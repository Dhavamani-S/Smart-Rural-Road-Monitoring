param([Parameter(Mandatory = $true)][string]$DemoPassword)

$base = "http://localhost:8080"
$script:pass = 0
$script:fail = 0

function Check($name, $actual, $expected) {
    if ("$actual" -eq "$expected") {
        $script:pass++
        Write-Host "PASS  $name" -ForegroundColor Green
    } else {
        $script:fail++
        Write-Host "FAIL  $name   (expected: $expected, got: $actual)" -ForegroundColor Red
    }
}

function Api($method, $path, $headers, $body) {
    $p = @{ Uri = "$base$path"; Method = $method; SkipHttpErrorCheck = $true; ContentType = "application/json" }
    if ($headers) { $p.Headers = $headers }
    if ($body) { $p.Body = ($body | ConvertTo-Json) }
    Invoke-WebRequest @p
}

function Login($email, $password) {
    $r = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body (@{ email = $email; password = $password } | ConvertTo-Json)
    @{ Authorization = "Bearer $($r.token)" }
}

function Json($response) { $response.Content | ConvertFrom-Json }
function Has($list, $code) { (@($list | Where-Object { $_.ruleCode -eq $code }).Count -gt 0) }

$ah = Login "admin@smartroad.com" "Admin@12345"
$dash = Json (Api "Get" "/api/dashboard" $ah)
function Row($part) { @($dash.projects | Where-Object { $_.name -like "*$part*" })[0] }
function Eval($row) { Json (Api "Get" "/api/projects/$($row.projectId)/evaluation" $ah) }

Write-Host "`n--- Demo projects ---"
Check "7 demo projects exist" @($dash.projects | Where-Object { $_.name.StartsWith("[DEMO]") }).Count 7

$d1 = Row "Village A to Highway"
$e = Eval $d1
Check "D1 on track: status IN_PROGRESS" $d1.status "IN_PROGRESS"
Check "D1 on track: category Healthy" $d1.healthCategory "Healthy"
Check "D1 on track: no alerts" @($e.alerts).Count 0

$d2 = Row "Bridge Approach"
$e = Eval $d2
Check "D2 behind schedule: status DELAYED" $d2.status "DELAYED"
Check "D2 behind schedule: Needs Attention" $d2.healthCategory "Needs Attention"
Check "D2 has the progress gap alert" (Has $e.alerts "DELAY_PROGRESS_GAP") $true
Check "D2 has the overdue milestone alert" (Has $e.alerts "DELAY_MILESTONE") $true

$d3 = Row "Market Link"
$e = Eval $d3
Check "D3 overdue: status DELAYED" $d3.status "DELAYED"
Check "D3 overdue: category Critical" $d3.healthCategory "Critical"
Check "D3 deadline alert is HIGH" (@($e.alerts | Where-Object { $_.ruleCode -eq "DELAY_OVERDUE" })[0].severity) "HIGH"

$d4 = Row "School Access"
$e = Eval $d4
Check "D4 overspending: status IN_PROGRESS" $d4.status "IN_PROGRESS"
Check "D4 overspending: Needs Attention" $d4.healthCategory "Needs Attention"
Check "D4 budget alert is HIGH" (@($e.alerts | Where-Object { $_.ruleCode -eq "BUDGET_AHEAD" })[0].severity) "HIGH"
Check "D4 near-limit alert" (Has $e.alerts "BUDGET_NEAR_LIMIT") $true

$d5 = Row "Hamlet Connector"
$e = Eval $d5
Check "D5 completed: status COMPLETED" $d5.status "COMPLETED"
Check "D5 completed: category Healthy" $d5.healthCategory "Healthy"
Check "D5 completed: no alerts" @($e.alerts).Count 0

$d6 = Row "Panchayat Road"
$e = Eval $d6
Check "D6 not started: status NOT_STARTED" $d6.status "NOT_STARTED"
Check "D6 not started: no alerts" @($e.alerts).Count 0

$d7 = Row "Hill Road"
$e = Eval $d7
Check "D7 paused: status ON_HOLD" $d7.status "ON_HOLD"
Check "D7 paused: no alerts" @($e.alerts).Count 0
Check "D7 paused: monitoring recommendation" (Has $e.recommendations "REC_MONITOR") $true

Write-Host "`n--- Charts data ---"
$series = $dash.progressTimeline | Where-Object { $_.projectId -eq $d1.projectId } | Select-Object -First 1
Check "D1 progress timeline has 6 points" @($series.points).Count 6
foreach ($c in "MATERIAL", "LABOUR", "EQUIPMENT", "TRANSPORT", "PERMITS", "OTHER") {
    Check "expense category $c is present" ($dash.expenseDistribution.PSObject.Properties.Name -contains $c) $true
}

Write-Host "`n--- Demo engineers ---"
$h1 = Login "demo.engineer1@smartroad.com" $DemoPassword
$h2 = Login "demo.engineer2@smartroad.com" $DemoPassword
Check "engineer one sees 4 projects" (Json (Api "Get" "/api/dashboard" $h1)).summary.totalProjects 4
Check "engineer two sees 3 projects" (Json (Api "Get" "/api/dashboard" $h2)).summary.totalProjects 3

Write-Host ""
Write-Host "Done: $($script:pass) passed, $($script:fail) failed"