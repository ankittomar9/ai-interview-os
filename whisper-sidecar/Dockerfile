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
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone whisper.cpp
RUN git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git .

# Build with whisper server support
RUN cmake -B build -DWHISPER_BUILD_SERVER=ON && \
    cmake --build build --config Release -j --target whisper-server

# Build argument for model selection (default: large-v3-turbo quantized q5_0 ~574MB)
# Lite profile: --build-arg WHISPER_MODEL=ggml-base.en.bin (~140MB)
ARG WHISPER_MODEL=ggml-large-v3-turbo-q5_0.bin

# Download neural speech-to-text model
RUN mkdir -p models && \
    wget -q --show-progress https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${WHISPER_MODEL} -O models/${WHISPER_MODEL}

EXPOSE 8178

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8178/health || exit 1

ENTRYPOINT ["./build/bin/whisper-server"]
CMD ["-m", "models/ggml-large-v3-turbo-q5_0.bin", "--host", "0.0.0.0", "--port", "8178", "--convert"]
