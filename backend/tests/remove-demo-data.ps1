$base = "http://localhost:8080"
$r = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body (@{ email = "admin@smartroad.com"; password = "Admin@12345" } | ConvertTo-Json)
$h = @{ Authorization = "Bearer $($r.token)" }
$q = [uri]::EscapeDataString("[DEMO]")
$page = (Invoke-WebRequest -Uri "$base/api/projects/search?q=$q&size=100" -Headers $h).Content | ConvertFrom-Json
$count = 0
foreach ($p in $page.content) {
    if ($p.name.StartsWith("[DEMO]")) {
        Invoke-WebRequest -Uri "$base/api/projects/$($p.id)" -Method Delete -Headers $h | Out-Null
        $count++
    }
}
Write-Host "Removed $count demo project(s)."