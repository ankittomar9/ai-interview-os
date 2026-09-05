<#
.SYNOPSIS
    Interactive recorder for human acceptance audio clips (REMEDIATION-HOTFIX-1 H3).
.DESCRIPTION
    Guides the repository owner to record 5 real microphone audio clips (~10-15s each, WAV):
      - 2 Technical sentences
      - 2 Conversational sentences
      - 1 Proper-noun-heavy sentence (InterviewOS, Ankit Singh Tomar, Groq, Ollama, Kafka, Redis, Judge0)
    
    Audio is captured as 16-bit 16kHz mono PCM WAV into scripts/eval/clips_user/
    and recorded in scripts/eval/manifest_user.csv.
#>

[CmdletBinding()]
param (
    [string]$ClipsDir = "$PSScriptRoot/clips_user",
    [string]$ManifestPath = "$PSScriptRoot/manifest_user.csv"
)

# P/Invoke WinMM for native Windows microphone recording without third-party dependencies
$winMmTypeDef = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinMicRecorder {
    [DllImport("winmm.dll", EntryPoint = "mciSendStringA", CharSet = CharSet.Ansi)]
    public static extern int mciSendString(string lpszCommand, StringBuilder lpszReturnString, int cchReturn, IntPtr hwndCallback);

    public static int Send(string cmd) {
        StringBuilder sb = new StringBuilder(256);
        return mciSendString(cmd, sb, sb.Capacity, IntPtr.Zero);
    }
}
"@

try {
    Add-Type -TypeDefinition $winMmTypeDef -ErrorAction SilentlyContinue
} catch {
    # Type already added in current session
}

if (-not (Test-Path $ClipsDir)) {
    New-Item -ItemType Directory -Path $ClipsDir -Force | Out-Null
}

$promptList = @(
    @{
        Id = 1
        Filename = "user_clip_01.wav"
        Category = "technical"
        TargetText = "We architected an idempotent event-driven pipeline using Apache Kafka and PostgreSQL with distributed consensus."
    },
    @{
        Id = 2
        Filename = "user_clip_02.wav"
        Category = "technical"
        TargetText = "The query optimization required creating composite B-tree indexes and caching frequently accessed session keys in Redis."
    },
    @{
        Id = 3
        Filename = "user_clip_03.wav"
        Category = "conversational"
        TargetText = "I collaborated closely with product managers and engineering teammates to prioritize our quarterly roadmap and mitigate delivery risks."
    },
    @{
        Id = 4
        Filename = "user_clip_04.wav"
        Category = "conversational"
        TargetText = "Whenever we encountered ambiguous system requirements, I initiated architectural design reviews to establish consensus before coding."
    },
    @{
        Id = 5
        Filename = "user_clip_05.wav"
        Category = "proper_noun"
        TargetText = "My name is Ankit Singh Tomar, interviewing for InterviewOS with Whisper, Ollama, Groq, Kubernetes, and Judge0 infrastructure."
    }
)

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host " InterviewOS - Human Microphone Acceptance Clip Recorder (H3)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Standing Protocol: Zero synthetic TTS. 5 real microphone clips recorded by repo owner." -ForegroundColor Yellow
Write-Host "Clips Directory: $ClipsDir"
Write-Host "Manifest File:   $ManifestPath`n"

$manifestEntries = @()

foreach ($item in $promptList) {
    $outPath = Join-Path $ClipsDir $item.Filename
    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "Clip $($item.Id) of 5 [$($item.Category.ToUpper())]: $($item.Filename)" -ForegroundColor Green
    Write-Host "Please read the following sentence clearly into your microphone:" -ForegroundColor White
    Write-Host "`n   ""$($item.TargetText)""`n" -ForegroundColor Yellow

    $alreadyExists = Test-Path $outPath
    if ($alreadyExists) {
        $existingSize = (Get-Item $outPath).Length
        Write-Host "Existing clip found: $outPath ($([math]::Round($existingSize / 1024, 1)) KB)" -ForegroundColor DarkCyan
        $choice = Read-Host "Keep existing [K] or Re-record [R]? (Default: K)"
        if ($choice -notmatch "^[rR]") {
            $manifestEntries += [PSCustomObject]@{
                filename = $item.Filename
                reference_text = $item.TargetText
                category = $item.Category
                notes = "human_mic_recording"
            }
            continue
        }
    }

    Write-Host "Press [ENTER] to START recording (speak for ~8-15 seconds)..." -ForegroundColor Magenta
    [void][System.Console]::ReadLine()

    # Open MCI waveaudio device, configure 16kHz 16-bit mono PCM
    [WinMicRecorder]::Send("open new type waveaudio alias userrec") | Out-Null
    [WinMicRecorder]::Send("set userrec bitspersample 16 channels 1 samplespersec 16000 bytespersec 32000 alignment 2") | Out-Null
    [WinMicRecorder]::Send("record userrec") | Out-Null

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host "RECORDING IN PROGRESS... Press [ENTER] when you finish speaking." -ForegroundColor Red
    [void][System.Console]::ReadLine()
    $sw.Stop()
    $durationSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)

    # Save to file
    [WinMicRecorder]::Send("save userrec `"$outPath`"") | Out-Null
    [WinMicRecorder]::Send("close userrec") | Out-Null

    if (Test-Path $outPath) {
        $fileSize = (Get-Item $outPath).Length
        Write-Host "Saved: $outPath ($([math]::Round($fileSize / 1024, 1)) KB, duration: ~$($durationSec)s)" -ForegroundColor Green
    } else {
        Write-Host "Error saving recording! Please verify mic permissions or drop WAV manually." -ForegroundColor Red
    }

    $customRef = Read-Host "Enter exact spoken words if different from prompt (or press ENTER to keep prompt)"
    $finalRef = if ([string]::IsNullOrWhiteSpace($customRef)) { $item.TargetText } else { $customRef.Trim() }

    $manifestEntries += [PSCustomObject]@{
        filename = $item.Filename
        reference_text = $finalRef
        category = $item.Category
        notes = "human_mic_recording"
    }
}

# Write manifest CSV
$csvLines = @(
    "# Source: Human microphone recordings by repo owner Ankit Singh Tomar ($((Get-Date).ToString('yyyy-MM-dd'))).",
    "# Acceptance evidence corpus for InterviewOS STT stream. Zero synthetic speech.",
    "filename,reference_text,category,notes"
)

foreach ($entry in $manifestEntries) {
    # Escape quotes
    $escapedRef = $entry.reference_text.Replace('"', '""')
    $csvLines += "$($entry.filename),""$escapedRef"",$($entry.category),$($entry.notes)"
}

$csvLines | Out-File -FilePath $ManifestPath -Encoding utf8

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host " Recording Complete! Manifest written to: $ManifestPath" -ForegroundColor Green
Write-Host " Next step: Run live evaluation harness on the human clips:" -ForegroundColor Yellow
Write-Host "   python scripts/eval/wer_eval.py --manifest scripts/eval/manifest_user.csv --clips-dir scripts/eval/clips_user --output scripts/eval/wer_report_user.json" -ForegroundColor White
Write-Host "================================================================================`n" -ForegroundColor Cyan
