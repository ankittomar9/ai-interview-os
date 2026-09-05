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
