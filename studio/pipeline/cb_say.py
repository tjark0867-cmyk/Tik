"""Chatterbox-Sprachausgabe (laeuft in studio/.venv-cb).

.venv-cb/bin/python pipeline/cb_say.py jobs.json
jobs.json: {"ref": "pfad.wav" | null, "exaggeration": 0.6, "cfg_weight": 0.4, "items": [{"text": "...", "out": "a.wav"}, ...]}
"""
import json
import sys

import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

torch.set_num_threads(4)
job = json.load(open(sys.argv[1]))
model = ChatterboxTTS.from_pretrained(device="cpu")
for i, it in enumerate(job["items"]):
    wav = model.generate(it["text"], audio_prompt_path=job.get("ref"), exaggeration=job.get("exaggeration", 0.6),
                         cfg_weight=job.get("cfg_weight", 0.4), temperature=job.get("temperature", 0.8))
    ta.save(it["out"], wav, model.sr)
    print(f"{i + 1}/{len(job['items'])}", flush=True)
