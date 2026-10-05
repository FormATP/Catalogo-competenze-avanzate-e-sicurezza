#!/usr/bin/env python3
"""
extract_avanzato.py
Converte il file Excel clienti in data-avanzato.json per il catalogo web.

Struttura attesa (foglio "Catalogo corsi"):
  Ambito | Codice Competenza | Codice corso | Titolo | Durata (ore) |
  Descrizione corso | Modalità di svolgimento | Modalità Formativa |
  Ore modalità formativa | Tematiche formative

Uso:
    python tools/extract_avanzato.py Catalogo_corsi_clienti.xlsx

Output:
    assets/data/data-avanzato.json
"""

import sys, os, json, subprocess, tempfile
import pandas as pd

MODAL_MAP = {
    'aula corsi interna':                          'aula',
    'aula corsi esterna':                          'aula',
    'autoapprendimento con formazione a distanza':  'fad',
    'action learning':                              'action_learning',
    'affiancamento':                                'affiancamento',
    'affiancamento - training on the job':          'affiancamento',
}

def s(v): return "" if pd.isna(v) else str(v).strip()
def n(v):
    if pd.isna(v): return 0
    try: return int(float(v))
    except: return 0

def to_xlsx(path):
    if path.lower().endswith('.xlsx'): return path, False
    tmp = tempfile.mkdtemp()
    subprocess.run(['libreoffice','--headless','--convert-to','xlsx','--outdir',tmp,path],
                   check=True, capture_output=True)
    base = os.path.splitext(os.path.basename(path))[0]
    return os.path.join(tmp, base+'.xlsx'), True

def extract(path):
    xlsx, tmp = to_xlsx(path)
    df = pd.read_excel(xlsx, sheet_name='Catalogo corsi', header=0)

    courses_raw = {}
    for _, row in df.iterrows():
        cod = s(row['Codice corso'])
        if not cod: continue
        try: cod_int = str(int(float(cod)))
        except: continue

        if cod_int not in courses_raw:
            ambito_raw = s(row['Ambito'])
            parts = ambito_raw.split(' ', 1)
            sigla = parts[0] if len(parts) > 1 else ambito_raw
            label = parts[1] if len(parts) > 1 else ambito_raw

            cc_raw   = s(row['Codice Competenza'])
            cc_parts = cc_raw.split(' ', 1)
            codice   = cc_parts[0]
            desc_c   = cc_parts[1] if len(cc_parts) > 1 else cc_raw

            courses_raw[cod_int] = {
                'ambito':                 sigla,
                'ambito_label':           label,
                'codice':                 codice,
                'descrizione_competenza': desc_c,
                'titolo':                 s(row['Titolo']),
                'durata':                 n(row['Durata (ore)']),
                'descrizione':            s(row['Descrizione corso']),
                'tematica':               s(row['Tematiche formative']),
                'aula':            0,
                'action_learning': 0,
                'affiancamento':   0,
                'fad':             0,
            }

        modal  = s(row['Modalità Formativa']).lower().strip()
        ore    = n(row['Ore modalità formativa'])
        chiave = MODAL_MAP.get(modal)
        if chiave:
            courses_raw[cod_int][chiave] += ore

    courses = list(courses_raw.values())
    out_dir  = os.path.join(os.path.dirname(__file__), '..', 'assets', 'data')
    out_path = os.path.join(out_dir, 'data-avanzato.json')
    os.makedirs(out_dir, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

    print(f"✅  {len(courses)} corsi → {os.path.abspath(out_path)}")
    from collections import Counter
    for amb, tot in sorted(Counter(c['ambito'] for c in courses).items()):
        print(f"   {amb}: {tot} corsi")
    if tmp:
        import shutil; shutil.rmtree(os.path.dirname(xlsx), ignore_errors=True)

if __name__ == '__main__':
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    extract(sys.argv[1])
