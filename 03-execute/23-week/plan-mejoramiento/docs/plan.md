# Project Plan — Mobility Aids

**Project ID:** `mobility-aids` | **Document:** Project Plan | **Version:** 1.3
**Reviewed:** 2026-11-26 | **Status:** In Progress — requirements and delivery evidence remain incomplete
**Reference:** Acta No. 18-2026

------------------------------------------------------------------------------------------------------------------------

## 1. Project Objective

The objective of this project is to design, develop, test, and deliver a technical aids management system for people with mobility needs.

The system is based on the requirements established in the project specification and the instructor's Acta No. 18-2026.

The final solution must include:

- A React frontend.
- A PHP Laravel backend.
- A static public website.
- Containerized infrastructure.
- An API-based data seeder.
- Technical documentation and verification evidence.

The implementation must preserve inventory consistency, enforce authorization rules, and maintain the historical information associated with lending and return operations.

## 2. Project Scope

The project includes the following components:

| Component | Responsibility |
|---|---|
| `docs/` | Technical documentation, project planning, and architecture decisions. |
| `api/` | Backend implementation using PHP and Laravel. |
| `app/` | Frontend implementation using React and Vite. |
| `page/` | Static public product website. |
| `infra/` | Container and database configuration. |
| `tool/` | API-based initial data seeder. |

All functionality must remain within the approved project specification.

The implementation must be consistent with the ten user stories, six business rules, and five non-functional requirements.

## 3. Development Phases

### Phase 1 — Requirements and Documentation

**Objective:** Establish a complete and consistent technical specification.

Activities:

- Define project principles and constraints.
- Document the ten user stories.
- Define the six business rules.
- Document the five non-functional requirements.
- Define the logical data model.
- Specify API endpoints and contracts.
- Define the 23 implementation tasks.
- Document at least three Architecture Decision Records.
- Maintain consistency between project documentation and implementation evidence.

**Progress as of 2026-11-26:**

The core documentation set exists, along with four accepted ADRs and one concurrency evidence report. This review restored the complete constitution, recorded the static public website, reconciled the target API contract with the current source route inventory, and updated task evidence. Several API, mobile-administrator, seeder, automated-test, and delivery requirements remain incomplete. See `tasks.md` and `evidencias/estado-verificacion-2026-11-26.md`.

**Deliverable:** Complete and consistent project documentation.

### Phase 2 — Backend Development

**Objective:** Implement the business logic and API.

Activities:

- Configure the Laravel application.
- Implement the required data models.
- Implement database migrations.
- Implement API endpoints.
- Validate business rules.
- Implement lending and return operations.
- Protect inventory consistency.
- Implement reporting for the most requested technical aids.
- Enforce authentication and role-based authorization.

**Progress as of 2026-11-26:**

Laravel models, controllers, routes, migrations, seeders, and 11 PHP test files are present. Earlier documentation reports successful executions of `LoanApiTest.php` and `BeneficiaryApiTest.php`, but the repository does not contain dated test-run output for those statements. One concurrency scenario has retained screenshots and a written report. Full API-contract, authorization, database-integrity, repeatable concurrency, and end-to-end verification remain incomplete. The route and report implementation differs from the target contract.

**Deliverable:** Functional backend API supported by automated tests.

### Phase 3 — Frontend Development

**Objective:** Build the user interface using React.

Activities:

- Configure the React application using Vite.
- Implement authentication and protected routes.
- Implement the administrative layout and navigation.
- Develop the dashboard and inventory statistics.
- Implement beneficiary management.
- Implement inventory and technical aid management.
- Implement loan and return management.
- Implement reports and system settings.
- Integrate the frontend with the Laravel API.
- Display inventory and operation information.
- Implement validation and user-facing messages in Spanish.
- Apply responsive styles and reusable UI components.

**Progress as of 2026-11-26:**

The React/Vite application has source pages for the following modules:

- Authentication and login.
- Dashboard.
- Beneficiaries.
- Inventory.
- Technical Aids.
- Loans.
- Returns.
- Reports and analytics.
- System settings.

Supporting implementation includes authentication services, API communication, protected routes, reusable components, global styles, module-specific styles, application images, an icon, and a promotional video. Responsive refinements are present in the shared layout and stylesheet; their final Git delivery status is recorded separately.

The administrator login screen was visually checked on a laptop at the reported local development address. Mobile administrator access failed with `ERR_CONNECTION_TIMED_OUT`; valid authentication, live API workflows, role-specific behavior, and complete acceptance remain unverified. Current responsive changes are uncommitted in the worktree.

**Deliverable:** React application integrated with the backend API and supported by verification evidence.

### Phase 4 — Public Website

**Objective:** Present the Mobility Aids product through a static website.

Activities:

- Build the public product presentation.
- Explain the system's purpose.
- Present its main characteristics.
- Ensure the website describes the actual product rather than the technical examination.
- Verify desktop and mobile presentation.

**Progress as of 2026-11-26:**

The independent static site is implemented in `page/` with HTML, CSS, JavaScript, the official icon, the five category images, the real Cushions photograph, and the promotional video. The operator reports local verification at `http://127.0.0.1:4173/` and successful phone access at `http://192.168.1.27:4177/`. These are local/private-network addresses, not public Internet deployments. The mobile phone access is operator-reported; responsive source/bounds checks are not equivalent to saved screenshots for every viewport.

**Deliverable:** Static public website.

### Phase 5 — Infrastructure and Data Seeding

**Objective:** Prepare a reproducible execution environment.

Activities:

- Configure the required containers.
- Configure the database.
- Ensure the database environment starts with one command.
- Implement the initial data seeder through the API.
- Include the five predefined technical aid categories.
- Verify environment configuration and application startup.

**Progress as of 2026-11-26:**

`infra/docker-compose.yml` defines a MySQL 8.4 service. It does not compose the Laravel and React services into the required one-command full environment. The category seeder exists in `api/`; `tool/` has no implementation files. API-based demonstration-data seeding and full infrastructure startup remain pending.

**Deliverable:** Reproducible containerized environment and functional API-based seeder.

### Phase 6 — Testing and Validation

**Objective:** Verify that the complete system meets the specification.

Activities:

- Test the required API endpoints.
- Test the six business rules.
- Verify inventory consistency.
- Test simultaneous lending attempts.
- Verify HTTP 409 Conflict when the last available unit is requested simultaneously.
- Verify that historical operation information remains unchanged.
- Verify that operations and returns cannot be deleted.
- Create at least 15 automated test files.
- Validate consistency between documentation and implementation.
- Verify frontend and backend integration.

**Progress as of 2026-11-26:**

The repository contains 11 PHP test files. The final local `php artisan test` run passed 90 tests and 365 assertions using an isolated SQLite in-memory database; the result is recorded in `evidencias/estado-verificacion-2026-11-26.md`. The minimum 15 test-file target, full API contract, automated concurrency, and end-to-end integration remain unverified. One manual concurrency scenario is documented with three screenshots.

**Deliverable:** Automated testing evidence and validated application.

### Phase 7 — Final Delivery

**Objective:** Prepare the repository for evaluation.

Activities:

- Review all 23 implementation tasks.
- Verify the required project structure.
- Include the project README.
- Include the anonymized Acta PDF.
- Verify that no `.env` files or `node_modules` directories are committed.
- Review the Git history and commit dates.
- Verify the final project documentation.
- Prepare the individual live demonstration.
- Review the final branch and integration status.

**Progress as of 2026-11-26:**

At the start of the final release review, the checked-out branch was `feature/activity-6-app`, local HEAD was `516a6a2` dated 2026-11-25, and local `origin/feature/activity-6-app` pointed to that commit. The initial worktree contained uncommitted changes and untracked paths. This baseline does not establish a pull request, merge, or final instructor acceptance; subsequent release activity is reported separately.

**Deliverable:** Complete Mobility Aids project ready for evaluation.

------------------------------------------------------------------------------------------------------------------------

## 4. Work Schedule

The following schedule preserves the original planned development and verification dates.

| Planned date | Main activity |
|---|---|
| November 8, 2026 | Project setup and initial documentation |
| November 9, 2026 | Requirements and data model |
| November 10, 2026 | API contract and backend preparation |
| November 11, 2026 | Backend implementation |
| November 12, 2026 | Backend validation and testing |
| November 13, 2026 | React frontend development |
| November 16, 2026 | Public website and infrastructure |
| November 18, 2026 | Integration, testing, and final review |

The original schedule represents the planned development activities. Actual progress and completion must be demonstrated through repository files, automated tests, and Git evidence.

The official delivery and demonstration dates remain those established by the instructor.

As of this review, the planned delivery date of November 19, 2026 has passed and the individual demonstration date is November 26, 2026. This schedule record does not establish that delivery or demonstration was accepted.

## 5. Git Workflow and Traceability

All project changes must be recorded through small, meaningful commits.

The following rules apply:

- Use descriptive commit messages in English.
- Commit each completed document or implementation increment.
- Maintain the existing Git history.
- Do not rewrite previous commits.
- Verify actual commit dates and file changes before delivery.
- Preserve the required commit distribution across the project subfolders.
- Keep generated files, dependencies, and sensitive credentials out of the repository.

The checked-out branch at review time is:

`feature/activity-6-app`

At review time, local HEAD was `516a6a2` (`style(app): improve dashboard CSS compatibility`, dated 2026-11-25). Git reported a matching local remote-tracking ref, `origin/feature/activity-6-app`. This does not independently establish a live pull request, merge, or instructor acceptance. Minimum commit count, dates, and distribution still require verification.

The initial worktree contained uncommitted changes and untracked paths, including `page/`. This records the state before final release commits; subsequent commit and push activity is reported separately. No merge or history rewrite is implied.

Example commit messages:

```text
docs: define project requirements
docs: document system architecture
feat: implement technical aid management
feat: integrate lending operations
test: validate inventory constraints
style(app): improve dashboard CSS compatibility
```

No `.env` files or `node_modules` directories may be committed.

## 6. Quality and Acceptance Criteria

The project must satisfy the following conditions:

| Criterion | Required result |
|---|---|
| User stories | 10 |
| Business rules | 6 |
| Non-functional requirements | 5 |
| Implementation tasks | 23 |
| Automated test files | At least 15 |
| Architecture Decision Records | At least 3 |
| Frontend | React |
| Frontend build tool | Vite |
| Backend | PHP with Laravel |
| Public website | Static website |
| Database environment | Starts with one command |
| Data seeder | Uses the API |

All endpoints must be equivalent to those defined in the API contract.

The implementation must remain consistent with the approved specification.

Each acceptance criterion must have verifiable evidence before final delivery.

## 7. Risk Management

| Risk | Mitigation |
|---|---|
| Inconsistent documentation | Review documentation against the approved specification and actual implementation. |
| Incorrect inventory calculations | Validate business rules and concurrent operations. |
| API integration failures | Test endpoints and frontend communication. |
| Missing automated tests | Track test coverage and the number of test files. |
| Incomplete Git evidence | Review commits, dates, branches, and file changes. |
| Pull request includes unrelated changes | Review the complete change set before merging. |
| Exposure of sensitive credentials | Exclude `.env` files and sensitive information. |
| Incomplete delivery evidence | Maintain a traceable record of implementation and acceptance results. |
| API contract divergence | Reconcile `/api` routes, authentication, categories, health check, and reporting with the approved contract. |
| Administrator inaccessible from phone | Confirm network binding and firewall behavior; mobile access currently reports a timeout. |
| Missing API seeder | Implement and verify the required tool-based data initialization. |
| Untracked public website and uncommitted refinements | Preserve version-control traceability before claiming final delivery. |

## 8. Final Evaluation

The official project delivery date established by the instructor was:

**November 19, 2026 — 6:00 p.m.**

The individual live demonstration was scheduled for:

**November 26, 2026 — From 6:00 p.m.**

The project must be executable, explainable, and consistent with the approved specification. As of the review date, this plan does not assert final delivery or acceptance.

The apprentice must be able to explain architectural decisions, demonstrate the implemented functionality, and implement a change requested during the live demonstration.

The final evaluation must be supported by:

- Project documentation.
- Source code and repository history.
- Automated test results.
- Application execution evidence.
- Verified compliance with the approved requirements.

------------------------------------------------------------------------------------------------------------------------

**End of Project Plan — Mobility Aids**