import pandas as pd
import re
from pathlib import Path

RAW_DIR = Path("data/raw")
OUT_FILE = Path("data/world_metrics_merged.csv")

FILES = {
    "life_expectancy": RAW_DIR / "life_expectancy.csv",
    "pm25": RAW_DIR / "pm25_air_pollution.csv",
    "undernourishment": RAW_DIR / "undernourishment.csv",
    "gdp_per_capita": RAW_DIR / "gdp_per_capita.csv",
    # Optional later:
    # "obesity_prevalence": RAW_DIR / "obesity_prevalence.csv",
}

ID_COLS = {"Entity", "Code", "Year"}


def find_value_column(df: pd.DataFrame) -> str:
    # pick first numeric-ish column that is not an id column
    candidates = [c for c in df.columns if c not in ID_COLS]
    # prefer columns with numbers
    best_col = None
    best_non_null = -1
    for c in candidates:
        s = pd.to_numeric(df[c], errors="coerce")
        non_null = s.notna().sum()
        if non_null > best_non_null:
            best_non_null = non_null
            best_col = c
    if best_col is None:
        raise ValueError("Could not detect metric value column.")
    return best_col


def clean_metric_csv(path: Path, metric_name: str) -> pd.DataFrame:
    df = pd.read_csv(path)

    required = {"Entity", "Code", "Year"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"{path.name} missing required columns: {missing}")

    value_col = find_value_column(df)

    df = df[["Entity", "Code", "Year", value_col]].copy()
    df.rename(columns={value_col: metric_name}, inplace=True)

    # numeric coercion
    df["Year"] = pd.to_numeric(df["Year"], errors="coerce").astype("Int64")
    df[metric_name] = pd.to_numeric(df[metric_name], errors="coerce")

    # keep likely country rows: ISO3 uppercase codes only (filters out OWID_* aggregates)
    df = df[df["Code"].astype(str).str.fullmatch(r"[A-Z]{3}", na=False)]

    # drop nulls
    df = df.dropna(subset=["Year", metric_name])

    # keep one row per country/year (if duplicates exist, keep last)
    df = df.sort_values(["Code", "Year"]).drop_duplicates(subset=["Code", "Year"], keep="last")

    print(f"{metric_name}: value column='{value_col}', rows={len(df)}")
    return df


def choose_best_common_year(metric_dfs: dict) -> int:
    # years present in all metrics
    common_years = None
    for name, df in metric_dfs.items():
        years = set(df["Year"].dropna().astype(int).unique().tolist())
        common_years = years if common_years is None else (common_years & years)

    if not common_years:
        raise RuntimeError("No common year across all selected metrics.")

    scores = []
    for y in sorted(common_years):
        merged = None
        for name, df in metric_dfs.items():
            d = df[df["Year"] == y][["Entity", "Code", "Year", name]].copy()
            if merged is None:
                merged = d
            else:
                merged = merged.merge(d[["Code", "Year", name]], on=["Code", "Year"], how="inner")
        scores.append((y, len(merged)))

    # choose highest coverage; tie-break by latest year
    scores_sorted = sorted(scores, key=lambda t: (t[1], t[0]), reverse=True)
    best_year, best_count = scores_sorted[0]

    print("\nCandidate common years (top 10 by merged coverage):")
    for y, cnt in scores_sorted[:10]:
        print(f"  {y}: {cnt} countries")

    print(f"\nChosen year = {best_year} (coverage={best_count})")
    return best_year


def main():
    metric_dfs = {}
    for metric_name, path in FILES.items():
        if not path.exists():
            raise FileNotFoundError(f"Missing file: {path}")
        metric_dfs[metric_name] = clean_metric_csv(path, metric_name)

    year = choose_best_common_year(metric_dfs)

    merged = None
    for name, df in metric_dfs.items():
        d = df[df["Year"] == year][["Entity", "Code", "Year", name]].copy()
        if merged is None:
            merged = d
        else:
            merged = merged.merge(d[["Code", "Year", name]], on=["Code", "Year"], how="inner")

    # rename Entity to country for convenience
    merged = merged.rename(columns={"Entity": "country", "Code": "code", "Year": "year"})

    # optional derived helpers (nice for tooltips/sorting)
    if "gdp_per_capita" in merged.columns:
        merged["log_gdp_per_capita"] = pd.to_numeric(merged["gdp_per_capita"], errors="coerce").apply(
            lambda x: None if pd.isna(x) or x <= 0 else __import__("math").log10(x)
        )

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    merged.to_csv(OUT_FILE, index=False)

    print(f"\nSaved merged CSV: {OUT_FILE}")
    print(f"Rows: {len(merged)}")
    print("\nColumns:", list(merged.columns))
    print("\nPreview:")
    print(merged.head(8).to_string(index=False))


if __name__ == "__main__":
    main()