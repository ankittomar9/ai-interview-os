#!/usr/bin/env python3
"""
WER (Word Error Rate) Evaluation Harness for InterviewOS Speech-to-Text.
Measures transcription accuracy, latency, and context biasing effectiveness.
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from typing import Dict, List, Tuple, Any, Optional

def normalize_text(text: str) -> str:
    """Normalize text for consistent WER scoring."""
    if not text:
        return ""
    # Lowercase, replace hyphens and underscores with space
    text = text.lower().replace("-", " ").replace("_", " ")
    # Remove punctuation except letters and numbers
    text = re.sub(r"[^\w\s]", "", text)
    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text

def compute_wer(reference: str, hypothesis: str) -> Tuple[float, int, int, int, int]:
    """
    Compute Word Error Rate (WER) using Levenshtein distance on words.
    Returns: (wer_score, substitutions, deletions, insertions, reference_length)
    """
    ref_words = normalize_text(reference).split()
    hyp_words = normalize_text(hypothesis).split()

    if not ref_words:
        if not hyp_words:
            return 0.0, 0, 0, 0, 0
        return 1.0, 0, 0, len(hyp_words), 0

    r_len = len(ref_words)
    h_len = len(hyp_words)

    # DP Matrix: dp[i][j] = (errors, s, d, i)
    dp = [[(0, 0, 0, 0) for _ in range(h_len + 1)] for _ in range(r_len + 1)]

    for i in range(1, r_len + 1):
        dp[i][0] = (i, 0, i, 0) # all deletions
    for j in range(1, h_len + 1):
        dp[0][j] = (j, 0, 0, j) # all insertions

    for i in range(1, r_len + 1):
        for j in range(1, h_len + 1):
            if ref_words[i - 1] == hyp_words[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                sub_err, s, d, ins = dp[i - 1][j - 1]
                del_err, ds, dd, dins = dp[i - 1][j]
                ins_err, is_, id_, iins = dp[i][j - 1]

                # Substitution
                best_err = sub_err + 1
                best_op = (sub_err + 1, s + 1, d, ins)

                # Deletion
                if del_err + 1 < best_err:
                    best_err = del_err + 1
                    best_op = (del_err + 1, ds, dd + 1, dins)

                # Insertion
                if ins_err + 1 < best_err:
                    best_err = ins_err + 1
                    best_op = (ins_err + 1, is_, id_, iins + 1)

                dp[i][j] = best_op

    total_errors, s, d, ins = dp[r_len][h_len]
    wer = total_errors / r_len
    return wer, s, d, ins, r_len

def post_audio_multipart(
    endpoint: str,
    audio_path: str,
    prompt_context: Optional[str] = None,
    session_id: Optional[int] = None,
    api_key: Optional[str] = None
) -> Tuple[Optional[str], float, Optional[str]]:
    """
    POST audio file as multipart/form-data to orchestrator transcribe endpoint.
    Returns: (transcript_text, latency_ms, provider_or_status)
    """
    boundary = "----WebKitFormBoundaryInterviewOsEval" + str(int(time.time()))
    body = bytearray()

    with open(audio_path, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(audio_path)
    content_type = "audio/wav" if filename.endswith(".wav") else "audio/webm"

    # Add 'file'
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(file_bytes)
    body.extend(b"\r\n")

    # Add 'audio'
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="audio"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(file_bytes)
    body.extend(b"\r\n")

    if prompt_context:
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(b'Content-Disposition: form-data; name="promptContext"\r\n\r\n')
        body.extend(prompt_context.encode("utf-8"))
        body.extend(b"\r\n")

    if session_id:
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(b'Content-Disposition: form-data; name="sessionId"\r\n\r\n')
        body.extend(str(session_id).encode("utf-8"))
        body.extend(b"\r\n")

    if api_key:
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(b'Content-Disposition: form-data; name="apiKey"\r\n\r\n')
        body.extend(api_key.encode("utf-8"))
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(
        endpoint,
        data=bytes(body),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "InterviewOS-STT-Eval/1.0"
        },
        method="POST"
    )

    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            elapsed_ms = (time.time() - start_time) * 1000
            res_json = json.loads(resp.read().decode("utf-8"))
            transcript = res_json.get("text") or res_json.get("transcript") or ""
            provider = res_json.get("provider") or res_json.get("status") or "OK"
            return transcript, elapsed_ms, provider
    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        return None, elapsed_ms, str(e)

def run_evaluation(
    manifest_path: str,
    clips_dir: str,
    endpoint: str,
    prompt_context: Optional[str] = None,
    session_id: Optional[int] = None,
    api_key: Optional[str] = None,
    simulated_baseline: bool = False,
    simulated_biased: bool = False
) -> Dict[str, Any]:
    """Run evaluation across all clips in manifest."""
    is_simulation = simulated_baseline or simulated_biased

    clips = []
    with open(manifest_path, "r", encoding="utf-8") as f:
        filtered_lines = [line for line in f if not line.strip().startswith("#")]
        reader = csv.DictReader(filtered_lines)
        for row in reader:
            clips.append(row)

    results = []
    total_ref_words = 0
    total_errors = 0
    total_s = 0
    total_d = 0
    total_ins = 0
    total_latency_ms = 0.0

    print("=" * 80)
    if is_simulation:
        print(f"Running STT Evaluation (SIMULATION MODE) on {len(clips)} clips")
    else:
        print(f"Running STT Evaluation (LIVE MODE) on {len(clips)} clips")
        print(f"Endpoint: {endpoint}")
    if prompt_context:
        print(f"Prompt Context: {prompt_context}")
    print("=" * 80)

    for idx, clip in enumerate(clips, 1):
        filename = clip["filename"]
        reference = clip["reference_text"]
        category = clip.get("category", "general")
        audio_path = os.path.join(clips_dir, filename)

        if is_simulation:
            source = "SIMULATED"
            latency_ms = None
            if simulated_biased:
                hyp = clip.get("biased_hypothesis", clip.get("baseline_hypothesis", reference))
                provider = "SIMULATED_BIASED_MANIFEST"
            else:
                hyp = clip.get("baseline_hypothesis", reference)
                provider = "SIMULATED_BASELINE_MANIFEST"
        else:
            # LIVE MODE: must hard-fail on missing audio clips
            if not os.path.exists(audio_path):
                sys.stderr.write(f"\nERROR: Audio clip file not found: {audio_path}\n"
                                 f"Live evaluation requires real audio clips. Aborting.\n")
                sys.exit(1)

            source = "LIVE"
            hyp, measured_latency_ms, provider = post_audio_multipart(
                endpoint, audio_path, prompt_context, session_id, api_key
            )
            if hyp is None:
                hyp = ""
            latency_ms = measured_latency_ms
            total_latency_ms += latency_ms

        wer, s, d, ins, r_len = compute_wer(reference, hyp)
        clip_errs = s + d + ins

        total_ref_words += r_len
        total_errors += clip_errs
        total_s += s
        total_d += d
        total_ins += ins

        result_entry: Dict[str, Any] = {
            "id": idx,
            "filename": filename,
            "category": category,
            "source": source,
            "reference": reference,
            "hypothesis": hyp,
            "wer": round(wer, 4),
            "substitutions": s,
            "deletions": d,
            "insertions": ins,
            "ref_words": r_len,
            "latency_ms": round(latency_ms, 1) if latency_ms is not None else None,
            "provider": provider
        }
        results.append(result_entry)

        status_flag = "PASS" if wer <= 0.10 else "WARN" if wer <= 0.25 else "FAIL"
        latency_str = f"{latency_ms:5.0f}ms" if latency_ms is not None else "     N/A"
        print(f"[{idx:02d}/{len(clips):02d}] [{status_flag}] WER: {wer*100:5.1f}% | Latency: {latency_str} | Source: {source} | Clip: {filename}")
        if wer > 0:
            print(f"       Ref: \"{reference}\"")
            print(f"       Hyp: \"{hyp}\"")

    corpus_wer = (total_errors / total_ref_words) if total_ref_words > 0 else 0.0
    avg_latency = (total_latency_ms / len(clips)) if (clips and not is_simulation) else None

    summary: Dict[str, Any] = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "simulation": is_simulation,
        "total_clips": len(clips),
        "total_words": total_ref_words,
        "total_errors": total_errors,
        "substitutions": total_s,
        "deletions": total_d,
        "insertions": total_ins,
        "corpus_wer": round(corpus_wer, 4),
        "corpus_wer_percent": round(corpus_wer * 100, 2),
        "avg_latency_ms": round(avg_latency, 1) if avg_latency is not None else None,
        "endpoint": None if is_simulation else endpoint,
        "prompt_context": prompt_context,
        "results": results
    }

    print("\n" + "=" * 80)
    latency_summary_str = f"{avg_latency:.1f}ms" if avg_latency is not None else "N/A (Simulated)"
    mode_str = "SIMULATION" if is_simulation else "LIVE"
    print(f"SUMMARY [{mode_str}]: Corpus WER = {corpus_wer * 100:.2f}% ({total_errors}/{total_ref_words} words) | Avg Latency: {latency_summary_str}")
    print("=" * 80)

    return summary

def main():
    parser = argparse.ArgumentParser(description="InterviewOS Speech-to-Text WER Evaluation")
    parser.add_argument("--endpoint", default="http://localhost:8082/api/v1/ai/transcribe", help="STT endpoint URL")
    parser.add_argument("--manifest", default="scripts/eval/clips/manifest.csv", help="Path to manifest CSV")
    parser.add_argument("--clips-dir", default="scripts/eval/clips", help="Directory containing audio clips")
    parser.add_argument("--output", default="scripts/eval/wer_report.json", help="Path for output report JSON")
    parser.add_argument("--prompt-context", default=None, help="Prompt context / hot-words")
    parser.add_argument("--session-id", type=int, default=None, help="Session ID for context retrieval")
    parser.add_argument("--api-key", default=None, help="Optional API key")
    parser.add_argument("--compare", default=None, help="Compare results against baseline JSON")
    parser.add_argument("--simulate-baseline", action="store_true", help="Generate reference baseline without live server")
    parser.add_argument("--simulate-biased", action="store_true", help="Generate context-biased evaluation without live server")

    args = parser.parse_args()

    report = run_evaluation(
        manifest_path=args.manifest,
        clips_dir=args.clips_dir,
        endpoint=args.endpoint,
        prompt_context=args.prompt_context,
        session_id=args.session_id,
        api_key=args.api_key,
        simulated_baseline=args.simulate_baseline,
        simulated_biased=args.simulate_biased
    )

    # Automated Gate Verification
    curr_wer = report.get("corpus_wer", 0.0)
    gate_abs_wer = curr_wer <= 0.08

    # Speed gate (gate_speed_30s_clip_le_20s) deleted per REMEDIATION-HOTFIX-1 §1.1:
    # No 30-second benchmark reference clip exists in the 20-clip dataset (durations are 4.8s - 6.8s).
    # Hardcoded 'passed: True' is strictly removed to prevent unverified attestation.
    report["gates"] = {
        "gate_absolute_wer_le_8pct": {
            "required": "<= 8.0%",
            "actual": f"{curr_wer * 100:.2f}%",
            "passed": gate_abs_wer
        }
    }

    if args.compare and os.path.exists(args.compare):
        with open(args.compare, "r", encoding="utf-8") as f:
            base_data = json.load(f)
        base_wer = base_data.get("corpus_wer", 0.0)
        reduction = ((base_wer - curr_wer) / base_wer * 100) if base_wer > 0 else 0.0
        gate_reduction = reduction >= 40.0
        report["gates"]["gate_relative_reduction_ge_40pct"] = {
            "required": ">= 40.0%",
            "actual": f"{reduction:+.2f}%",
            "passed": gate_reduction
        }

    # Ensure output dir exists
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\nSaved evaluation report to {args.output}")

    if args.compare and os.path.exists(args.compare):
        print(f"\n--- Comparison vs Baseline ({args.compare}) ---")
        print(f"Baseline WER: {base_wer * 100:.2f}% -> Current WER: {curr_wer * 100:.2f}%")
        print(f"Relative WER Reduction: {reduction:+.2f}%")
        print(f"Gates: Absolute WER <= 8%: {'PASS' if gate_abs_wer else 'FAIL'} | Relative Reduction >= 40%: {'PASS' if gate_reduction else 'FAIL'}")
    else:
        print(f"\nGates: Absolute WER <= 8%: {'PASS' if gate_abs_wer else 'FAIL'}")

if __name__ == "__main__":
    main()
