# Contributing to VidPulse AI

Thank you for contributing to VidPulse AI. We welcome contributions that optimize video frame extraction, improve optical flow heuristics, and enhance creator visualization components.

## Guidelines
1. **Heuristic Honesty**: Never overstate analytics capabilities; document the exact mathematical heuristic used for attention scoring.
2. **Compute Efficiency**: Avoid adding heavy deep learning models for tasks where lightweight OpenCV/NumPy operations suffice. Keep frame processing fast.
3. **No Hardcoded Secrets**: Ensure `.env` is never committed.
4. **Testing**: Run analytics unit tests before opening a PR:
   ```bash
   python backend/tests/test_analytics_engine.py
   ```
5. **Branching**: Submit changes on topic branches, never directly to `main`.
