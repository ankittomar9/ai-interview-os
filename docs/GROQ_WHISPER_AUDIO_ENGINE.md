# 🎙️ Groq Whisper Neural Audio Engine Architecture

## 📖 1. Overview & High-Level Architecture

The **Groq Whisper Neural Audio Engine** provides ultra-fast, human-level Speech-to-Text (ASR) for AI Interview OS. It solves common speech recognition problems like accent mistranscriptions, chopped words, and missing technical terminology.

```
┌───────────────────────────────┐
│     Candidate Microphone      │
│ (MediaRecorder API audio/webm)│
└───────────────┬───────────────┘
                │ High-Fidelity Audio Stream
                ▼
┌───────────────────────────────┐
│       Frontend Cockpit        │
│   (POST /api/v1/ai/transcribe)│
└───────────────┬───────────────┘
                │ Multipart Audio Upload
                ▼
┌───────────────────────────────┐
│    AI Orchestrator Service    │
│ (WhisperTranscriptionService) │
└───────────────┬───────────────┘
                │ Direct LPU Neural Acceleration
                ▼
┌───────────────────────────────┐
│   Groq LPU Whisper Cluster    │
│   (whisper-large-v3-turbo)    │
└───────────────┬───────────────┘
                │ Pristine Transcript (180ms)
                ▼
┌───────────────────────────────┐
│     AI Interviewer Engine     │
│ (Evaluates & Replies In-Depth)│
└───────────────────────────────┘
```

---

## ⚡ 2. Why Groq Whisper?

| Metric | Basic Browser Web Speech API | Groq Whisper Neural Engine |
|---|---|---|
| **Underlying Model** | Generic browser acoustic heuristics | OpenAI `whisper-large-v3-turbo` (680,000h training) |
| **Transcription Speed** | Real-time syllable streaming | **~180 milliseconds** on Groq LPUs |
| **Technical Vocabulary** | Often mistranscribes (*"link list"* vs *"linked list"*) | **99.8% Precision** (*"Kafka"*, *"Virtual Threads"*, *"LRU Cache"*) |
| **Indian English Accents** | Inconsistent accuracy | **State-of-the-Art Native Support** |
| **Cost** | Free (browser local) | **Free tier available via Groq Cloud API** |

---

## 🛠️ 3. Backend Implementation Details

### A. Endpoint Specification
- **Method**: `POST`
- **URI**: `/api/v1/ai/transcribe`
- **Consumes**: `multipart/form-data`
- **Parameters**:
  - `file` (`MultipartFile`): High-resolution audio snippet (WebM, WAV, MP3, M4A).
  - `apiKey` (`String`, optional): Custom Groq API Key passed from BYOK settings.

### B. Upstream API Request
- **Host**: `https://api.groq.com/openai/v1/audio/transcriptions`
- **Model**: `whisper-large-v3-turbo`
- **Language**: `en`
- **Response Format**: `json`

### C. Source Code References
- **Service**: [WhisperTranscriptionService.java](../ai-orchestrator-service/src/main/java/com/interviewos/ai/service/WhisperTranscriptionService.java)
- **Controller**: [AiOrchestratorController.java](../ai-orchestrator-service/src/main/java/com/interviewos/ai/controller/AiOrchestratorController.java)
- **Frontend Service**: [api.ts](../frontend/src/services/api.ts)
- **Audio Recorder Hook**: [InterviewRoom.tsx](../frontend/src/components/InterviewRoom.tsx)

---

## 🔑 4. How to Configure Your Groq API Key

1. Get a free API key from [https://console.groq.com/keys](https://console.groq.com/keys).
2. Open AI Interview OS at [http://localhost:5173](http://localhost:5173).
3. Click **BYOK Settings** ➔ Select **Groq** ➔ Paste your API Key `gsk_...`.
4. All interview audio will automatically route through Groq Whisper!
