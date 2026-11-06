"""
Unit Tests for VidPulse AI Frame-by-Frame Saliency, Retention Decay Curve, and Heatmap Engine
"""

import sys
import os
import pytest
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_service import (
    compute_visual_saliency,
    compute_retention_curve,
    generate_hook_dropoff_heatmap,
    analyze_frames,
)


def test_visual_saliency_computation():
    """Verify visual saliency map, focal concentration, and heatmap grid dimensions."""
    # Synthetic frame: 160x90 with a bright centered circle
    frame = np.zeros((90, 160, 3), dtype=np.uint8)
    if cv2 is not None:
        cv2.circle(frame, (80, 45), 20, (255, 255, 255), -1)

    saliency = compute_visual_saliency(frame, grid_size=8)
    assert "focal_concentration" in saliency
    assert "centroid" in saliency
    assert "heatmap_grid" in saliency
    assert "visual_clutter" in saliency

    # Check 8x8 grid structure
    assert len(saliency["heatmap_grid"]) == 8
    assert len(saliency["heatmap_grid"][0]) == 8
    assert 0.0 <= saliency["focal_concentration"] <= 1.0

    # Centroid should be approximately near the center (0.5, 0.5)
    cx = saliency["centroid"]["x"]
    cy = saliency["centroid"]["y"]
    assert 0.3 <= cx <= 0.7
    assert 0.3 <= cy <= 0.7


def test_empty_frame_saliency_fallback():
    """Verify empty/None frame handles gracefully."""
    res = compute_visual_saliency(None)
    assert res["focal_concentration"] == 0.0
    assert res["centroid"] == {"x": 0.5, "y": 0.5}


def test_retention_curve_decay_and_monotonicity():
    """Verify retention curve starts at 100% and strictly decays monotonically."""
    timeline_scores = [0.85, 0.82, 0.80, 0.78, 0.75, 0.70, 0.68, 0.65, 0.60, 0.58]
    hook_score = 80
    drops = []

    curve = compute_retention_curve(timeline_scores, hook_score, drops)
    points = curve["retention_points"]

    assert len(points) == len(timeline_scores)
    assert points[0]["retention_pct"] == 100.0

    # Test monotonicity
    for i in range(1, len(points)):
        assert points[i]["retention_pct"] <= points[i - 1]["retention_pct"], (
            f"Retention increased at second {i}: {points[i]['retention_pct']} > {points[i-1]['retention_pct']}"
        )
        assert points[i]["retention_pct"] >= 2.0


def test_retention_profile_viral_hook():
    """High hook score and sustained high engagement should yield viral_hook profile."""
    timeline_scores = [0.90] * 20
    curve = compute_retention_curve(timeline_scores, hook_score=85, drops=[])

    assert curve["drop_off_velocity_3s"] <= 12.0
    assert curve["retention_profile"] == "viral_hook"
    assert curve["final_retention"] >= 55.0


def test_retention_profile_cliff_drop():
    """Weak hook score (<35) and critical drops should trigger cliff_drop profile."""
    timeline_scores = [0.20] * 15
    critical_drop = [{"start_sec": 1, "end_sec": 5, "severity": "critical", "avg_score": 0.15}]

    curve = compute_retention_curve(timeline_scores, hook_score=20, drops=critical_drop)
    assert curve["drop_off_velocity_3s"] >= 20.0
    assert curve["retention_profile"] == "cliff_drop"


def test_hook_dropoff_heatmap_generation():
    """Verify heatmap matrix risk classification and intensity values."""
    timeline_scores = [0.85, 0.80, 0.25, 0.20, 0.30, 0.75]
    drops = [{"start_sec": 2, "end_sec": 4, "severity": "critical", "avg_score": 0.22}]

    heatmap = generate_hook_dropoff_heatmap(timeline_scores, drops)
    assert len(heatmap) == len(timeline_scores)

    # Second 0 should be safe
    assert heatmap[0]["risk_level"] == "safe"

    # Seconds in drop window should be critical_drop
    assert heatmap[2]["risk_level"] == "critical_drop"
    assert heatmap[2]["heat_intensity"] == 0.95
    assert heatmap[3]["risk_level"] == "critical_drop"


def test_analyze_frames_integration():
    """Verify full analyze_frames pipeline enriches timeline and outputs retention/heatmap."""
    # Synthetic frames
    h, w = 90, 160
    f1 = np.ones((h, w, 3), dtype=np.uint8) * 50
    f2 = np.ones((h, w, 3), dtype=np.uint8) * 150
    f3 = np.ones((h, w, 3), dtype=np.uint8) * 200

    frames = [f1, f2, f3]
    timestamps = [0.0, 1.0, 2.0]

    analysis = analyze_frames(frames, timestamps)
    assert "retention_curve" in analysis
    assert "heatmap" in analysis
    assert "timeline" in analysis

    assert len(analysis["timeline"]) == 3
    for item in analysis["timeline"]:
        assert "retention_pct" in item
        assert "focal_concentration" in item
        assert "centroid" in item
