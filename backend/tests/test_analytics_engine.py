"""
Unit Tests for VidPulse AI Analytics, Hook Retention & Virality Scoring Engine
"""

import sys
import os
import pytest
import numpy as np

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_service import (
    classify_severity,
    detect_attention_drops,
    score_hook,
    predict_virality,
    generate_recommendations,
)


def test_severity_classification():
    """Verify severity tiers match analytical score thresholds."""
    assert classify_severity(np.array([0.10, 0.15, 0.12])) == "critical", "Expected critical for avg < 0.2"
    assert classify_severity(np.array([0.25, 0.28, 0.22])) == "high", "Expected high for avg < 0.3"
    assert classify_severity(np.array([0.35, 0.38, 0.32])) == "medium", "Expected medium for avg < 0.4"
    assert classify_severity(np.array([0.55, 0.65, 0.72])) == "low", "Expected low for avg >= 0.4"


def test_attention_drop_detection():
    """Construct a synthetic 30-second timeline and verify drop isolation."""
    # Seconds 0-10: High engagement (0.80)
    # Seconds 11-16: Sustained Drop below 0.45 threshold (0.22) -> Critical/High drop
    # Seconds 17-30: Recovery (0.75)
    timeline = [0.80] * 10 + [0.22] * 6 + [0.75] * 14

    drops = detect_attention_drops(timeline, threshold=0.45, min_duration=3, smoothing_window=3)
    assert len(drops) > 0, "Failed to detect synthetic attention drop segment"
    drop = drops[0]
    assert 9 <= drop["start_sec"] <= 12, f"Drop start mismatch: got {drop['start_sec']}"
    assert drop["severity"] in ["critical", "high"], f"Drop severity mismatch: got {drop['severity']}"
    assert drop["avg_score"] < 0.45


def test_transient_noise_filter():
    """Verify that a 1-second transient dip is ignored when min_duration=3."""
    noisy_timeline = [0.80] * 10 + [0.30] * 1 + [0.80] * 10
    no_drops = detect_attention_drops(noisy_timeline, threshold=0.45, min_duration=3, smoothing_window=3)
    assert len(no_drops) == 0, f"Expected 0 drops for transient noise, but got {len(no_drops)}"


def test_hook_score_calculation():
    """Verify 3-second hook retention scoring across high and low dynamics."""
    # High dynamics hook: strong motion, scene shifts, high engagement
    high_motion = [3.5, 4.0, 3.8, 3.2, 2.9, 2.5, 2.8, 3.0, 3.1, 2.7]
    high_scores = [0.85, 0.90, 0.70, 0.88, 0.65, 0.82, 0.78, 0.85, 0.80, 0.82]
    hook_high = score_hook(high_scores, high_motion)
    assert hook_high > 60, f"Expected strong hook score (>60), got {hook_high}"

    # Low dynamics hook: static opening with negligible motion
    low_motion = [0.1] * 10
    low_scores = [0.25] * 10
    hook_low = score_hook(low_scores, low_motion)
    assert hook_low < 35, f"Expected weak hook score (<35), got {hook_low}"

    # Empty payload handling
    assert score_hook([], []) == 0


def test_virality_prediction():
    """Verify virality index computation bounds and relative ordering."""
    high_scores = [0.85] * 30
    high_motions = [2.5] * 30
    virality_high = predict_virality(high_scores, hook_score=85, motions=high_motions)
    assert 70 <= virality_high <= 100

    low_scores = [0.20] * 30
    low_motions = [0.2] * 30
    virality_low = predict_virality(low_scores, hook_score=20, motions=low_motions)
    assert 0 <= virality_low <= 40

    assert virality_high > virality_low
    assert predict_virality([], 0, []) == 0


def test_recommendation_generation():
    """Verify automated actionable suggestions based on hook and drop telemetry."""
    # Scenario: Weak hook (< 35) + critical drop (< 0.3)
    drops = [
        {"start_sec": 12, "end_sec": 17, "severity": "critical", "avg_score": 0.21}
    ]
    recs = generate_recommendations(hook_score=28, drops=drops, overall_score=0.42)
    assert len(recs) >= 2

    problems = [r["problem"] for r in recs]
    assert "Weak hook in first 5 seconds" in problems
    assert "Critical attention drop detected" in problems
    assert "Low overall engagement score" in problems


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
