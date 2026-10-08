$requests = @(
    @{ folder = '1 Auth'; name = 'Login as admin'; method = 'POST'; url = '{{baseUrl}}/api/auth/login'; body = '{ "email": "admin@smartroad.com", "password": "Admin@12345" }'; expect = 200; noauth = $true; save = @(, @('token', 'token')) },
    @{ folder = '1 Auth'; name = 'Login with a wrong password'; method = 'POST'; url = '{{baseUrl}}/api/auth/login'; body = '{ "email": "admin@smartroad.com", "password": "wrong" }'; expect = 401; noauth = $true },
    @{ folder = '1 Auth'; name = 'Request without a token'; method = 'GET'; url = '{{baseUrl}}/api/projects'; expect = 401; noauth = $true },

    @{ folder = '2 Admin - users and projects'; name = 'Create site engineer'; method = 'POST'; url = '{{baseUrl}}/api/users/engineers'; body = '{ "fullName": "Postman Engineer", "email": "postman{{$timestamp}}@smartroad.com", "password": "Engineer@123" }'; expect = 201; save = @(@('engineerId', 'id'), @('engineerEmail', 'email')) },
    @{ folder = '2 Admin - users and projects'; name = 'Create engineer with a short password'; method = 'POST'; url = '{{baseUrl}}/api/users/engineers'; body = '{ "fullName": "Bad", "email": "bad{{$timestamp}}@smartroad.com", "password": "abc" }'; expect = 400 },
    @{ folder = '2 Admin - users and projects'; name = 'List site engineers'; method = 'GET'; url = '{{baseUrl}}/api/users/engineers'; expect = 200 },
    @{ folder = '2 Admin - users and projects'; name = 'List all users'; method = 'GET'; url = '{{baseUrl}}/api/users'; expect = 200 },
    @{ folder = '2 Admin - users and projects'; name = 'Create project'; method = 'POST'; url = '{{baseUrl}}/api/projects'; body = '{ "name": "Postman Test Road {{$timestamp}}", "location": "Test Village", "description": "Postman test data", "totalBudget": 1000000, "startDate": "{{startDate}}", "deadline": "{{deadlineDate}}", "assignedEngineerId": {{engineerId}} }'; expect = 201; save = @(, @('projectId', 'id')) },
    @{ folder = '2 Admin - users and projects'; name = 'Create project with a negative budget'; method = 'POST'; url = '{{baseUrl}}/api/projects'; body = '{ "name": "Bad", "location": "X", "totalBudget": -5, "startDate": "{{startDate}}", "deadline": "{{deadlineDate}}" }'; expect = 400 },
    @{ folder = '2 Admin - users and projects'; name = 'Create project with the deadline before the start'; method = 'POST'; url = '{{baseUrl}}/api/projects'; body = '{ "name": "Bad", "location": "X", "totalBudget": 1000, "startDate": "{{deadlineDate}}", "deadline": "{{startDate}}" }'; expect = 400 },
    @{ folder = '2 Admin - users and projects'; name = 'List projects'; method = 'GET'; url = '{{baseUrl}}/api/projects'; expect = 200 },
    @{ folder = '2 Admin - users and projects'; name = 'Get project'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}'; expect = 200 },
    @{ folder = '2 Admin - users and projects'; name = 'Update project'; method = 'PUT'; url = '{{baseUrl}}/api/projects/{{projectId}}'; body = '{ "name": "Postman Test Road Updated", "location": "Test Village", "totalBudget": 1200000, "startDate": "{{startDate}}", "deadline": "{{deadlineDate}}", "status": "IN_PROGRESS", "assignedEngineerId": {{engineerId}} }'; expect = 200 },
    @{ folder = '2 Admin - users and projects'; name = 'Search projects'; method = 'GET'; url = '{{baseUrl}}/api/projects/search?q=Postman&page=0&size=5&sort=name&direction=asc'; expect = 200 },
    @{ folder = '2 Admin - users and projects'; name = 'Get a missing project'; method = 'GET'; url = '{{baseUrl}}/api/projects/999999'; expect = 404 },
    @{ folder = '2 Admin - users and projects'; name = 'Assign engineer to project'; method = 'PUT'; url = '{{baseUrl}}/api/projects/{{projectId}}/assignment'; body = '{ "engineerId": {{engineerId}} }'; expect = 200 },
    @{ folder = '2 Admin - users and projects'; name = 'Add milestone'; method = 'POST'; url = '{{baseUrl}}/api/projects/{{projectId}}/milestones'; body = '{ "title": "Postman milestone", "targetDate": "{{milestoneDate}}" }'; expect = 201; save = @(, @('milestoneId', 'id')) },
    @{ folder = '2 Admin - users and projects'; name = 'Milestone outside the project dates'; method = 'POST'; url = '{{baseUrl}}/api/projects/{{projectId}}/milestones'; body = '{ "title": "Too late", "targetDate": "2099-01-01" }'; expect = 400 },
    @{ folder = '2 Admin - users and projects'; name = 'List milestones'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/milestones'; expect = 200 },

    @{ folder = '3 Engineer'; name = 'Login as the engineer'; method = 'POST'; url = '{{baseUrl}}/api/auth/login'; body = '{ "email": "{{engineerEmail}}", "password": "Engineer@123" }'; expect = 200; noauth = $true; save = @(, @('token', 'token')) },
    @{ folder = '3 Engineer'; name = 'Add progress update'; method = 'POST'; url = '{{baseUrl}}/api/projects/{{projectId}}/progress'; body = '{ "completedPercentage": 30, "remarks": "Postman progress update" }'; expect = 201 },
    @{ folder = '3 Engineer'; name = 'Progress above 100'; method = 'POST'; url = '{{baseUrl}}/api/projects/{{projectId}}/progress'; body = '{ "completedPercentage": 101 }'; expect = 400 },
    @{ folder = '3 Engineer'; name = 'Progress history'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/progress'; expect = 200 },
    @{ folder = '3 Engineer'; name = 'Add expense'; method = 'POST'; url = '{{baseUrl}}/api/projects/{{projectId}}/expenses'; body = '{ "amount": 250000, "category": "MATERIAL", "expenseDate": "{{recentDate}}", "description": "Postman test expense" }'; expect = 201 },
    @{ folder = '3 Engineer'; name = 'Negative expense'; method = 'POST'; url = '{{baseUrl}}/api/projects/{{projectId}}/expenses'; body = '{ "amount": -5, "category": "MATERIAL", "expenseDate": "{{recentDate}}" }'; expect = 400 },
    @{ folder = '3 Engineer'; name = 'Expense history'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/expenses'; expect = 200 },
    @{ folder = '3 Engineer'; name = 'Complete milestone'; method = 'PATCH'; url = '{{baseUrl}}/api/projects/{{projectId}}/milestones/{{milestoneId}}/complete'; expect = 200 },
    @{ folder = '3 Engineer'; name = 'Put project on hold'; method = 'PATCH'; url = '{{baseUrl}}/api/projects/{{projectId}}/status'; body = '{ "status": "ON_HOLD" }'; expect = 200 },
    @{ folder = '3 Engineer'; name = 'Resume project'; method = 'PATCH'; url = '{{baseUrl}}/api/projects/{{projectId}}/status'; body = '{ "status": "IN_PROGRESS" }'; expect = 200 },
    @{ folder = '3 Engineer'; name = 'Engineer cannot create a project'; method = 'POST'; url = '{{baseUrl}}/api/projects'; body = '{ "name": "Hack", "location": "X", "totalBudget": 1000, "startDate": "{{startDate}}", "deadline": "{{deadlineDate}}" }'; expect = 403 },
    @{ folder = '3 Engineer'; name = 'Upload site photo (choose a file in Postman first)'; method = 'POST'; url = '{{baseUrl}}/api/projects/{{projectId}}/photos'; form = $true; expect = 201 },
    @{ folder = '3 Engineer'; name = 'List site photos'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/photos'; expect = 200 },

    @{ folder = '4 Analytics (as engineer)'; name = 'Road health index'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/health'; expect = 200 },
    @{ folder = '4 Analytics (as engineer)'; name = 'Budget analysis'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/budget-analysis'; expect = 200 },
    @{ folder = '4 Analytics (as engineer)'; name = 'Alerts'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/alerts'; expect = 200 },
    @{ folder = '4 Analytics (as engineer)'; name = 'Recommendations'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/recommendations'; expect = 200 },
    @{ folder = '4 Analytics (as engineer)'; name = 'Project report'; method = 'GET'; url = '{{baseUrl}}/api/projects/{{projectId}}/report'; expect = 200 },
    @{ folder = '4 Analytics (as engineer)'; name = 'Engineer dashboard'; method = 'GET'; url = '{{baseUrl}}/api/dashboard'; expect = 200 },
    @{ folder = '4 Analytics (as engineer)'; name = 'My profile'; method = 'GET'; url = '{{baseUrl}}/api/profile'; expect = 200 },

    @{ folder = '5 Admin - views and cleanup'; name = 'Login as admin again'; method = 'POST'; url = '{{baseUrl}}/api/auth/login'; body = '{ "email": "admin@smartroad.com", "password": "Admin@12345" }'; expect = 200; noauth = $true; save = @(, @('token', 'token')) },
    @{ folder = '5 Admin - views and cleanup'; name = 'Admin cannot record progress'; method = 'POST'; url = '{{baseUrl}}/api/projects/{{projectId}}/progress'; body = '{ "completedPercentage": 40 }'; expect = 403 },
    @{ folder = '5 Admin - views and cleanup'; name = 'Admin dashboard'; method = 'GET'; url = '{{baseUrl}}/api/dashboard'; expect = 200 },
    @{ folder = '5 Admin - views and cleanup'; name = 'Health summary of all projects'; method = 'GET'; url = '{{baseUrl}}/api/analytics/health-summary'; expect = 200 },
    @{ folder = '5 Admin - views and cleanup'; name = 'Alerts across projects'; method = 'GET'; url = '{{baseUrl}}/api/analytics/alerts'; expect = 200 },
    @{ folder = '5 Admin - views and cleanup'; name = 'Recommendations across projects'; method = 'GET'; url = '{{baseUrl}}/api/analytics/recommendations?issuesOnly=true'; expect = 200 },
    @{ folder = '5 Admin - views and cleanup'; name = 'Deactivate the test engineer'; method = 'PATCH'; url = '{{baseUrl}}/api/users/{{engineerId}}/active'; body = '{ "active": false }'; expect = 200 },
    @{ folder = '5 Admin - views and cleanup'; name = 'Delete the test project'; method = 'DELETE'; url = '{{baseUrl}}/api/projects/{{projectId}}'; expect = 204 }
)

$folders = [ordered]@{}
foreach ($r in $requests) {
    $tests = @("pm.test('Status code is $($r.expect)', function () { pm.response.to.have.status($($r.expect)); });")
    if ($r.save) {
        foreach ($pair in $r.save) {
            $tests += "if (pm.response.code === $($r.expect)) { pm.collectionVariables.set('$($pair[0])', pm.response.json().$($pair[1])); }"
        }
    }
    $request = [ordered]@{ method = $r.method; url = $r.url }
    if ($r.form) {
        $request['body'] = [ordered]@{
            mode     = 'formdata'
            formdata = @(
                [ordered]@{ key = 'file'; type = 'file'; src = @() },
                [ordered]@{ key = 'caption'; value = 'Postman test photo'; type = 'text' }
            )
        }
    } else {
        $request['header'] = @([ordered]@{ key = 'Content-Type'; value = 'application/json' })
        if ($r.body) {
            $request['body'] = [ordered]@{ mode = 'raw'; raw = $r.body; options = @{ raw = @{ language = 'json' } } }
        }
    }
    if ($r.noauth) { $request['auth'] = @{ type = 'noauth' } }
    $item = [ordered]@{
        name    = $r.name
        event   = @(@{ listen = 'test'; script = @{ type = 'text/javascript'; exec = $tests } })
        request = $request
    }
    if (-not $folders.Contains($r.folder)) { $folders[$r.folder] = New-Object System.Collections.ArrayList }
    [void]$folders[$r.folder].Add($item)
}

$items = foreach ($name in $folders.Keys) { [ordered]@{ name = $name; item = $folders[$name] } }

$collection = [ordered]@{
    info     = [ordered]@{
        name        = 'SmartRoad API'
        description = 'Run the folders in order (Collection Runner). Variables are filled in automatically.'
        schema      = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    }
    auth     = [ordered]@{ type = 'bearer'; bearer = @([ordered]@{ key = 'token'; value = '{{token}}'; type = 'string' }) }
    variable = @(
        @{ key = 'baseUrl'; value = 'http://localhost:8080' },
        @{ key = 'token'; value = '' },
        @{ key = 'projectId'; value = '' },
        @{ key = 'engineerId'; value = '' },
        @{ key = 'engineerEmail'; value = '' },
        @{ key = 'milestoneId'; value = '' }
    )
    event    = @(@{
        listen = 'prerequest'
        script = @{
            type = 'text/javascript'
            exec = @(
                "const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);",
                "pm.collectionVariables.set('startDate', d(-30));",
                "pm.collectionVariables.set('deadlineDate', d(150));",
                "pm.collectionVariables.set('milestoneDate', d(30));",
                "pm.collectionVariables.set('recentDate', d(-5));"
            )
        }
    })
    item     = @($items)
}

$out = Join-Path $PSScriptRoot 'SmartRoad.postman_collection.json'
$collection | ConvertTo-Json -Depth 20 | Set-Content -Path $out -Encoding utf8
Write-Host "Created $out with $($requests.Count) requests."