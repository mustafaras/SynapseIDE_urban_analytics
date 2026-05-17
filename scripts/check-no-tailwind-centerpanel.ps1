Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$targetRoot = Join-Path $repoRoot 'src/centerpanel'

if (-not (Test-Path $targetRoot)) {
  Write-Error "Center Panel source directory not found: $targetRoot"
}

$sourceExtensions = @('.ts', '.tsx', '.js', '.jsx')
$literalClassPattern = 'class(Name)?\s*=\s*(["''])([^"'']*)\2'
$tailwindUtilityPattern = '(?i)(^|\s)((hover|focus|active|disabled|sm|md|lg|xl|2xl|dark):)?(container|flex|inline-flex|grid|block|hidden|items-[a-z0-9-]+|justify-[a-z0-9-]+|content-[a-z0-9-]+|self-[a-z0-9-]+|gap-[a-z0-9-]+|space-[xy]-[a-z0-9-]+|p[trblxy]?-[a-z0-9-]+|m[trblxy]?-[a-z0-9-]+|w-[a-z0-9-\[\]/.]+|h-[a-z0-9-\[\]/.]+|min-w-[a-z0-9-\[\]/.]+|max-w-[a-z0-9-\[\]/.]+|min-h-[a-z0-9-\[\]/.]+|max-h-[a-z0-9-\[\]/.]+|text-(xs|sm|base|lg|xl|[0-9a-z-\[\]/.]+)|font-(thin|light|normal|medium|semibold|bold|black)|leading-[a-z0-9-\[\]/.]+|tracking-[a-z0-9-\[\]/.]+|bg-[a-z0-9-\[\]/.#]+|border(-[a-z0-9-\[\]/.#]+)?|rounded(-[a-z0-9-\[\]/.]+)?|shadow(-[a-z0-9-\[\]/.]+)?|opacity-[a-z0-9-\[\]/.]+|z-[a-z0-9-\[\]/.]+|overflow-[a-z0-9-]+|absolute|relative|fixed|sticky|inset-[a-z0-9-\[\]/.]+|top-[a-z0-9-\[\]/.]+|right-[a-z0-9-\[\]/.]+|bottom-[a-z0-9-\[\]/.]+|left-[a-z0-9-\[\]/.]+)(?=$|\s)'

$findings = New-Object System.Collections.Generic.List[string]

Get-ChildItem -Path $targetRoot -Recurse -File |
  Where-Object { $sourceExtensions -contains $_.Extension } |
  ForEach-Object {
    $relativePath = Resolve-Path -Relative $_.FullName
    $lineNumber = 0

    Get-Content -Path $_.FullName | ForEach-Object {
      $lineNumber += 1
      $line = $_

      if ($line -match $literalClassPattern -and $Matches[3] -match $tailwindUtilityPattern) {
        $findings.Add("${relativePath}:${lineNumber}: $line")
      }
    }
  }

if ($findings.Count -gt 0) {
  Write-Host 'Tailwind-like utility classes found in src/centerpanel:' -ForegroundColor Red
  $findings | ForEach-Object { Write-Host $_ }
  exit 1
}

Write-Host 'No Tailwind-like utility classes found in src/centerpanel.'