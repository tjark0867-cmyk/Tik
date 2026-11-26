"""Erzeugt die Excel-Dateien des TikTok-Business.

  produkt/Finanz-Planer-2027.xlsx        -> das Produkt, das verkauft wird (leer, mit Beispielzeilen)
  produkt/Finanz-Planer-2027-DEMO.xlsx   -> ausgefuellte Version fuer Bildschirmaufnahmen in Videos
  business/Business-Tracker.xlsx         -> 500-EUR-Rechner + taegliches KPI-Tracking

Aufruf (aus dem Repo-Root):  python3 scripts/build_xlsx.py
"""
from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.formatting.rule import CellIsRule, DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent.parent

FONT = "Arial"
GREEN_DARK = "1F6F43"
INPUT_FILL = PatternFill("solid", fgColor="FFF2A8")
HEAD_FILL = PatternFill("solid", fgColor=GREEN_DARK)
SECTION_FILL = PatternFill("solid", fgColor="E3F1E8")
TOTAL_FILL = PatternFill("solid", fgColor="F2F2F2")
THIN = Side(style="thin", color="D0D0D0")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

EUR = '#,##0.00 "€";[Red]-#,##0.00 "€";"–"'
EUR0 = '#,##0 "€";[Red]-#,##0 "€";"–"'
PCT = '0.0%;[Red]-0.0%;"–"'
INT = '#,##0;-#,##0;"–"'
DATE = "DD.MM.YYYY"


def f(bold=False, color="000000", size=10, italic=False):
    return Font(name=FONT, bold=bold, color=color, size=size, italic=italic)


def title(ws, text, sub=None):
    ws["A1"] = text
    ws["A1"].font = f(True, GREEN_DARK, 16)
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
    """Eingabefeld: gelb hinterlegt, blaue Schrift."""
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


def widths(ws, mapping):
    for col, w in mapping.items():
        ws.column_dimensions[col].width = w


def set_default_font(wb):
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if c.font is None or c.font.name != FONT:
                    c.font = Font(name=FONT, bold=c.font.bold, color=c.font.color,
                                  size=c.font.size or 10, italic=c.font.italic)


# --------------------------------------------------------------------------------------
# PRODUKT: Finanz-Planer 2027
# --------------------------------------------------------------------------------------
MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
INCOME = ["Gehalt (netto)", "Nebeneinkommen", "Sonstige Einnahmen"]
EXPENSES = [
    ("Miete & Wohnen", "B"), ("Strom & Nebenkosten", "B"), ("Internet & Handy", "B"),
    ("Versicherungen", "B"), ("Kredite & Raten", "B"), ("Lebensmittel", "B"),
    ("Drogerie & Haushalt", "B"), ("Mobilität (Auto/ÖPNV)", "B"),
    ("Abos & Streaming", "W"), ("Essen gehen & Lieferdienste", "W"), ("Freizeit & Hobbys", "W"),
    ("Kleidung", "W"), ("Geschenke", "W"), ("Urlaub", "W"), ("Sonstiges", "W"),
    ("Notgroschen", "S"), ("Sparen & Investieren", "S"), ("Sparziele", "S"),
]
# Demo-Werte: (Budget/Monat, [Ist Jan, Feb, Mär])
DEMO_INCOME = {
    "Gehalt (netto)": (2400, [2400, 2400, 2400]),
    "Nebeneinkommen": (150, [120, 180, 210]),
    "Sonstige Einnahmen": (0, [0, 45, 0]),
}
DEMO_EXP = {
    "Miete & Wohnen": (780, [780, 780, 780]), "Strom & Nebenkosten": (95, [95, 95, 95]),
    "Internet & Handy": (55, [55, 55, 49]), "Versicherungen": (60, [60, 60, 60]),
    "Kredite & Raten": (150, [150, 150, 150]), "Lebensmittel": (320, [365, 331, 298]),
    "Drogerie & Haushalt": (50, [62, 41, 47]), "Mobilität (Auto/ÖPNV)": (58, [58, 58, 58]),
    "Abos & Streaming": (35, [71, 56, 32]), "Essen gehen & Lieferdienste": (80, [143, 96, 71]),
    "Freizeit & Hobbys": (70, [88, 64, 59]), "Kleidung": (40, [0, 79, 25]),
    "Geschenke": (25, [0, 30, 15]), "Urlaub": (75, [75, 75, 75]), "Sonstiges": (40, [52, 38, 33]),
    "Notgroschen": (150, [100, 150, 200]), "Sparen & Investieren": (150, [150, 150, 150]),
    "Sparziele": (100, [50, 100, 150]),
}

INC_FIRST = 6
INC_LAST = INC_FIRST + len(INCOME) - 1          # 8
INC_SUM = INC_LAST + 1                          # 9
EXP_LABEL = INC_SUM + 2                         # 11
EXP_FIRST = EXP_LABEL + 1                       # 12
EXP_LAST = EXP_FIRST + len(EXPENSES) - 1        # 29
EXP_SUM = EXP_LAST + 1                          # 30
LEFT = EXP_SUM + 2                              # 32
RATE = LEFT + 1                                 # 33
MCOL = [chr(ord("D") + i) for i in range(12)]   # D..O


def budget_sheet(wb, demo):
    ws = wb.create_sheet("Budget")
    title(ws, "Budget 2027", "Gelbe Felder ausfüllen: Budget pro Monat (Spalte C) und deine echten Ist-Werte je Monat. "
                             "Typ: B = Bedürfnis, W = Wunsch, S = Sparen.")
    header(ws, 4, ["Kategorie", "Typ\n(B/W/S)", "Budget /\nMonat"] + MONTHS +
           ["Summe Ist", "Ø Ist /\nMonat", "Ø Ist −\nBudget"])

    def section(row, text):
        ws.cell(row=row, column=1, value=text).font = f(True, GREEN_DARK)
        for c in range(1, 19):
            ws.cell(row=row, column=c).fill = SECTION_FILL

    section(5, "EINNAHMEN")
    section(EXP_LABEL, "AUSGABEN")

    def line(r, label, typ, budget, actuals):
        ws.cell(row=r, column=1, value=label).font = f()
        ws.cell(row=r, column=1).border = BOX
        tc = ws.cell(row=r, column=2, value=typ)
        tc.alignment = Alignment(horizontal="center")
        if typ:
            inp(tc)
        inp(ws.cell(row=r, column=3), budget, EUR)
        for i, col in enumerate(MCOL):
            val = actuals[i] if actuals and i < len(actuals) else None
            inp(ws[f"{col}{r}"], val, EUR)
        calc(ws[f"P{r}"], f"=SUM(D{r}:O{r})", EUR)
        calc(ws[f"Q{r}"], f"=IF(COUNT(D{r}:O{r})=0,0,AVERAGE(D{r}:O{r}))", EUR)
        calc(ws[f"R{r}"], f"=IF(COUNT(D{r}:O{r})=0,0,Q{r}-C{r})", EUR)

    for i, label in enumerate(INCOME):
        b, a = DEMO_INCOME[label] if demo else (None, None)
        if not demo and label == "Gehalt (netto)":
            b, a = 2400, [2400]   # Beispielzeile
            ws.cell(row=INC_FIRST + i, column=1).comment = Comment(
                "Beispielwerte – einfach mit deinen Zahlen überschreiben.", "Finanz-Planer")
        line(INC_FIRST + i, label, None, b, a)
    for i, (label, typ) in enumerate(EXPENSES):
        b, a = DEMO_EXP[label] if demo else (None, None)
        line(EXP_FIRST + i, label, typ, b, a)

    def total(r, label, first, last):
        ws.cell(row=r, column=1, value=label).font = f(True)
        for col in ["C"] + MCOL + ["P", "Q"]:
            calc(ws[f"{col}{r}"], f"=SUM({col}{first}:{col}{last})", EUR, bold=True)
        calc(ws[f"R{r}"], f"=IF(Q{r}=0,0,Q{r}-C{r})", EUR, bold=True)
        for c in range(1, 19):
            ws.cell(row=r, column=c).fill = TOTAL_FILL

    total(INC_SUM, "Summe Einnahmen", INC_FIRST, INC_LAST)
    total(EXP_SUM, "Summe Ausgaben", EXP_FIRST, EXP_LAST)

    ws.cell(row=LEFT, column=1, value="Übrig (Einnahmen − Ausgaben)").font = f(True)
    ws.cell(row=RATE, column=1, value="Sparquote (S-Kategorien ÷ Einnahmen)").font = f(True)
    for col in ["C"] + MCOL + ["P", "Q"]:
        calc(ws[f"{col}{LEFT}"], f"={col}{INC_SUM}-{col}{EXP_SUM}", EUR, bold=True)
        calc(ws[f"{col}{RATE}"],
             f"=IF({col}{INC_SUM}=0,0,SUMIF($B${EXP_FIRST}:$B${EXP_LAST},\"S\",{col}{EXP_FIRST}:{col}{EXP_LAST})/{col}{INC_SUM})",
             PCT, bold=True)

    # Ampel: B/W-Kategorien ueber Budget = rot, darunter = gruen; S-Kategorien umgekehrt
    red = PatternFill("solid", fgColor="F8D7DA")
    green = PatternFill("solid", fgColor="D4EDDA")
    for r in range(EXP_FIRST, EXP_LAST + 1):
        rng = f"R{r}"
        if ws[f"B{r}"].value == "S":
            ws.conditional_formatting.add(rng, FormulaRule(formula=[f"AND(Q{r}>0,R{r}>=0)"], fill=green))
            ws.conditional_formatting.add(rng, FormulaRule(formula=[f"AND(Q{r}>0,R{r}<0)"], fill=red))
        else:
            ws.conditional_formatting.add(rng, FormulaRule(formula=[f"AND(Q{r}>0,R{r}>0)"], fill=red))
            ws.conditional_formatting.add(rng, FormulaRule(formula=[f"AND(Q{r}>0,R{r}<=0)"], fill=green))
    for col in ["C"] + MCOL + ["P", "Q"]:
        ws.conditional_formatting.add(f"{col}{LEFT}", CellIsRule(operator="lessThan", formula=["0"], fill=red))

    dv = DataValidation(type="list", formula1='"B,W,S"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"B{EXP_FIRST}:B{EXP_LAST}")

    widths(ws, {"A": 32, "B": 8, "C": 12, **{c: 11 for c in MCOL}, "P": 12, "Q": 12, "R": 12})
    ws.freeze_panes = "D5"
    return ws


def regel_sheet(wb):
    ws = wb.create_sheet("50-30-20")
    title(ws, "50/30/20-Regel", "Wie viel solltest du für Bedürfnisse, Wünsche und Sparen ausgeben – und wie viel tust du es wirklich?")
    ws["A4"] = "Geplantes Nettoeinkommen / Monat"
    ws["A4"].font = f(True)
    calc(ws["C4"], f"=Budget!C{INC_SUM}", EUR, bold=True, color="008000")
    header(ws, 6, ["Bereich", "Anteil (änderbar)", "Empfohlen\n€ / Monat", "Dein Budget\n€ / Monat", "Dein Ist\nØ € / Monat", "Status"])
    rows = [("Bedürfnisse (B)", "B", 0.5, "le"), ("Wünsche (W)", "W", 0.3, "le"), ("Sparen (S)", "S", 0.2, "ge")]
    for i, (label, key, share, mode) in enumerate(rows):
        r = 7 + i
        ws.cell(row=r, column=1, value=label).font = f(True)
        ws.cell(row=r, column=1).border = BOX
        inp(ws.cell(row=r, column=2), share, "0%")
        calc(ws[f"C{r}"], f"=$C$4*B{r}", EUR)
        calc(ws[f"D{r}"], f"=SUMIF(Budget!$B${EXP_FIRST}:$B${EXP_LAST},\"{key}\",Budget!$C${EXP_FIRST}:$C${EXP_LAST})", EUR, color="008000")
        calc(ws[f"E{r}"], f"=SUMIF(Budget!$B${EXP_FIRST}:$B${EXP_LAST},\"{key}\",Budget!$Q${EXP_FIRST}:$Q${EXP_LAST})", EUR, color="008000")
        if mode == "le":
            calc(ws[f"F{r}"], f'=IF(E{r}=0,"–",IF(E{r}<=C{r},"✅ im Rahmen","⚠️ "&TEXT(E{r}-C{r},"0")&" € drüber"))')
        else:
            calc(ws[f"F{r}"], f'=IF(E{r}=0,"–",IF(E{r}>=C{r},"✅ Ziel erreicht","⚠️ "&TEXT(C{r}-E{r},"0")&" € unter Ziel"))')
    ws["A10"] = "Summe Anteile (muss 100 % sein)"
    ws["A10"].font = f(italic=True)
    calc(ws["B10"], "=SUM(B7:B9)", "0%")
    ws.conditional_formatting.add("B10", CellIsRule(operator="notEqual", formula=["1"], fill=PatternFill("solid", fgColor="F8D7DA")))

    chart = BarChart()
    chart.type = "col"
    chart.title = "Empfohlen vs. Budget vs. Ist"
    chart.y_axis.title = "€ / Monat"
    data = Reference(ws, min_col=3, max_col=5, min_row=6, max_row=9)
    cats = Reference(ws, min_col=1, min_row=7, max_row=9)
    chart.add_data(data, titles_from_data=True)
    chart.set_categories(cats)
    chart.height, chart.width = 8, 16
    chart.roundedCorners = False
    chart.legend.overlay = False
    chart.title.overlay = False
    chart.y_axis.title.overlay = False
    chart.x_axis.delete = False
    chart.y_axis.delete = False
    ws.add_chart(chart, "A12")
    widths(ws, {"A": 32, "B": 16, "C": 14, "D": 14, "E": 14, "F": 24})


def ziele_sheet(wb, demo):
    ws = wb.create_sheet("Sparziele")
    title(ws, "Sparziele", "Trag deine Ziele ein – der Planer rechnet aus, wie viel du jeden Monat zurücklegen musst.")
    header(ws, 4, ["Ziel", "Zielbetrag", "Bereits gespart", "Zieldatum", "Noch offen", "Monate bis Ziel", "Pro Monat nötig", "Fortschritt"])
    demo_rows = [("Notgroschen (3 Monatsausgaben)", 6000, 1850, date(2027, 12, 31)),
                 ("Urlaub Sommer", 1500, 450, date(2027, 7, 1)),
                 ("Neues Handy", 600, 120, date(2027, 10, 1)),
                 ("Weihnachtsgeschenke", 400, 0, date(2027, 11, 30))]
    example = [("Urlaub (Beispiel – überschreiben)", 1500, 300, date(2027, 7, 1))]
    rows = demo_rows if demo else example
    for i in range(10):
        r = 5 + i
        vals = rows[i] if i < len(rows) else (None, None, None, None)
        inp(ws[f"A{r}"], vals[0])
        inp(ws[f"B{r}"], vals[1], EUR)
        inp(ws[f"C{r}"], vals[2], EUR)
        inp(ws[f"D{r}"], vals[3], DATE)
        calc(ws[f"E{r}"], f'=IF(B{r}="","",MAX(B{r}-C{r},0))', EUR)
        calc(ws[f"F{r}"], f'=IF(OR(B{r}="",D{r}=""),"",MAX((YEAR(D{r})-YEAR(TODAY()))*12+MONTH(D{r})-MONTH(TODAY()),1))', INT)
        calc(ws[f"G{r}"], f'=IF(F{r}="","",E{r}/F{r})', EUR)
        calc(ws[f"H{r}"], f'=IF(OR(B{r}="",B{r}=0),"",MIN(C{r}/B{r},1))', PCT)
    ws["A15"] = "Gesamt"
    ws["A15"].font = f(True)
    for col in "BCEG":
        calc(ws[f"{col}15"], f"=SUM({col}5:{col}14)", EUR, bold=True)
    calc(ws["H15"], '=IF(B15=0,0,C15/B15)', PCT, bold=True)
    ws.conditional_formatting.add("H5:H15", DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="63BE7B"))
    widths(ws, {"A": 36, "B": 13, "C": 15, "D": 13, "E": 13, "F": 14, "G": 15, "H": 14})
    ws.freeze_panes = "A5"


def wochen_sheet(wb, demo):
    ws = wb.create_sheet("52-Wochen")
    title(ws, "52-Wochen-Spar-Challenge", "Woche 1 = 1 × Startbetrag, Woche 2 = 2 × Startbetrag … Erledigte Wochen mit x markieren.")
    ws["A3"] = "Startbetrag (Woche 1)"
    ws["A3"].font = f(True)
    inp(ws["B3"], 1, EUR)
    header(ws, 5, ["Woche", "Einzahlung", "Erledigt (x)", "Bisher gespart"])
    for w in range(1, 53):
        r = 5 + w
        ws[f"A{r}"] = w
        ws[f"A{r}"].font = f()
        ws[f"A{r}"].alignment = Alignment(horizontal="center")
        ws[f"A{r}"].border = BOX
        calc(ws[f"B{r}"], f"=A{r}*$B$3", EUR)
        mark = "x" if (demo and w <= 11) or (not demo and w == 1) else None
        inp(ws[f"C{r}"], mark)
        ws[f"C{r}"].alignment = Alignment(horizontal="center")
        calc(ws[f"D{r}"], f'=SUMIF($C$6:C{r},"x",$B$6:B{r})', EUR)
    ws["F5"], ws["F6"], ws["F7"], ws["F8"] = "Ziel gesamt", "Schon gespart", "Fortschritt", "Wochen erledigt"
    for c in ("F5", "F6", "F7", "F8"):
        ws[c].font = f(True)
    calc(ws["G5"], "=SUM(B6:B57)", EUR, bold=True)
    calc(ws["G6"], '=SUMIF(C6:C57,"x",B6:B57)', EUR, bold=True)
    calc(ws["G7"], "=IF(G5=0,0,G6/G5)", PCT, bold=True)
    calc(ws["G8"], '=COUNTIF(C6:C57,"x")', INT, bold=True)
    ws.conditional_formatting.add("G7", DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="63BE7B"))
    ws.conditional_formatting.add("A6:D57", FormulaRule(formula=['$C6="x"'], fill=PatternFill("solid", fgColor="D4EDDA")))
    ws["F10"] = "Profi-Tipp: Rückwärts sparen (Woche 1 = 52 €) – im Dezember, wenn Geschenke anstehen, sind die Beträge dann klein."
    ws["F10"].font = f(italic=True, color="555555")
    widths(ws, {"A": 22, "B": 13, "C": 13, "D": 15, "E": 3, "F": 18, "G": 14})
    ws.freeze_panes = "A6"


def schulden_sheet(wb, demo):
    ws = wb.create_sheet("Schulden")
    title(ws, "Schuldenfrei-Plan", "Schneeball-Methode: Alle Mindestraten zahlen, jeden Extra-Euro in die Schuld mit Rang 1 (kleinster Betrag).")
    header(ws, 4, ["Schuld", "Restbetrag", "Zins p. a.", "Monatliche Rate", "Monate bis\nschuldenfrei", "Zinskosten\ngesamt (ca.)", "Schneeball-\nRang"])
    demo_rows = [("Dispo Girokonto", 800, 0.119, 80), ("Ratenkredit Auto", 4500, 0.069, 150), ("Klarna-Raten", 230, 0, 46)]
    example = [("Dispo (Beispiel – überschreiben)", 800, 0.119, 80)]
    rows = demo_rows if demo else example
    for i in range(8):
        r = 5 + i
        vals = rows[i] if i < len(rows) else (None, None, None, None)
        inp(ws[f"A{r}"], vals[0])
        inp(ws[f"B{r}"], vals[1], EUR)
        inp(ws[f"C{r}"], vals[2], "0.0%")
        inp(ws[f"D{r}"], vals[3], EUR)
        calc(ws[f"E{r}"], f'=IF(B{r}="","",IFERROR(ROUNDUP(IF(C{r}=0,B{r}/D{r},NPER(C{r}/12,-D{r},B{r})),0),"Rate zu niedrig"))', INT)
        calc(ws[f"F{r}"], f'=IF(B{r}="","",IF(ISNUMBER(E{r}),IF(C{r}=0,0,MAX(NPER(C{r}/12,-D{r},B{r})*D{r}-B{r},0)),""))', EUR)
        calc(ws[f"G{r}"], f'=IF(B{r}="","",COUNTIF($B$5:$B$12,"<"&B{r})+1)', INT)
        ws[f"G{r}"].alignment = Alignment(horizontal="center")
    ws["A13"] = "Gesamt"
    ws["A13"].font = f(True)
    for col in "BDF":
        calc(ws[f"{col}13"], f"=SUM({col}5:{col}12)", EUR, bold=True)
    calc(ws["E13"], "=IF(COUNT(E5:E12)=0,0,MAX(E5:E12))", INT, bold=True)
    ws["A15"] = "Hinweis: Zinskosten gelten bei gleichbleibender Rate. Lawinen-Methode = höchster Zins zuerst, spart meist mehr Zinsen."
    ws["A15"].font = f(italic=True, color="555555")
    ws.conditional_formatting.add("G5:G12", CellIsRule(operator="equal", formula=["1"], fill=PatternFill("solid", fgColor="D4EDDA")))
    widths(ws, {"A": 34, "B": 13, "C": 11, "D": 15, "E": 14, "F": 14, "G": 12})


def abo_sheet(wb, demo):
    ws = wb.create_sheet("Abo-Check")
    title(ws, "Abo-Check", "Jedes Abo eintragen, ehrlich bewerten, unnötige kündigen. Das Ergebnis ist dein Sparpotenzial pro Jahr.")
    header(ws, 4, ["Abo", "Kosten / Monat", "Nutzung", "Behalten?", "Kosten / Jahr", "Sparpotenzial / Jahr"])
    demo_rows = [("Netflix", 13.99, "oft", "ja"), ("Spotify", 10.99, "oft", "ja"), ("Fitnessstudio", 29.90, "nie", "nein"),
                 ("Amazon Prime", 8.99, "selten", "ja"), ("Disney+", 9.99, "selten", "nein"), ("Foto-App Premium", 4.99, "nie", "nein"),
                 ("Cloud-Speicher", 2.99, "oft", "ja"), ("Zeitschrift digital", 7.99, "nie", "nein")]
    example = [("Streaming (Beispiel – überschreiben)", 13.99, "selten", "nein")]
    rows = demo_rows if demo else example
    for i in range(15):
        r = 5 + i
        vals = rows[i] if i < len(rows) else (None, None, None, None)
        inp(ws[f"A{r}"], vals[0])
        inp(ws[f"B{r}"], vals[1], EUR)
        inp(ws[f"C{r}"], vals[2])
        inp(ws[f"D{r}"], vals[3])
        calc(ws[f"E{r}"], f'=IF(B{r}="","",B{r}*12)', EUR)
        calc(ws[f"F{r}"], f'=IF(B{r}="","",IF(D{r}="nein",B{r}*12,0))', EUR)
    ws["A20"] = "Gesamt"
    ws["A20"].font = f(True)
    for col in "BEF":
        calc(ws[f"{col}20"], f"=SUM({col}5:{col}19)", EUR, bold=True)
    ws["A22"] = "Du sparst pro Jahr:"
    ws["A22"].font = f(True, GREEN_DARK, 14)
    calc(ws["B22"], "=F20", EUR, bold=True)
    ws["B22"].font = f(True, GREEN_DARK, 14)
    dv1 = DataValidation(type="list", formula1='"oft,selten,nie"', allow_blank=True)
    dv2 = DataValidation(type="list", formula1='"ja,nein"', allow_blank=True)
    ws.add_data_validation(dv1)
    ws.add_data_validation(dv2)
    dv1.add("C5:C19")
    dv2.add("D5:D19")
    ws.conditional_formatting.add("A5:F19", FormulaRule(formula=['$D5="nein"'], fill=PatternFill("solid", fgColor="F8D7DA")))
    widths(ws, {"A": 36, "B": 15, "C": 11, "D": 11, "E": 14, "F": 19})


def start_sheet(ws, demo):
    ws.title = "Start"
    title(ws, "Finanz-Planer 2027" + (" – DEMO" if demo else ""),
          "Dein Geld im Griff – in 10 Minuten pro Monat.")
    steps = [
        "So funktioniert's:",
        "1. Tab »Budget«: Einnahmen und Budget pro Kategorie (Spalte C) eintragen.",
        "2. Jeden Monat deine echten Ausgaben in die Monatsspalte schreiben (Kontoauszug-App reicht).",
        "3. Tab »50-30-20«: sofort sehen, ob du zu viel für Wünsche ausgibst.",
        "4. Tab »Sparziele«: Ziele eintragen – der Planer sagt dir die nötige Monatsrate.",
        "5. Tab »52-Wochen«: wöchentlich sparen und abhaken.",
        "6. Tabs »Schulden« und »Abo-Check«: Kosten, die dich bremsen, sichtbar machen und loswerden.",
    ]
    for i, s in enumerate(steps):
        c = ws.cell(row=4 + i, column=1, value=s)
        c.font = f(i == 0)
    ws["A12"] = "Legende:"
    ws["A12"].font = f(True)
    inp(ws["A13"], "Gelb = hier eintragen")
    ws["A14"] = "Weiß = rechnet automatisch (nicht überschreiben)"
    ws["A14"].font = f()
    if not demo:
        ws["A15"] = "Zeilen mit »(Beispiel – überschreiben)« zeigen dir das Format – einfach ersetzen."
        ws["A15"].font = f(italic=True, color="555555")

    ws["A17"] = "DEIN DASHBOARD"
    ws["A17"].font = f(True, GREEN_DARK, 13)
    dash = [
        ("Einnahmen bisher (Jahr)", f"=Budget!P{INC_SUM}", EUR),
        ("Ausgaben bisher (Jahr)", f"=Budget!P{EXP_SUM}", EUR),
        ("Übrig bisher (Jahr)", f"=Budget!P{LEFT}", EUR),
        ("Ø Sparquote", f"=Budget!Q{RATE}", PCT),
        ("Sparziele – Fortschritt", "=Sparziele!H15", PCT),
        ("52-Wochen – schon gespart", "='52-Wochen'!G6", EUR),
        ("Abo-Check – Sparpotenzial / Jahr", "='Abo-Check'!F20", EUR),
        ("Schulden – Restbetrag gesamt", "=Schulden!B13", EUR),
    ]
    for i, (label, formula, fmt) in enumerate(dash):
        r = 18 + i
        ws.cell(row=r, column=1, value=label).font = f(True)
        ws.cell(row=r, column=1).border = BOX
        calc(ws[f"B{r}"], formula, fmt, bold=True, color="008000")
    ws["A28"] = "Hinweis: Dieser Planer ist ein Hilfsmittel zur Haushaltsplanung und keine Finanz- oder Anlageberatung."
    ws["A28"].font = f(italic=True, color="777777", size=9)
    widths(ws, {"A": 62, "B": 18})


def build_planer(demo):
    wb = Workbook()
    start_sheet(wb.active, demo)
    budget_sheet(wb, demo)
    regel_sheet(wb)
    ziele_sheet(wb, demo)
    wochen_sheet(wb, demo)
    schulden_sheet(wb, demo)
    abo_sheet(wb, demo)
    set_default_font(wb)
    out = ROOT / "produkt" / ("Finanz-Planer-2027-DEMO.xlsx" if demo else "Finanz-Planer-2027.xlsx")
    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    return out


# --------------------------------------------------------------------------------------
# BUSINESS-TRACKER: 500-EUR-Rechner + KPI-Tracking
# --------------------------------------------------------------------------------------
def build_tracker():
    wb = Workbook()
    ws = wb.active
    ws.title = "Rechner"
    title(ws, "500-€-Rechner", "Gelbe Annahmen anpassen – unten steht, wie viele Views du pro Tag für dein Ziel brauchst.")
    header(ws, 4, ["Annahme", "Wert", "Quelle / Hinweis"])
    A = [  # (label, value, fmt, note)
        ("Ziel Umsatz pro Tag (netto)", 500, EUR0, "Dein Ziel."),
        ("Preis Finanz-Planer (brutto)", 19, EUR, "Empfehlung aus der Strategie; Launch-Preis 14 € möglich."),
        ("Umsatzsteuer", 0.19, PCT, "DE-Regelsteuersatz; Digistore24 führt sie als Wiederverkäufer ab."),
        ("Plattformgebühr variabel", 0.079, PCT, "Digistore24-Standard ca. 7,9 % – aktuellen Stand prüfen."),
        ("Plattformgebühr fix pro Verkauf", 1.00, EUR, "Digistore24-Standard ca. 1 € – aktuellen Stand prüfen."),
        ("Planer-Verkäufe pro 1.000 Views", 0.08, "0.00", "Annahme für Produkt-Demo-lastigen Content; dein echter Wert steht im Tab Tagesreport."),
        ("Ø Preis TikTok-Shop-Produkt", 25, EUR, "Annahme: Haushalts-/Spar-Gadgets 10–40 €."),
        ("Affiliate-Provision", 0.12, PCT, "Annahme; im TikTok Shop je Produkt verschieden (oft 5–20 %)."),
        ("Affiliate-Verkäufe pro 1.000 Views", 0.12, "0.00", "Annahme; nur bei Videos mit Produkt-Link realistisch."),
        ("Creator Rewards € pro 1.000 qual. Views", 0.50, EUR, "Annahme; Spanne grob 0,30–1,00 €. Erst ab 10k Follower & Videos > 1 Min."),
        ("Anteil qualifizierter Views", 0.40, PCT, "Annahme: nicht jeder View zählt (Länge, For-You-Feed, Original)."),
        ("Videos pro Tag", 3, INT, "Empfehlung aus dem Content-Plan."),
    ]
    for i, (label, value, fmt, note) in enumerate(A):
        r = 5 + i
        ws.cell(row=r, column=1, value=label).font = f()
        ws.cell(row=r, column=1).border = BOX
        inp(ws[f"B{r}"], value, fmt)
        ws[f"C{r}"] = note
        ws[f"C{r}"].font = f(italic=True, color="555555", size=9)
    # rows: 5 Ziel, 6 Preis, 7 USt, 8 Geb%, 9 Geb fix, 10 Rate P, 11 Aff Preis, 12 Prov, 13 Rate A, 14 CR, 15 qual, 16 Videos
    header(ws, 18, ["Ergebnis", "Wert", "Erklärung"])
    R = [
        ("Netto pro Planer-Verkauf", "=B6/(1+B7)-B6*B8-B9", EUR, "Was nach Steuer und Gebühren bei dir ankommt."),
        ("Provision pro Affiliate-Verkauf", "=B11*B12", EUR, ""),
        ("Umsatz pro 1.000 Views", "=B10*B19+B13*B20+B14*B15", EUR, "Alle drei Einnahmequellen zusammen."),
        ("Benötigte Views pro Tag", "=IF(B21=0,0,B5/B21*1000)", INT, "Über alle Videos zusammen."),
        ("Benötigte Ø Views pro Video", "=IF(B16=0,0,B22/B16)", INT, ""),
        ("→ Planer-Verkäufe pro Tag", "=B22/1000*B10", "0.0", ""),
        ("→ Affiliate-Verkäufe pro Tag", "=B22/1000*B13", "0.0", ""),
        ("Umsatz Planer / Tag", "=B24*B19", EUR, ""),
        ("Umsatz Affiliate / Tag", "=B25*B20", EUR, ""),
        ("Umsatz Creator Rewards / Tag", "=B22/1000*B14*B15", EUR, ""),
        ("Summe / Tag (Kontrolle = Ziel)", "=B26+B27+B28", EUR, ""),
        ("Umsatz / Monat (30 Tage)", "=B29*30", EUR0, "Vor Einkommensteuer – Rücklage 30–40 % bilden."),
    ]
    for i, (label, formula, fmt, note) in enumerate(R):
        r = 19 + i
        ws.cell(row=r, column=1, value=label).font = f(i in (3, 4, 10))
        ws.cell(row=r, column=1).border = BOX
        calc(ws[f"B{r}"], formula, fmt, bold=i in (3, 4, 10))
        ws[f"C{r}"] = note
        ws[f"C{r}"].font = f(italic=True, color="555555", size=9)
    for r in (22, 23):
        ws[f"A{r}"].fill = PatternFill("solid", fgColor="D4EDDA")
        ws[f"B{r}"].fill = PatternFill("solid", fgColor="D4EDDA")
    widths(ws, {"A": 40, "B": 16, "C": 80})

    # Tagesreport
    tr = wb.create_sheet("Tagesreport")
    title(tr, "Tagesreport", "Jeden Abend 2 Minuten: Zahlen aus TikTok-Analytics, Digistore24 und TikTok Shop eintragen.")
    cols = ["Datum", "Videos\ngepostet", "Views", "Profil-\naufrufe", "Link-\nKlicks", "Planer-\nVerkäufe",
            "Umsatz Planer\n(netto)", "Affiliate-\nProvision", "Creator\nRewards", "Gesamt", "Ziel", "Erreicht",
            "View →\nProfil", "Profil →\nKlick", "Klick →\nKauf"]
    header(tr, 4, cols)
    start = date(2026, 11, 27)
    days = 180
    for i in range(days):
        r = 5 + i
        tr[f"A{r}"] = start + timedelta(days=i)
        tr[f"A{r}"].number_format = "DD.MM.YY"
        tr[f"A{r}"].font = f()
        tr[f"A{r}"].border = BOX
        for col in "BCDEFHI":
            inp(tr[f"{col}{r}"], None, EUR if col in "HI" else INT)
        calc(tr[f"G{r}"], f'=IF(F{r}="","",F{r}*Rechner!$B$19)', EUR, color="008000")
        calc(tr[f"J{r}"], f'=IF(COUNT(F{r},H{r},I{r})=0,"",F{r}*Rechner!$B$19+H{r}+I{r})', EUR, bold=True)
        calc(tr[f"K{r}"], f"=Rechner!$B$5", EUR0, color="008000")
        calc(tr[f"L{r}"], f'=IF(J{r}="","",J{r}/K{r})', PCT)
        calc(tr[f"M{r}"], f'=IF(OR(C{r}="",C{r}=0,D{r}=""),"",D{r}/C{r})', PCT)
        calc(tr[f"N{r}"], f'=IF(OR(D{r}="",D{r}=0,E{r}=""),"",E{r}/D{r})', PCT)
        calc(tr[f"O{r}"], f'=IF(OR(E{r}="",E{r}=0,F{r}=""),"",F{r}/E{r})', PCT)
    # Beispielzeile (Tag 1)
    for col, v in zip("BCDEFHI", [2, 1840, 31, 0, 0, 0, 0]):
        tr[f"{col}5"].value = v
    tr["A5"].comment = Comment("Beispielwerte für Tag 1 – mit deinen echten Zahlen überschreiben.", "Business-Tracker")
    last = 4 + days
    tr.conditional_formatting.add(f"L5:L{last}", DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="63BE7B"))
    widths(tr, {"A": 11, **{c: 11 for c in "BCDEFHIKLMNO"}, "G": 13, "J": 12})
    tr.freeze_panes = "B5"

    # Uebersicht
    ov = wb.create_sheet("Übersicht", 1)
    title(ov, "Übersicht", "Rechnet automatisch aus dem Tagesreport.")
    K = [
        ("Getrackte Tage", f"=COUNT(Tagesreport!J5:J{last})", INT),
        ("Videos gesamt", f"=SUM(Tagesreport!B5:B{last})", INT),
        ("Views gesamt", f"=SUM(Tagesreport!C5:C{last})", INT),
        ("Ø Views pro Video", "=IF(B5=0,0,B6/B5)", INT),
        ("Umsatz gesamt", f"=SUM(Tagesreport!J5:J{last})", EUR),
        ("Ø Umsatz pro Tag", "=IF(B4=0,0,B8/B4)", EUR),
        ("Bester Tag", f"=IF(B4=0,0,MAX(Tagesreport!J5:J{last}))", EUR),
        ("Tage mit Ziel erreicht", f'=COUNTIF(Tagesreport!L5:L{last},">=1")', INT),
        ("Deine echten Planer-Verkäufe pro 1.000 Views", f"=IF(B6=0,0,SUM(Tagesreport!F5:F{last})/B6*1000)", "0.000"),
        ("Ø View → Profil", f"=IF(B6=0,0,SUM(Tagesreport!D5:D{last})/B6)", PCT),
        ("Ø Profil → Link-Klick", f"=IF(SUM(Tagesreport!D5:D{last})=0,0,SUM(Tagesreport!E5:E{last})/SUM(Tagesreport!D5:D{last}))", PCT),
        ("Ø Link-Klick → Kauf", f"=IF(SUM(Tagesreport!E5:E{last})=0,0,SUM(Tagesreport!F5:F{last})/SUM(Tagesreport!E5:E{last}))", PCT),
    ]
    header(ov, 3, ["Kennzahl", "Wert"])
    for i, (label, formula, fmt) in enumerate(K):
        r = 4 + i
        ov.cell(row=r, column=1, value=label).font = f(True)
        ov.cell(row=r, column=1).border = BOX
        calc(ov[f"B{r}"], formula, fmt, bold=True, color="008000")
    ov["A17"] = "Tipp: Trag »Deine echten Planer-Verkäufe pro 1.000 Views« nach 2–3 Wochen im Rechner (B10) ein – dann ist die Prognose ehrlich."
    ov["A17"].font = f(italic=True, color="555555")

    chart = LineChart()
    chart.title = "Umsatz pro Tag vs. Ziel"
    chart.y_axis.title = "€"
    chart.add_data(Reference(tr, min_col=10, max_col=11, min_row=4, max_row=last), titles_from_data=True)
    chart.set_categories(Reference(tr, min_col=1, min_row=5, max_row=last))
    chart.height, chart.width = 9, 22
    chart.roundedCorners = False
    chart.legend.overlay = False
    chart.title.overlay = False
    chart.y_axis.title.overlay = False
    chart.x_axis.delete = False
    chart.y_axis.delete = False
    chart.x_axis.number_format = "DD.MM."
    ov.add_chart(chart, "D3")
    widths(ov, {"A": 46, "B": 16})

    set_default_font(wb)
    out = ROOT / "business" / "Business-Tracker.xlsx"
    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    return out


if __name__ == "__main__":
    for p in (build_planer(False), build_planer(True), build_tracker()):
        print("geschrieben:", p.relative_to(ROOT))
