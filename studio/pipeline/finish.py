"""Untertitel + Hintergrundmusik + Endmontage.

python3 pipeline/finish.py <story>

Liest  stories/<story>/out/{video_noaudio.mp4, voice.wav, timeline.json}
Schreibt stories/<story>/out/{captions.ass, music.wav} und stories/<story>/<story>.mp4 (1080x1920, fertig zum Hochladen)
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent


# ------------------------------------------------------------------ Untertitel
def ass_time(t):
    t = max(0.0, t)
    h, m = int(t // 3600), int(t % 3600 // 60)
    s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def chunks(words, max_words=3, max_chars=16):
    out, cur = [], []
    for w in words:
        cur.append(w)
        text = " ".join(x["w"] for x in cur)
        end_punct = re.search(r"[,.!?]$", w["w"])
        if len(cur) >= max_words or len(text) >= max_chars or end_punct:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def write_ass(words, path, duration):
    head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter ExtraBold,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,7,3,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    cs = chunks(words)
    for i, c in enumerate(cs):
        start = c[0]["start"]
        nxt = cs[i + 1][0]["start"] if i + 1 < len(cs) else duration
        end = min(nxt, c[-1]["end"] + 0.6)
        text = " ".join(x["w"] for x in c).replace('"', "").replace("“", "").replace("”", "")
        pop = r"{\pos(540,1270)\fscx86\fscy86\t(0,90,\fscx100\fscy100)}"
        lines.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Cap,,0,0,0,,{pop}{text}")
    path.write_text(head + "\n".join(lines) + "\n")
    return len(lines)


# ------------------------------------------------------------------ Musik
def music(duration, sr=44100, bpm=104, seed=3):
    """Leise, verschmitzte Pizzicato-Schleich-Musik – komplett synthetisch erzeugt."""
    rng = np.random.default_rng(seed)
    n = int(duration * sr)
    out = np.zeros(n + sr * 2)
    beat = 60 / bpm

    def note(freq, t0, length, amp, decay, harmonics=(1, 0.5, 0.25, 0.12)):
        i0 = int(t0 * sr)
        tt = np.arange(int(length * sr)) / sr
        env = np.exp(-tt / decay) * np.minimum(1, tt / 0.004)
        sig = sum(a * np.sin(2 * np.pi * freq * (k + 1) * tt) for k, a in enumerate(harmonics))
        seg = out[i0:i0 + len(tt)]
        seg += (amp * env * sig)[: len(seg)]

    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    # D-Moll Schleich-Bass (Pizzicato), 2-Takt-Muster
    bass = [50, 53, 57, 53, 50, 53, 56, 57, 48, 52, 55, 52, 49, 52, 55, 57]
    melody = [(74, 0), (77, 1.5), (76, 2), (74, 3), (73, 4.5), (74, 5), (69, 6)]
    t = 0.0
    bar = 0
    while t < duration + 1:
        for k in range(8):
            m = bass[(bar % 2) * 8 + k]
            note(hz(m - 12), t + k * beat / 2 + (0.012 if k % 2 else 0), 0.35, 0.55, 0.11)
        if bar % 2 == 0 and bar > 0:
            for m, off in melody:
                note(hz(m), t + off * beat / 2, 0.9, 0.16, 0.28, harmonics=(1, 0.3, 0.1))
        # leiser Shaker auf den Offbeats
        for k in range(8):
            i0 = int((t + k * beat / 2 + beat / 4) * sr)
            L = int(0.05 * sr)
            noise = rng.standard_normal(L) * np.exp(-np.arange(L) / (0.012 * sr)) * 0.05
            out[i0:i0 + L] += np.diff(np.concatenate([[0], noise]))[: len(out[i0:i0 + L])]
        t += beat * 4
        bar += 1
    out = out[:n]
    fade = int(1.5 * sr)
    out[-fade:] *= np.linspace(1, 0, fade)
    out[: int(0.3 * sr)] *= np.linspace(0, 1, int(0.3 * sr))
    out /= np.max(np.abs(out)) + 1e-9
    return (out * 0.8).astype(np.float32), sr


def main(story):
    sdir = ROOT / "stories" / story
    out = sdir / "out"
    tl = json.loads((out / "timeline.json").read_text())
    dur = tl["frames"] / tl["fps"]
    n = write_ass(tl["words"], out / "captions.ass", dur)
    m, sr = music(dur)
    sf.write(out / "music.wav", m, sr)
    final = sdir / f"{story}.mp4"
    fc = (
        "[0:v]scale=1080:1920:flags=lanczos,vignette=angle=PI/5:mode=forward,"
        f"ass={out / 'captions.ass'},format=yuv420p[v];"
        "[1:a]aresample=44100,asplit=2[vo][vk];[2:a]volume=0.13[mu];"
        "[mu][vk]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=300[duck];"
        "[vo][duck]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-12.3:TP=-1.2:LRA=11,aresample=44100[a]"
    )
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(out / "video_noaudio.mp4"), "-i", str(out / "voice.wav"), "-i", str(out / "music.wav"),
           "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", f"{dur:.3f}",
           "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-r", "30",
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(final)]
    subprocess.run(cmd, check=True)
    print(f"{n} Untertitel, Musik {dur:.1f}s → {final.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1])
