# AI Interview OS — Rapid Dev Refresh Helper
# Recompiles only what changed and restarts target container(s) in seconds.
# Zero dependency re-downloads. Zero cache wipes. Zero database restarts.
param (
    [string]$Service = "all"
)

$ErrorActionPreference = "Stop"

function Refresh-SingleService {
    param ([string]$name)
    Write-Host "? Packaging $name..." -ForegroundColor Cyan
    mvn package -pl $name -DskipTests
    if ($LASTEXITCODE -ne 0) { throw "Maven build failed for $name" }
    
    Write-Host "?? Updating container $name..." -ForegroundColor Cyan
    docker compose up -d --no-deps --build $name
    Write-Host "? $name is updated and live!" -ForegroundColor Green
}

switch ($Service.ToLower()) {
    "frontend" {
        Write-Host "? Building frontend bundle..." -ForegroundColor Cyan
        npm --prefix frontend run build
        Write-Host "?? Updating frontend container..." -ForegroundColor Cyan
        docker compose up -d --no-deps --build frontend
        Write-Host "? Frontend updated and live at http://localhost:5173!" -ForegroundColor Green
    }
    "session" { Refresh-SingleService "interview-session-service" }
    "interview-session-service" { Refresh-SingleService "interview-session-service" }
    "report" { Refresh-SingleService "evaluation-report-service" }
    "evaluation-report-service" { Refresh-SingleService "evaluation-report-service" }
    "orchestrator" { Refresh-SingleService "ai-orchestrator-service" }
    "ai-orchestrator-service" { Refresh-SingleService "ai-orchestrator-service" }
    "gateway" { Refresh-SingleService "api-gateway-service" }
    "api-gateway-service" { Refresh-SingleService "api-gateway-service" }
    "questionbank" { Refresh-SingleService "question-bank-service" }
    "question-bank-service" { Refresh-SingleService "question-bank-service" }
    "proctor" { Refresh-SingleService "proctor-sentinel-service" }
    "proctor-sentinel-service" { Refresh-SingleService "proctor-sentinel-service" }
    "all" {
        Write-Host "? Incremental compile of all backend modules (no 'clean')..." -ForegroundColor Cyan
        mvn package -DskipTests
        if ($LASTEXITCODE -ne 0) { throw "Maven build failed" }
        
        Write-Host "?? Refreshing core microservice containers..." -ForegroundColor Cyan
        docker compose up -d --no-deps --build interview-session-service evaluation-report-service ai-orchestrator-service question-bank-service proctor-sentinel-service api-gateway-service
        Write-Host "? All backend microservices refreshed in seconds!" -ForegroundColor Green
    }
    default {
        Refresh-SingleService $Service
    }
}
