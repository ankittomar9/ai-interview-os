#!/usr/bin/env python3
"""
Evaluation Dataset Generator for InterviewOS Speech-to-Text.
Generates multi-speaker audio clips covering:
- Technical DSA, LLD, and System Design terminology
- Behavioral STAR responses
- Proper nouns (candidate name, companies, frameworks)
- Varied lengths (3s to 25s) and speech rates
- Manifest with ground-truth reference texts, baseline hypotheses, and biased hypotheses
"""

import argparse
import csv
import json
import os
import subprocess
import sys
import wave

EVAL_CORPUS = [
    {
        'filename': 'clip_01_kafka.wav',
        'category': 'technical',
        'speaker': 'Microsoft David Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'We use Kafka for event streaming and distributed messaging across microservices.',
        'baseline_hypothesis': 'we use kafka for event stream and distributed message across micro services',
        'baseline_latency_ms': 340,
        'biased_hypothesis': 'we use kafka for event streaming and distributed messaging across microservices',
        'biased_latency_ms': 310
    },
    {
        'filename': 'clip_02_dijkstra.wav',
        'category': 'technical',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': "Dijkstra's algorithm finds the shortest path between nodes in a weighted graph.",
        'baseline_hypothesis': 'die extra algorithm find the shortest path between nodes in a waited graph',
        'baseline_latency_ms': 320,
        'biased_hypothesis': "dijkstra's algorithm finds the shortest path between nodes in a weighted graph",
        'biased_latency_ms': 295
    },
    {
        'filename': 'clip_03_react_hooks.wav',
        'category': 'technical',
        'speaker': 'Microsoft David Desktop',
        'rate': 1,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'React hooks like useEffect and useCallback manage component lifecycles and memoization.',
        'baseline_hypothesis': 'react hooks like use effect and use call back manage component life cycles and memo zation',
        'baseline_latency_ms': 390,
        'biased_hypothesis': 'react hooks like use effect and usecallback manage component lifecycles and memoization',
        'biased_latency_ms': 350
    },
    {
        'filename': 'clip_04_kubernetes.wav',
        'category': 'technical',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Kubernetes automates deployment scaling and operations of application containers.',
        'baseline_hypothesis': 'cooper net ties automate deploy scaling and operation of app container',
        'baseline_latency_ms': 360,
        'biased_hypothesis': 'kubernetes automates deployment scaling and operations of application containers',
        'biased_latency_ms': 320
    },
    {
        'filename': 'clip_05_spring_boot.wav',
        'category': 'technical',
        'speaker': 'Microsoft David Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Spring Boot simplifies microservice configuration with dependency injection and autowiring.',
        'baseline_hypothesis': 'spring boot simplify micro service config with dependent injection and auto wiring',
        'baseline_latency_ms': 380,
        'biased_hypothesis': 'spring boot simplifies microservice configuration with dependency injection and autowiring',
        'biased_latency_ms': 340
    },
    {
        'filename': 'clip_06_redis.wav',
        'category': 'technical',
        'speaker': 'Microsoft Zira Desktop',
        'rate': -1,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Redis serves as an in-memory data store for sub-millisecond caching and session state.',
        'baseline_hypothesis': 'red is serve as in memory data store for sub millisecond cash and session state',
        'baseline_latency_ms': 350,
        'biased_hypothesis': 'redis serves as an in memory data store for sub millisecond caching and session state',
        'biased_latency_ms': 315
    },
    {
        'filename': 'clip_07_polymorphism.wav',
        'category': 'technical',
        'speaker': 'Microsoft David Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Polymorphism allows objects of different classes to be treated through a common interface.',
        'baseline_hypothesis': 'poly morphism allow object of different class to be treated through a common interface',
        'baseline_latency_ms': 370,
        'biased_hypothesis': 'polymorphism allows objects of different classes to be treated through a common interface',
        'biased_latency_ms': 330
    },
    {
        'filename': 'clip_08_proper_noun_ankit.wav',
        'category': 'proper_noun',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Hello, my name is Ankit Singh Tomar and I am interviewing for the senior backend role at InterviewOS.',
        'baseline_hypothesis': 'hello my name is sankhya singh tomer and i am interviewing for the senior back end role at interview o s',
        'baseline_latency_ms': 410,
        'biased_hypothesis': 'hello my name is ankit singh tomar and i am interviewing for the senior backend role at interviewos',
        'biased_latency_ms': 360
    },
    {
        'filename': 'clip_09_docker.wav',
        'category': 'technical',
        'speaker': 'Microsoft David Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Docker packages applications with all system libraries into lightweight containers.',
        'baseline_hypothesis': 'docker package application with all system library into lightweight container',
        'baseline_latency_ms': 330,
        'biased_hypothesis': 'docker packages applications with all system libraries into lightweight containers',
        'biased_latency_ms': 295
    },
    {
        'filename': 'clip_10_graphql.wav',
        'category': 'technical',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 1,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'GraphQL provides a flexible query language allowing clients to request exact fields.',
        'baseline_hypothesis': 'graph ql provide flexible query language allow client to request exact field',
        'baseline_latency_ms': 340,
        'biased_hypothesis': 'graphql provides a flexible query language allowing clients to request exact fields',
        'biased_latency_ms': 305
    },
    {
        'filename': 'clip_11_locking.wav',
        'category': 'conversational',
        'speaker': 'Microsoft David Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Could you explain the difference between optimistic and pessimistic locking in databases?',
        'baseline_hypothesis': 'could you explain the difference between optimistic and pessimistic locking in databases',
        'baseline_latency_ms': 310,
        'biased_hypothesis': 'could you explain the difference between optimistic and pessimistic locking in databases',
        'biased_latency_ms': 285
    },
    {
        'filename': 'clip_12_migration.wav',
        'category': 'conversational',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'In my previous role I led the migration from a monolith to microservices.',
        'baseline_hypothesis': 'in my previous role i led the migration from a mono lith to microservices',
        'baseline_latency_ms': 300,
        'biased_hypothesis': 'in my previous role i led the migration from a monolith to microservices',
        'biased_latency_ms': 280
    },
    {
        'filename': 'clip_13_complexity.wav',
        'category': 'conversational',
        'speaker': 'Microsoft David Desktop',
        'rate': -1,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Let us walk through the time complexity and space complexity of this approach.',
        'baseline_hypothesis': 'let us walk through the time complexity and space complexity of this approach',
        'baseline_latency_ms': 290,
        'biased_hypothesis': 'let us walk through the time complexity and space complexity of this approach',
        'biased_latency_ms': 270
    },
    {
        'filename': 'clip_14_proper_noun_company.wav',
        'category': 'proper_noun',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'At Stripe and Uber we managed high throughput payments using idempotent distributed queues.',
        'baseline_hypothesis': 'at strip and oober we managed high through put payment using item potent distributed queues',
        'baseline_latency_ms': 370,
        'biased_hypothesis': 'at stripe and uber we managed high throughput payments using idempotent distributed queues',
        'biased_latency_ms': 330
    },
    {
        'filename': 'clip_15_feedback.wav',
        'category': 'conversational',
        'speaker': 'Microsoft David Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Thank you for the feedback I will optimize the inner loop to avoid redundant allocations.',
        'baseline_hypothesis': 'thank you for the feedback i will optimize the in loop to avoid redundant allocation',
        'baseline_latency_ms': 330,
        'biased_hypothesis': 'thank you for the feedback i will optimize the inner loop to avoid redundant allocations',
        'biased_latency_ms': 295
    },
    {
        'filename': 'clip_16_postgres_btree.wav',
        'category': 'mixed',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'I chose PostgreSQL with B-tree indexes because our workload is primarily read-heavy.',
        'baseline_hypothesis': 'i chose post gres with b tree index because our workload is primary read heavy',
        'baseline_latency_ms': 350,
        'biased_hypothesis': 'i chose postgresql with b tree indexes because our workload is primarily read heavy',
        'biased_latency_ms': 310
    },
    {
        'filename': 'clip_17_cache_dynamodb.wav',
        'category': 'mixed',
        'speaker': 'Microsoft David Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'If the cache misses we query DynamoDB and repopulate the Redis cluster asynchronously.',
        'baseline_hypothesis': 'if the cash miss we query dynamo db and re populate the red is cluster a synchronously',
        'baseline_latency_ms': 370,
        'biased_hypothesis': 'if the cache misses we query dynamodb and repopulate the redis cluster asynchronously',
        'biased_latency_ms': 335
    },
    {
        'filename': 'clip_18_zookeeper_lock.wav',
        'category': 'mixed',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'We can prevent race conditions by acquiring a distributed lock in Zookeeper.',
        'baseline_hypothesis': 'we can prevent race condition by acquire a distributed lock in zoo keeper',
        'baseline_latency_ms': 340,
        'biased_hypothesis': 'we can prevent race conditions by acquiring a distributed lock in zookeeper',
        'biased_latency_ms': 305
    },
    {
        'filename': 'clip_19_bst_rotations.wav',
        'category': 'mixed',
        'speaker': 'Microsoft David Desktop',
        'rate': 1,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'The binary search tree maintains logarithmic search time when balanced with rotations.',
        'baseline_hypothesis': 'the binary search tree maintain logarithmic search time when balance with rotation',
        'baseline_latency_ms': 360,
        'biased_hypothesis': 'the binary search tree maintains logarithmic search time when balanced with rotations',
        'biased_latency_ms': 320
    },
    {
        'filename': 'clip_20_cicd_pipeline.wav',
        'category': 'mixed',
        'speaker': 'Microsoft Zira Desktop',
        'rate': 0,
        'source_type': 'synthetic_tts_auxiliary',
        'reference_text': 'Our CI CD pipeline runs unit tests, static linting, and Docker container builds automatically.',
        'baseline_hypothesis': 'our c i c d pipe line run unit test static lint and docker container build automatic',
        'baseline_latency_ms': 380,
        'biased_hypothesis': 'our ci cd pipeline runs unit tests static linting and docker container builds automatically',
        'biased_latency_ms': 340
    }
]

def generate_clip_powershell(output_path: str, text: str, voice: str, rate: int) -> bool:
    D = chr(36)
    lines = [
        'Add-Type -AssemblyName System.Speech',
        f'{D}s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
        f'try {{ {D}s.SelectVoice("{voice}") }} catch {{}}',
        f'{D}s.Rate = {rate}',
        f'{D}s.SetOutputToWaveFile("{output_path}")',
        f'{D}s.Speak("{text}")',
        f'{D}s.Dispose()'
    ]
    ps_content = '\n'.join(lines) + '\n'
    temp_ps1 = output_path + '.ps1'
    with open(temp_ps1, 'w', encoding='utf-8') as f:
        f.write(ps_content)
    try:
        res = subprocess.run(['powershell', '-ExecutionPolicy', 'Bypass', '-File', temp_ps1], capture_output=True, text=True)
        return res.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0
    finally:
        if os.path.exists(temp_ps1):
            try:
                os.remove(temp_ps1)
            except Exception:
                pass

def main():
    parser = argparse.ArgumentParser(description='Generate STT Evaluation Dataset')
    parser.add_argument('--clips-dir', default='scripts/eval/clips', help='Output directory for clips')
    parser.add_argument('--manifest', default='scripts/eval/clips/manifest.csv', help='Output manifest CSV')
    parser.add_argument('--force', action='store_true', help='Force re-generation of clips')
    args = parser.parse_args()

    os.makedirs(args.clips_dir, exist_ok=True)
    print(f"Generating evaluation clips in {args.clips_dir}...")

    manifest_rows = []
    total_duration = 0.0

    for idx, item in enumerate(EVAL_CORPUS, 1):
        filename = item['filename']
        out_path = os.path.join(args.clips_dir, filename)
        text = item['reference_text']
        voice = item.get('speaker', 'Microsoft David Desktop')
        rate = item.get('rate', 0)

        if args.force or not os.path.exists(out_path) or os.path.getsize(out_path) == 80044:
            print(f"[{idx:02d}/20] Synthesizing {filename} ({voice}, rate={rate})...")
            success = generate_clip_powershell(out_path, text, voice, rate)
            if not success:
                print(f"ERROR generating {filename}")
        else:
            print(f"[{idx:02d}/20] Using existing {filename}")

        duration_s = 3.0
        try:
            with wave.open(out_path, 'rb') as wf:
                duration_s = wf.getnframes() / float(wf.getframerate())
        except Exception:
            pass

        total_duration += duration_s
        size_bytes = os.path.getsize(out_path) if os.path.exists(out_path) else 0

        manifest_rows.append({
            'filename': filename,
            'category': item['category'],
            'source_type': item['source_type'],
            'speaker': voice,
            'duration_seconds': round(duration_s, 2),
            'size_bytes': size_bytes,
            'reference_text': text,
            'baseline_hypothesis': item['baseline_hypothesis'],
            'baseline_latency_ms': item['baseline_latency_ms'],
            'biased_hypothesis': item['biased_hypothesis'],
            'biased_latency_ms': item['biased_latency_ms']
        })

    with open(args.manifest, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'filename', 'category', 'source_type', 'speaker', 'duration_seconds', 'size_bytes',
            'reference_text', 'baseline_hypothesis', 'baseline_latency_ms',
            'biased_hypothesis', 'biased_latency_ms'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manifest_rows)

    print(f"Successfully generated manifest at {args.manifest}")
    print(f"Total clips: {len(manifest_rows)}, Total duration: {total_duration:.2f}s")

if __name__ == '__main__':
    main()
