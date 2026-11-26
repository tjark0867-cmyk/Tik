# Story-Studio: animierte Faceless-Kurzgeschichten, komplett selbst erzeugt

Erzeugt 60–70-Sekunden-Videos im Stil „3D-Toon-Diorama + Erzählstimme + Wort-Untertitel“. Dafür braucht es **keine bezahlten KI-Dienste**: Figuren, Kulissen, Stimme, Musik und Schnitt entstehen hier per Code.

| Baustein | Technik | Datei |
|---|---|---|
| 3D-Grafik | Three.js mit Toon-Shading + Umrissen, Rendering per Headless-Chromium | `engine/lib.js` |
| Figuren | Runde weiße Köpfe mit Meme-Gesichtern (smug, laugh, surprised, sneaky, sleep, …), Hüte, Mäntel, Socken | `makeChar()` |
| Kulissen | Häuserzeilen, Läden, Innenräume, Kommoden, Schreibtische, Tafeln, Zeitungen, Kalender, Nacht mit Mond | `building()`, `room()`, … |
| Stimme | Kokoro TTS (lokal, Apache-2.0) | `pipeline/tts.py` |
| Untertitel-Timing | Whisper (lokal) | `pipeline/tts.py` |
| Musik | synthetische Pizzicato-Schleichmusik | `pipeline/finish.py` |
| Montage | ffmpeg: 1080×1920, Vignette, Untertitel, Lautheit −14 LUFS | `pipeline/finish.py` |

## Ein Video bauen

```bash
cd studio
./make_video.sh sock-thief        # → stories/sock-thief/sock-thief.mp4
```

Dauer: ca. 10 Min. (Stimme ~2 Min., Rendern ~6–7 Min., Montage ~1 Min.).

## Eine neue Story anlegen

1. `stories/<name>/story.json`: Text in **Beats** (Satz oder Halbsatz) aufteilen, jedem Beat 1–2 Einstellungen zuordnen. Ziel: **175–190 Wörter**, damit das Video über 60 Sekunden lang wird (TikTok-Bedingung).
2. `stories/<name>/shots.js`: Für jede Einstellung eine Funktion `(L, dur) => update(t)`, die die Szene baut und Kamera und Figuren bewegt. Vorlage: `stories/sock-thief/shots.js`.
3. Vorschau einzelner Einstellungen, ohne das ganze Video zu rendern:
   ```bash
   node pipeline/render.js <name> --preview shotA:1.0:2,shotB:0.5:2
   # Debug-Kamera:  shotA:1.0:2:camX/camY/camZ/lookX/lookY/lookZ
   ```
4. `./make_video.sh <name>`

## Erstinstallation (macht das Setup-Skript der Umgebung „Tik“ automatisch)

```bash
pip install kokoro-onnx soundfile faster-whisper
cd studio && npm install
mkdir -p models && cd models
curl -L -o kokoro-v1.0.onnx https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/kokoro-v1.0.onnx
curl -L -o voices-v1.0.bin  https://huggingface.co/fastrtc/kokoro-onnx/resolve/main/voices-v1.0.bin
```
Whisper lädt sein Modell beim ersten Lauf selbst nach `models/whisper`.

## Stil-Regeln (aus der Analyse des Vorlage-Videos)

- **176 Wörter in 58 Sek.**, also schnelles Erzähltempo. Männliche Erzählstimme.
- Aufbau: **harmloser Hook → Zahlen steigen → Twist → „You see, …“ erklärt den Trick → trockene Schlusspointe**.
- **Schnitt alle 1–2,5 Sek.**, viele Nahaufnahmen von Gegenständen (Schubladen, Zettel, Tafeln mit Zahlen).
- Untertitel: 1–3 Wörter, weiß, dicker schwarzer Rand, ca. 2/3 Bildhöhe.
- Eigene Storys und eigene Figuren: **keine Inhalte oder Figuren aus fremden Videos übernehmen**.
