# Security Policy — VidPulse AI

## Supported Versions

| Version | Supported |
|---|---|
| `v1.0.x` (FastAPI / Next.js) | ✅ Yes |
| Earlier experimental builds | ❌ No |

---

## Reporting a Vulnerability

If you discover a security vulnerability, security flaw, or credential exposure within VidPulse AI, please do **NOT** open a public GitHub issue.

Please report the finding privately to:
* **Security Contact:** Yash Patadiya
* **Email:** [yashpatadiya1724@gmail.com](mailto:yashpatadiya1724@gmail.com)
* **Response SLA:** Within 48 hours with an initial assessment and mitigation plan.

Please include:
1. Target endpoint, service component, or file affected.
2. Steps to reproduce the issue or proof-of-concept payload.
3. Potential security impact (e.g. unauthorized object access, unvalidated redirect, denial of service).

---

## Data Privacy & Architectural Boundaries

### 1. Video Content Storage
* **Presigned Object Access:** Raw creator video uploads are stored in private object storage (MinIO / AWS S3) and accessed only via short-lived presigned URLs.
* **No Unauthenticated Video Access:** Video endpoints strictly require valid JWT bearer tokens.

### 2. Analytical Privacy (No Biometric Tracking)
* VidPulse AI's engagement model is **strictly heuristic**. It computes optical flow motion vectors and luminance variance over downsampled proxy frames (160×90).
* **Zero Biometrics:** VidPulse AI does **not** track human faces, identify viewers, capture gaze, or perform biometric surveillance.

### 3. Secret Management
* Production deployments must provide `SECRET_KEY`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` via container environment variables or secrets managers (e.g. Railway / Render secrets).
* Secrets, access tokens, and private S3 credentials are never logged to `stdout` or committed to version control.
