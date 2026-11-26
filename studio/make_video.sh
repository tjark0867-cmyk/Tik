#!/usr/bin/env bash
# Komplettes Video aus einer Story bauen:  ./make_video.sh sock-thief
#   1. Erzählstimme + Zeitplan (Kokoro + Whisper)   → out/voice.wav, out/timeline.json
#   2. 3D-Szenen Bild für Bild rendern (Three.js)     → out/video_noaudio.mp4
#   3. Untertitel + Musik + Endmontage                → stories/<story>/<story>.mp4
set -euo pipefail
cd "$(dirname "$0")"
STORY="${1:?Story-Name angeben, z. B. sock-thief}"
echo "▶ 1/3 Stimme & Timing";   python3 pipeline/tts.py "$STORY"
echo "▶ 2/3 Rendern";           node pipeline/render.js "$STORY"
echo "▶ 3/3 Endmontage";        python3 pipeline/finish.py "$STORY"
echo "✅ Fertig: stories/$STORY/$STORY.mp4"
