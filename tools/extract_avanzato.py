#!/usr/bin/env python3
"""
extract_avanzato.py
Converte il file XLS del gestionale Fondimpresa in data-avanzato.json
per il catalogo web Form&ATP.

Uso:
    python tools/extract_avanzato.py <percorso_file.xls>

Output:
    assets/data/data-avanzato.json
"""

import sys
import os
import json
import subprocess
import tempfile
import pandas as pd

# ── Mappatura modalità formativa → chiave JSON ─────────────────────────
MODAL_MAP = {
    'aula corsi interna':                                   'aula',
    'aula corsi esterna':                                   'aula',
    'autoapprendimento con formazione a distanza':          'fad',
    'action learning':                                      'action_learning',
    'affiancamento':                                        'affiancamento',
    'affiancamento - training on the job':                  'affiancamento',
    'partecipazione a convegni - seminari - workshop - esterni': None,  # ignora
    'altro':                                                None,
}

# ── Colonne del foglio Progettazioni ──────────────────────────────────
C_AMBITO    = 'Ambito'
C_COD_COMP  = 'Codice Competenza'
C_COD_CORSO = 'Codice corso\n(numero intero)'
C_TITOLO    = 'Titolo\n(max 255 caratteri*)'
C_DURATA    = 'Durata in ore\n(secondo min/max della competenza selezionata)'
C_DESC      = 'Descrizione corso\n(min 1500 - max 5000 caratteri*)'
C_DEST      = 'Destinatari\n(min 1000 - max 2000 caratteri*)'
C_MOD_SVOL  = "Modalità di svolgimento dell'azione formativa\n(min 1000 - max 2000 caratteri*)"
C_TIPO_CERT = 'Tipo Certificazione'
C_CERT      = 'Certificazione degli esiti\n(max 2000* caratteri)'
C_MOD_FORM  = 'Modalità Formativa'
C_ORE_MOD   = 'Ore corso modalita formativa\n(la somma per corso deve essere uguale alla durata Colonna E)'


def s(v):
    return "" if pd.isna(v) else str(v).strip()

def n(v):
    if pd.isna(v): return 0
    try:    return int(float(v))
    except: return 0


def to_xlsx(path):
    """Converte .xls → .xlsx via LibreOffice se necessario."""
    if path.lower().endswith('.xlsx'):
        return path, False
    tmp = tempfile.mkdtemp()
    subprocess.run(
        ['libreoffice', '--headless', '--convert-to', 'xlsx', '--outdir', tmp, path],
        check=True, capture_output=True
    )
    base = os.path.splitext(os.path.basename(path))[0]
    out  = os.path.join(tmp, base + '.xlsx')
    return out, True


def extract(xls_path):
    xlsx_path, tmp = to_xlsx(xls_path)

    df = pd.read_excel(xlsx_path, sheet_name='Progettazioni', header=2)

    courses_raw = {}
    for _, row in df.iterrows():
        cod_raw = s(row[C_COD_CORSO])
        if not cod_raw:
            continue
        try:
            cod_int = str(int(float(cod_raw)))
        except ValueError:
            continue

        if cod_int not in courses_raw:
            ambito_raw = s(row[C_AMBITO])
            parts = ambito_raw.split(' ', 1)
            sigla = parts[0] if len(parts) > 1 else ambito_raw
            label = parts[1] if len(parts) > 1 else ambito_raw

            cc_raw = s(row[C_COD_COMP])
            cc_parts = cc_raw.split(' ', 1)
            codice = cc_parts[0]
            desc_c = cc_parts[1] if len(cc_parts) > 1 else cc_raw

            courses_raw[cod_int] = {
                'ambito':                sigla,
                'ambito_label':          label,
                'codice':                codice,
                'descrizione_competenza':desc_c,
                'titolo':                s(row[C_TITOLO]),
                'durata':                n(row[C_DURATA]),
                'descrizione':           s(row[C_DESC]),
                'destinatari':           s(row[C_DEST]),
                'modalita':              s(row[C_MOD_SVOL]),
                'tipo_cert':             s(row[C_TIPO_CERT]),
                'certificazione':        s(row[C_CERT]),
                'aula':                  0,
                'action_learning':       0,
                'affiancamento':         0,
                'fad':                   0,
            }

        modal = s(row[C_MOD_FORM]).lower().strip()
        ore   = n(row[C_ORE_MOD])
        chiave = MODAL_MAP.get(modal)
        if chiave and chiave in courses_raw[cod_int]:
            courses_raw[cod_int][chiave] += ore

    courses = list(courses_raw.values())

    out_dir  = os.path.join(os.path.dirname(__file__), '..', 'assets', 'data')
    out_path = os.path.join(out_dir, 'data-avanzato.json')
    os.makedirs(out_dir, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

    print(f"✅  Estratti {len(courses)} corsi → {os.path.abspath(out_path)}")

    # Riepilogo ambiti
    from collections import Counter
    cnt = Counter(c['ambito'] for c in courses)
    for amb, tot in sorted(cnt.items()):
        print(f"   {amb}: {tot} corsi")

    if tmp:
        import shutil
        shutil.rmtree(os.path.dirname(xlsx_path), ignore_errors=True)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    extract(sys.argv[1])
