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

function NewProject($name, $location, $startOffset, $deadlineOffset, $budget, $engineerId) {
    $r = Api "Post" "/api/projects" $ah @{ name = "$name $stamp"; location = $location; description = "Demo test data"; totalBudget = $budget; startDate = (Day $startOffset); deadline = (Day $deadlineOffset); assignedEngineerId = $engineerId }
    $id = (Json $r).id
    $script:created += $id
    $id
}
function Search($query, $headers) { Json (Api "Get" "/api/projects/search?$query" $headers) }

Write-Host "`n--- Setup ---"
$ah = Login "admin@smartroad.com" "Admin@12345"
$eh = Login "ravi@smartroad.com" "Engineer@123"
Api "Post" "/api/users/engineers" $ah @{ fullName = "Sita Devi"; email = "sita@smartroad.com"; password = "Engineer@123" } | Out-Null
$sh = Login "sita@smartroad.com" "Engineer@123"
$engineers = @((Invoke-WebRequest -Uri "$base/api/users/engineers" -Headers $ah).Content | ConvertFrom-Json)
$ravi = $engineers | Where-Object { $_.email -eq "ravi@smartroad.com" } | Select-Object -First 1
$sita = $engineers | Where-Object { $_.email -eq "sita@smartroad.com" } | Select-Object -First 1
$stamp = Get-Date -Format "HHmmss"

$s1 = NewProject "Search Alpha Road" "Greenfield Village" -50 50 1000000 $ravi.id
$s2 = NewProject "Search Beta Bridge" "Hilltop Village" -20 200 600000 $sita.id
$s3 = NewProject "Search Gamma Lane" "Greenfield Village" 10 90 400000 $ravi.id
Api "Post" "/api/projects/$s1/progress" $eh @{ completedPercentage = 40 } | Out-Null
Api "Post" "/api/projects/$s1/expenses" $eh @{ amount = 300000; category = "MATERIAL"; expenseDate = (Day -15); description = "Test data" } | Out-Null
Api "Post" "/api/projects/$s1/expenses" $eh @{ amount = 200000; category = "LABOUR"; expenseDate = (Day -10); description = "Test data" } | Out-Null
Api "Post" "/api/projects/$s1/milestones" $ah @{ title = "Report test milestone"; targetDate = (Day 20) } | Out-Null

Write-Host "`n--- Search and filters (admin) ---"
$r = Search "q=$stamp" $ah
Check "name filter finds the 3 test projects" $r.totalElements 3
Check "search is case-insensitive on location" (Search "q=$stamp&location=greenfield" $ah).totalElements 2
Check "engineer filter" (Search "q=$stamp&engineerId=$($sita.id)" $ah).totalElements 1
Check "status IN_PROGRESS" (Search "q=$stamp&status=IN_PROGRESS" $ah).totalElements 1
Check "status NOT_STARTED" (Search "q=$stamp&status=NOT_STARTED" $ah).totalElements 2
Check "date range: deadline on or after +150 days" (Search "q=$stamp&dateFrom=$(Day 150)" $ah).totalElements 1
Check "date range: start on or before -30 days" (Search "q=$stamp&dateTo=$(Day -30)" $ah).totalElements 1
Check "combined filters" (Search "q=Beta&location=hilltop&status=NOT_STARTED&engineerId=$($sita.id)" $ah).totalElements 1
Check "a % in the search text is not a wildcard" (Search "q=%25" $ah).totalElements 0
$p0 = Search "q=$stamp&size=2&page=0" $ah
$p1 = Search "q=$stamp&size=2&page=1" $ah
Check "page 0 has 2 items" @($p0.content).Count 2
Check "page 1 has 1 item" @($p1.content).Count 1
Check "total pages = 2" $p0.totalPages 2
Check "sorted by name ascending" @((Search "q=$stamp&sort=name&direction=asc" $ah).content)[0].name "Search Alpha Road $stamp"
Check "sorted by name descending" @((Search "q=$stamp&sort=name&direction=desc" $ah).content)[0].name "Search Gamma Lane $stamp"
Check "page size is capped at 100" (Search "size=1000" $ah).size 100
Check "dateFrom after dateTo is rejected" (Api "Get" "/api/projects/search?dateFrom=$(Day 10)&dateTo=$(Day -10)" $ah).StatusCode 400
Check "invalid status is rejected" (Api "Get" "/api/projects/search?status=NOPE" $ah).StatusCode 400
Check "request without token is rejected" (Api "Get" "/api/projects/search" $null).StatusCode 401

Write-Host "`n--- Search as engineers ---"
Check "Ravi sees only his 2 projects" (Search "q=$stamp" $eh).totalElements 2
Check "Sita sees only her 1 project" (Search "q=$stamp" $sh).totalElements 1
Check "Ravi cannot see Sita's projects with a filter" (Search "q=$stamp&engineerId=$($sita.id)" $eh).totalElements 0

Write-Host "`n--- Project report ---"
$rep = Json (Api "Get" "/api/projects/$s1/report" $ah)
Check "report project name" $rep.project.name "Search Alpha Road $stamp"
CheckNum "timeline: total days = 100" $rep.timeline.totalDays 100
CheckNum "timeline: elapsed days = 50" $rep.timeline.elapsedDays 50
CheckNum "timeline: remaining days = 50" $rep.timeline.remainingDays 50
CheckNum "timeline: planned progress = 50" $rep.timeline.plannedProgress 50
CheckNum "timeline: progress gap = 10" $rep.timeline.progressGap 10
CheckNum "health index = 86" $rep.health.healthIndex 86
CheckNum "budget utilization = 50" $rep.budget.analysis.utilizationPercent 50
Check "1 milestone" @($rep.milestones).Count 1
Check "1 progress update" @($rep.progressHistory).Count 1
Check "2 expenses" @($rep.expenses).Count 2
Check "0 photos" @($rep.photos).Count 0
Check "0 alerts" @($rep.alerts).Count 0
Check "positive recommendation included" @($rep.recommendations | Where-Object { $_.ruleCode -eq "REC_ON_TRACK" }).Count 1
Check "assigned engineer can read the report" (Api "Get" "/api/projects/$s1/report" $eh).StatusCode 200
Check "unassigned engineer cannot read the report" (Api "Get" "/api/projects/$s1/report" $sh).StatusCode 403
Check "report without token is rejected" (Api "Get" "/api/projects/$s1/report" $null).StatusCode 401
Check "report of a missing project returns 404" (Api "Get" "/api/projects/999999/report" $ah).StatusCode 404

Write-Host "`n--- Status changes by the engineer ---"
$r = Api "Patch" "/api/projects/$s1/status" $eh @{ status = "ON_HOLD" }
Check "engineer puts the project on hold" $r.StatusCode 200
Check "status is ON_HOLD" (Json $r).status "ON_HOLD"
Check "putting it on hold twice is rejected" (Api "Patch" "/api/projects/$s1/status" $eh @{ status = "ON_HOLD" }).StatusCode 400
Check "engineer cannot set COMPLETED" (Api "Patch" "/api/projects/$s1/status" $eh @{ status = "COMPLETED" }).StatusCode 400
Check "engineer cannot set DELAYED" (Api "Patch" "/api/projects/$s1/status" $eh @{ status = "DELAYED" }).StatusCode 400
$r = Api "Patch" "/api/projects/$s1/status" $eh @{ status = "IN_PROGRESS" }
Check "engineer resumes the project" $r.StatusCode 200
Check "resumed status is IN_PROGRESS (progress is 40%)" (Json $r).status "IN_PROGRESS"
Check "resuming a project that is not on hold is rejected" (Api "Patch" "/api/projects/$s1/status" $eh @{ status = "IN_PROGRESS" }).StatusCode 400
Api "Patch" "/api/projects/$s3/status" $eh @{ status = "ON_HOLD" } | Out-Null
Check "resuming a 0% project returns NOT_STARTED" (Json (Api "Patch" "/api/projects/$s3/status" $eh @{ status = "IN_PROGRESS" })).status "NOT_STARTED"
Check "admin cannot use the engineer status endpoint" (Api "Patch" "/api/projects/$s1/status" $ah @{ status = "ON_HOLD" }).StatusCode 403
Check "unassigned engineer cannot change status" (Api "Patch" "/api/projects/$s1/status" $sh @{ status = "ON_HOLD" }).StatusCode 403

Write-Host "`n--- Assignment (admin) ---"
$r = Api "Put" "/api/projects/$s1/assignment" $ah @{ engineerId = $sita.id }
Check "admin reassigns the project to Sita" $r.StatusCode 200
Check "assigned engineer id is Sita" (Json $r).assignedEngineerId $sita.id
Check "Sita can now read the project" (Api "Get" "/api/projects/$s1" $sh).StatusCode 200
Check "Ravi can no longer read it" (Api "Get" "/api/projects/$s1" $eh).StatusCode 403
$r = Api "Put" "/api/projects/$s1/assignment" $ah @{ engineerId = $null }
Check "admin removes the assignment" $r.StatusCode 200
Check "assigned engineer is empty" (Json $r).assignedEngineerId $null
Check "assignment back to Ravi works" (Api "Put" "/api/projects/$s1/assignment" $ah @{ engineerId = $ravi.id }).StatusCode 200
Check "unknown engineer returns 404" (Api "Put" "/api/projects/$s1/assignment" $ah @{ engineerId = 999999 }).StatusCode 404
Check "an admin account cannot be assigned" (Api "Put" "/api/projects/$s1/assignment" $ah @{ engineerId = 1 }).StatusCode 400
Check "engineer cannot assign projects" (Api "Put" "/api/projects/$s1/assignment" $eh @{ engineerId = $ravi.id }).StatusCode 403

Write-Host "`n--- Profile and password ---"
$me = Json (Api "Get" "/api/profile" $eh)
Check "profile shows the email" $me.email "ravi@smartroad.com"
Check "profile shows the role" $me.role "SITE_ENGINEER"
Check "admin profile shows ADMIN" (Json (Api "Get" "/api/profile" $ah)).role "ADMIN"
Check "profile without token is rejected" (Api "Get" "/api/profile" $null).StatusCode 401

$tempEmail = "temp$stamp@smartroad.com"
Api "Post" "/api/users/engineers" $ah @{ fullName = "Temp Engineer"; email = $tempEmail; password = "TempPass@123" } | Out-Null
$th = Login $tempEmail "TempPass@123"
Check "wrong current password is rejected" (Api "Post" "/api/profile/change-password" $th @{ currentPassword = "wrong"; newPassword = "NewPass@456" }).StatusCode 400
Check "same password is rejected" (Api "Post" "/api/profile/change-password" $th @{ currentPassword = "TempPass@123"; newPassword = "TempPass@123" }).StatusCode 400
Check "short new password is rejected" (Api "Post" "/api/profile/change-password" $th @{ currentPassword = "TempPass@123"; newPassword = "short" }).StatusCode 400
Check "password changed" (Api "Post" "/api/profile/change-password" $th @{ currentPassword = "TempPass@123"; newPassword = "NewPass@456" }).StatusCode 204
Check "old password no longer works" (Api "Post" "/api/auth/login" $null @{ email = $tempEmail; password = "TempPass@123" }).StatusCode 401
Check "new password works" (Api "Post" "/api/auth/login" $null @{ email = $tempEmail; password = "NewPass@456" }).StatusCode 200

Write-Host "`n--- User administration ---"
$users = @((Api "Get" "/api/users" $ah).Content | ConvertFrom-Json)
$temp = $users | Where-Object { $_.email -eq $tempEmail } | Select-Object -First 1
$admin = $users | Where-Object { $_.email -eq "admin@smartroad.com" } | Select-Object -First 1
Check "user list contains the temp engineer" ($null -ne $temp) $true
Check "engineer cannot list users" (Api "Get" "/api/users" $eh).StatusCode 403
Check "admin account cannot be deactivated" (Api "Patch" "/api/users/$($admin.id)/active" $ah @{ active = $false }).StatusCode 400
Check "engineer cannot deactivate users" (Api "Patch" "/api/users/$($temp.id)/active" $eh @{ active = $false }).StatusCode 403
Check "unknown user returns 404" (Api "Patch" "/api/users/999999/active" $ah @{ active = $false }).StatusCode 404
$tokenBefore = Login $tempEmail "NewPass@456"
Check "token works before deactivation" (Api "Get" "/api/profile" $tokenBefore).StatusCode 200
Check "admin deactivates the temp engineer" (Json (Api "Patch" "/api/users/$($temp.id)/active" $ah @{ active = $false })).active $false
Check "deactivated user cannot log in" (Api "Post" "/api/auth/login" $null @{ email = $tempEmail; password = "NewPass@456" }).StatusCode 401
Check "existing token stops working" (Api "Get" "/api/profile" $tokenBefore).StatusCode 401
Check "deactivated engineer cannot be assigned" (Api "Put" "/api/projects/$s1/assignment" $ah @{ engineerId = $temp.id }).StatusCode 400
Check "admin reactivates the temp engineer" (Json (Api "Patch" "/api/users/$($temp.id)/active" $ah @{ active = $true })).active $true
Check "reactivated user can log in again" (Api "Post" "/api/auth/login" $null @{ email = $tempEmail; password = "NewPass@456" }).StatusCode 200
Api "Patch" "/api/users/$($temp.id)/active" $ah @{ active = $false } | Out-Null

Write-Host "`n--- Cleanup ---"
$codes = foreach ($id in $script:created) { (Api "Delete" "/api/projects/$id" $ah).StatusCode }
Check "all test projects deleted" (($codes | Sort-Object -Unique) -join ",") "204"

Write-Host ""
Write-Host "Done: $($script:pass) passed, $($script:fail) failed"