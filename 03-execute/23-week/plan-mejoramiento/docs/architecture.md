# System Architecture — Mobility Aids

**Project:** Mobility Aids | **Identifier:** `mobility-aids` | **Document type:** System Architecture
**Version:** 1.2 | **Reviewed:** 2026-11-26
**Status:** Implementation and acceptance verification in progress
**Reference:** Acta No. 18-2026

------------------------------------------------------------------------------------------------------------------------

## 1. Purpose

This document describes the system architecture of Mobility Aids, a technical aids lending management system developed for the SENA ADSO project.

The architecture follows the technical requirements established in Acta No. 18-2026 and the approved project specification.

The system manages technical aids, beneficiaries, authorized users, lending operations, returns, inventory availability and historical information.

The solution is organized into independent components with clearly defined responsibilities, including a React frontend, a Laravel backend API, persistent storage, a public presentation website, infrastructure and a data initialization tool.

This document describes the approved architecture and the implementation progress supported by the available project evidence.

------------------------------------------------------------------------------------------------------------------------

## 2. Architectural Overview

The solution is organized into the following components:

1. **Frontend Application:** React application developed with Vite for authorized system users.
2. **Backend API:** PHP application developed with Laravel to implement business rules and expose HTTP endpoints.
3. **Database:** Persistent storage for technical aids, beneficiaries, users, loans, returns and historical information.
4. **Public Website:** Static website presenting the Mobility Aids product.
5. **Infrastructure:** Containerized environment for the database and application services.
6. **Seed Tool:** API-based tool for initializing demonstration data.

The frontend and backend communicate through HTTP requests. Business rules and authorization must be enforced by the backend.

-----------------------------------------------------------------------------------------------------------------------

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Frontend Build Tool | Vite |
| Frontend Language | JavaScript |
| Backend | PHP |
| Backend Framework | Laravel |
| API Communication | HTTP and Axios |
| Authentication | Laravel authentication and role-based authorization |
| Database | MySQL 8.4, InnoDB target (ADR-004; Docker Compose image verified) |
| Public Website | Static website |
| Containers | Docker and Docker Compose |
| Data Initialization | API-based seeder |
| Version Control | Git and GitHub |

The implementation must remain consistent with the mandatory technology stack and the decisions documented in the Architecture Decision Records.

Database and infrastructure details must not be assumed when they have not been verified against the corresponding configuration and ADR documents.

------------------------------------------------------------------------------------------------------------------------

## 4. System Components

### 4.1 Frontend Application

**Location:** `app/`

**Technology:** React and Vite.

The frontend provides the user interface for administrators and managers.

Its implementation is organized into reusable components, layouts, services, hooks and functional pages.

The main responsibilities include:

- Displaying the application interface and navigation.
- Managing user authentication and protected routes.
- Communicating with the Laravel API through the configured API client.
- Displaying inventory statistics and operational information.
- Managing beneficiary information.
- Displaying technical aids and inventory availability.
- Managing lending and return operations.
- Presenting reports and system settings.
- Displaying validation results and user-facing messages in Spanish.
- Maintaining a responsive and consistent visual interface.

#### 4.1.1 Frontend Structure

The application follows this internal organization:

```text
app/
├── src/
│   ├── assets/
│   │   ├── icons/
│   │   ├── images/
│   │   └── videos/
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── beneficiaries/
│   │   ├── inventory/
│   │   ├── technical-aids/
│   │   ├── loans/
│   │   ├── returns/
│   │   ├── reports/
│   │   └── settings/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   ├── auth.js
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── .gitignore
```

The structure represents the application organization. Individual files and modules must remain consistent with the actual repository.

#### 4.1.2 Implemented Frontend Modules

The React application includes the following implemented interface modules:

| Module | Responsibility |
|---|---|
| Authentication | User login and access to protected application routes. |
| Dashboard | Displays inventory statistics and relevant system information. |
| Beneficiaries | Provides beneficiary registration, consultation and management interfaces. |
| Inventory | Displays inventory information and availability. |
| Technical Aids | Provides technical aid catalog management interfaces. |
| Loans | Provides lending operations and loan information. |
| Returns | Provides return registration and return history interfaces. |
| Reports | Presents reports and operational statistics. |
| Settings | Provides the system settings interface. |

The frontend also includes reusable UI components, an administrative layout, authentication services, API communication services, global styles and responsive module-specific styles.

The application resources include images, an application icon and a promotional video.

Responsive refinements are present in `app/src/layouts/AdminLayout.jsx` and `app/src/styles/index.css`. Their worktree status at the start of the final release review and subsequent release activity are reported separately. The source existence and UI checks do not prove that all administrative API workflows work end to end.

The existence of an interface module does not, by itself, establish that every operation has completed end-to-end integration testing.

### 4.2 Backend API

**Location:** `api/`

**Technology:** PHP and Laravel.

The backend implements the business logic and exposes the HTTP API consumed by the frontend.

Its responsibilities include:

- Processing application requests.
- Validating request data.
- Enforcing the approved business rules.
- Managing user authentication and role-based authorization.
- Managing technical aid records and categories.
- Managing beneficiaries.
- Processing lending and return operations.
- Maintaining inventory consistency.
- Preserving historical operation information.
- Returning standardized HTTP responses and error messages.

Business rules must be enforced by the backend, not exclusively by the frontend.

Authentication and authorization must distinguish between the `admin` and `manager` roles according to the project specification.

The beneficiary is a system record and does not authenticate or access the application.

### 4.3 Database

The database stores the persistent information required by the application.

Its responsibilities include:

- Persisting technical aids and categories.
- Storing beneficiary information.
- Storing authorized user information.
- Recording lending operations and loan lines.
- Recording returns.
- Maintaining inventory quantities and availability.
- Preserving historical operation information.
- Enforcing data integrity and referential constraints.
- Supporting transactional inventory operations.

The database engine, schema and physical configuration must follow the approved data model and Architecture Decision Records.

### 4.4 Public Website

**Location:** `page/`

The public website is a static HTML, CSS, and JavaScript presentation independent of the internal application, Laravel, React, and the API. Its main files are `page/index.html`, `page/styles.css`, and `page/script.js`.

The implementation includes:

- The official Mobility Aids icon as header branding and favicon, retaining the navy-blue, gold, and white identity.
- The five official categories: Wheelchairs, Crutches, Walkers, Canes, and Cushions.
- The existing Cushions photograph, category photographs, hero image, and `publicidad-mobility-aids.mp4`.
- Hero, purpose, categories, benefits, process, promotional-video, and footer sections.
- Responsive navigation, a mobile menu, and mobile hero treatment intended to prevent clipping and horizontal page overflow.

The local address recorded for public verification is `http://127.0.0.1:4173/`. The project operator also reports successfully opening the website on a phone through the local network at `http://192.168.1.27:4177/`. These are local/private-network addresses, not public Internet deployments. The distinction between source breakpoint inspection, browser viewport checks, and reported physical-device access is recorded in `evidencias/estado-verificacion-2026-11-26.md`.

The website must describe the actual product rather than the technical evaluation or academic recovery process.

### 4.5 Infrastructure

**Location:** `infra/`

The infrastructure contains the configuration required to execute the application environment.

Its responsibilities include:

- Defining the required containers.
- Configuring the database service.
- Configuring the application services.
- Supporting reproducible environment startup.
- Protecting sensitive credentials and configuration values.

The complete environment must comply with the infrastructure requirements established in the project specification.

Sensitive credentials and local environment files must not be committed to the repository.

The inspected `infra/docker-compose.yml` defines the MySQL 8.4 service. It does not define the Laravel API or React development server, so the complete single-command application startup requirement is not demonstrated by this Compose file alone.

### 4.6 Seed Tool

**Location:** `tool/`

An API-based seed tool is a project requirement. The `tool/` directory was inspected and contains no implementation files as of 2026-11-26; the seed tool must therefore be treated as pending.

Its responsibilities include:

- Creating the required initial data.
- Registering the five predefined technical aid categories.
- Using the documented API endpoints.
- Producing reproducible demonstration data.

When implemented, the seed process must respect the API contract and the approved project specification.

------------------------------------------------------------------------------------------------------------------------

## 5. Communication Flow

The main application communication follows this flow:

1. The administrator or manager accesses the React application.
2. The frontend manages authentication and protected application routes.
3. The frontend sends HTTP requests through the configured API communication service.
4. The Laravel API receives and validates the request.
5. The backend verifies authentication, authorization and applicable business rules.
6. The backend processes the operation using persistent storage.
7. The API returns the corresponding HTTP response.
8. The frontend displays the operation result or validation message to the user.

The public website operates independently of the internal application interface.

------------------------------------------------------------------------------------------------------------------------

## 6. Business Rule Enforcement

The backend must enforce the following project rules:

- A beneficiary may have a maximum of two outstanding technical aids.
- The maximum lending period is 30 days.
- Beneficiaries with overdue technical aids cannot receive additional aids until the overdue items are returned.
- Available inventory must always remain between zero and total inventory.
- Historical information stored in a loan line must not change when the technical aids catalog is updated.
- Lending operations and returns cannot be deleted.
- Technical aids must use logical deactivation instead of physical deletion.
- A technical aid cannot be returned more than once.
- User permissions must follow the approved `admin` and `manager` roles.

The frontend may provide validation and confirmation messages, but backend enforcement remains mandatory.

------------------------------------------------------------------------------------------------------------------------

## 7. Concurrency Management

The backend and database must guarantee inventory consistency during simultaneous lending operations.

When two managers attempt to lend the last available unit:

- Only one operation may succeed.
- The other operation must receive HTTP 409 Conflict.
- Inventory must never become negative.
- Incomplete lending operations must not be persisted.

Inventory changes and return operations must be performed transactionally to prevent inconsistent quantities and duplicate updates.

------------------------------------------------------------------------------------------------------------------------

## 8. Security and Data Protection

The architecture must protect application information and enforce the access rules defined in the project specification.

The following requirements apply:

- Authentication is required for protected application operations.
- Access permissions must be checked according to user roles.
- Passwords must never be stored or transmitted in plain text.
- Sensitive credentials must not be committed to the public repository.
- Environment-specific configuration must be handled through environment variables.
- Dates and timestamps must be stored and processed in UTC.
- User-facing messages must be written in Spanish.
- Historical lending information must remain consistent.

The frontend must not be considered the only security boundary. Authorization and business rule enforcement belong to the backend.

------------------------------------------------------------------------------------------------------------------------

## 9. Project Structure

The solution follows this organization:

```text
plan-mejoramiento/
├── docs/
│   ├── constitution.md
│   ├── spec.md
│   ├── plan.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── api-contract.md
│   ├── tasks.md
│   └── adr/
├── api/
├── app/
├── page/
├── infra/
└── tool/
```

Each component has a separate responsibility.

The `app/` directory contains the React frontend, while `api/` contains the Laravel backend.

The remaining directories support documentation, public presentation, infrastructure and data initialization.

------------------------------------------------------------------------------------------------------------------------

## 10. Architectural Decisions

Technology choices and significant implementation decisions must be documented in Architecture Decision Records.

The ADR documents must explain:

- The context of each decision.
- The alternatives considered.
- The selected approach.
- The consequences of the decision.

The implementation must comply with the accepted decisions and the mandatory technology stack established for the project.

------------------------------------------------------------------------------------------------------------------------

## 11. Source of Truth

The architecture must remain consistent with:

- Acta No. 18-2026.
- `constitution.md`.
- `spec.md`.
- `data-model.md`.
- `api-contract.md`.
- Accepted Architecture Decision Records.

Any architectural change that affects project requirements must be reviewed and documented before implementation.

The architecture document must be updated when relevant implementation decisions change.

## 12. Local Runtime and Verification Status

The following local demonstration details were supplied by the project operator on 2026-11-26; they are not a claim of independent network or firewall verification:

- Start the Laravel API from `api/` with `php artisan serve --host=0.0.0.0 --port=8000`.
- Start the React/Vite administrator from `app/` with `npm run dev -- --host 0.0.0.0`.
- Ports 5173 and 5174 were reported as occupied during the demonstration, so Vite selected port 5175. The laptop login screen was visually checked at `http://localhost:5175/login`.
- The operator reports that Windows Firewall rules were created for TCP ports 5175 and 8000 on the Private profile.
- Accessing the administrator from a phone was not successful; the phone displayed `ERR_CONNECTION_TIMED_OUT`. Mobile administrator/API access and end-to-end acceptance therefore remain unverified.

The public website's reported successful phone access does not imply that the administrator is reachable from a phone. Full API authentication, CRUD workflows, roles, loan restrictions, inventory concurrency, and production deployment remain separate verification items.

-----------------------------------------------------------------------------------------------------------------------

**End of System Architecture — Mobility Aids**