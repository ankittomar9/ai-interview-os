# Whisper.cpp Sidecar Service (100% Local Speech-to-Text)

This sidecar provides completely offline, local neural speech-to-text inference for candidate audio evaluation in InterviewOS, satisfying **SPEC-003: Local-First Purity** and **SPEC-STT-1: Antigravity-Grade Accuracy**.

## Features
- Runs [whisper.cpp](https://github.com/ggerganov/whisper.cpp) C++ server on port `:8178`.
- Default Model: `ggml-large-v3-turbo-q5_0.bin` (~574MB, high accuracy on non-native English and technical jargon).
- Zero cloud egress: candidate voice recordings never leave the local machine.
- Direct FFmpeg decoding via `--convert` flag for any incoming container format (WAV, WebM, Opus).
- Compatible with `ai-orchestrator-service` via `${WHISPER_ENDPOINT:http://whisper-sidecar:8178/inference}`.

## Model Profiles & Tradeoffs

| Profile | Model | File Size | Peak RAM | Typical Latency (30s audio) | Non-Native WER | Target |
|---|---|---|---|---|---|---|
| **Default (Standard)** | `ggml-large-v3-turbo-q5_0.bin` | ~574 MB | ~1.2 GB | ~5–15s (CPU) | ~4–7% | Production / Dev with ≥2GB RAM |
| **Lite (Low-RAM)** | `ggml-base.en.bin` | ~140 MB | ~350 MB | ~1–3s (CPU) | ~12–20% | Low-spec hosts (≤1GB RAM) |

## Quickstart (Docker)

### Build Standard (Default)
```bash
docker build -t ai-interview-os/whisper-sidecar:latest ./whisper-sidecar
docker run -d -p 8178:8178 --memory 2g --name whisper-sidecar ai-interview-os/whisper-sidecar:latest
```

### Build Lite Profile (Low RAM)
```bash
docker build --build-arg WHISPER_MODEL=ggml-base.en.bin -t ai-interview-os/whisper-sidecar:latest ./whisper-sidecar
docker run -d -p 8178:8178 --memory 512m --name whisper-sidecar ai-interview-os/whisper-sidecar:latest
```

## Healthcheck
```bash
curl http://localhost:8178/health
```
