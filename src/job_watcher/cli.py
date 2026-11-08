"""Command-line entry points for collection, rebuilding, and daily runs."""

from __future__ import annotations

import argparse
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from .collector import collect_sources, source_results_from_raw
from .history import build_history
from .issues import sync_issue
from .schema import DATA_ROOT, HISTORY_PATH, RAW_ROOT, STATUS_PATH
from .status import make_status, write_status


def _sync_site_data(root: Path) -> None:
    for publish_root in (root / "site", root / "dist"):
        publish_data = publish_root / "data"
        publish_data.mkdir(parents=True, exist_ok=True)
        shutil.copy2(root / HISTORY_PATH, publish_data / "history.csv")
        shutil.copy2(root / STATUS_PATH, publish_data / "status.json")


def _commit_data(root: Path, run_date: str) -> None:
    subprocess.run(["git", "add", str(DATA_ROOT), "site/data", "dist/data"], cwd=root, check=True)
    changed = subprocess.run(
        ["git", "diff", "--cached", "--quiet"], cwd=root, check=False
    )
    if changed.returncode == 0:
        return
    subprocess.run(
        ["git", "commit", "-m", f"Daily job snapshot {run_date}"], cwd=root, check=True
    )


def run_daily(root: Path, *, skip_issues: bool = False, skip_commit: bool = False) -> int:
    run_time = datetime.now(timezone.utc)
    run_date = run_time.date().isoformat()
    results = collect_sources(run_date, raw_root=root / RAW_ROOT)
    rows = build_history(
        raw_root=root / RAW_ROOT,
        history_path=root / HISTORY_PATH,
    )
    status = make_status(
        rows,
        run_date=run_date,
        run_time=run_time.isoformat().replace("+00:00", "Z"),
        source_results=results,
        raw_root=root / RAW_ROOT,
    )
    write_status(status, root / STATUS_PATH)
    _sync_site_data(root)
    errors = {result.name: result.error for result in results if result.error}
    if not skip_issues:
        print(f"GitHub Issue: {sync_issue(run_date=run_date, rows=rows, status=status, source_errors=errors)}")
    if not skip_commit:
        _commit_data(root, run_date)
    print(
        f"Run {run_date}: {sum(result.ok for result in results)}/{len(results)} sources succeeded; "
        f"{len(rows)} postings in history; {status['new_today']} new; {status['removed_today']} removed."
    )
    for result in results:
        suffix = f" ({result.error})" if result.error else ""
        print(f"  {'OK' if result.ok else 'FAIL'} {result.name}: {result.count}{suffix}")
    return 0


def build_history_command(root: Path) -> int:
    rows = build_history(raw_root=root / RAW_ROOT, history_path=root / HISTORY_PATH)
    run_date = max(
        (path.name for path in (root / RAW_ROOT).iterdir() if path.is_dir()),
        default=datetime.now(timezone.utc).date().isoformat(),
    )
    results = source_results_from_raw(run_date, raw_root=root / RAW_ROOT)
    status = make_status(
        rows,
        run_date=run_date,
        source_results=results,
        raw_root=root / RAW_ROOT,
    )
    write_status(status, root / STATUS_PATH)
    _sync_site_data(root)
    print(f"Built {len(rows)} history rows from raw files through {run_date}.")
    return 0


def parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="FDA sports finance job watcher")
    subparsers = parser.add_subparsers(dest="command", required=True)

    run = subparsers.add_parser("run", help="fetch sources, rebuild data, and publish daily changes")
    run.add_argument("--root", type=Path, default=Path("."))
    run.add_argument("--skip-issues", action="store_true")
    run.add_argument("--skip-commit", action="store_true")

    build = subparsers.add_parser("build-history", help="rebuild history and status from raw files")
    build.add_argument("--root", type=Path, default=Path("."))
    return parser


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    root = args.root.resolve()
    if args.command == "run":
        return run_daily(root, skip_issues=args.skip_issues, skip_commit=args.skip_commit)
    if args.command == "build-history":
        return build_history_command(root)
    raise AssertionError(args.command)


if __name__ == "__main__":
    raise SystemExit(main())
