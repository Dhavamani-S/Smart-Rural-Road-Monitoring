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

function Upload($projectId, $headers, $filePath, $caption) {
    $form = @{ file = Get-Item $filePath }
    if ($caption) { $form.caption = $caption }
    Invoke-WebRequest -Uri "$base/api/projects/$projectId/photos" -Method Post -Headers $headers -Form $form -SkipHttpErrorCheck
}

function Json($response) { $response.Content | ConvertFrom-Json }
function Day($offset) { (Get-Date).AddDays($offset).ToString("yyyy-MM-dd") }

Write-Host "`n--- Preparing test files ---"
Add-Type -AssemblyName System.Drawing
$png = Join-Path $env:TEMP "smartroad-test.png"
$bmp = New-Object System.Drawing.Bitmap 300, 200
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::SteelBlue)
$g.Dispose()
$bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$fake = Join-Path $env:TEMP "smartroad-fake.jpg"
Set-Content -Path $fake -Value "This is plain text pretending to be a photo."
$big = Join-Path $env:TEMP "smartroad-big.png"
[System.IO.File]::WriteAllBytes($big, [byte[]]::new(6MB))

Write-Host "`n--- Setup ---"
$ah = Login "admin@smartroad.com" "Admin@12345"
$eh = Login "ravi@smartroad.com" "Engineer@123"
Api "Post" "/api/users/engineers" $ah @{ fullName = "Sita Devi"; email = "sita@smartroad.com"; password = "Engineer@123" } | Out-Null
$sh = Login "sita@smartroad.com" "Engineer@123"
$engineers = @((Invoke-WebRequest -Uri "$base/api/users/engineers" -Headers $ah).Content | ConvertFrom-Json)
$ravi = $engineers | Where-Object { $_.email -eq "ravi@smartroad.com" } | Select-Object -First 1
$pname = "Step6 Test " + (Get-Date -Format "HHmmss")
$r = Api "Post" "/api/projects" $ah @{ name = $pname; location = "Test Village"; description = "Demo test data"; totalBudget = 1000000; startDate = (Day -30); deadline = (Day 180); assignedEngineerId = $ravi.id }
Check "test project created" $r.StatusCode 201
if ($r.StatusCode -ne 201) {
    Write-Host "Project creation failed: $($r.Content)" -ForegroundColor Yellow
    exit 1
}
$proj = (Json $r).id

Write-Host "`n--- Upload ---"
$r = Upload $proj $eh $png "Test data: foundation layer"
Check "assigned engineer uploads a photo" $r.StatusCode 201
if ($r.StatusCode -ne 201) {
    Write-Host "Upload failed: $($r.Content)" -ForegroundColor Yellow
    Write-Host "Check the three cloudinary values in secrets.properties, then restart the server." -ForegroundColor Yellow
    exit 1
}
$j = Json $r
$photoId = $j.id
Check "image URL is a Cloudinary https link" ($j.imageUrl -like "https://res.cloudinary.com/*") $true
Check "caption saved" $j.caption "Test data: foundation layer"
Check "uploader name saved" $j.uploadedByName "Ravi Kumar"
$r = Upload $proj $eh $fake $null
Check "text file pretending to be a photo is rejected" $r.StatusCode 400
$r = Upload $proj $eh $big $null
Check "6 MB file is rejected" $r.StatusCode 413
$r = Invoke-WebRequest -Uri "$base/api/projects/$proj/photos" -Method Post -Headers $eh -Form @{ caption = "no file here" } -SkipHttpErrorCheck
Check "request without a file is rejected" $r.StatusCode 400
$r = Upload $proj $ah $png $null
Check "admin cannot upload" $r.StatusCode 403
$r = Upload $proj $sh $png $null
Check "unassigned engineer cannot upload" $r.StatusCode 403

Write-Host "`n--- Viewing ---"
Check "admin sees 1 photo" @((Api "Get" "/api/projects/$proj/photos" $ah).Content | ConvertFrom-Json).Count 1
Check "assigned engineer sees 1 photo" @((Api "Get" "/api/projects/$proj/photos" $eh).Content | ConvertFrom-Json).Count 1
$r = Api "Get" "/api/projects/$proj/photos" $sh
Check "unassigned engineer cannot view photos" $r.StatusCode 403
$r = Api "Get" "/api/projects/$proj/photos" $null
Check "request without token is rejected" $r.StatusCode 401

Write-Host "`n--- Deleting ---"
$r = Api "Delete" "/api/projects/$proj/photos/$photoId" $sh
Check "unassigned engineer cannot delete" $r.StatusCode 403
$r = Api "Delete" "/api/projects/$proj/photos/$photoId" $ah
Check "admin deletes the photo" $r.StatusCode 204
Check "photo list is empty again" @((Api "Get" "/api/projects/$proj/photos" $ah).Content | ConvertFrom-Json).Count 0
$r = Api "Delete" "/api/projects/$proj/photos/$photoId" $ah
Check "deleting it again returns 404" $r.StatusCode 404

Write-Host "`n--- Deleting a project that has photos ---"
$r = Upload $proj $eh $png "Second test photo"
Check "second photo uploaded" $r.StatusCode 201
$r = Api "Delete" "/api/projects/$proj" $ah
Check "project with a photo is deleted" $r.StatusCode 204
$r = Api "Get" "/api/projects/$proj" $ah
Check "deleted project returns 404" $r.StatusCode 404

Remove-Item $png, $fake, $big -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Done: $($script:pass) passed, $($script:fail) failed"