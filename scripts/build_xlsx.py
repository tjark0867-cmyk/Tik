"""Erzeugt business/Business-Tracker.xlsx fuer den Faceless-Kanal "Milliarden Storys".

Tabs:
  Rechner          -> Wie viele Views brauche ich fuer X EUR/Tag? (nur Plattform-Auszahlungen)
  Uebersicht       -> Kennzahlen, Monetarisierungs-Meilensteine, echte RPMs, Diagramm
  Tagesreport      -> 180 Tage taegliches Tracking
  Content-Pipeline -> 60 Video-Ideen mit Hook und Status

Aufruf (aus dem Repo-Root):  python3 scripts/build_xlsx.py
"""
from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.formatting.rule import DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent.parent

FONT = "Arial"
ACCENT = "1F3A5F"
INPUT_FILL = PatternFill("solid", fgColor="FFF2A8")
HEAD_FILL = PatternFill("solid", fgColor=ACCENT)
RESULT_FILL = PatternFill("solid", fgColor="D4EDDA")
DONE_FILL = PatternFill("solid", fgColor="D4EDDA")
THIN = Side(style="thin", color="D0D0D0")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

EUR = '#,##0.00 "€";[Red]-#,##0.00 "€";"–"'
EUR0 = '#,##0 "€";[Red]-#,##0 "€";"–"'
PCT = '0.0%;[Red]-0.0%;"–"'
INT = '#,##0;-#,##0;"–"'

DAYS = 180
FIRST = 5
LAST = FIRST + DAYS - 1

# (Thema, Hook) – 1–15 haben fertige Skripte in 03_SKRIPTE.md, 16–60 sind Ideen (vor dem Schreiben recherchieren)
IDEAS = [
    ("McDonald's ist ein Immobilienkonzern", "McDonald's verdient sein Geld nicht mit Burgern."),
    ("Red Bull kommt aus Thailand", "Das erfolgreichste Getränk Österreichs kommt eigentlich aus Thailand."),
    ("Aldi Nord & Süd – der Zigaretten-Streit", "Wegen einer Packung Zigaretten gibt es heute zwei Aldis."),
    ("Nokia – von Gummistiefeln zum Handy", "Das unzerstörbare Handy kam von einer Firma, die Gummistiefel gemacht hat."),
    ("Lego war fast pleite", "Lego war 2003 fast pleite – wegen zu viel Kreativität."),
    ("Adidas vs. Puma – die geteilte Stadt", "In dieser Stadt hat man früher zuerst auf deine Schuhe geschaut."),
    ("IKEA – der Name & das abgeschraubte Tischbein", "Dein IKEA-Karton ist flach, weil jemand ein Tischbein abgeschraubt hat."),
    ("Fanta wurde in Deutschland erfunden", "Fanta wurde in Deutschland erfunden – weil Coca-Cola nicht mehr liefern konnte."),
    ("Nintendo – 130 Jahre Neuerfindung", "Nintendo ist über 130 Jahre alt – und hat mit etwas ganz anderem angefangen."),
    ("Kodak erfand die Digitalkamera", "Die Firma, die die Digitalkamera erfunden hat, ist an ihr gescheitert."),
    ("Blockbuster lacht Netflix aus", "Netflix wollte sich mal für 50 Millionen Dollar verkaufen – und wurde ausgelacht."),
    ("Rolex gehört einer Stiftung", "Rolex gehört keinem Milliardär. Sondern einer Stiftung."),
    ("Monopoly war eine Warnung", "Monopoly sollte eigentlich zeigen, wie unfair Monopole sind."),
    ("Der dritte Apple-Gründer", "Es gab einen dritten Apple-Gründer. Er hat seine Anteile für 800 Dollar verkauft."),
    ("Lamborghini vs. Ferrari", "Lamborghini gibt es nur, weil Enzo Ferrari einen Kunden beleidigt hat."),
    ("WD-40 – der Name", "Der Name WD-40 ist eigentlich ein Laborprotokoll."),
    ("Post-it – der schlechte Kleber", "Post-its gibt es nur, weil ein Kleber zu schlecht war."),
    ("Haribo – was der Name bedeutet", "Haribo ist kein Fantasiewort – sondern ein Name und eine Stadt."),
    ("Tempo – Marke wird Wort", "Warum sagen wir alle 'Tempo' – und nicht Taschentuch?"),
    ("Ritter Sport – warum quadratisch", "Ritter Sport ist quadratisch, damit sie in eine Sakkotasche passt."),
    ("Nivea – Latein für Schnee", "Nivea ist Latein – und beschreibt einfach die Farbe der Creme."),
    ("Druckerpatronen-Prinzip", "Warum ist Druckertinte teurer als Champagner?"),
    ("Supermarkt: Milch ganz hinten", "Die Milch steht nicht zufällig ganz hinten im Supermarkt."),
    ("Kino-Popcorn", "Das Kino verdient nicht an deinem Ticket – sondern an deinem Popcorn."),
    ("Casinos ohne Uhren", "Warum gibt es in Casinos keine Uhren?"),
    ("Costco Hot Dog 1,50 $", "Dieser Hot Dog kostet seit 1985 genau 1,50 Dollar."),
    ("Vielfliegerprogramme", "Manche Airlines verdienen mit Meilen mehr als mit Fliegen."),
    ("Starbucks als Bank", "Starbucks ist heimlich eine Bank."),
    ("Amazon in der Garage", "Amazon war mal ein Online-Buchladen aus einer Garage."),
    ("Samsung – Trockenfisch & Nudeln", "Samsung hat früher Trockenfisch verkauft."),
    ("Toyota – Webstühle", "Toyota hat mit Webstühlen angefangen."),
    ("Peugeot – Pfeffermühlen", "Peugeot macht seit fast 200 Jahren Pfeffermühlen."),
    ("Porsche & der VW Käfer", "Der VW Käfer wurde von Ferdinand Porsche entworfen."),
    ("BMW-Logo ist kein Propeller", "Das BMW-Logo ist kein Propeller."),
    ("Samwer-Brüder", "Diese drei Brüder wurden reich, indem sie Ideen kopierten."),
    ("Bitcoin-Pizza", "Diese zwei Pizzen haben 10.000 Bitcoin gekostet."),
    ("IKEA-Produktnamen", "IKEA-Namen sind kein Zufall – dahinter steckt ein System."),
    ("Rolex-Warteliste", "Warum bekommst du keine Rolex, obwohl du sie bezahlen kannst?"),
    ("De Beers & Diamanten", "Diamanten sind gar nicht so selten, wie du denkst."),
    ("Michelin-Sterne", "Ein Reifenhersteller vergibt die wichtigsten Sterne der Gastronomie."),
    ("Guinness-Buch der Rekorde", "Das Guinness-Buch entstand wegen eines Streits über einen Vogel."),
    ("WhatsApp – 19 Milliarden", "19 Milliarden Dollar für eine Firma mit rund 55 Mitarbeitern."),
    ("Instagram – 1 Milliarde", "Instagram wurde für 1 Milliarde Dollar gekauft – mit 13 Mitarbeitern."),
    ("YouTube als Dating-Seite", "YouTube sollte ursprünglich eine Dating-Seite werden."),
    ("Twitter aus einer Podcast-Firma", "Twitter war ursprünglich ein Nebenprojekt einer Podcast-Firma."),
    ("Dyson – 5.127 Prototypen", "James Dyson baute 5.127 Prototypen, bevor einer funktionierte."),
    ("Coca-Cola & das Kokablatt", "In der ursprünglichen Coca-Cola steckte Kokablatt-Extrakt."),
    ("McDonald's-Eismaschinen", "Warum ist bei McDonald's die Eismaschine immer kaputt?"),
    ("Birkin Bag", "Die begehrteste Handtasche der Welt entstand bei einem Gespräch im Flugzeug."),
    ("Lidl & Kaufland – Schwarz-Gruppe", "Lidl und Kaufland gehören zum selben Konzern."),
    ("Dieter Schwarz", "Einer der reichsten Deutschen – und kaum jemand kennt sein Gesicht."),
    ("Würth – Schrauben-Milliarden", "Mit Schrauben zum Milliardär – aus einer Kleinstadt in Baden-Württemberg."),
    ("Playmobil & die Ölkrise", "Playmobil gibt es nur wegen der Ölkrise."),
    ("Nutella & die Kakao-Knappheit", "Nutella entstand, weil Kakao zu teuer war."),
    ("Zara ohne Werbung", "Zara macht kaum klassische Werbung – und ist trotzdem überall."),
    ("Netflix-DVDs bis 2023", "Netflix hat bis 2023 DVDs per Post verschickt."),
    ("Ryanair-Geschäftsmodell", "Wie Ryanair mit 10-€-Flügen trotzdem Geld verdient."),
    ("Lindt-Goldhase vor Gericht", "Lindt hat jahrelang vor Gericht um seinen Goldhasen gekämpft."),
    ("Überraschungsei in den USA", "Warum gab es das Überraschungsei in den USA nicht?"),
    ("Facebook begann als Facemash", "Facebook hat als fragwürdige Uni-Website angefangen."),
]


def f(bold=False, color="000000", size=10, italic=False):
    return Font(name=FONT, bold=bold, color=color, size=size, italic=italic)


def title(ws, text, sub=None):
    ws["A1"] = text
    ws["A1"].font = f(True, ACCENT, 16)
    if sub:
        ws["A2"] = sub
        ws["A2"].font = f(italic=True, color="555555")


def header(ws, row, labels, col=1):
    for i, label in enumerate(labels):
        c = ws.cell(row=row, column=col + i, value=label)
        c.font = f(True, "FFFFFF")
        c.fill = HEAD_FILL
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BOX
    ws.row_dimensions[row].height = 32


def inp(cell, value=None, fmt=None):
    if value is not None:
        cell.value = value
    cell.fill = INPUT_FILL
    cell.font = f(color="0000FF")
    cell.border = BOX
    if fmt:
        cell.number_format = fmt


def calc(cell, formula, fmt=None, bold=False, color="000000"):
    cell.value = formula
    cell.font = f(bold, color)
    cell.border = BOX
    if fmt:
        cell.number_format = fmt


def label(ws, ref, text, bold=False):
    ws[ref] = text
    ws[ref].font = f(bold)
    ws[ref].border = BOX


def note(ws, ref, text):
    ws[ref] = text
    ws[ref].font = f(italic=True, color="555555", size=9)


def widths(ws, mapping):
    for col, w in mapping.items():
        ws.column_dimensions[col].width = w


def rechner(ws):
    ws.title = "Rechner"
    title(ws, "Views-Rechner", "Gelbe Annahmen anpassen. Ergebnis: Wie viele Views du pro Tag für dein Ziel brauchst – nur aus Plattform-Auszahlungen.")
    header(ws, 4, ["Annahme", "Wert", "Quelle / Hinweis"])
    rows = [
        ("Ziel pro Tag", 500, EUR0, "Dein Ziel."),
        ("TikTok Creator Rewards: € pro 1.000 qualifizierte Views", 0.60, EUR,
         "Annahme. Berichtete Spanne grob 0,30–1,20 €, je nach Thema, Zuschauerland und Watchtime. Nach den ersten Auszahlungen echten Wert aus der Übersicht eintragen."),
        ("Anteil qualifizierter Views (TikTok)", 0.60, PCT,
         "Annahme. Es zählen nur bestimmte Views (u. a. For-You-Feed, Video > 1 Min., Mindest-Watchtime). Echten Wert siehst du im Creator-Dashboard."),
        ("YouTube Shorts: € pro 1.000 Views", 0.06, EUR,
         "Annahme. Shorts zahlen deutlich weniger als Langvideos; berichtete Spanne grob 0,02–0,12 € für deutsches Publikum."),
        ("YouTube-Shorts-Views im Verhältnis zu TikTok-Views", 1.0, "0.0",
         "1,0 = gleiches Video läuft auf YouTube genauso gut wie auf TikTok."),
        ("Videos pro Tag (gleiches Video auf beiden Plattformen)", 3, INT, "Empfehlung aus dem Produktionsplan."),
        ("Optional: Sponsoring pro Monat", 0, EUR0,
         "Bezahlte Erwähnungen von Marken (z. B. Apps) – ab ca. 50–100k Followern realistisch. Kein eigenes Produkt."),
        ("Optional: YouTube-Langvideo-Views pro Tag", 0, INT,
         "Die gleichen Storys als 8–12-Min.-Video zusammengeschnitten. Standard 0 = nicht genutzt."),
        ("Optional: YouTube-Langvideo € pro 1.000 Views", 6.00, EUR,
         "Annahme für Wirtschaftsthemen, deutsches Publikum; berichtete Spanne grob 3–12 €."),
    ]
    for i, (lab, val, fmt, n) in enumerate(rows):
        r = 5 + i
        label(ws, f"A{r}", lab)
        inp(ws[f"B{r}"], val, fmt)
        note(ws, f"C{r}", n)
    # 5 Ziel | 6 TT-RPM | 7 qual | 8 YT-RPM | 9 Verhaeltnis | 10 Videos | 11 Sponsoring | 12 Long-Views | 13 Long-RPM
    header(ws, 15, ["Ergebnis", "Wert", "Erklärung"])
    res = [
        ("Feste Einnahmen pro Tag (Sponsoring + Langvideos)", "=B11/30+B12/1000*B13", EUR, ""),
        ("Einnahmen pro 1.000 TikTok-Views (inkl. passender YouTube-Views)", "=B6*B7+B8*B9", EUR, "Kernkennzahl: so viel bringt dir ein TikTok-View inklusive YouTube-Zwilling."),
        ("Benötigte TikTok-Views pro Tag", "=IF(B17=0,0,MAX(B5-B16,0)/B17*1000)", INT, ""),
        ("Benötigte YouTube-Shorts-Views pro Tag", "=B18*B9", INT, ""),
        ("Benötigte Views pro Tag gesamt", "=B18+B19", INT, "Über beide Plattformen."),
        ("Ø TikTok-Views pro Video", "=IF(B10=0,0,B18/B10)", INT, ""),
        ("Ø YouTube-Views pro Video", "=IF(B10=0,0,B19/B10)", INT, ""),
        ("Einnahmen TikTok pro Tag", "=B18/1000*B6*B7", EUR, ""),
        ("Einnahmen YouTube Shorts pro Tag", "=B19/1000*B8", EUR, ""),
        ("Feste Einnahmen pro Tag", "=B16", EUR, ""),
        ("Summe pro Tag (Kontrolle = Ziel)", "=B23+B24+B25", EUR, ""),
        ("Summe pro Monat (30 Tage)", "=B26*30", EUR0, "Vor Steuern – 30–40 % zurücklegen."),
    ]
    for i, (lab, formula, fmt, n) in enumerate(res):
        r = 16 + i
        key = r in (18, 20, 21)
        label(ws, f"A{r}", lab, bold=key)
        calc(ws[f"B{r}"], formula, fmt, bold=key)
        note(ws, f"C{r}", n)
        if key:
            ws[f"A{r}"].fill = RESULT_FILL
            ws[f"B{r}"].fill = RESULT_FILL
    widths(ws, {"A": 62, "B": 16, "C": 110})


def tagesreport(wb):
    ws = wb.create_sheet("Tagesreport")
    title(ws, "Tagesreport", "Jeden Abend 2 Minuten: Zahlen aus TikTok Studio / Creator-Dashboard und YouTube Studio eintragen.")
    cols = ["Datum", "Videos\ngepostet", "TikTok\nViews", "TikTok\nqualif. Views", "TikTok\nFollower", "TikTok\nEinnahmen",
            "YT Shorts\nViews", "YT\nAbonnenten", "YT\nEinnahmen", "Sonstiges\n(Sponsoring)", "Gesamt", "Ziel", "Erreicht",
            "TikTok Views\nletzte 30 Tage", "YT Shorts Views\nletzte 90 Tage"]
    header(ws, 4, cols)
    start = date(2026, 11, 27)
    for i in range(DAYS):
        r = FIRST + i
        ws[f"A{r}"] = start + timedelta(days=i)
        ws[f"A{r}"].number_format = "DD.MM.YY"
        ws[f"A{r}"].font = f()
        ws[f"A{r}"].border = BOX
        for col in "BCDEFGHIJ":
            inp(ws[f"{col}{r}"], None, EUR if col in "FIJ" else INT)
        calc(ws[f"K{r}"], f'=IF(COUNT(F{r},I{r},J{r})=0,"",F{r}+I{r}+J{r})', EUR, bold=True)
        calc(ws[f"L{r}"], "=Rechner!$B$5", EUR0, color="008000")
        calc(ws[f"M{r}"], f'=IF(K{r}="","",K{r}/L{r})', PCT)
        calc(ws[f"N{r}"], f'=IF(C{r}="","",SUM(C{max(FIRST, r - 29)}:C{r}))', INT)
        calc(ws[f"O{r}"], f'=IF(G{r}="","",SUM(G{max(FIRST, r - 89)}:G{r}))', INT)
    for col, v in zip("BCDEGH", [2, 1240, 0, 38, 2150, 21]):
        ws[f"{col}{FIRST}"].value = v
    ws[f"A{FIRST}"].comment = Comment("Beispielwerte für Tag 1 – mit deinen echten Zahlen überschreiben.", "Tracker")
    ws.conditional_formatting.add(f"M{FIRST}:M{LAST}", DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="63BE7B"))
    widths(ws, {"A": 11, **{c: 12 for c in "BCDEFGHIJKLM"}, "N": 15, "O": 16})
    ws.freeze_panes = "B5"
    return ws


def uebersicht(wb, tr):
    ws = wb.create_sheet("Übersicht", 1)
    title(ws, "Übersicht", "Rechnet automatisch aus dem Tagesreport.")
    T = "Tagesreport!"
    rng = lambda c: f"{T}{c}{FIRST}:{c}{LAST}"
    last_val = lambda c, key: f"=IFERROR(INDEX({rng(c)},MATCH(9.99E+307,{rng(key)})),0)"

    header(ws, 3, ["Kennzahl", "Wert"])
    k = [
        ("Getrackte Tage", f"=COUNT({rng('K')})", INT),
        ("Videos gesamt", f"=SUM({rng('B')})", INT),
        ("TikTok-Views gesamt", f"=SUM({rng('C')})", INT),
        ("YouTube-Shorts-Views gesamt", f"=SUM({rng('G')})", INT),
        ("Ø TikTok-Views pro Video", "=IF(B5=0,0,B6/B5)", INT),
        ("Einnahmen gesamt", f"=SUM({rng('K')})", EUR),
        ("Ø Einnahmen pro getracktem Tag", "=IF(B4=0,0,B9/B4)", EUR),
        ("Bester Tag", f"=IF(B4=0,0,MAX({rng('K')}))", EUR),
        ("Tage mit Ziel erreicht", f'=COUNTIF({rng("M")},">=1")', INT),
        ("Dein echter TikTok-Wert: € pro 1.000 qualif. Views", f'=IF(SUMIF({rng("F")},"<>",{rng("D")})=0,0,SUM({rng("F")})/SUMIF({rng("F")},"<>",{rng("D")})*1000)', EUR),
        ("Dein echter Anteil qualifizierter Views", f'=IF(SUMIF({rng("D")},"<>",{rng("C")})=0,0,SUM({rng("D")})/SUMIF({rng("D")},"<>",{rng("C")}))', PCT),
        ("Dein echter YouTube-Wert: € pro 1.000 Shorts-Views", f'=IF(SUMIF({rng("I")},"<>",{rng("G")})=0,0,SUM({rng("I")})/SUMIF({rng("I")},"<>",{rng("G")})*1000)', EUR),
    ]
    for i, (lab, formula, fmt) in enumerate(k):
        r = 4 + i
        label(ws, f"A{r}", lab, bold=True)
        calc(ws[f"B{r}"], formula, fmt, bold=True, color="008000")
    note(ws, "A16", "Sobald die ersten Auszahlungen da sind: die drei »echten« Werte oben im Rechner (B6, B7, B8) eintragen – dann ist die Prognose ehrlich.")

    header(ws, 18, ["Monetarisierung freischalten", "Aktuell", "Ziel", "Fortschritt"])
    m = [
        ("TikTok: Follower", last_val("E", "E"), 10000),
        ("TikTok: Views der letzten 30 Tage", last_val("N", "C"), 100000),
        ("YouTube: Abonnenten", last_val("H", "H"), 1000),
        ("YouTube: Shorts-Views der letzten 90 Tage", last_val("O", "G"), 10000000),
    ]
    for i, (lab, formula, goal) in enumerate(m):
        r = 19 + i
        label(ws, f"A{r}", lab)
        calc(ws[f"B{r}"], formula, INT, color="008000")
        inp(ws[f"C{r}"], goal, INT)
        calc(ws[f"D{r}"], f"=IF(C{r}=0,0,MIN(B{r}/C{r},1))", PCT)
    label(ws, "A23", "TikTok Creator Rewards", bold=True)
    calc(ws["B23"], '=IF(AND(B19>=C19,B20>=C20),"✅ bewerben","⏳ noch nicht")', bold=True)
    label(ws, "A24", "YouTube-Partnerprogramm (Shorts)", bold=True)
    calc(ws["B24"], '=IF(AND(B21>=C21,B22>=C22),"✅ bewerben","⏳ noch nicht")', bold=True)
    note(ws, "A25", "Schwellen = Stand der Plattformregeln Ende 2026 (gelb, änderbar). Weitere Bedingungen: 18+, persönliches TikTok-Konto, Videos > 1 Min., keine Verstöße.")
    ws.conditional_formatting.add("D19:D22", DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="63BE7B"))

    chart = LineChart()
    chart.title = "Einnahmen pro Tag vs. Ziel"
    chart.y_axis.title = "€"
    chart.add_data(Reference(tr, min_col=11, max_col=12, min_row=4, max_row=LAST), titles_from_data=True)
    chart.set_categories(Reference(tr, min_col=1, min_row=FIRST, max_row=LAST))
    chart.height, chart.width = 9, 22
    chart.roundedCorners = False
    chart.legend.overlay = False
    chart.title.overlay = False
    chart.y_axis.title.overlay = False
    chart.x_axis.delete = False
    chart.y_axis.delete = False
    chart.x_axis.number_format = "DD.MM."
    ws.add_chart(chart, "F3")
    widths(ws, {"A": 52, "B": 16, "C": 13, "D": 13})


def pipeline(wb):
    ws = wb.create_sheet("Content-Pipeline")
    title(ws, "Content-Pipeline", "60 Video-Ideen. Status per Dropdown setzen. Nr. 1–15: Skript fertig in 03_SKRIPTE.md.")
    header(ws, 4, ["Nr.", "Thema", "Hook (erster Satz)", "Status", "Gepostet am", "TikTok\nViews", "YT Shorts\nViews", "Notiz"])
    for i, (topic, hook) in enumerate(IDEAS):
        r = 5 + i
        ws[f"A{r}"] = i + 1
        ws[f"A{r}"].font = f()
        ws[f"A{r}"].alignment = Alignment(horizontal="center")
        ws[f"B{r}"] = topic
        ws[f"B{r}"].font = f(True)
        ws[f"C{r}"] = hook
        ws[f"C{r}"].font = f()
        for col in "ABC":
            ws[f"{col}{r}"].border = BOX
        inp(ws[f"D{r}"], "Skript fertig" if i < 15 else "Idee")
        inp(ws[f"E{r}"], None, "DD.MM.YY")
        inp(ws[f"F{r}"], None, INT)
        inp(ws[f"G{r}"], None, INT)
        inp(ws[f"H{r}"])
    last = 4 + len(IDEAS)
    dv = DataValidation(type="list", formula1='"Idee,Recherche,Skript fertig,Voiceover,Schnitt,Gepostet"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"D5:D{last}")
    ws.conditional_formatting.add(f"A5:H{last}", FormulaRule(formula=['$D5="Gepostet"'], fill=DONE_FILL))
    ws[f"A{last + 2}"] = "Gepostet gesamt"
    ws[f"A{last + 2}"].font = f(True)
    calc(ws[f"D{last + 2}"], f'=COUNTIF(D5:D{last},"Gepostet")', INT, bold=True)
    calc(ws[f"F{last + 2}"], f"=SUM(F5:F{last})", INT, bold=True)
    calc(ws[f"G{last + 2}"], f"=SUM(G5:G{last})", INT, bold=True)
    widths(ws, {"A": 5, "B": 38, "C": 78, "D": 15, "E": 12, "F": 12, "G": 12, "H": 30})
    ws.freeze_panes = "C5"


def build():
    wb = Workbook()
    rechner(wb.active)
    tr = tagesreport(wb)
    uebersicht(wb, tr)
    pipeline(wb)
    out = ROOT / "business" / "Business-Tracker.xlsx"
    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    return out


if __name__ == "__main__":
    print("geschrieben:", build().relative_to(ROOT))
