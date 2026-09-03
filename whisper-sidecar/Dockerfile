# -----------------------------------------------------------------------------
# InterviewOS - Local Whisper.cpp Neural Speech-to-Text Sidecar (SPEC-003)
# Zero cloud egress, 100% local speech-to-text inference on port :8178.
# -----------------------------------------------------------------------------
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    cmake \
    wget \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone whisper.cpp
RUN git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git .

# Build with whisper server support
RUN make server

# Download the lightweight English model (~140MB)
RUN mkdir -p models && \
    wget -q --show-progress https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin -O models/ggml-base.en.bin

EXPOSE 8178

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8178/health || exit 1

ENTRYPOINT ["./server"]
CMD ["-m", "models/ggml-base.en.bin", "--host", "0.0.0.0", "--port", "8178"]
