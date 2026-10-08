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
    $script:created += (Json $r).id
    (Json $r).id
}
function AddProgress($id, $pct) { Api "Post" "/api/projects/$id/progress" $eh @{ completedPercentage = $pct } | Out-Null }
function AddExpense($id, $amount, $category, $dayOffset) {
    Api "Post" "/api/projects/$id/expenses" $eh @{ amount = $amount; category = $category; expenseDate = (Day $dayOffset); description = "Test data" } | Out-Null
}
function Health($id) { Json (Api "Get" "/api/projects/$id/health" $ah) }

Write-Host "`n--- Setup ---"
$ah = Login "admin@smartroad.com" "Admin@12345"
$eh = Login "ravi@smartroad.com" "Engineer@123"
Api "Post" "/api/users/engineers" $ah @{ fullName = "Sita Devi"; email = "sita@smartroad.com"; password = "Engineer@123" } | Out-Null
$sh = Login "sita@smartroad.com" "Engineer@123"
$engineers = @((Invoke-WebRequest -Uri "$base/api/users/engineers" -Headers $ah).Content | ConvertFrom-Json)
$ravi = $engineers | Where-Object { $_.email -eq "ravi@smartroad.com" } | Select-Object -First 1
$stamp = Get-Date -Format "HHmmss"
$script:created = @()

Write-Host "`n--- Case 1: slightly behind plan (planned 50, actual 40, 50% spent) ---"
$c1 = NewProject "Health case 1" -50 50 1000000
AddProgress $c1 40
AddExpense $c1 300000 "MATERIAL" -15
AddExpense $c1 200000 "LABOUR" -10
$h = Health $c1
CheckNum "planned progress = 50" $h.plannedProgress 50
CheckNum "progress score = 80" $h.progressScore 80
CheckNum "schedule score = 90" $h.scheduleScore 90
CheckNum "budget score = 90" $h.budgetScore 90
CheckNum "health index = 86" $h.healthIndex 86
Check "category = HEALTHY" $h.category "HEALTHY"
Check "label = Healthy" $h.categoryLabel "Healthy"
Check "explanation factors are returned (3)" @($h.factors).Count 3

Write-Host "`n--- Budget analysis for case 1 ---"
$b = Json (Api "Get" "/api/projects/$c1/budget-analysis" $ah)
CheckNum "utilization = 50" $b.analysis.utilizationPercent 50
CheckNum "remaining budget = 500000" $b.analysis.remainingBudget 500000
CheckNum "planned expenditure = 500000" $b.analysis.plannedExpenditure 500000
CheckNum "budget variance = 0" $b.analysis.budgetVariance 0
CheckNum "earned value = 400000" $b.analysis.earnedValue 400000
CheckNum "cost efficiency index = 0.8" $b.analysis.costEfficiencyIndex 0.8
Check "budget status = SPENDING_AHEAD_OF_WORK (50% spent, 40% done)" $b.analysis.status "SPENDING_AHEAD_OF_WORK"
Check "risk wording says indicator, not confirmed problem" ($b.analysis.interpretation -like "*not a confirmed financial problem*") $true
CheckNum "MATERIAL total = 300000" $b.expenseByCategory.MATERIAL 300000
CheckNum "LABOUR total = 200000" $b.expenseByCategory.LABOUR 200000

Write-Host "`n--- Case 2: overdue and far behind ---"
$c2 = NewProject "Health case 2" -80 -10 1000000
AddProgress $c2 30
AddExpense $c2 900000 "MATERIAL" -15
$h = Health $c2
CheckNum "planned progress = 100" $h.plannedProgress 100
CheckNum "progress score = 30" $h.progressScore 30
CheckNum "schedule score = 0" $h.scheduleScore 0
CheckNum "budget score = 0" $h.budgetScore 0
CheckNum "health index = 12" $h.healthIndex 12
Check "category = CRITICAL" $h.category "CRITICAL"
Check "overdue note is present" ((($h.notes -join " ") -like "*deadline passed*")) $true

Write-Host "`n--- Case 3: project that has not started ---"
$c3 = NewProject "Health case 3" 10 100 1000000
$h = Health $c3
CheckNum "planned progress = 0" $h.plannedProgress 0
CheckNum "health index = 100" $h.healthIndex 100
Check "category = HEALTHY" $h.category "HEALTHY"
Check "not-started note is present" ((($h.notes -join " ") -like "*not started*")) $true

Write-Host "`n--- Case 4: completed project ---"
$c4 = NewProject "Health case 4" -100 -5 1000000
AddProgress $c4 100
AddExpense $c4 800000 "MATERIAL" -20
$h = Health $c4
CheckNum "health index = 100" $h.healthIndex 100
Check "category = HEALTHY" $h.category "HEALTHY"
$b = Json (Api "Get" "/api/projects/$c4/budget-analysis" $ah)
Check "budget status = WITHIN_PLAN (80% spent, 100% done)" $b.analysis.status "WITHIN_PLAN"

Write-Host "`n--- Case 5: spending above the whole budget ---"
$c5 = NewProject "Health case 5" -50 50 1000000
AddProgress $c5 50
AddExpense $c5 1200000 "MATERIAL" -15
$h = Health $c5
CheckNum "progress score = 100" $h.progressScore 100
CheckNum "schedule score = 100" $h.scheduleScore 100
CheckNum "budget score = 0" $h.budgetScore 0
CheckNum "health index = 70" $h.healthIndex 70
Check "category = NEEDS_ATTENTION" $h.category "NEEDS_ATTENTION"
$b = Json (Api "Get" "/api/projects/$c5/budget-analysis" $ah)
Check "budget status = OVER_BUDGET" $b.analysis.status "OVER_BUDGET"
CheckNum "remaining budget = -200000" $b.analysis.remainingBudget -200000

Write-Host "`n--- Case 6: one overdue milestone ---"
$c6 = NewProject "Health case 6" -50 50 1000000
AddProgress $c6 40
AddExpense $c6 500000 "MATERIAL" -15
$r = Api "Post" "/api/projects/$c6/milestones" $ah @{ title = "Overdue test milestone"; targetDate = (Day -5) }
Check "overdue milestone created" $r.StatusCode 201
$h = Health $c6
CheckNum "schedule score = 80" $h.scheduleScore 80
CheckNum "health index = 83" $h.healthIndex 83
Check "category = HEALTHY" $h.category "HEALTHY"

Write-Host "`n--- Case 7: progress but zero expenses ---"
$c7 = NewProject "Health case 7" -50 50 1000000
AddProgress $c7 20
$h = Health $c7
CheckNum "progress score = 40" $h.progressScore 40
CheckNum "schedule score = 50" $h.scheduleScore 50
CheckNum "budget score = 100" $h.budgetScore 100
CheckNum "health index = 61" $h.healthIndex 61
Check "category = NEEDS_ATTENTION" $h.category "NEEDS_ATTENTION"
Check "missing-expenses note is present" ((($h.notes -join " ") -like "*No expenses*")) $true

Write-Host "`n--- Access control ---"
Check "unassigned engineer cannot read health" (Api "Get" "/api/projects/$c1/health" $sh).StatusCode 403
Check "unassigned engineer cannot read budget analysis" (Api "Get" "/api/projects/$c1/budget-analysis" $sh).StatusCode 403
Check "assigned engineer can read health" (Api "Get" "/api/projects/$c1/health" $eh).StatusCode 200
Check "request without token is rejected" (Api "Get" "/api/projects/$c1/health" $null).StatusCode 401
Check "missing project returns 404" (Api "Get" "/api/projects/999999/health" $ah).StatusCode 404

Write-Host "`n--- Summary endpoint ---"
$sum = @((Api "Get" "/api/analytics/health-summary" $ah).Content | ConvertFrom-Json)
Check "admin summary lists all 7 test projects" (@($sum | Where-Object { $created -contains $_.projectId }).Count) 7
$item = $sum | Where-Object { $_.projectId -eq $c1 } | Select-Object -First 1
CheckNum "summary value matches single-project value (case 1)" $item.healthIndex 86
Check "unassigned engineer summary is empty" @((Api "Get" "/api/analytics/health-summary" $sh).Content | ConvertFrom-Json).Count 0

Write-Host "`n--- Cleanup ---"
foreach ($id in $created) { Api "Delete" "/api/projects/$id" $ah | Out-Null }
Check "test project removed" (Api "Get" "/api/projects/$c1" $ah).StatusCode 404

Write-Host ""
Write-Host "Done: $($script:pass) passed, $($script:fail) failed"