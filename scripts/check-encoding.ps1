$ErrorActionPreference = "Stop"

$root = "src"
$extensions = "*.ts","*.tsx","*.js","*.jsx","*.css","*.html","*.md","*.json"

$badTokens = @(
  "�",  # Replacement character
  "ↁE"  # Known mojibake artifact in this repo
)

$files = Get-ChildItem -Path $root -Recurse -File -Include $extensions
$bad = @()

foreach ($f in $files) {
  $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  foreach ($token in $badTokens) {
    if ($text.Contains($token)) {
      $bad += $f.FullName
      break
    }
  }
}

if ($bad.Count -gt 0) {
  Write-Host "Encoding check failed. Found mojibake in:"
  $bad | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Encoding check passed."
