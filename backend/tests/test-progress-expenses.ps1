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
function Day($offset) { (Get-Date).AddDays($offset).ToString("yyyy-MM-dd") }

Write-Host "`n--- Setup ---"
$ah = Login "admin@smartroad.com" "Admin@12345"
$eh = Login "ravi@smartroad.com" "Engineer@123"
$engineers = @((Invoke-WebRequest -Uri "$base/api/users/engineers" -Headers $ah).Content | ConvertFrom-Json)
$ravi = $engineers | Where-Object { $_.email -eq "ravi@smartroad.com" } | Select-Object -First 1
Check "Ravi engineer account found" ($null -ne $ravi) $true

$pname = "Step5 Test " + (Get-Date -Format "HHmmss")
$r = Api "Post" "/api/projects" $ah @{ name = $pname; location = "Test Village"; description = "Demo test data"; totalBudget = 6000000; startDate = (Day -30); deadline = (Day 180); assignedEngineerId = $ravi.id }
Check "admin creates test project" $r.StatusCode 201
$proj = (Json $r).id

Write-Host "`n--- Milestones ---"
$r = Api "Post" "/api/projects/$proj/milestones" $ah @{ title = "Site clearing and earthwork"; targetDate = (Day 10) }
Check "admin creates milestone 1" $r.StatusCode 201
$m1 = (Json $r).id
$r = Api "Post" "/api/projects/$proj/milestones" $ah @{ title = "Base layer and drainage"; targetDate = (Day 90) }
Check "admin creates milestone 2" $r.StatusCode 201
$m2 = (Json $r).id
$r = Api "Post" "/api/projects/$proj/milestones" $ah @{ title = "Too late"; targetDate = (Day 400) }
Check "milestone outside project dates is rejected" $r.StatusCode 400
$r = Api "Post" "/api/projects/$proj/milestones" $ah @{ title = "site clearing and earthwork"; targetDate = (Day 20) }
Check "duplicate milestone title is rejected" $r.StatusCode 400
$r = Api "Post" "/api/projects/$proj/milestones" $eh @{ title = "Engineer attempt"; targetDate = (Day 20) }
Check "engineer cannot create milestone" $r.StatusCode 403

Write-Host "`n--- Progress ---"
$r = Api "Post" "/api/projects/$proj/progress" $eh @{ completedPercentage = 30; remarks = "Earthwork finished on first 2 km" }
Check "engineer records 30% progress" $r.StatusCode 201
$r = Api "Post" "/api/projects/$proj/progress" $eh @{ completedPercentage = 20 }
Check "lower progress is rejected" $r.StatusCode 400
$r = Api "Post" "/api/projects/$proj/progress" $eh @{ completedPercentage = 101 }
Check "progress above 100 is rejected" $r.StatusCode 400
$r = Api "Post" "/api/projects/$proj/progress" $ah @{ completedPercentage = 40 }
Check "admin cannot record progress" $r.StatusCode 403
$p = Json (Api "Get" "/api/projects/$proj" $eh)
Check "project completedPercentage = 30" $p.completedPercentage 30
Check "status auto-changed to IN_PROGRESS" $p.status "IN_PROGRESS"

Write-Host "`n--- Expenses ---"
$r = Api "Post" "/api/projects/$proj/expenses" $eh @{ amount = 500000; category = "MATERIAL"; expenseDate = (Day -15); description = "Test data: gravel and bitumen" }
Check "expense 1 saved" $r.StatusCode 201
$r = Api "Post" "/api/projects/$proj/expenses" $eh @{ amount = 250000; category = "LABOUR"; expenseDate = (Day -10); description = "Test data: crew wages" }
Check "expense 2 saved" $r.StatusCode 201
$r = Api "Post" "/api/projects/$proj/expenses" $eh @{ amount = -5; category = "MATERIAL"; expenseDate = (Day -15) }
Check "negative amount is rejected" $r.StatusCode 400
$r = Api "Post" "/api/projects/$proj/expenses" $eh @{ amount = 100; category = "MATERIAL"; expenseDate = (Day 365) }
Check "future expense date is rejected" $r.StatusCode 400
$r = Api "Post" "/api/projects/$proj/expenses" $eh @{ amount = 100; category = "MATERIAL"; expenseDate = (Day -60) }
Check "expense before project start is rejected" $r.StatusCode 400
$r = Api "Post" "/api/projects/$proj/expenses" $ah @{ amount = 100; category = "MATERIAL"; expenseDate = (Day -15) }
Check "admin cannot record expenses" $r.StatusCode 403
$p = Json (Api "Get" "/api/projects/$proj" $eh)
Check "totalExpenditure = 750000" ([double]$p.totalExpenditure) 750000
Check "remainingBudget = 5250000" ([double]$p.remainingBudget) 5250000
Check "budgetUtilizationPercent = 12.5" ([double]$p.budgetUtilizationPercent) 12.5

Write-Host "`n--- Completing milestones ---"
$r = Api "Patch" "/api/projects/$proj/milestones/$m1/complete" $eh
Check "engineer completes milestone 1" $r.StatusCode 200
$r = Api "Patch" "/api/projects/$proj/milestones/$m1/complete" $eh
Check "completing twice is rejected" $r.StatusCode 400
$r = Api "Patch" "/api/projects/$proj/milestones/$m2/complete" $ah
Check "admin cannot complete milestones" $r.StatusCode 403

Write-Host "`n--- Histories (admin) ---"
Check "progress history has 1 entry" @((Api "Get" "/api/projects/$proj/progress" $ah).Content | ConvertFrom-Json).Count 1
Check "expense history has 2 entries" @((Api "Get" "/api/projects/$proj/expenses" $ah).Content | ConvertFrom-Json).Count 2
Check "milestone list has 2 entries" @((Api "Get" "/api/projects/$proj/milestones" $ah).Content | ConvertFrom-Json).Count 2

Write-Host "`n--- Access control ---"
Api "Post" "/api/users/engineers" $ah @{ fullName = "Sita Devi"; email = "sita@smartroad.com"; password = "Engineer@123" } | Out-Null
$sh = Login "sita@smartroad.com" "Engineer@123"
$r = Api "Get" "/api/projects/$proj/expenses" $sh
Check "unassigned engineer cannot read expenses" $r.StatusCode 403
$r = Api "Post" "/api/projects/$proj/progress" $sh @{ completedPercentage = 50 }
Check "unassigned engineer cannot add progress" $r.StatusCode 403
$r = Api "Get" "/api/projects" $null
Check "request without token is rejected" $r.StatusCode 401
$r = Api "Get" "/api/projects/999999/expenses" $ah
Check "missing project returns 404" $r.StatusCode 404

Write-Host "`n--- Deleting a project with child records ---"
$r = Api "Post" "/api/projects" $ah @{ name = "Temp delete test"; location = "Test"; totalBudget = 1000; startDate = (Day -5); deadline = (Day 30) }
Check "temp project created" $r.StatusCode 201
$tmp = (Json $r).id
$r = Api "Post" "/api/projects/$tmp/milestones" $ah @{ title = "Temp"; targetDate = (Day 10) }
Check "temp milestone created" $r.StatusCode 201
$r = Api "Delete" "/api/projects/$tmp" $ah
Check "project with milestone deleted" $r.StatusCode 204
$r = Api "Get" "/api/projects/$tmp" $ah
Check "deleted project returns 404" $r.StatusCode 404

Write-Host ""
Write-Host "Done: $($script:pass) passed, $($script:fail) failed"
