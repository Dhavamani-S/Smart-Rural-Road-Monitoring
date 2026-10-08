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
function AddProgress($id, $pct, $dayOffset = 0) {
    $body = @{ completedPercentage = $pct }
    if ($dayOffset -ne 0) { $body.updateDate = (Day $dayOffset) }
    Api "Post" "/api/projects/$id/progress" $eh $body | Out-Null
}
function AddExpense($id, $amount, $category, $dayOffset) {
    Api "Post" "/api/projects/$id/expenses" $eh @{ amount = $amount; category = $category; expenseDate = (Day $dayOffset); description = "Test data" } | Out-Null
}
function Eval($id) { Json (Api "Get" "/api/projects/$id/evaluation" $ah) }
function Has($list, $code) { (@($list | Where-Object { $_.ruleCode -eq $code }).Count -gt 0) }
function Pick($list, $code) { $list | Where-Object { $_.ruleCode -eq $code } | Select-Object -First 1 }
function Status($id) { (Json (Api "Get" "/api/projects/$id" $ah)).status }

Write-Host "`n--- Setup ---"
$ah = Login "admin@smartroad.com" "Admin@12345"
$eh = Login "ravi@smartroad.com" "Engineer@123"
Api "Post" "/api/users/engineers" $ah @{ fullName = "Sita Devi"; email = "sita@smartroad.com"; password = "Engineer@123" } | Out-Null
$sh = Login "sita@smartroad.com" "Engineer@123"
$engineers = @((Invoke-WebRequest -Uri "$base/api/users/engineers" -Headers $ah).Content | ConvertFrom-Json)
$ravi = $engineers | Where-Object { $_.email -eq "ravi@smartroad.com" } | Select-Object -First 1
$stamp = Get-Date -Format "HHmmss"

Write-Host "`n--- Case A: on track ---"
$cA = NewProject "Alert case A" -50 50 1000000
AddProgress $cA 50
AddExpense $cA 500000 "MATERIAL" -15
$e = Eval $cA
Check "no alerts for a project on track" @($e.alerts).Count 0
Check "positive recommendation is shown" (Has $e.recommendations "REC_ON_TRACK") $true
Check "its type is POSITIVE" (Pick $e.recommendations "REC_ON_TRACK").type "POSITIVE"
Check "triggering rule is explained" ((Pick $e.recommendations "REC_ON_TRACK").triggeredRule -like "REC_ON_TRACK*") $true
Check "project is not delayed" $e.delayed $false

Write-Host "`n--- Case B: behind schedule (planned 50, actual 25) ---"
$cB = NewProject "Alert case B" -50 50 1000000
AddProgress $cB 25
AddExpense $cB 250000 "MATERIAL" -15
$e = Eval $cB
$gapAlert = Pick $e.alerts "DELAY_PROGRESS_GAP"
Check "progress gap alert is raised" (Has $e.alerts "DELAY_PROGRESS_GAP") $true
Check "severity is MEDIUM for a 25 point gap" $gapAlert.severity "MEDIUM"
Check "message states the gap" ($gapAlert.reason -like "*25.0 percentage points below planned progress*") $true
Check "it is an indicator, not confirmed" $gapAlert.confirmed $false
Check "alert is stored (has a database id)" ($gapAlert.id -gt 0) $true
Check "schedule review recommended" (Has $e.recommendations "REC_SCHEDULE_REVIEW") $true
Check "no positive message while delayed" (Has $e.recommendations "REC_ON_TRACK") $false
Check "project is flagged delayed" $e.delayed $true
Check "status becomes DELAYED" (Status $cB) "DELAYED"
AddProgress $cB 50
$e = Eval $cB
Check "alerts clear after catching up" @($e.alerts).Count 0
Check "status returns to IN_PROGRESS" (Status $cB) "IN_PROGRESS"

Write-Host "`n--- Case B2: low progress but on schedule (planned 10, actual 5) ---"
$cB2 = NewProject "Alert case B2" -10 90 1000000
AddProgress $cB2 5
AddExpense $cB2 50000 "MATERIAL" -5
$e = Eval $cB2
Check "low progress alone is not a delay" @($e.alerts).Count 0
Check "project is not delayed" $e.delayed $false
Check "status stays IN_PROGRESS" (Status $cB2) "IN_PROGRESS"

Write-Host "`n--- Case C: deadline passed ---"
$cC = NewProject "Alert case C" -80 -10 1000000
AddProgress $cC 30
AddExpense $cC 300000 "MATERIAL" -15
$e = Eval $cC
Check "deadline alert is raised" (Has $e.alerts "DELAY_OVERDUE") $true
Check "deadline alert is HIGH" (Pick $e.alerts "DELAY_OVERDUE").severity "HIGH"
Check "deadline alert is confirmed" (Pick $e.alerts "DELAY_OVERDUE").confirmed $true
Check "progress gap alert is HIGH" (Pick $e.alerts "DELAY_PROGRESS_GAP").severity "HIGH"
Check "immediate review recommended" (Has $e.recommendations "REC_OVERDUE_REVIEW") $true
Check "no duplicate schedule review" (Has $e.recommendations "REC_SCHEDULE_REVIEW") $false
Check "status becomes DELAYED" (Status $cC) "DELAYED"

Write-Host "`n--- Case D: 80% spent, 45% done ---"
$cD = NewProject "Alert case D" -50 50 1000000
AddProgress $cD 45
AddExpense $cD 800000 "MATERIAL" -15
$e = Eval $cD
$ahead = Pick $e.alerts "BUDGET_AHEAD"
Check "budget alert is raised" (Has $e.alerts "BUDGET_AHEAD") $true
Check "severity is HIGH for a 35 point gap" $ahead.severity "HIGH"
Check "wording says it is not a confirmed problem" ($ahead.reason -like "*not a confirmed financial problem*") $true
Check "it is an indicator, not confirmed" $ahead.confirmed $false
Check "no delay alert (progress is close to plan)" (Has $e.alerts "DELAY_PROGRESS_GAP") $false
Check "expense review recommended" (Has $e.recommendations "REC_EXPENSE_REVIEW") $true

Write-Host "`n--- Case E: spending above the budget ---"
$cE = NewProject "Alert case E" -50 50 1000000
AddProgress $cE 50
AddExpense $cE 1200000 "MATERIAL" -15
$e = Eval $cE
Check "over-budget alert is raised" (Has $e.alerts "BUDGET_OVER") $true
Check "over-budget alert is HIGH" (Pick $e.alerts "BUDGET_OVER").severity "HIGH"
Check "over-budget alert is confirmed" (Pick $e.alerts "BUDGET_OVER").confirmed $true
Check "no second budget-ahead alert" (Has $e.alerts "BUDGET_AHEAD") $false
Check "overrun recommendation is made" (Has $e.recommendations "REC_BUDGET_OVERRUN") $true
Check "no conflicting expense review" (Has $e.recommendations "REC_EXPENSE_REVIEW") $false

Write-Host "`n--- Case F: near the budget limit ---"
$cF = NewProject "Alert case F" -50 50 1000000
AddProgress $cF 80
AddExpense $cF 910000 "MATERIAL" -15
$e = Eval $cF
Check "near-limit alert is raised" (Has $e.alerts "BUDGET_NEAR_LIMIT") $true
Check "it is the only alert" @($e.alerts).Count 1
Check "budget watch recommended" (Has $e.recommendations "REC_BUDGET_WATCH") $true

Write-Host "`n--- Case G: rapid increase in expenses ---"
$cG = NewProject "Alert case G" -90 90 1000000
AddProgress $cG 50
AddExpense $cG 100000 "MATERIAL" -60
AddExpense $cG 100000 "LABOUR" -40
AddExpense $cG 300000 "EQUIPMENT" -3
$e = Eval $cG
Check "rapid-spending alert is raised" (Has $e.alerts "BUDGET_RAPID_SPEND") $true
Check "it is the only alert" @($e.alerts).Count 1
Check "recent spend check recommended" (Has $e.recommendations "REC_RECENT_SPEND_CHECK") $true
Check "no positive message" (Has $e.recommendations "REC_ON_TRACK") $false

Write-Host "`n--- Case H: overdue milestone ---"
$cH = NewProject "Alert case H" -50 50 1000000
AddProgress $cH 50
AddExpense $cH 500000 "MATERIAL" -15
Api "Post" "/api/projects/$cH/milestones" $ah @{ title = "Culvert construction"; targetDate = (Day -5) } | Out-Null
$e = Eval $cH
Check "milestone alert is raised" (Has $e.alerts "DELAY_MILESTONE") $true
Check "milestone priority recommended" (Has $e.recommendations "REC_MILESTONE_PRIORITY") $true
Check "recommendation names the milestone" ((Pick $e.recommendations "REC_MILESTONE_PRIORITY").recommendedAction -like "*Culvert construction*") $true
Check "milestone alone does not mark the project delayed" $e.delayed $false

Write-Host "`n--- Case I: no recent progress update ---"
$cI = NewProject "Alert case I" -60 60 1000000
AddProgress $cI 50 -20
AddExpense $cI 500000 "MATERIAL" -15
$e = Eval $cI
Check "update alert is raised" (Has $e.alerts "DELAY_NO_UPDATE") $true
Check "severity is LOW after 20 days" (Pick $e.alerts "DELAY_NO_UPDATE").severity "LOW"
Check "update request recommended" (Has $e.recommendations "REC_UPDATE_REQUEST") $true
Check "on-track message can still be shown" (Has $e.recommendations "REC_ON_TRACK") $true

Write-Host "`n--- Case J: no progress update ever ---"
$cJ = NewProject "Alert case J" -30 60 1000000
$e = Eval $cJ
Check "progress gap alert is HIGH" (Pick $e.alerts "DELAY_PROGRESS_GAP").severity "HIGH"
Check "no-update alert is raised" (Has $e.alerts "DELAY_NO_UPDATE") $true
Check "NOT_STARTED status is left unchanged" (Status $cJ) "NOT_STARTED"

Write-Host "`n--- Case K: completed project ---"
$cK = NewProject "Alert case K" -100 -5 1000000
AddProgress $cK 100
AddExpense $cK 800000 "MATERIAL" -20
$e = Eval $cK
Check "no alerts for a completed project" @($e.alerts).Count 0
Check "positive message is shown" (Has $e.recommendations "REC_ON_TRACK") $true
Check "status stays COMPLETED" (Status $cK) "COMPLETED"

Write-Host "`n--- Case L: project that has not started ---"
$cL = NewProject "Alert case L" 10 100 1000000
$e = Eval $cL
Check "no alerts before the start date" @($e.alerts).Count 0
Check "positive message is shown" (Has $e.recommendations "REC_ON_TRACK") $true

Write-Host "`n--- Endpoints and access control ---"
Check "alerts endpoint works" (Api "Get" "/api/projects/$cD/alerts" $ah).StatusCode 200
Check "recommendations endpoint works" (Api "Get" "/api/projects/$cD/recommendations" $ah).StatusCode 200
Check "assigned engineer can read alerts" (Api "Get" "/api/projects/$cD/alerts" $eh).StatusCode 200
Check "unassigned engineer cannot read alerts" (Api "Get" "/api/projects/$cD/alerts" $sh).StatusCode 403
Check "unassigned engineer cannot read recommendations" (Api "Get" "/api/projects/$cD/recommendations" $sh).StatusCode 403
Check "unassigned engineer cannot read evaluation" (Api "Get" "/api/projects/$cD/evaluation" $sh).StatusCode 403
Check "request without token is rejected" (Api "Get" "/api/projects/$cD/alerts" $null).StatusCode 401
Check "missing project returns 404" (Api "Get" "/api/projects/999999/alerts" $ah).StatusCode 404

Write-Host "`n--- Lists across projects ---"
$allAlerts = @((Api "Get" "/api/analytics/alerts" $ah).Content | ConvertFrom-Json)
Check "list includes the budget alert of case D" @($allAlerts | Where-Object { $_.projectId -eq $cD -and $_.ruleCode -eq "BUDGET_AHEAD" }).Count 1
Check "list is sorted with HIGH first" $allAlerts[0].severity "HIGH"
$issues = @((Api "Get" "/api/analytics/recommendations?issuesOnly=true" $eh).Content | ConvertFrom-Json)
Check "issuesOnly hides positive messages" @($issues | Where-Object { $_.type -eq "POSITIVE" }).Count 0
Check "issue list contains the overrun recommendation of case E" @($issues | Where-Object { $_.projectId -eq $cE -and $_.ruleCode -eq "REC_BUDGET_OVERRUN" }).Count 1
Check "unassigned engineer sees no alerts" @((Api "Get" "/api/analytics/alerts" $sh).Content | ConvertFrom-Json).Count 0

Write-Host "`n--- Cleanup (also proves stored alerts are removed with the project) ---"
$codes = foreach ($id in $script:created) { (Api "Delete" "/api/projects/$id" $ah).StatusCode }
Check "all test projects deleted" (($codes | Sort-Object -Unique) -join ",") "204"

Write-Host ""
Write-Host "Done: $($script:pass) passed, $($script:fail) failed"