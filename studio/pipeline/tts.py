"""Erzaehlstimme + Zeitplan.

python3 pipeline/tts.py <story>

Erzeugt in stories/<story>/out/:
  voice.wav      – komplette Erzaehlung (Kokoro, lokal)
  timeline.json  – Einstellungen mit Bildanzahl + Wort-Zeitpunkte fuer die Untertitel
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
LEAD_IN = 0.12
CFG_TAIL = None
TAIL = 0.7  # Standard; pro Story ueberschreibbar mit "tail" in story.json


def trim(a, thr=0.012, pad=0.03, sr=24000):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    s, e = max(0, idx[0] - int(pad * sr)), min(len(a), idx[-1] + int(pad * sr))
    return a[s:e]


PAUSE = {"comma": 0.08, "question": 0.26, "stop": 0.2}


def pause_after(text, last):
    if last:
        return CFG_TAIL or TAIL
    t = text.strip()
    if t.endswith(","):
        return PAUSE["comma"]
    if t.endswith("?"):
        return PAUSE["question"]
    return PAUSE["stop"]


def words_of(text):
    return [w for w in text.split() if re.search(r"\w", w)]


def align(model, audio, sr, text, offset):
    """Wort-Zeitpunkte: Whisper, wenn die Woerter passen – sonst proportional nach Zeichen."""
    mine = words_of(text)
    a16 = np.interp(np.arange(0, len(audio), sr / 16000), np.arange(len(audio)), audio).astype(np.float32)
    segs, _ = model.transcribe(a16, word_timestamps=True, language="en", initial_prompt=text)
    got = [w for s in segs for w in s.words]
    dur = len(audio) / sr
    if len(got) == len(mine):
        out = [(w, offset + g.start, offset + g.end) for w, g in zip(mine, got)]
    else:
        lens = np.array([len(w) + 2 for w in mine], float)
        edges = np.concatenate([[0], np.cumsum(lens)]) / lens.sum() * dur
        out = [(w, offset + edges[i], offset + edges[i + 1]) for i, w in enumerate(mine)]
    return out, len(got) == len(mine)


def main(story):
    sdir = ROOT / "stories" / story
    cfg = json.loads((sdir / "story.json").read_text())
    global CFG_TAIL
    CFG_TAIL = cfg.get("tail")
    PAUSE.update(cfg.get("pauses", {}))
    out = sdir / "out"
    out.mkdir(parents=True, exist_ok=True)
    kok = Kokoro(str(ROOT / "models/kokoro-v1.0.onnx"), str(ROOT / "models/voices-v1.0.bin"))
    cb = {}
    if cfg.get("tts") == "chatterbox":                      # alle Beats vorab mit Chatterbox erzeugen (eigene venv)
        import subprocess, tempfile
        tmp = Path(tempfile.mkdtemp())
        ref = cfg.get("voice_ref")
        if ref and ref.startswith("kokoro:"):                # Kokoro-Stimme als Klangvorlage (lizenzfrei)
            a_ref, sr_ref = kok.create("Every story has a secret. And this one starts on a quiet little street, where nothing ever seemed to happen.", voice=ref.split(":")[1], speed=1.0, lang="en-us")
            sf.write(tmp / "ref.wav", a_ref, sr_ref); ref = str(tmp / "ref.wav")
        items = [{"text": b["text"], "out": str(tmp / f"b{i:03d}.wav")} for i, b in enumerate(cfg["beats"])]
        (tmp / "job.json").write_text(json.dumps({"ref": ref, "exaggeration": cfg.get("exaggeration", 0.6), "cfg_weight": cfg.get("cfg_weight", 0.4), "items": items}))
        subprocess.run([str(ROOT / ".venv-cb/bin/python"), str(ROOT / "pipeline/cb_say.py"), str(tmp / "job.json")], check=True)
        tempo = cfg.get("tempo", 1.0)
        for i, it in enumerate(items):
            outp = it["out"].replace(".wav", "_t.wav")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", it["out"], "-af", f"atempo={tempo},aresample=24000", outp], check=True)
            a, _ = sf.read(outp, dtype="float32"); cb[i] = a if a.ndim == 1 else a.mean(axis=1)
    from faster_whisper import WhisperModel
    wm = WhisperModel("base.en", device="cpu", compute_type="int8", download_root=str(ROOT / "models/whisper"))

    sr = 24000
    pieces = [np.zeros(int(LEAD_IN * sr), np.float32)]
    t = LEAD_IN
    beats, words, exact = [], [], 0
    for i, b in enumerate(cfg["beats"]):
        last = i == len(cfg["beats"]) - 1
        if cb: a, sr = cb[i], 24000
        else: a, sr = kok.create(b["text"], voice=cfg.get("voice", "am_michael"), speed=cfg.get("speed", 1.0), lang="en-us")
        a = trim(np.asarray(a, np.float32), sr=sr)
        w, ok = align(wm, a, sr, b["text"], t)
        exact += ok
        words += [{"w": x, "start": round(s, 3), "end": round(e, 3)} for x, s, e in w]
        gap = pause_after(b["text"], last)
        beats.append({"start": t, "speech_end": t + len(a) / sr, "end": t + len(a) / sr + gap})
        pieces += [a, np.zeros(int(gap * sr), np.float32)]
        t += len(a) / sr + gap
    voice = np.concatenate(pieces)
    sf.write(out / "voice.wav", voice, sr)

    # Einstellungen: Beat-Dauer auf die Shots verteilen; Bildgrenzen aus absoluten Zeiten (kein Drift)
    shots = []
    for b, bt in zip(cfg["beats"], beats):
        ws = b.get("weights") or [1] * len(b["shots"])
        acc = bt["start"] if bt is not beats[0] else 0.0
        span = bt["end"] - acc
        for k, (sid, wgt) in enumerate(zip(b["shots"], ws)):
            dur = span * wgt / sum(ws)
            shots.append({"id": sid, "t0": acc, "t1": acc + dur, "dissolve": b.get("dissolve", 0) if k == 0 else 0})
            acc += dur
    total = 0
    for s in shots:
        f1 = round(s["t1"] * FPS)
        s["frames"] = f1 - total
        total = f1
    timeline = {"fps": FPS, "duration": len(voice) / sr, "frames": total,
                "shots": [{"id": s["id"], "frames": s["frames"], "start": round(s["t0"], 3), "dissolve": s["dissolve"]} for s in shots], "words": words}
    (out / "timeline.json").write_text(json.dumps(timeline, indent=1))
    print(f"Stimme: {len(voice) / sr:.1f}s, {len(words)} Wörter, {exact}/{len(beats)} Beats exakt per Whisper, {len(shots)} Einstellungen")


if __name__ == "__main__":
    main(sys.argv[1])
