$base = "http://localhost:8080"
$script:pass = 0
$script:fail = 0
$script:created = @()

function Check($name, $actual, $expected) {
    if ("$actual" -eq "$expected") {
        $script:pass++
        Write-Host "PASS  $name" -ForegroundColor Green
    } else {
        $script:fail++
        Write-Host "FAIL  $name   (expected: $expected, got: $actual)" -ForegroundColor Red
    }
}

function CheckNum($name, $actual, $expected) {
    if ($null -ne $actual -and [math]::Abs([double]$actual - [double]$expected) -lt 0.06) {
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
function Day($offset) { (Get-Date).AddDays($offset).ToString("yyyy-MM-dd") }

function NewProject($name, $startOffset, $deadlineOffset, $budget) {
    $r = Api "Post" "/api/projects" $ah @{ name = "$name $stamp"; location = "Test Village"; description = "Demo test data"; totalBudget = $budget; startDate = (Day $startOffset); deadline = (Day $deadlineOffset); assignedEngineerId = $ravi.id }
    $id = (Json $r).id
    $script:created += $id
    $id
}
function AddProgress($id, $pct) { Api "Post" "/api/projects/$id/progress" $eh @{ completedPercentage = $pct } | Out-Null }
function AddExpense($id, $amount, $category, $dayOffset) {
    Api "Post" "/api/projects/$id/expenses" $eh @{ amount = $amount; category = $category; expenseDate = (Day $dayOffset); description = "Test data" } | Out-Null
}
function Dash($headers) { Json (Api "Get" "/api/dashboard" $headers) }
function Amt($map, $key) {
    if ($map.PSObject.Properties.Name -contains $key) { [double]$map.$key } else { 0 }
}

Write-Host "`n--- Setup ---"
$ah = Login "admin@smartroad.com" "Admin@12345"
$eh = Login "ravi@smartroad.com" "Engineer@123"
Api "Post" "/api/users/engineers" $ah @{ fullName = "Sita Devi"; email = "sita@smartroad.com"; password = "Engineer@123" } | Out-Null
$sh = Login "sita@smartroad.com" "Engineer@123"
$engineers = @((Invoke-WebRequest -Uri "$base/api/users/engineers" -Headers $ah).Content | ConvertFrom-Json)
$ravi = $engineers | Where-Object { $_.email -eq "ravi@smartroad.com" } | Select-Object -First 1
$stamp = Get-Date -Format "HHmmss"
$before = Dash $ah

Write-Host "`n--- Creating 4 known test projects ---"
$p1 = NewProject "Dash P1" -50 50 1000000
AddProgress $p1 40
AddExpense $p1 300000 "MATERIAL" -15
AddExpense $p1 200000 "LABOUR" -10
Api "Post" "/api/projects/$p1/milestones" $ah @{ title = "Dashboard test milestone"; targetDate = (Day 20) } | Out-Null

$p2 = NewProject "Dash P2" -80 -10 2000000
AddProgress $p2 30
AddExpense $p2 600000 "EQUIPMENT" -15

$p3 = NewProject "Dash P3" 10 100 500000

$p4 = NewProject "Dash P4" -100 -5 800000
AddProgress $p4 100
AddExpense $p4 400000 "MATERIAL" -20

$after = Dash $ah
$b = $before.summary
$a = $after.summary

Write-Host "`n--- Admin summary cards (changes caused by the 4 test projects) ---"
CheckNum "total projects +4" ($a.totalProjects - $b.totalProjects) 4
CheckNum "not started +1" ($a.notStarted - $b.notStarted) 1
CheckNum "in progress +1" ($a.inProgress - $b.inProgress) 1
CheckNum "delayed +1" ($a.delayed - $b.delayed) 1
CheckNum "completed +1" ($a.completed - $b.completed) 1
CheckNum "total budget +4300000" ($a.totalBudget - $b.totalBudget) 4300000
CheckNum "total expenditure +1500000" ($a.totalExpenditure - $b.totalExpenditure) 1500000
CheckNum "remaining budget +2800000" ($a.remainingBudget - $b.remainingBudget) 2800000
CheckNum "projects requiring attention +1" ($a.projectsRequiringAttention - $b.projectsRequiringAttention) 1
CheckNum "high-risk projects +1" ($a.highRiskProjects - $b.highRiskProjects) 1
Check "status distribution matches the cards" $after.statusDistribution.COMPLETED $a.completed

Write-Host "`n--- Project rows (chart data) ---"
$r1 = $after.projects | Where-Object { $_.projectId -eq $p1 } | Select-Object -First 1
CheckNum "P1 planned progress = 50" $r1.plannedProgress 50
CheckNum "P1 actual progress = 40" $r1.completedPercentage 40
CheckNum "P1 budget utilization = 50" $r1.budgetUtilizationPercent 50
CheckNum "P1 health index = 86" $r1.healthIndex 86
Check "P1 category = Healthy" $r1.healthCategory "Healthy"
Check "P1 engineer name is included" $r1.assignedEngineerName "Ravi Kumar"
$r2 = $after.projects | Where-Object { $_.projectId -eq $p2 } | Select-Object -First 1
Check "P2 status = DELAYED" $r2.status "DELAYED"
CheckNum "P2 health index = 42" $r2.healthIndex 42
Check "P2 category = Critical" $r2.healthCategory "Critical"
$r4 = $after.projects | Where-Object { $_.projectId -eq $p4 } | Select-Object -First 1
Check "P4 status = COMPLETED" $r4.status "COMPLETED"

Write-Host "`n--- Expense distribution ---"
CheckNum "MATERIAL +700000" ((Amt $after.expenseDistribution "MATERIAL") - (Amt $before.expenseDistribution "MATERIAL")) 700000
CheckNum "LABOUR +200000" ((Amt $after.expenseDistribution "LABOUR") - (Amt $before.expenseDistribution "LABOUR")) 200000
CheckNum "EQUIPMENT +600000" ((Amt $after.expenseDistribution "EQUIPMENT") - (Amt $before.expenseDistribution "EQUIPMENT")) 600000

Write-Host "`n--- Timeline, updates, milestones, alerts, recommendations ---"
$s1 = $after.progressTimeline | Where-Object { $_.projectId -eq $p1 } | Select-Object -First 1
Check "P1 progress timeline has 1 point" @($s1.points).Count 1
CheckNum "P1 timeline point = 40%" @($s1.points)[0].percentage 40
Check "recent updates are returned (max 10)" ((@($after.recentUpdates).Count -gt 0) -and (@($after.recentUpdates).Count -le 10)) $true
$pm = @($after.pendingMilestones | Where-Object { $_.projectId -eq $p1 })
Check "pending milestone of P1 is listed" $pm.Count 1
Check "pending milestone is not overdue" $pm[0].overdue $false
Check "high-risk alert of P2 is listed" (@($after.alerts | Where-Object { $_.projectId -eq $p2 -and $_.ruleCode -eq "DELAY_OVERDUE" }).Count) 1
Check "alerts are sorted with HIGH first" @($after.alerts)[0].severity "HIGH"
Check "recommendation of P2 is listed" (@($after.recommendations | Where-Object { $_.projectId -eq $p2 -and $_.ruleCode -eq "REC_OVERDUE_REVIEW" }).Count) 1
Check "positive messages are not in the list" (@($after.recommendations | Where-Object { $_.type -eq "POSITIVE" }).Count) 0

Write-Host "`n--- Engineer dashboards ---"
$ed = Dash $eh
$er1 = $ed.projects | Where-Object { $_.projectId -eq $p1 } | Select-Object -First 1
CheckNum "assigned engineer sees P1 expenditure = 500000" $er1.totalExpenditure 500000
CheckNum "assigned engineer sees P1 remaining = 500000" $er1.remainingBudget 500000
$sd = Dash $sh
Check "engineer without projects: 0 projects" $sd.summary.totalProjects 0
Check "engineer without projects: empty project list" @($sd.projects).Count 0
Check "engineer without projects: empty alert list" @($sd.alerts).Count 0
Check "engineer without projects: zero budget" ([double]$sd.summary.totalBudget) 0
Check "request without token is rejected" (Api "Get" "/api/dashboard" $null).StatusCode 401

Write-Host "`n--- Cleanup ---"
$codes = foreach ($id in $script:created) { (Api "Delete" "/api/projects/$id" $ah).StatusCode }
Check "all test projects deleted" (($codes | Sort-Object -Unique) -join ",") "204"
$final = Dash $ah
Check "totals return to the starting value" $final.summary.totalProjects $b.totalProjects

Write-Host ""
Write-Host "Done: $($script:pass) passed, $($script:fail) failed"