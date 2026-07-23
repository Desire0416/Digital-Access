# Parse le manuel LMS (contenu.md extrait du .docx) en JSON structuré.
import sys, re, json

SRC = sys.argv[1]
OUT = sys.argv[2]

raw = open(SRC, encoding="utf-8").read()
lines = [l.rstrip() for l in raw.split("\n")]

def nz(a, b):  # non-empty lines in [a, b)
    return [l.strip() for l in lines[a:b] if l.strip()]

XY = re.compile(r"^(\d+)\.(\d+)\s+(.*)$")
MOD = re.compile(r"^\d+\.\s+Module\s+(\d+)\s+—\s+(.+)$")

# index of every module heading (ignorer le sommaire : un vrai module est suivi
# de « Texte d'ouverture à publier sur la plateforme ») + section évaluation.
def is_real_module(i):
    return any(lines[j].strip().startswith("Texte d’ouverture") or lines[j].strip().startswith("Texte d'ouverture")
               for j in range(i + 1, min(i + 4, len(lines))))
mod_idx = [i for i, l in enumerate(lines) if MOD.match(l.strip()) and is_real_module(i)]
last = mod_idx[-1]
# sections 13/14 réelles = celles situées APRÈS le dernier module (pas le sommaire)
eval_idx = next(i for i in range(last, len(lines)) if re.match(r"^13\.\s+Évaluation", lines[i].strip()))
annex_idx = next(i for i in range(eval_idx, len(lines)) if re.match(r"^14\.\s+Annexes", lines[i].strip()))
concl_idx = next(i for i in range(annex_idx, len(lines)) if lines[i].strip().startswith("Conclusion pédagogique"))

def find(a, b, pred):
    for i in range(a, b):
        if pred(lines[i].strip()):
            return i
    return -1

modules = []
bounds = mod_idx + [eval_idx]
for k in range(len(mod_idx)):
    a, b = bounds[k], bounds[k + 1]
    m = MOD.match(lines[a].strip())
    num = int(m.group(1)); title = m.group(2).strip()

    i_bien = find(a, b, lambda s: s.startswith("BIENVENUE"))
    i_obj = find(a, b, lambda s: s == "Objectifs pédagogiques")
    i_parc = find(a, b, lambda s: s == "Parcours du module")
    i_tuto = find(a, b, lambda s: s.startswith("Tutoriel pas à pas"))
    i_act = find(a, b, lambda s: s == "Activité pratique")
    i_liv = find(a, b, lambda s: s == "Livrable du projet fil rouge")
    i_quiz = find(a, b, lambda s: s == "Quiz de validation")
    i_corr = find(a, b, lambda s: s == "Corrigé commenté")
    i_web = find(a, b, lambda s: s.startswith("Webinaire"))
    i_res = find(a, b, lambda s: s == "Résumé du module")

    bienvenue = lines[i_bien].strip()
    # durée/validation/livrable table data row (3 cells)
    duree_row = None
    for i in range(a, b):
        if lines[i].strip() == "| DURÉE | VALIDATION | PROJET FIL ROUGE |":
            cells = [c.strip() for c in lines[i + 2].strip().strip("|").split("|")]
            duree_row = cells
            break

    objectives = nz(i_obj + 1, i_parc)

    # parcours : run de X.Y jusqu'à répétition du premier (= début du contenu)
    parcours = []
    i = i_parc + 1
    while i < b:
        s = lines[i].strip()
        mm = XY.match(s)
        if not mm:
            i += 1
            continue
        key = f"{mm.group(1)}.{mm.group(2)}"
        if parcours and key == parcours[0][0]:
            break
        parcours.append((key, mm.group(3).strip()))
        i += 1
    content_start = i

    # sous-sections : de content_start à i_tuto, découpées par titres X.Y
    sec_heads = [j for j in range(content_start, i_tuto) if XY.match(lines[j].strip())]
    sections = []
    for si, sj in enumerate(sec_heads):
        end = sec_heads[si + 1] if si + 1 < len(sec_heads) else i_tuto
        hm = XY.match(lines[sj].strip())
        stitle = hm.group(3).strip()
        skey = f"{hm.group(1)}.{hm.group(2)}"
        block = lines[sj + 1:end]
        i_ret = next((x for x, l in enumerate(block) if l.strip() == "À retenir"), None)
        i_q = next((x for x, l in enumerate(block) if l.strip().startswith("QUESTION DE RÉFLEXION")), None)
        prose_end = i_ret if i_ret is not None else (i_q if i_q is not None else len(block))
        prose = [l.strip() for l in block[:prose_end] if l.strip()]
        retenir = []
        if i_ret is not None:
            ret_end = i_q if i_q is not None else len(block)
            retenir = [l.strip() for l in block[i_ret + 1:ret_end] if l.strip()]
        question = block[i_q].strip() if i_q is not None else ""
        sections.append({"key": skey, "title": stitle, "prose": prose, "retenir": retenir, "question": question})

    tuto_title = lines[i_tuto].strip()
    tuto_steps = nz(i_tuto + 1, i_act)

    # activité : CONSIGNE — ... puis Modalités
    act_block = lines[i_act + 1:i_liv]
    consigne = next((l.strip() for l in act_block if l.strip().startswith("CONSIGNE")), "")
    i_mod = next((x for x, l in enumerate(act_block) if l.strip() == "Modalités"), None)
    modalites = [l.strip() for l in act_block[i_mod + 1:] if l.strip()] if i_mod is not None else []

    # livrable : PRODUCTION ATTENDUE — ... puis Critères de réussite
    liv_block = lines[i_liv + 1:i_quiz]
    prod = next((l.strip() for l in liv_block if l.strip().startswith("PRODUCTION ATTENDUE")), "")
    i_crit = next((x for x, l in enumerate(liv_block) if l.strip() == "Critères de réussite"), None)
    criteres = [l.strip() for l in liv_block[i_crit + 1:] if l.strip()] if i_crit is not None else []

    # quiz : 1. question / A. / B. / C. jusqu'à SEUIL
    quiz_block = lines[i_quiz + 1:i_corr]
    questions = []
    cur = None
    for l in quiz_block:
        s = l.strip()
        if not s:
            continue
        if s.startswith("SEUIL"):
            break
        qm = re.match(r"^(\d+)\.\s+(.*)$", s)
        om = re.match(r"^([ABC])\.\s+(.*)$", s)
        if qm:
            if cur:
                questions.append(cur)
            cur = {"n": int(qm.group(1)), "question": qm.group(2).strip(), "options": []}
        elif om and cur:
            cur["options"].append(om.group(2).strip())
    if cur:
        questions.append(cur)

    # corrigé : | N | LETTER | explication |
    ans = {}
    for i in range(i_corr, i_web):
        s = lines[i].strip()
        cm = re.match(r"^\|\s*(\d+)\s*\|\s*([ABC])\s*\|\s*(.+?)\s*\|$", s)
        if cm:
            ans[int(cm.group(1))] = (cm.group(2), cm.group(3).strip())
    for q in questions:
        letter, expl = ans.get(q["n"], (None, ""))
        q["answerIndex"] = {"A": 0, "B": 1, "C": 2}.get(letter, 0)
        q["explanation"] = expl

    webinaire = ""
    if i_web >= 0:
        wl = lines[i_web + 1].strip()
        webinaire = re.sub(r"^Objectif\s*:\s*", "", wl).strip()

    modules.append({
        "num": num, "title": title, "bienvenue": bienvenue, "dureeRow": duree_row,
        "objectives": objectives, "parcours": [p[1] for p in parcours],
        "sections": sections, "tutoTitle": tuto_title, "tutoSteps": tuto_steps,
        "consigne": consigne, "modalites": modalites, "prod": prod, "criteres": criteres,
        "quiz": questions, "webinaire": webinaire,
    })

# Annexes : de annex_idx à concl_idx, découpées par "Annexe X — Title"
annexes = []
ann_heads = [i for i in range(annex_idx, concl_idx) if re.match(r"^Annexe\s+([A-N])\s+—\s+(.+)$", lines[i].strip())]
for ai, aj in enumerate(ann_heads):
    end = ann_heads[ai + 1] if ai + 1 < len(ann_heads) else concl_idx
    hm = re.match(r"^Annexe\s+([A-N])\s+—\s+(.+)$", lines[aj].strip())
    body = "\n".join(lines[aj + 1:end]).strip()
    annexes.append({"letter": hm.group(1), "title": hm.group(2).strip(), "body": body})

data = {"modules": modules, "annexes": annexes}
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ── résumé de validation ──
print(f"modules: {len(modules)}")
for m in modules:
    nq = len(m["quiz"]); opts_ok = all(len(q["options"]) == 3 for q in m["quiz"])
    ans_ok = all("explanation" in q and q["explanation"] for q in m["quiz"])
    print(f"  M{m['num']:>1} {m['title'][:34]:34} | sections={len(m['sections'])} parcours={len(m['parcours'])} "
          f"obj={len(m['objectives'])} tuto={len(m['tutoSteps'])} crit={len(m['criteres'])} "
          f"quiz={nq} opts3={opts_ok} ans={ans_ok} web={'Y' if m['webinaire'] else 'N'}")
print(f"annexes: {len(annexes)} -> {[a['letter'] for a in annexes]}")
