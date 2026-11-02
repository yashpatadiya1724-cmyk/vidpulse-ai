# VidPulse AI — Architecture & System Design Document

## 1. System Overview
VidPulse AI is a video engagement analytics engine engineered to identify viewer drop-off points, frame-by-frame engagement peaks, and hook retention dynamics for content creators and marketing teams.

---

## 2. Core Analytics Architecture

### 2.1 Low-Compute Heuristic Engagement Scoring
- **Downscaled Optical Flow (Farneback):**
  - Processing raw 1080p/4K frames with dense optical flow requires GPU clusters ($>200\text{ms}/\text{frame}$).
  - VidPulse downsamples consecutive frame pairs to a tiny **160x90** proxy canvas and runs 2-iteration Farneback optical flow ($<5\text{ms}$ on standard CPU), extracting motion magnitude:
    $$\Delta M = \text{mean}\left(\sqrt{u^2 + v^2}\right)$$
- **Brightness & Visual Variance:**
  - Evaluates standard deviation of grayscale luminance ($\sigma_{\text{gray}} / 128$) to measure visual dynamism and lighting transitions.
- **Composite Score Formula:**
  $$\text{Score} = \text{clip}\left(0.4 \cdot \min(\text{Var}_{\text{bright}}, 1.0) + 0.6 \cdot \min\left(\frac{\Delta M}{5.0}, 1.0\right), 0.0, 1.0\right)$$

### 2.2 Convolution-Based Attention Drop Detection
- Raw second-by-second scores contain high-frequency noise from momentary camera cuts.
- A 1D moving-average convolution kernel ($K = [1/w, \dots, 1/w]$ with $w=5$) produces smoothed engagement curves.
- Drop segments are bounded only when smoothed engagement stays below $\tau = 0.45$ for a continuous interval $\ge 3\text{ seconds}$.
- Severity tiers:
  - **Critical:** $\mu_{\text{score}} < 0.20$
  - **High:** $0.20 \le \mu_{\text{score}} < 0.30$
  - **Medium:** $0.30 \le \mu_{\text{score}} < 0.40$
  - **Low:** $\mu_{\text{score}} \ge 0.40$
