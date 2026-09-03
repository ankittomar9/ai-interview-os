# Whisper.cpp Sidecar Service (100% Local Speech-to-Text)

This sidecar provides completely offline, local neural speech-to-text inference for candidate audio evaluation in InterviewOS, satisfying **SPEC-003: Local-First Purity**.

## Features
- Runs [whisper.cpp](https://github.com/ggerganov/whisper.cpp) C++ server on port `:8178`.
- Model: `ggml-base.en.bin` (~140MB, low memory footprint, sub-1s latency).
- Zero cloud egress: candidate voice recordings never leave the local machine.
- Compatible with `ai-orchestrator-service` via `${WHISPER_ENDPOINT:http://whisper-sidecar:8178/inference}`.

## Quickstart (Docker)
```bash
docker build -t ai-interview-os/whisper-sidecar:latest ./whisper-sidecar
docker run -d -p 8178:8178 --name whisper-sidecar ai-interview-os/whisper-sidecar:latest
```

## Healthcheck
```bash
curl http://localhost:8178/health
```
