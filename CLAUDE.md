# Projekt-Regeln (Feedback des Nutzers – immer beachten)

Dieses Repo produziert animierte Faceless-Story-Videos mit dem Studio in `studio/` (siehe `studio/README.md`).

## Qualitätsregeln für jedes neue Video

### 1. Keine Animationsfehler – zu 100 % vermeiden
Feedback zu Video #1: Der Dieb ist in der Einstellung `sneak` mitten durch eine Laterne gelaufen (Laufweg x −2,2 → −0,9 bei z −0,4, Laterne bei x −1,2 / z −0,3).
- Vor dem Rendern **jeden Laufweg gegen alle Requisiten prüfen** (Laternen, Briefkästen, Bäume, Tafeln, Möbel, Gebäude, andere Figuren). Mindestabstand ≈ 0,6 Einheiten zwischen Figur und Objekt.
- Keine Figur darf durch Wände, Möbel, Tische oder andere Figuren gehen oder darin stehen; Gegenstände in Händen dürfen nicht durch den Körper ragen.
- Vor dem Gesamt-Render von **jeder bewegten Einstellung Vorschaubilder am Anfang, in der Mitte und am Ende** anschauen (`--preview id:0:dur,id:mitte:dur,id:ende:dur`) und gezielt auf Durchdringungen prüfen.
- Bei Unsicherheit: Laufweg so legen, dass er vor oder hinter dem Objekt vorbeiführt, oder das Objekt verschieben.

### 2. Stimme wie im Vorlage-Video
Feedback: Die Stimme soll wie im Vorlage-Video klingen – **einladender, wärmer, erzählerischer**. `am_michael` (Video #1) war zu nüchtern.
- Vorlage: männlicher Erzähler, ca. 183 Wörter/Min., mittlere Stimmlage (Grundton ≈ 155 Hz), warmer, leicht verschmitzter Erzählton mit Spannung in den Pausen.
- Vor dem nächsten Video: **3–4 Stimmproben** desselben Absatzes erzeugen (z. B. Kokoro `bm_george`, `bm_fable`, `am_puck`, `am_fenrir` sowie Mischungen) und den Nutzer **wählen lassen**, bevor gerendert wird. Ich kann Audio nicht selbst anhören.
- **Entscheidung (Video #2): Nutzer hat `am_puck` gewählt** – Standardstimme für alle weiteren Videos, Tempo ≈ 183 Wörter/Min.
- **Entscheidung (Vorlage 2 „Every Memory Has a Price“): `am_eric`, Tempo ≈ 228 Wörter/Min., kaum Pausen** – Standard für Videos im filmischen Stil der Vorlage 2.
- Wenn keine Kokoro-Stimme nah genug herankommt: ElevenLabs vorschlagen (Nutzer gibt API-Key über das sichere Formular).

## Vorlage 2 – filmischer Stil ("Every Memory Has a Price")
- Starke Lichtstimmung (warme Lampen in blauer Nacht), Leuchten (Bloom), Tiefenunschärfe, Nebel, Vignette, Filmkorn.
- **Zeichenstil wie Vorlage 2 = 2.5D (Nutzer-Feedback zu Video #3):** Figuren sind **gezeichnete 2D-Figuren** (`style: '2d'`, `makeSprite`) – flacher Kopf mit dicker Kontur, großer Kopf, rundlicher kurzer Körper, Strich-Arme/-Beine mit Ellbogen – als Billboard in der 3D-Kulisse. **Keine 3D-Figuren** (`style: 'ch'`/Standard) mehr für diesen Stil. Vom Nutzer per Vergleichsbild bestätigt.
- Blickrichtung über `ch.userData.lookAt = [x,y,z]`; Gegenstände in der Hand über `L.spritePose(ch, { arms, hold: L.hold.jar()/glasses()/brush()/can() })`; Leuchten in der Hand mit `L.glow()` + `handWorld()`; liegende Figuren mit `billboard: false`.
- Gemalte Hintergründe (`L.backdrop('day'|'night'|'sunset'|'gray')`), Halbton-Raster (`L.post.halftone`), Lichtfarbe der Figuren je Szene (`L.spriteTint`).
- Große runde Augen, kräftige Linien, ausdrucksstarke Mimik (Tränen, Sorgen, Staunen, Blinzeln).
- Immer in **1080×1920 nativ** rendern (`"size": "1080x1920"` in story.json), nicht hochskalieren.
- Kulissen-Details nutzen: Feuerleitern (`fireEscape`), Wimpelketten (`bunting`), Lichtkegel, Regen, Nebel.
- Story: Welt mit einer besonderen Regel → Familie in Not → Opfer steigert sich → Warnung → tragischer Twist. Ca. 290 Wörter / 75–80 s.

## Allgemein
- **Keine Wasserzeichen** – weder sichtbar noch unhörbar (Nutzer-Wunsch). Deshalb **kein Chatterbox** (setzt ein unhörbares Perth-Wasserzeichen); Stimmen nur über Kokoro oder andere Modelle ohne Wasserzeichen.
- **Keine fremden Stimmen klonen** (z. B. Erzähler aus Vorlage-Videos) – nur Stimmen, an denen der Nutzer die Rechte hat.
- Keine OpenArt-Credits verwenden – alles selbst mit dem Studio erzeugen (Wunsch des Nutzers).
- Sprache der Videos: Englisch. Kommunikation mit dem Nutzer: Deutsch.
- Videos > 60 Sekunden (TikTok Creator Rewards).
- Eigene Storys und Figuren; nichts aus fremden Videos übernehmen.
