# InterviewOS Speech-to-Text (STT) Evaluation

## Corpus Disclosure & Provenance

> **CRITICAL DISCLOSURE (REMEDIATION-HOTFIX-1 §1.4):**
> The audio clips in `scripts/eval/clips/` are **Windows SAPI TTS synthetic speech, multi-voice (Microsoft David and Microsoft Zira), not human recordings**.
> This synthetic corpus serves **strictly as an automated regression substrate** for testing pipeline plumbing, multipart audio uploads, and proper-noun context biasing integration.
> **The synthetic corpus is NEVER acceptance evidence.** Real acceptance criteria are measured exclusively on human-recorded microphone audio (see H3 acceptance clips under `scripts/eval/clips_user/`).

## Evaluation Harness (`wer_eval.py`)

The evaluation harness measures Word Error Rate (WER) using Levenshtein distance on normalized words.

### Usage

1. **Live Evaluation (requires running service on port 8082)**:
   ```bash
   # Arm A (Baseline):
   python scripts/eval/wer_eval.py --endpoint http://localhost:8082/api/v1/ai/transcribe --output scripts/eval/baseline_wer.json

   # Arm B (Proper-Noun Context Biased):
   python scripts/eval/wer_eval.py --endpoint http://localhost:8082/api/v1/ai/transcribe --prompt-context "Ankit Singh Tomar, InterviewOS, Stripe, Uber, Kafka, Redis, Kubernetes, PostgreSQL" --compare scripts/eval/baseline_wer.json --output scripts/eval/wer_report.json
   ```

2. **Simulation Mode (Regression Reference Only)**:
   ```bash
   python scripts/eval/wer_eval.py --simulate-baseline --output scripts/eval/baseline_wer.simulated.json
   python scripts/eval/wer_eval.py --simulate-biased --prompt-context "Ankit Singh Tomar" --compare scripts/eval/baseline_wer.simulated.json --output scripts/eval/wer_report.simulated.json
   ```
   Simulation outputs explicitly record `"simulation": true`, `"endpoint": null`, and per-clip `"source": "SIMULATED"` to prevent any false attestation of live decode.

## Human Acceptance Clips (H3 Protocol)

Real acceptance criteria for the InterviewOS STT stream are measured strictly against 5 human-recorded microphone audio clips (~10–15 seconds each, 16-bit 16kHz PCM WAV) spoken by the repository owner:
- **2 Technical sentences** (distributed systems, database indexing)
- **2 Conversational sentences** (roadmap prioritization, stakeholder design alignment)
- **1 Proper-noun-heavy sentence** (`Ankit Singh Tomar`, `InterviewOS`, `Whisper`, `Ollama`, `Groq`, `Kubernetes`, `Judge0`)

### Recording Instructions

1. Run the interactive recorder:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/eval/record_clips.ps1
   ```
   The script prompts each sentence, records from your microphone via native Windows multimedia API, saves the clips to `scripts/eval/clips_user/user_clip_01.wav` ... `user_clip_05.wav`, and generates `scripts/eval/manifest_user.csv`.

2. Alternatively, record using your preferred microphone tool (e.g. Audacity, Windows Sound Recorder) and save 16-bit 16kHz WAV files directly to `scripts/eval/clips_user/user_clip_01.wav` through `user_clip_05.wav`, ensuring the exact spoken words are entered into `scripts/eval/manifest_user.csv`.

3. Run the live acceptance evaluation:
   ```bash
   # Arm A (Baseline):
   python scripts/eval/wer_eval.py --manifest scripts/eval/manifest_user.csv --clips-dir scripts/eval/clips_user --output scripts/eval/baseline_wer_user.json

   # Arm B (Context Biased):
   python scripts/eval/wer_eval.py --manifest scripts/eval/manifest_user.csv --clips-dir scripts/eval/clips_user --prompt-context "Ankit Singh Tomar, InterviewOS, Whisper, Ollama, Groq, Kubernetes, Judge0" --compare scripts/eval/baseline_wer_user.json --output scripts/eval/wer_report_user.json
   ```

