import argparse
import signal
import sys
import time
from pathlib import Path

RAPL_BASE = Path("/sys/class/powercap/intel-rapl")


def check_rapl(package: int):
    if not RAPL_BASE.exists():
        print("[error] RAPL not found. Requires Linux + Intel/AMD CPU (Sandy Bridge+).")
        sys.exit(1)
    if not (RAPL_BASE / f"intel-rapl:{package}").exists():
        print(f"[error] Package {package} not found. Available:")
        for p in RAPL_BASE.iterdir():
            print(f"  {p.name}")
        sys.exit(1)


def read_uj(package: int) -> int:
    return int((RAPL_BASE / f"intel-rapl:{package}" / "energy_uj").read_text())


def read_max_uj(package: int) -> int:
    # needed for wraparound correction
    return int((RAPL_BASE / f"intel-rapl:{package}" / "max_energy_range_uj").read_text())


def read_name(package: int) -> str:
    try:
        return (RAPL_BASE / f"intel-rapl:{package}" / "name").read_text().strip()
    except FileNotFoundError:
        return f"package-{package}"


def delta_uj(before: int, after: int, max_uj: int) -> int:
    # handle counter wraparound
    if after >= before:
        return after - before
    return max_uj - before + after


def fmt_joules(j: float) -> str:
    if j < 1:    return f"{j * 1000:7.2f} mJ"
    if j < 1000: return f"{j:7.3f}  J"
    return               f"{j / 1000:7.3f} kJ"

def fmt_watts(w: float) -> str:
    return f"{w:6.3f} W"


def print_header(name: str, package: int, interval: float):
    print(f"\n  RAPL Live Monitor — {name} (package {package})")
    print(f"  Interval: {interval}s   |   Ctrl+C to stop\n")
    print(f"  {'Time':>8}  {'Power':>10}  {'Δ Energy':>12}  {'Cumulative':>12}")
    print(f"  {'─'*8}  {'─'*10}  {'─'*12}  {'─'*12}")

def print_row(elapsed: float, watts: float, delta_j: float, total_j: float):
    print(
        f"  {elapsed:>7.1f}s"
        f"  {fmt_watts(watts):>10}"
        f"  {fmt_joules(delta_j):>12}"
        f"  {fmt_joules(total_j):>12}"
    )


def monitor(package: int, interval: float):
    check_rapl(package)

    name   = read_name(package)
    max_uj = read_max_uj(package)

    print_header(name, package, interval)

    total_j = 0.0
    t_start = time.perf_counter()

    def on_exit(sig, frame):
        # print session summary on Ctrl+C
        elapsed = time.perf_counter() - t_start
        print(f"\n  ── Session summary ──────────────────────")
        print(f"  Duration    : {elapsed:.1f} s")
        print(f"  Total energy: {fmt_joules(total_j).strip()}")
        print(f"  Avg power   : {fmt_watts(total_j / elapsed if elapsed > 0 else 0).strip()}")
        print()
        sys.exit(0)

    signal.signal(signal.SIGINT, on_exit)

    prev_uj = read_uj(package)
    prev_t  = time.perf_counter()

    while True:
        time.sleep(interval)

        curr_uj = read_uj(package)
        curr_t  = time.perf_counter()

        d_j   = delta_uj(prev_uj, curr_uj, max_uj) / 1_000_000  # µJ → J
        d_t   = curr_t - prev_t
        watts = d_j / d_t if d_t > 0 else 0.0

        total_j += d_j
        elapsed  = curr_t - t_start

        print_row(elapsed, watts, d_j, total_j)

        prev_uj = curr_uj
        prev_t  = curr_t


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RAPL live power monitor")
    parser.add_argument("--interval", type=float, default=1.0,
                        help="Sampling interval in seconds (default: 1.0)")
    parser.add_argument("--package",  type=int,   default=0,
                        help="CPU package index (default: 0)")
    args = parser.parse_args()

    monitor(args.package, args.interval)
