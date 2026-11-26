# Faceless-Story-Kanal: animierte Kurzgeschichten für TikTok & YouTube Shorts

**Konzept:** 60–70-Sekunden-Videos mit 3D-animierten Toon-Kurzgeschichten (gemütliche Diorama-Stadt, runde Meme-Gesichter, Erzählstimme, Wort-für-Wort-Untertitel), jeweils mit cleverem Twist am Ende.
**Geld:** nur Plattform-Auszahlungen (TikTok Creator Rewards + YouTube-Shorts-Werbeanteil). Kein Shop, kein eigenes Produkt.
**Produktion:** komplett automatisch per Code im Ordner [`studio/`](studio/README.md): keine bezahlten KI-Dienste, keine Credits.

## ▶️ So läuft es

1. Ich (Claude) schreibe die Story und baue ihre Szenen in `studio/stories/<name>/`.
2. `./studio/make_video.sh <name>` erzeugt Stimme, 3D-Animation, Untertitel, Musik → fertige MP4 (1080×1920).
3. Du lädst die MP4 auf TikTok **und** YouTube Shorts hoch (Texte unten).

## 📁 Inhalt

| Ordner/Datei | Wofür |
|---|---|
| `studio/` | Die Video-Fabrik: 3D-Engine, Stimme, Untertitel, Musik, Montage ([Anleitung](studio/README.md)) |
| `studio/stories/sock-thief/` | Story #1 „The Sock Thief“: Text, Szenen, **fertiges Video** |
| `studio/STORY_BANK.md` | 5 weitere fertige Erzähltexte für die nächsten Videos |
| `videos/` | Fertige Videos zum Hochladen + Upload-Texte |
| `01_STRATEGIE.md` … `06_RECHT_UND_STEUERN.md` | Strategie, Setup, Hooks, Recht & Steuern (Monetarisierung, Impressum, KI-Kennzeichnung) |
| `business/Business-Tracker.xlsx` | Views-Rechner, Tagesreport, Fortschritt bis zur Monetarisierung |

## Upload-Regeln

- **Sprache:** Englisch, wie die Vorlage (größerer Markt).
- **KI-Kennzeichnung:** Stimme und Bilder sind KI- bzw. computergeneriert. Beim Upload den Schalter für KI-generierte Inhalte aktivieren (TikTok: „KI-generierte Inhalte“; YouTube: nur nötig bei realistisch wirkenden Inhalten, bei Toon-Optik meist nicht, trotzdem prüfen).
- **Musik:** Ist schon leise drin. Optional in der App einen Sound aus der kommerziellen Bibliothek sehr leise drunterlegen.
- **Länge:** über 60 Sekunden (Bedingung für TikTok Creator Rewards). Ist bei jedem Video sichergestellt.
- **Originalität:** jede Story ist neu geschrieben, mit eigenen Figuren und Szenen. Keine Inhalte aus fremden Videos.
