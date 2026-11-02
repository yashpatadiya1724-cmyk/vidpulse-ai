# Engineering Challenges & Technical Learnings
### Repository: vidpulse-ai

## 1. Challenge: Optical Flow Compute Overhead
- **Problem:** Analyzing a 60-second video at 30 fps produces 1,800 frames. Full-resolution optical flow took upwards of 6 minutes per video on budget cloud CPUs, making near-instant analysis impossible.
- **Solution:** Sampled video at 2 frames per second (120 frames total) and downsampled frames to 160x90 prior to Farneback calculation. Total processing time dropped to **under 1.5 seconds** per 60-second video with zero loss in drop-off detection accuracy.

---

## 2. Challenge: False Drop Triggers on Clean Video Transitions
- **Problem:** Normal video scene transitions (crossfades, quick dips to black) scored low for 0.5s to 1s, falsely flagging hundreds of "critical drops" throughout the video.
- **Solution:** Added a 1D moving average smoothing convolution window combined with a minimum drop threshold (`min_duration = 3` seconds). Momentary transition cuts are naturally smoothed over, while genuine viewer drop-off valleys are accurately isolated.
