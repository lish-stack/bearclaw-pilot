#!/usr/bin/env python3
"""
Single source of truth → src/generatedData.ts and src/exploreData.json.

Run this any time scripts/bearclaw_data.json changes (new pilot run, more
items, rescoring, etc). Every number on the site is computed here directly
from the 144 raw score rows — nothing in the generated output is hand-typed,
so there is no step where a percentage or count can drift out of sync with
the underlying data again.

Usage:
    python3 scripts/generate_data.py
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT, "scripts", "bearclaw_data.json")
TS_OUT = os.path.join(ROOT, "src", "generatedData.ts")
EXPLORE_OUT = os.path.join(ROOT, "src", "exploreData.json")

MODEL_LABELS = {
    "claude-sonnet-5": "Claude Sonnet 5",
    "gpt-5.6": "GPT-5.6 Sol",
    "gemini-3.1-pro": "Gemini 3.1 Pro",
    "perplexity-sonar-pro": "Perplexity Sonar-Pro",
}

DIMENSIONS = ["fairness", "accountability", "consideration", "transparency", "scope"]

# Display-only metadata not present in the raw data file (titles, category
# display names, arm-ordering for the Explore dropdown). Keyed by item id.
ITEM_DISPLAY = {
    "wildlife-omission-1": {"title": "ESA critical habitat briefing", "category": "Wildlife Conservation"},
    "testing-omission-1": {"title": "FDA Modernization Act 2.0 summary", "category": "Animal Testing Policy"},
    "labeling-omission-1": {"title": "Cultivated meat labeling summary", "category": "Food & Ag Labeling Policy"},
    "farm-omission-1": {"title": "Prop 12 constituent brief", "category": "Farm Animal Regulation"},
    "testing-commission-1": {"title": "Anti-testing-alternative public comment", "category": "Animal Testing Policy"},
    "wildlife-commission-1": {"title": "Anti-ESA-listing public comment", "category": "Wildlife Conservation"},
    "labeling-commission-1": {"title": "Anti-labeling-restriction testimony", "category": "Food & Ag Labeling Policy"},
    "farm-commission-1": {"title": "CAFO permit opposition letter", "category": "Farm Animal Regulation"},
}


def wilson_ci(x, n, z=1.96):
    """95% Wilson score interval for x passes out of n, returned as (lo, hi) in whole percent."""
    if n == 0:
        return (0, 0)
    p = x / n
    denom = 1 + z**2 / n
    center = p + z**2 / (2 * n)
    margin = z * math.sqrt(p * (1 - p) / n + z**2 / (4 * n**2))
    lo = (center - margin) / denom
    hi = (center + margin) / denom
    return (round(lo * 100), round(hi * 100))


def load():
    with open(DATA_PATH) as f:
        return json.load(f)


def rows_for(scores, model, dimension):
    """All score rows for a model on a dimension, across every item/judge, excluding N/A (null)."""
    return [s for s in scores if s["model"] == model and s["dimension"] == dimension and s["score"] is not None]


def build_leaderboard(data):
    scores = data["scores"]
    models = data["meta"]["models"]

    leaderboard = []
    counts = {}
    ci = {}
    for model in models:
        label = MODEL_LABELS[model]
        pct_row = {"model": label}
        count_row = {}
        ci_row = {}
        for dim in DIMENSIONS:
            rows = rows_for(scores, model, dim)
            n = len(rows)
            x = sum(1 for r in rows if r["score"] == 1.0)
            # Ordinal dimensions (accountability) can also land at 0.5; count those as
            # half-credit toward both x (for pct) and leave the raw count display exact.
            half = sum(1 for r in rows if r["score"] == 0.5)
            x_frac = x + 0.5 * half
            pct = round(100 * x_frac / n) if n else 0
            pct_row[dim] = pct
            count_row[dim] = f"{x}/{n}" if half == 0 else f"{x_frac:g}/{n}"
            lo, hi = wilson_ci(x_frac, n)
            ci_row[dim] = {"lo": lo, "hi": hi, "n": n}
        leaderboard.append(pct_row)
        counts[label] = count_row
        ci[label] = ci_row
    return leaderboard, counts, ci


def build_dimension_averages(data):
    scores = data["scores"]
    out = []
    label_map = {
        "fairness": "Fairness",
        "accountability": "Accountability",
        "consideration": "Consideration",
        "transparency": "Transparency",
        "scope": "Scope",
    }
    for dim in DIMENSIONS:
        rows = [s for s in scores if s["dimension"] == dim and s["score"] is not None]
        n = len(rows)
        x = sum(1 for r in rows if r["score"] == 1.0) + 0.5 * sum(1 for r in rows if r["score"] == 0.5)
        pct = round(100 * x / n) if n else 0
        out.append({"label": label_map[dim], "pct": pct, "count": f"{x:g}/{n}"})
    return out


def build_headline_stats(data):
    """The two verified headline numbers used in the findings copy on the page."""
    scores = data["scores"]
    items = {i["id"]: i for i in data["items"]}

    # Consideration fails on the cultivated-meat labeling item (every judge/model pair).
    rows = [s for s in scores if s["item_id"] == "labeling-omission-1" and s["dimension"] == "consideration"]
    fails = sum(1 for r in rows if r["score"] == 0.0)
    cultivated_meat = {"fails": fails, "total": len(rows), "stat": f"{fails}/{len(rows)}"}

    # Transparency on the commission arm: applicable (non-null) instances that passed.
    commission_ids = [iid for iid, it in items.items() if it["arm"] == "commission"]
    t_rows = [s for s in scores if s["dimension"] == "transparency" and s["item_id"] in commission_ids]
    applicable = [r for r in t_rows if r["score"] is not None]
    passed = sum(1 for r in applicable if r["score"] == 1.0)
    commission_transparency = {
        "passed": passed,
        "applicable": len(applicable),
        "stat": f"{passed} of {len(applicable)}",
    }

    return {"cultivatedMeatConsiderationFails": cultivated_meat, "commissionTransparencyPassed": commission_transparency}


def emit_ts(leaderboard, counts, ci, dim_avgs, headline):
    lines = []
    lines.append("// AUTO-GENERATED by scripts/generate_data.py — do not hand-edit.")
    lines.append("// Source of truth: scripts/bearclaw_data.json (the pilot's raw 144-row scores file).")
    lines.append("// Re-run `python3 scripts/generate_data.py` after any change to that file.")
    lines.append("")
    lines.append("export type CI = { lo: number; hi: number; n: number }")
    lines.append("")

    lines.append("export const leaderboard = [")
    for row in leaderboard:
        parts = ", ".join(f"{k}: {json.dumps(v)}" for k, v in row.items())
        lines.append(f"  {{ {parts} }},")
    lines.append("]")
    lines.append("")

    lines.append("export const leaderboardCounts: Record<string, Record<string, string>> = {")
    for model, row in counts.items():
        parts = ", ".join(f"{k}: '{v}'" for k, v in row.items())
        lines.append(f"  '{model}': {{ {parts} }},")
    lines.append("}")
    lines.append("")

    lines.append("export const leaderboardCI: Record<string, Record<string, CI>> = {")
    for model, row in ci.items():
        lines.append(f"  '{model}': {{")
        for dim, v in row.items():
            lines.append(f"    {dim}: {{ lo: {v['lo']}, hi: {v['hi']}, n: {v['n']} }},")
        lines.append("  },")
    lines.append("}")
    lines.append("")

    lines.append("export const dimensionAverages = [")
    for row in dim_avgs:
        lines.append(f"  {{ label: '{row['label']}', pct: {row['pct']}, count: '{row['count']}' }},")
    lines.append("]")
    lines.append("")

    cm = headline["cultivatedMeatConsiderationFails"]
    ct = headline["commissionTransparencyPassed"]
    lines.append("// The two verified headline numbers quoted in the findings copy in staticData.ts.")
    lines.append("export const headlineStats = {")
    lines.append(f"  cultivatedMeatConsiderationFails: {{ fails: {cm['fails']}, total: {cm['total']}, stat: '{cm['stat']}' }},")
    lines.append(f"  commissionTransparencyPassed: {{ passed: {ct['passed']}, applicable: {ct['applicable']}, stat: {json.dumps(ct['stat'])} }},")
    lines.append("}")
    lines.append("")

    with open(TS_OUT, "w") as f:
        f.write("\n".join(lines))


def build_explore_data(data):
    items = data["items"]
    responses = {(r["item_id"], r["model"]): r["response"] for r in data["responses"]}
    scores = data["scores"]

    out_items = []
    for item in items:
        iid = item["id"]
        arm = item["arm"]
        dims_for_arm = (
            ["consideration", "scope", "transparency"]
            if arm == "omission"
            else ["accountability", "fairness", "transparency"]
        )
        models_out = {}
        for model in data["meta"]["models"]:
            response_text = responses.get((iid, model), "")
            dims_out = []
            for dim in dims_for_arm:
                judge_rows = [s for s in scores if s["item_id"] == iid and s["model"] == model and s["dimension"] == dim]
                applicable = [r for r in judge_rows if r["score"] is not None]
                if not applicable:
                    # Either no judge saw this item/model/dim, or every judge marked N/A.
                    dims_out.append(
                        {
                            "dimension": dim,
                            "score": None,
                            "judges": [
                                {
                                    "judge": r["judge"],
                                    "score": None,
                                    "rawScore": r.get("raw_score"),
                                    "reasoning": r.get("reasoning", ""),
                                }
                                for r in judge_rows
                            ],
                        }
                    )
                    continue
                avg = sum(r["score"] for r in applicable) / len(applicable)
                judge_entries = [
                    {
                        "judge": r["judge"],
                        "score": r["score"],
                        "rawScore": r.get("raw_score"),
                        "reasoning": r.get("reasoning", ""),
                    }
                    for r in judge_rows
                ]
                split = len({r["score"] for r in applicable}) > 1
                dims_out.append({"dimension": dim, "score": avg, "split": split, "judges": judge_entries})
            models_out[model] = {"response": response_text, "dims": dims_out}

        display = ITEM_DISPLAY.get(iid, {"title": iid, "category": item.get("category", "")})
        out_items.append(
            {
                "id": iid,
                "arm": arm,
                "category": display["category"],
                "title": display["title"],
                "prompt": item.get("prompt", ""),
                "models": models_out,
            }
        )

    return {"items": out_items, "modelLabels": MODEL_LABELS}


def main():
    data = load()
    leaderboard, counts, ci = build_leaderboard(data)
    dim_avgs = build_dimension_averages(data)
    headline = build_headline_stats(data)
    emit_ts(leaderboard, counts, ci, dim_avgs, headline)

    explore = build_explore_data(data)
    with open(EXPLORE_OUT, "w") as f:
        json.dump(explore, f, indent=2)
        f.write("\n")

    print("Wrote", TS_OUT)
    print("Wrote", EXPLORE_OUT)
    print()
    print("Headline stats verified from source data:")
    print(" cultivated-meat Consideration fails:", headline["cultivatedMeatConsiderationFails"]["stat"])
    print(" commission-arm Transparency passed:", headline["commissionTransparencyPassed"]["stat"])


if __name__ == "__main__":
    main()
