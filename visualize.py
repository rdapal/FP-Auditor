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

for entry in data:
    if entry['data']:
        profiles.append(entry['profile'])
        # Extract cores, defaulting to 0 if blocked/unknown
        core_val = entry['data']['hw']['data'].get('cores', 0)
        cores.append(int(core_val) if str(core_val).isdigit() else 0)
        # Extract canvas length
        canvas_lengths.append(entry['data']['canvas'].get('rawLength', 0))

# Themes
plt.style.use('dark_background')
os.makedirs('docs', exist_ok=True)

# --- Plot 1: Hardware Leak ---
plt.figure(figsize=(10, 6))
plt.bar(profiles, cores, color='#58a6ff')
plt.title('Hardware Entropy Leakage: Exposed CPU Cores by Browser Profile', fontsize=14)
plt.ylabel('Reported CPU Cores', fontsize=12)
plt.xticks(rotation=15)
plt.axhline(y=20, color='r', linestyle='--', label='Actual Hardware Cores (20)')
plt.legend()
plt.tight_layout()
plt.savefig('docs/plot_cores.png')
print("[+] Generated docs/plot_cores.png")

# --- Plot 2: Canvas Data Spoofing ---
plt.figure(figsize=(10, 6))
plt.bar(profiles, canvas_lengths, color='#3fb950')
plt.title('Canvas API Defense: Data Payload Size', fontsize=14)
plt.ylabel('Canvas Data URI Length (Bytes)', fontsize=12)
plt.xticks(rotation=15)
plt.tight_layout()
plt.savefig('docs/plot_canvas.png')
print("[+] Generated docs/plot_canvas.png")
