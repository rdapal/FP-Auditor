import json
import matplotlib.pyplot as plt
import numpy as np
import os

# Load the JSON data
with open('results_matrix.json', 'r') as f:
    data = json.load(f)

profiles = []
cores = []
canvas_lengths = []
timings = []

for entry in data:
    payload = entry.get('data')
    if payload:
        # clean up names for the graphs
        name = entry.get('profile', 'Unknown').replace('_', '\n')
        profiles.append(name)
        
        # hardware Data
        hw_data = payload.get('hw', {}).get('data', {})
        core_val = hw_data.get('cores', 0)
        cores.append(int(core_val) if str(core_val).isdigit() else 0)
        
        # canvas Data
        canvas_lengths.append(payload.get('canvas', {}).get('rawLength', 0))
        
        # timing Data (convert to float)
        timing_val = payload.get('timing', {}).get('data', {}).get('executionLatency', '0ms')
        try:
            timings.append(float(timing_val.replace('ms', '')))
        except ValueError:
            timings.append(0.0)

# Themes
plt.style.use('dark_background')
os.makedirs('docs', exist_ok=True)
colors = ['#58a6ff', '#ff7b72', '#3fb950', '#d2a8ff', '#f0883e', '#79c0ff']

# --- Plot 1: Hardware Leak ---
plt.figure(figsize=(10, 6))
bars = plt.bar(profiles, cores, color=colors)
plt.title('Hardware Spoofing: Reported CPU Cores', fontsize=16, fontweight='bold')
plt.ylabel('Cores', fontsize=12)
plt.axhline(y=20, color='r', linestyle='--', label='True Host Hardware (20)')
plt.legend()
plt.tight_layout()
plt.savefig('docs/plot_cores.png')
print("[+] Generated docs/plot_cores.png")

# --- Plot 2: Canvas Data Spoofing ---
plt.figure(figsize=(10, 6))
plt.bar(profiles, canvas_lengths, color=colors)
plt.title('Canvas API Defense: Data Payload Size', fontsize=16, fontweight='bold')
plt.ylabel('Data URI Length (Bytes)', fontsize=12)
plt.tight_layout()
plt.savefig('docs/plot_canvas.png')
print("[+] Generated docs/plot_canvas.png")

# --- Plot 3: Timing Variation ---
plt.figure(figsize=(10, 6))
plt.stem(profiles, timings, basefmt=" ")
plt.title('Timing Defense: Execution Latency Variation', fontsize=16, fontweight='bold')
plt.ylabel('Latency (ms)', fontsize=12)
# rounding threshold
plt.axhline(y=16.67, color='y', linestyle=':', label='60Hz VSync Rounding (16.67ms)')
plt.legend()
plt.tight_layout()
plt.savefig('docs/plot_timing.png')
print("[+] Generated docs/plot_timing.png")