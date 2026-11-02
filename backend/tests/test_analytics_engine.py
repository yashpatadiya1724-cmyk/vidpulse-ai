"""
Unit Tests for VidPulse AI Analytics & Attention Drop Detection Engine
"""

import sys
import os
import numpy as np

# Fix Windows stdout encoding for emojis
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import pure heuristic analytics functions
from app.services.ai_service import classify_severity, detect_attention_drops

def run_tests():
    print("==================================================")
    print("🎬 VIDPULSE AI: ENGAGEMENT ANALYTICS UNIT TESTS")
    print("==================================================")

    # 1. Test Severity Classification
    assert classify_severity(np.array([0.1, 0.15, 0.12])) == "critical", "Expected critical for avg < 0.2"
    assert classify_severity(np.array([0.25, 0.28, 0.22])) == "high", "Expected high for avg < 0.3"
    assert classify_severity(np.array([0.35, 0.38, 0.32])) == "medium", "Expected medium for avg < 0.4"
    assert classify_severity(np.array([0.55, 0.65, 0.72])) == "low", "Expected low for avg >= 0.4"
    print("✅ Severity Classification Verified across Critical, High, Medium, and Low tiers")

    # 2. Test Attention Drop Detection on Continuous Engagement Curve
    # Construct synthetic 30-second timeline:
    # Seconds 0-10: High engagement (0.75 - 0.85)
    # Seconds 11-16: Sustained Drop below 0.45 threshold (0.20 - 0.25) -> Critical drop
    # Seconds 17-30: Recovery to high engagement (0.70 - 0.80)
    timeline = [0.80] * 10 + [0.22] * 6 + [0.75] * 14

    drops = detect_attention_drops(timeline, threshold=0.45, min_duration=3, smoothing_window=3)
    assert len(drops) > 0, "Failed to detect synthetic attention drop segment"
    drop = drops[0]
    assert 9 <= drop["start_sec"] <= 12, f"Drop start mismatch: got {drop['start_sec']}"
    assert drop["severity"] in ["critical", "high"], f"Drop severity mismatch: got {drop['severity']}"
    print(f"✅ Attention Drop Detected: Sec {drop['start_sec']}–{drop['end_sec']} (Severity: {drop['severity'].upper()}, Avg Score: {drop['avg_score']:.2f})")

    # 3. Test Brief Transient Dip Rejection (Noise Filter)
    # A 1-second dip below 0.45 should NOT trigger a drop segment because min_duration=3
    noisy_timeline = [0.80] * 10 + [0.30] * 1 + [0.80] * 10
    no_drops = detect_attention_drops(noisy_timeline, threshold=0.45, min_duration=3, smoothing_window=3)
    assert len(no_drops) == 0, f"Expected 0 drops for transient noise, but got {len(no_drops)}"
    print("✅ Noise Filter Verified: 1-second transient dips correctly ignored")

    print("==================================================")
    print("🏆 ALL VIDPULSE AI ANALYTICS TESTS PASSED (100%)")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
