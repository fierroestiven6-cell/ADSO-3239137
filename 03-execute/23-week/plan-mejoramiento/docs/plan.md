# Project Plan — Mobility Aids

**Project ID:** `mobility-aids`  
**Document:** Project Plan  
**Status:** In Progress  
**Reference:** Acta No. 18-2026
--------------------------------------------------------------------------------
## 1. Project Objective

The objective of this project is to design, develop, test and deliver a complete technical aids management system for people with mobility needs.

The system will be based on the requirements established in the project specification and the instructor's Acta No. 18-2026.

The final product must include a React frontend, a PHP Laravel backend, a static public website, containerized infrastructure and an API-based data seeder.

## 2. Project Scope

The project includes the following components:

| Component | Responsibility |
|---|---|
| `docs/` | Technical documentation and architecture decisions |
| `api/` | Backend implementation using PHP and Laravel |
| `app/` | Frontend implementation using React |
| `page/` | Static public product website |
| `infra/` | Container and database configuration |
| `tool/` | API-based initial data seeder |

All functionality must remain within the approved project specification.

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

**Deliverable:** Complete project documentation.

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

**Deliverable:** Functional backend API.

### Phase 3 — Frontend Development

**Objective:** Build the user interface using React.

Activities:

- Configure the React application.
- Implement the interfaces required by the specification.
- Integrate the frontend with the Laravel API.
- Display inventory and operation information.
- Implement validation and error messages.
- Display user-facing messages in Spanish.

**Deliverable:** Functional React application.

### Phase 4 — Public Website

**Objective:** Present the Mobility Aids product through a static website.

Activities:

- Build the public product presentation.
- Explain the system's purpose.
- Present its main characteristics.
- Ensure the website describes the actual product rather than the technical examination.

**Deliverable:** Static public website.

### Phase 5 — Infrastructure and Data Seeding

**Objective:** Prepare a reproducible execution environment.

Activities:

- Configure the required containers.
- Configure the database.
- Ensure the database environment starts with one command.
- Implement the initial data seeder through the API.
- Include the five predefined technical aid categories.

**Deliverable:** Reproducible containerized environment and functional seeder.

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
- Validate the consistency between documentation and implementation.

**Deliverable:** Automated testing evidence and validated application.

### Phase 7 — Final Delivery

**Objective:** Prepare the repository for evaluation.

Activities:

- Review all 23 implementation tasks.
- Verify the required project structure.
- Include the project README.
- Include the anonymized Acta PDF.
- Verify that no `.env` files or `node_modules` directories are committed.
- Review the Git history.
- Prepare the individual live demonstration.

**Deliverable:** Complete Mobility Aids project ready for evaluation.
--------------------------------------------------------------------------------
## 4. Work Schedule

The following schedule establishes the planned development and verification days.

| Planned date | Main activity |
|---|---|
| November 8, 2026 | Project setup and initial documentation |
| November 9, 2026 | Requirements and data model |
| November 10, 2026 | API contract and backend preparation |
| November 11, 2026 | Backend implementation |
| November 12, 2026 | Backend validation and testing |
| November 13, 2026 | React frontend development |
| November 16, 2026 | Public website and infrastructure |
| November 18, 2026 | Integration, testing and final review |

The schedule is a work plan, not evidence of completed work. Actual progress must be demonstrated through Git commits and project files.
--------------------------------------------------------------------------------
## 5. Git Workflow and Traceability

All project changes must be recorded through small, meaningful commits.

The following rules apply:

- Use descriptive commit messages in English.
- Commit each completed document or implementation increment.
- Maintain the existing Git history.
- Do not rewrite previous commits.
- Distribute commits across at least eight distinct calendar days.
- Target at least four meaningful commits per project subfolder: `docs/`, `api/`, `app/`, `page/`, `infra/` and `tool/`.
- Verify the actual commit dates and file changes before delivery.

Example commit messages:

```text
docs: define project requirements
docs: document system architecture
feat: implement technical aid management
feat: integrate lending operations
test: validate inventory constraints
```
No `.env` files or `node_modules` directories may be committed.
--------------------------------------------------------------------------------
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
| Backend | PHP with Laravel |
| Public website | Static website |
| Database environment | Starts with one command |
| Data seeder | Uses the API |

All endpoints must be equivalent to those defined in the API contract.

The implementation must remain consistent with the approved specification.

## 7. Risk Management

| Risk | Mitigation |
|---|---|
| Inconsistent documentation | Review documentation against the specification |
| Incorrect inventory calculations | Validate business rules and concurrent operations |
| API integration failures | Test endpoints before frontend integration |
| Missing automated tests | Track test coverage and test files |
| Incomplete Git evidence | Review commits and dates regularly |
| Exposure of sensitive credentials | Exclude `.env` and sensitive information |

## 8. Final Evaluation

The project must be delivered by:

**November 19, 2026 — 6:00 p.m.**

The individual live demonstration is scheduled for:

**November 26, 2026 — From 6:00 p.m.**

The project must be executable, explainable and consistent with the specification.

The apprentice must be able to explain architectural decisions and implement a change requested during the live demonstration.
--------------------------------------------------------------------------------
**End of Project Plan — Mobility Aids**