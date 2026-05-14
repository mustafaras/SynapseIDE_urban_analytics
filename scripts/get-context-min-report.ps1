param(
  [int]$Top = 20,
  [int]$LargeSourceKb = 50,
  [int]$LargeDocsKb = 20
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")

Set-Location -LiteralPath $repoRoot

if (-not (Get-Command rg -ErrorAction SilentlyContinue)) {
  throw "ripgrep (rg) is required for this token-min context report."
}

$files = & rg --files

function New-FileMetric {
  param([string]$RelativePath)

  $item = Get-Item -LiteralPath (Join-Path $repoRoot $RelativePath)
  [pscustomobject]@{
    Path = ($RelativePath -replace "\\", "/")
    Length = $item.Length
    Kb = [math]::Round($item.Length / 1KB, 1)
  }
}

$docFiles = foreach ($file in $files) {
  if ($file -match "\.(md|json)$" -and $file -notmatch "(^|/)package-lock\.json$") {
    New-FileMetric -RelativePath $file
  }
}

$sourceFiles = foreach ($file in $files) {
  if ($file -match "\.(ts|tsx|js|jsx|css)$" -and $file -notmatch "(^|/)node_modules/") {
    New-FileMetric -RelativePath $file
  }
}

$largeDocs = @($docFiles | Where-Object { $_.Kb -ge $LargeDocsKb } | Sort-Object Length -Descending | Select-Object -First $Top)
$largeSource = @($sourceFiles | Where-Object { $_.Kb -ge $LargeSourceKb } | Sort-Object Length -Descending | Select-Object -First $Top)
$devPlanTotal = @($docFiles | Where-Object { $_.Path -like "DEVELOPMENT_PLANS/*" } | Measure-Object -Property Length -Sum)

Write-Output "# Context Min Report"
Write-Output ""
Write-Output ("Repo: {0}" -f $repoRoot)
Write-Output ("DEVELOPMENT_PLANS docs total: {0:n1} KB" -f (($devPlanTotal.Sum) / 1KB))
Write-Output ""
Write-Output "## First-read files"
Write-Output ""
Write-Output "- DEVELOPMENT_PLANS/CONTEXT_MIN.md"
Write-Output "- DEVELOPMENT_PLANS/CURRENT_TASK.json"
Write-Output "- DEVELOPMENT_PLANS/MODULE_INDEX.json when ownership is unclear"
Write-Output ""
Write-Output "## Largest docs"
Write-Output ""
foreach ($file in $largeDocs) {
  Write-Output ("- {0} ({1} KB)" -f $file.Path, $file.Kb)
}
Write-Output ""
Write-Output "## Largest source files"
Write-Output ""
foreach ($file in $largeSource) {
  Write-Output ("- {0} ({1} KB)" -f $file.Path, $file.Kb)
}
Write-Output ""
Write-Output "## Access rule"
Write-Output ""
Write-Output "Use rg for an exact prompt id, heading, component, export, or symbol before opening any file above the thresholds."
