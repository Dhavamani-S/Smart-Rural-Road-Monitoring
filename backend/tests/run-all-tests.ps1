param([string]$DemoPassword)

$dir = $PSScriptRoot
$scripts = @(
    "test-progress-expenses.ps1",
    "test-photos.ps1",
    "test-health-budget.ps1",
    "test-alerts-recommendations.ps1",
    "test-dashboard.ps1",
    "test-search-report-workflow.ps1"
)
$totalPass = 0
$totalFail = 0

function Run-Script($file, $extraArgs) {
    Write-Host "`n=== $file ===" -ForegroundColor Cyan
    $output = & pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $dir $file) @extraArgs 2>&1
    $done = $output | Where-Object { "$_" -match '^Done:' } | Select-Object -Last 1
    if ("$done" -match 'Done: (\d+) passed, (\d+) failed') {
        $script:totalPass += [int]$Matches[1]
        $script:totalFail += [int]$Matches[2]
        Write-Host "$done"
    } else {
        $script:totalFail++
        Write-Host "No result line - the script stopped early. Last output:" -ForegroundColor Red
        $output | Select-Object -Last 5 | ForEach-Object { Write-Host "$_" }
    }
    $output | Where-Object { "$_" -match '^FAIL' } | ForEach-Object { Write-Host "$_" -ForegroundColor Red }
}

foreach ($s in $scripts) { Run-Script $s @() }
if ($DemoPassword) { Run-Script "test-demo-data.ps1" @("-DemoPassword", $DemoPassword) }

Write-Host ""
Write-Host "TOTAL: $totalPass passed, $totalFail failed" -ForegroundColor Cyan