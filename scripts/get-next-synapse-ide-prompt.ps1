param(
  [string]$ManifestPath,
  [string]$LedgerPath,
  [switch]$Json
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")

if (-not $ManifestPath) {
  $ManifestPath = Join-Path $repoRoot "DEVELOPMENT_PLANS\SYNAPSE_IDE_PROMPT_MANIFEST.json"
}

if (-not $LedgerPath) {
  $LedgerPath = Join-Path $repoRoot "DEVELOPMENT_PLANS\SYNAPSE_IDE_IMPLEMENTATION_LEDGER.md"
}

if (-not (Test-Path -LiteralPath $ManifestPath)) {
  throw "Manifest not found: $ManifestPath"
}

if (-not (Test-Path -LiteralPath $LedgerPath)) {
  throw "Ledger not found: $LedgerPath"
}

$manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$ledger = Get-Content -LiteralPath $LedgerPath -Raw

$minimalContextDocuments = @(
  "DEVELOPMENT_PLANS/CONTEXT_MIN.md",
  "DEVELOPMENT_PLANS/CURRENT_TASK.json"
)

if ($manifest.PSObject.Properties.Name -contains "minimalContextDocuments") {
  $minimalContextDocuments = @($manifest.minimalContextDocuments)
}

$validDoneStatuses = @("completed", "skipped_with_reason")
$ledgerStatuses = @{}

$registerMatch = [regex]::Match(
  $ledger,
  "(?ms)^## Prompt Status Register\s*(?<body>.*?)(?=^## |\z)"
)

if ($registerMatch.Success) {
  $body = $registerMatch.Groups["body"].Value
  foreach ($line in ($body -split "`r?`n")) {
    if ($line -match "^\|\s*(\d{2})\s*\|[^|]*\|\s*([a-z_]+)\s*\|") {
      $ledgerStatuses[$matches[1]] = $matches[2].ToLowerInvariant()
    }
  }
}

function Get-StatusForPrompt {
  param($Prompt)

  $id = [string]$Prompt.id
  if ($ledgerStatuses.ContainsKey($id)) {
    return $ledgerStatuses[$id]
  }

  if ($Prompt.status) {
    return ([string]$Prompt.status).ToLowerInvariant()
  }

  return "pending"
}

$next = $null
$blockedBeforeNext = @()

foreach ($prompt in $manifest.prompts) {
  $status = Get-StatusForPrompt -Prompt $prompt

  if ($status -eq "blocked") {
    $blockedBeforeNext += $prompt
    $next = $prompt
    break
  }

  if ($validDoneStatuses -notcontains $status) {
    $next = $prompt
    break
  }
}

if (-not $next) {
  $result = [ordered]@{
    module = $manifest.module
    status = "all_completed"
    message = "All Synapse IDE prompts are completed or skipped with reason."
    nextPrompt = $null
    minimalContextDocuments = $minimalContextDocuments
  }
} else {
  $nextStatus = Get-StatusForPrompt -Prompt $next
  $result = [ordered]@{
    module = $manifest.module
    status = "next_prompt_found"
    nextPrompt = [ordered]@{
      id = $next.id
      title = $next.title
      status = $nextStatus
      dependsOn = $next.dependsOn
      promptHeading = $next.promptHeading
      promptFilePath = $manifest.promptFilePath
      ledgerPath = $manifest.ledgerPath
      handoffTemplatePath = $manifest.handoffTemplatePath
      primaryOutcome = $next.primaryOutcome
      validation = $next.validation
    }
    minimalContextDocuments = $minimalContextDocuments
    canonicalDocuments = $manifest.canonicalDocuments
    canonicalAccess = "Search these files only for the active prompt id, heading, status row, or named section. Do not read them fully by default."
  }
}

if ($Json) {
  $result | ConvertTo-Json -Depth 8
  exit 0
}

if ($result.status -eq "all_completed") {
  Write-Host $result.message
  exit 0
}

Write-Host "Next Synapse IDE prompt:"
Write-Host ("  Prompt {0} - {1}" -f $result.nextPrompt.id, $result.nextPrompt.title)
Write-Host ("  Status: {0}" -f $result.nextPrompt.status)
Write-Host ("  Prompt file: {0}" -f $result.nextPrompt.promptFilePath)
Write-Host ("  Heading: {0}" -f $result.nextPrompt.promptHeading)
Write-Host ("  Ledger: {0}" -f $result.nextPrompt.ledgerPath)
Write-Host ""
Write-Host "Minimal startup documents:"
foreach ($doc in $result.minimalContextDocuments) {
  Write-Host ("  - {0}" -f $doc)
}
Write-Host ""
Write-Host "Canonical documents are authoritative but should be searched, not read fully by default."
