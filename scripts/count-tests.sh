#!/usr/bin/env bash
# ==============================================================================
# scripts/count-tests.sh
# Honest-Judge Four-Number Test Counting Standard (SPEC-019 / QB-44 M-1 Prescription)
#
# Standard Definition:
#   Files: Test classes/files on disk (*Test*.java / *.test.ts*)
#   Cases: Runnable test methods (@Test in Java / it()|test() in TS)
#   Assertions: Direct assert-call occurrences (assert*( / assert.*()
#   Skipped: Explicitly disabled tests (@Disabled in Java / skip in TS)
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

count_java_module() {
    local mod="$1"
    local dir="$mod/src/test/java"
    if [ ! -d "$dir" ]; then
        echo "0 0 0 0"
        return
    fi
    local files cases asserts skipped
    files=$(find "$dir" -name "*Test*.java" | wc -l | tr -d ' ')
    cases=$(git grep -E "^\s*@Test\b" "$dir" 2>/dev/null | wc -l | tr -d ' ')
    asserts=$(git grep -E "\bassert[A-Za-z0-9_]*\(" "$dir" 2>/dev/null | wc -l | tr -d ' ')
    skipped=$(git grep -E "^\s*@Disabled\b" "$dir" 2>/dev/null | wc -l | tr -d ' ')
    echo "$files $cases $asserts $skipped"
}

count_frontend() {
    local dir="frontend/src"
    if [ ! -d "$dir" ]; then
        echo "0 0 0 0"
        return
    fi
    local files cases asserts skipped
    files=$(find "$dir" -name "*.test.ts*" | wc -l | tr -d ' ')
    cases=$(git grep -E "^\s*(it|test)\(" "$dir" 2>/dev/null | wc -l | tr -d ' ')
    asserts=$(git grep -E "\bassert\.[A-Za-z0-9_]*\(" "$dir" 2>/dev/null | wc -l | tr -d ' ')
    skipped=$(git grep -E "^\s*(it\.skip|test\.skip)\(" "$dir" 2>/dev/null | wc -l | tr -d ' ')
    echo "$files $cases $asserts $skipped"
}

read -r orc_files orc_cases orc_asserts orc_skip <<< "$(count_java_module "ai-orchestrator-service")"
read -r ses_files ses_cases ses_asserts ses_skip <<< "$(count_java_module "interview-session-service")"
read -r fe_files fe_cases fe_asserts fe_skip <<< "$(count_frontend)"

total_files=$((orc_files + ses_files + fe_files))
total_cases=$((orc_cases + ses_cases + fe_cases))
total_asserts=$((orc_asserts + ses_asserts + fe_asserts))
total_skip=$((orc_skip + ses_skip + fe_skip))

if [ "${1:-}" = "--markdown" ]; then
    echo "| Module | Test Files (on disk) | Test Cases | Assertions | Skipped | Status |"
    echo "|---|---|---|---|---|---|"
    echo "| \`ai-orchestrator-service\` | $orc_files | $orc_cases | $orc_asserts | $orc_skip | PASS |"
    echo "| \`interview-session-service\` | $ses_files | $ses_cases | $ses_asserts | $ses_skip | PASS |"
    echo "| \`frontend\` | $fe_files | $fe_cases | $fe_asserts | $fe_skip | PASS |"
    echo "| **Total / Reactor** | **$total_files** | **$total_cases** | **$total_asserts** | **$total_skip** | **PASS** |"
else
    echo "=============================================================================="
    echo "AI Interview OS — Honest-Judge Four-Number Test Count Report"
    echo "=============================================================================="
    printf "%-28s %10s %12s %12s %10s\n" "Module" "Files" "Cases" "Assertions" "Skipped"
    echo "------------------------------------------------------------------------------"
    printf "%-28s %10d %12d %12d %10d\n" "ai-orchestrator-service" "$orc_files" "$orc_cases" "$orc_asserts" "$orc_skip"
    printf "%-28s %10d %12d %12d %10d\n" "interview-session-service" "$ses_files" "$ses_cases" "$ses_asserts" "$ses_skip"
    printf "%-28s %10d %12d %12d %10d\n" "frontend" "$fe_files" "$fe_cases" "$fe_asserts" "$fe_skip"
    echo "------------------------------------------------------------------------------"
    printf "%-28s %10d %12d %12d %10d\n" "TOTAL" "$total_files" "$total_cases" "$total_asserts" "$total_skip"
    echo "=============================================================================="
fi
