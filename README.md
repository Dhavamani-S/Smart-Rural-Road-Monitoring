# SmartRoad – Rural Road Construction Monitoring

*Monitor Progress. Analyze Performance. Make Better Decisions.*

A web platform to monitor rural road construction projects, track progress and expenses, evaluate project health, detect delays and budget risks, and give rule-based recommendations.

**Status:** backend complete and tested. The React frontend is being built next.

> The decision support is **rule-based**. It does not use machine learning and does not predict future outcomes. Alerts are indicators for review, not confirmed problems, unless marked `confirmed`.

## Tech stack
React (planned), Java 21, Spring Boot 4 (Web, Data JPA, Security), MySQL 8, JWT with BCrypt, Cloudinary (photos), Chart.js (planned), Postman, Git.

## Setup
1. Install JDK 21, MySQL 8, PowerShell 7 (for the test scripts).
2. Create the database: `CREATE DATABASE smartroad_db;`
3. Copy `backend/secrets.properties.example` to `backend/secrets.properties` and fill in the MySQL password, a random JWT secret (32+ characters), the admin login and your Cloudinary keys.
4. Run the backend: `cd backend` then `.\mvnw.cmd spring-boot:run`. The API runs on http://localhost:8080. Run it from the `backend` folder.
5. Optional sample data: set `app.demo-data.enabled=true` and `app.demo-data.password=...` in `secrets.properties`, then restart. It creates 2 engineers and 7 projects labelled `[DEMO]`. This is test data, not real government data.

The first admin account is created from `app.admin.email` and `app.admin.password`.

## Roles
- **ADMIN:** projects, budgets, assignments, users, all views and reports.
- **SITE_ENGINEER:** only the projects assigned to them: progress, expenses, milestones, photos, status (On Hold / resume).

## How the scores work
**Planned progress** = elapsed days ÷ total days × 100 (0 to 100).

| Score | Rule (defaults, all configurable in `application.properties`) |
|---|---|
| Progress | actual ÷ planned × 100, capped at 100. 100 if complete or nothing is planned yet |
| Schedule | 100 − 2 × (points behind plan beyond 5) − 10 × overdue milestones; capped at 20 if the deadline passed; minimum 0; 100 if complete |
| Budget | 100 − 2 × (% budget spent − % work done, beyond 5 points); capped at 30 if spending exceeds the budget; spending behind the work is not penalised |

**Road Health Index** = 0.40 × Progress + 0.30 × Budget + 0.30 × Schedule. Healthy: 80 or more. Needs Attention: 60 to under 80. Critical: under 60.

**Budget Efficiency Analyzer:** utilization % = spent ÷ budget × 100; remaining = budget − spent; planned expenditure = budget × planned progress; budget variance = actual − planned expenditure; earned value = budget × actual progress; cost efficiency index = earned value ÷ actual cost.

| Alert | Fires when | Severity |
|---|---|---|
| Deadline passed (confirmed) | after the deadline and incomplete | High |
| Progress gap | planned − actual > 15 points | Medium; High at 30 or more |
| Milestone overdue | target date passed, not completed | Medium; High at 3 or more |
| No recent update | no update in 14 days (30 or none: Medium) | Low / Medium |
| Over budget (confirmed) | recorded spending above budget | High |
| Spending ahead of work | % spent − % done > 15 points | Medium; High at 30 or more |
| Near budget limit | 90% or more spent and work behind spending | Medium |
| Rapid spending | last 14 days more than 2× the earlier daily average and at least 10% of budget | Medium |

Recommendations are generated from these alerts and the health index. Each names the rule that triggered it, the deadline rule replaces the general schedule review, and an on-track message only appears when no delay or budget rule fires. Evaluating a project also moves it between In Progress and Delayed when the progress-gap or deadline rule fires.

## API overview
Auth: `POST /api/auth/login`. Users: `/api/users`, `/api/users/engineers`, `/api/profile`. Projects: `/api/projects`, `/search`, `/{id}/report`, `/{id}/assignment`, `/{id}/status`. Per project: `/progress`, `/milestones`, `/expenses`, `/photos`, `/health`, `/budget-analysis`, `/alerts`, `/recommendations`, `/evaluation`. Dashboard and lists: `/api/dashboard`, `/api/analytics/health-summary`, `/api/analytics/alerts`, `/api/analytics/recommendations`.

## Testing
- Automated: `backend/tests/run-all-tests.ps1` (PowerShell 7, server running).
- Postman: generate `docs/SmartRoad.postman_collection.json` with `docs/build-postman-collection.ps1`, import it into Postman, and run the folders in order.

## Security
BCrypt password hashing, stateless JWT, role checks on every endpoint, engineers limited to assigned projects, validated uploads (JPEG/PNG/WebP, 5 MB, checked by file content), secrets only in `secrets.properties` (ignored by Git). The test scripts and Postman collection use the example admin password. Change them if you change `app.admin.password`.

## Limitations
Planned progress is a straight line over time. Dates use the server's clock. PDF export is done with the browser's Save as PDF from the printable report page.