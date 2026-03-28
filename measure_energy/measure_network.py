import argparse
import signal
import sys
import time

import psutil

# kWh per GB — based on Aslan et al. (2018) fixed-line estimate
ENERGY_INTENSITY_KWH_PER_GB = 0.06


def bytes_to_gb(b: int) -> float:
    return b / 1_073_741_824


def gb_to_joules(gb: float) -> float:
    return gb * ENERGY_INTENSITY_KWH_PER_GB * 3_600_000


def read_bytes() -> tuple[int, int]:
    c = psutil.net_io_counters()
    return c.bytes_sent, c.bytes_recv


def fmt_joules(j: float) -> str:
    if j < 1:    return f"{j * 1000:7.2f} mJ"
    if j < 1000: return f"{j:7.3f}  J"
    return               f"{j / 1000:7.3f} kJ"

def fmt_watts(w: float) -> str:
    return f"{w:6.3f} W"

def fmt_bytes(b: int) -> str:
    if b < 1024:        return f"{b} B"
    if b < 1_048_576:   return f"{b/1024:.1f} KB"
    if b < 1_073_741_824: return f"{b/1_048_576:.1f} MB"
    return                     f"{b/1_073_741_824:.2f} GB"


def print_header(interface: str, interval: float):
    print(f"\n  Network Energy Monitor — {interface}")
    print(f"  Interval: {interval}s  |  Intensity: {ENERGY_INTENSITY_KWH_PER_GB} kWh/GB  |  Ctrl+C to stop\n")
    print(f"  {'Time':>8}  {'↑ Sent':>10}  {'↓ Recv':>10}  {'Power':>10}  {'Cumulative':>12}")
    print(f"  {'─'*8}  {'─'*10}  {'─'*10}  {'─'*10}  {'─'*12}")

def print_row(elapsed: float, sent: int, recv: int, watts: float, total_j: float):
    print(
        f"  {elapsed:>7.1f}s"
        f"  {fmt_bytes(sent):>10}"
        f"  {fmt_bytes(recv):>10}"
        f"  {fmt_watts(watts):>10}"
        f"  {fmt_joules(total_j):>12}"
    )


def monitor(interval: float):
    print_header("all interfaces", interval)

    total_j = 0.0
    t_start = time.perf_counter()

    def on_exit(sig, frame):
        elapsed = time.perf_counter() - t_start
        total_gb = total_j / (ENERGY_INTENSITY_KWH_PER_GB * 3_600_000)
        print(f"\n  ── Session summary ──────────────────────")
        print(f"  Duration    : {elapsed:.1f} s")
        print(f"  Total data  : {total_gb*1024:.2f} MB")
        print(f"  Total energy: {fmt_joules(total_j).strip()}")
        print(f"  Avg power   : {fmt_watts(total_j / elapsed if elapsed > 0 else 0).strip()}")
        print()
        sys.exit(0)

    signal.signal(signal.SIGINT, on_exit)

    prev_sent, prev_recv = read_bytes()
    prev_t = time.perf_counter()

    while True:
        time.sleep(interval)

        curr_sent, curr_recv = read_bytes()
        curr_t = time.perf_counter()

        d_sent = curr_sent - prev_sent
        d_recv = curr_recv - prev_recv
        d_bytes = d_sent + d_recv
        d_t = curr_t - prev_t

        d_j = gb_to_joules(bytes_to_gb(d_bytes))
        watts = d_j / d_t if d_t > 0 else 0.0
        total_j += d_j
        elapsed = curr_t - t_start

        print_row(elapsed, d_sent, d_recv, watts, total_j)

        prev_sent, prev_recv = curr_sent, curr_recv
        prev_t = curr_t


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Network energy monitor")
    parser.add_argument("--interval", type=float, default=1.0,
                        help="Sampling interval in seconds (default: 1.0)")
    args = parser.parse_args()

    monitor(args.interval)
