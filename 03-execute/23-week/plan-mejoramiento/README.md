# Mobility Aids
### Technical Aids Bank for Mobility

**A Technical Mobility Aids Management and Lending System**

![Project](https://img.shields.io/badge/Project-Mobility%20Aids-0B1F33)
![Backend](https://img.shields.io/badge/Backend-Laravel-red)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)
![Database](https://img.shields.io/badge/Database-MySQL-blue)
![Status](https://img.shields.io/badge/Status-Academic%20Recovery-orange)

---

## 1. Project Overview

**Mobility Aids** is a web-based management system designed to organize and support the administration of a technical mobility aids bank.

The system provides a centralized environment for managing technical aids, beneficiaries, inventory, loans, returns, and operational information.

Its main purpose is to improve the organization, availability, traceability, and control of mobility assistance equipment while supporting people who need these resources to improve their independence and quality of life.

The platform combines a public informational website with an administrative web application and a backend API.

The project is being developed as part of the Software Analysis and Development program (ADSO) at SENA, Colombia, under an academic recovery and improvement process.

### Main Goals

- Centralize the management of technical mobility aids.
- Maintain organized beneficiary records.
- Control equipment availability and inventory movements.
- Register and manage equipment loans.
- Record returns and preserve transaction history.
- Monitor equipment under maintenance.
- Provide operational information through administrative reports.
- Apply role-based access control.
- Maintain a structured, documented, and testable software architecture.

---

## 2. Project Objectives

### General Objective

Develop a web application that supports the administration of a technical mobility aids bank through organized inventory management, beneficiary registration, lending operations, returns, and equipment availability monitoring.

### Specific Objectives

1. Implement a centralized technical aids catalog.
2. Organize and maintain beneficiary information.
3. Record loan transactions and their associated items.
4. Control the availability of technical aids.
5. Register returns and preserve historical information.
6. Identify overdue loans and enforce the corresponding business rules.
7. Manage equipment that requires maintenance.
8. Provide an administrative dashboard with operational information.
9. Develop a public website that explains the purpose and services of the project.
10. Establish technical documentation, architecture decisions, and automated tests.

---

## 3. System Components

Mobility Aids is organized into three main application components.

### 3.1 Public Website

The public website is an independent informational website located in the `page/` directory.

It introduces the Mobility Aids project and explains its purpose, categories, benefits, and general operating process.

Its main sections include:

- Home.
- About the project.
- Technical aids categories.
- Benefits.
- How the bank works.
- Promotional content.
- Contact and informational sections.

The website includes:

- A responsive navigation menu.
- A project presentation banner.
- Informational content.
- Technical aids category cards.
- Category images.
- A promotional video.
- Responsive layouts for desktop, tablet, and mobile screens.

The five official technical aids categories are:

1. Wheelchairs.
2. Crutches.
3. Walkers.
4. Canes.
5. Cushions.

The public website is designed to work independently of the administrative application.

### 3.2 Administrative Web Application

The administrative application is built with React and provides the interface used to manage the mobility aids bank.

Its visual identity uses:

- Navy blue as the main interface color.
- Gold accents for important actions and active navigation.
- White content areas.
- Reusable interface components.
- Responsive layouts.

The corporate identity is:

**Mobility Aids**

*Technical Aids Bank for Mobility*

The corporate brand remains in English, while the administrative interface is presented in Spanish.

#### Administrative Modules

**Dashboard**

Provides a general overview of the bank, including inventory and operational indicators.

The dashboard includes:

- Total technical aids.
- Available units.
- Units currently on loan.
- Units under maintenance.
- Active loans.
- Returns.
- Registered beneficiaries.

**Technical Aids**

Supports the management of the technical aids catalog.

The module is intended to organize equipment information, categories, quantities, and operational status.

**Inventory**

Provides an overview of registered equipment and its availability.

Inventory management is important for preventing equipment from being assigned when no units are available.

**Beneficiaries**

Provides the interface for registering, consulting, and maintaining beneficiary information.

Beneficiary records are important because loans must be associated with a valid beneficiary.

**Loans**

Supports the registration and consultation of technical aids loans.

The loan process must validate equipment availability and beneficiary eligibility before completing a transaction.

**Returns**

Supports the registration and consultation of returned loan items.

The return process must preserve transaction history and prevent the same loan item from being returned more than once.

**Reports**

Provides access to operational information about the mobility aids bank.

The reporting capabilities must remain consistent with the implemented backend endpoints and the approved API contract.

**Settings**

Provides access to administrative configuration options.

### 3.3 Backend API

The backend is developed using PHP and Laravel.

It provides the application logic and exposes API endpoints used by the React administrative application.

Its responsibilities include:

- Authentication.
- Authorization.
- Beneficiary management.
- Technical aids management.
- Inventory operations.
- Loan registration.
- Return registration.
- Business rule validation.
- Operational reporting.
- Database persistence.

The backend uses Laravel controllers, models, middleware, routes, migrations, seeders, and automated feature tests.

The API is designed to separate the presentation layer from business logic and data persistence.

---

## 4. Technology Stack

The project uses the following technologies:

| Technology | Purpose |
|---|---|
| React | Administrative user interface |
| JavaScript | Frontend application logic |
| Vite | Frontend development server and build tool |
| CSS3 | Interface styling and responsive layouts |
| PHP | Backend programming language |
| Laravel | Backend framework and REST API |
| MySQL | Relational database |
| Laravel Sanctum | API authentication |
| PHPUnit | Backend automated testing |
| Python HTTP Server | Local public website development server |
| Git | Version control |
| GitHub | Remote repository and collaboration |
| Docker | Database and infrastructure experimentation |

### Frontend

React is used to create reusable components and administrative pages.

Vite provides the development environment and production build process.

### Backend

Laravel organizes the API into routes, controllers, models, middleware, migrations, and services.

### Database

MySQL is used as the relational database for storing system information.

The data model includes entities related to users, beneficiaries, technical aids, categories, inventory, loans, and returns.

### Version Control

Git is used to maintain a traceable development history.

GitHub stores the remote repository and supports branch-based development.

---

## 5. Main Functional Areas

The main functional areas of Mobility Aids are described below.

| Functional Area | Description |
|---|---|
| Authentication | Secure access to the administrative application |
| User Management | Management of authorized system accounts |
| Beneficiary Management | Registration and consultation of beneficiaries |
| Technical Aids Management | Administration of equipment information |
| Inventory Management | Monitoring of available and assigned units |
| Loan Management | Registration and tracking of equipment loans |
| Return Management | Registration and tracking of returned equipment |
| Maintenance | Identification and management of equipment under maintenance |
| Dashboard | Presentation of operational indicators |
| Reports | Consultation of available operational information |

The availability of individual operations depends on the implemented backend endpoints and authorization rules.

---

## 6. Business Rules

The project documentation defines important business rules to protect inventory integrity and loan operations.

The main rules include:

1. A beneficiary must not have more than two outstanding technical aids at the same time.
2. The maximum loan period is 30 days.
3. Beneficiaries with overdue loans must not receive additional loans until their situation is resolved.
4. Available inventory units must never become negative.
5. A loan must not be registered if the requested equipment has no available units.
6. Duplicate technical aid items must not be registered within the same loan.
7. Loan and return history must be preserved.
8. Loan records and returns must not be deleted as ordinary operational records.
9. Technical aids can be logically deactivated instead of being physically deleted.
10. A loan item must not be returned more than once.

These rules are intended to preserve consistency between the application, database, and business processes.

---

## 7. User Roles and Access Control

The system defines administrative roles to separate responsibilities.

### Administrator

The administrator is responsible for administrative supervision and authorized management functions.

The project requirements assign the administrator responsibilities related to the technical aids catalog, management of authorized accounts, and reporting.

### Manager

The manager is responsible for operational activities, including beneficiary management, loan registration, and returns, according to the approved authorization rules.

### Beneficiary

Beneficiaries are the people who receive technical mobility aids through the bank.

They are represented in the system as beneficiary records and are not intended to use the administrative authentication interface.

**Note:** Actual endpoint permissions must be verified against the approved API contract and current middleware configuration.

---

## 8. Loan and Return Workflow

### Loan Workflow

The general loan process follows these steps:

1. Select an existing beneficiary.
2. Verify beneficiary eligibility.
3. Select the requested technical aid.
4. Check available inventory units.
5. Validate the maximum number of outstanding items.
6. Validate the loan period.
7. Register the loan and its associated items.
8. Update inventory availability.
9. Preserve the transaction information for future consultation.

### Return Workflow

The return process follows these steps:

1. Locate the existing loan.
2. Identify the loan item being returned.
3. Verify that the item has not already been returned.
4. Register the return.
5. Update the equipment availability when appropriate.
6. Preserve the return record.
7. Update the loan status according to its remaining items.

### Inventory Control

Inventory must reflect the current operational condition of each technical aid.

The main inventory states include:

- Available.
- On Loan.
- Under Maintenance.

Equipment under maintenance must not be treated as available for new loans.

---

## 9. Maintenance Management

Maintenance is an important operational aspect of the mobility aids bank.

Technical aids may require inspection, repair, or maintenance before they can be assigned to another beneficiary.

The project includes maintenance-related inventory states and management functionality.

The availability of complete maintenance workflows and their final integration with the API should be verified against the current implementation and approved requirements.

---

## 10. Project Architecture

The project separates the public website, administrative frontend, backend API, and database.

```text
Mobility-Aids/
│
├── page/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── assets/
│       ├── images/
│       └── videos/
│
├── app/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── api/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   ├── tests/
│   └── artisan
│
├── docs/
│   ├── constitution.md
│   ├── spec.md
│   ├── plan.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── api-contract.md
│   ├── tasks.md
│   ├── adr/
│   └── evidencias/
│
├── infra/
├── tool/
├── iniciar-mobility-aids.ps1
└── README.md
```

The directory structure represents the main project organization. Individual files and infrastructure resources should be checked in the repository for their current availability.

### Architecture Responsibilities

| Component | Responsibility |
|---|---|
| Public Website | Informational presentation of the project |
| React Application | Administrative interface |
| Laravel API | Business logic and application services |
| MySQL Database | Persistent relational data |
| Git and GitHub | Version control and remote repository |
| Documentation | Requirements, architecture, decisions, and evidence |

---

## 11. Database Design

MySQL is used to persist the information managed by the system.

The database design supports the relationships between the main operational entities.

The data model includes concepts such as:

- Users.
- Beneficiaries.
- Technical aids.
- Technical aid categories.
- Inventory units.
- Loans.
- Loan items.
- Returns.
- Maintenance-related information.

The database structure is documented in:

`docs/data-model.md`

Migrations define the database structure, while seeders provide initial or demonstration data where configured.

Database migrations must be executed only after verifying the environment and database backup.

---

## 12. Authentication and Security

The administrative application uses an authentication mechanism based on Laravel Sanctum.

The backend includes role-based middleware and authorization checks intended to restrict access to protected operations.

Security considerations include:

- Password hashing.
- Protected API endpoints.
- Authentication middleware.
- Role-based authorization.
- Input validation.
- Prevention of unauthorized operations.
- Protection of sensitive configuration.
- Preservation of operational history.

Environment variables and credentials must never be committed to the Git repository.

The project must be evaluated using its actual authentication tests and endpoint authorization behavior rather than assuming that every protected workflow is fully verified.

---

## 13. Automated Testing

Automated testing is used to verify important backend operations and business rules.

The project includes feature tests related to:

- Authentication.
- Beneficiary management.
- Loan registration.
- Inventory availability.
- Overdue loan restrictions.
- Maximum outstanding items.
- Duplicate technical aid prevention.
- Return registration.
- Duplicate return prevention.
- Loan history.
- Loan details.
- Closed loan history.
- Overdue loan history.

Previously executed test groups included:

```bash
php artisan test --filter=LoanApiTest
php artisan test --filter=BeneficiaryApiTest
```

A previous project verification reported 90 passing tests and 365 assertions. This is historical evidence and must not be interpreted as the result of the most recent test execution.

Run the complete suite in a properly configured test environment before declaring the current version fully verified:

```bash
cd api
php artisan test
```

The React application can be checked with:

```bash
cd app
npm run build
```

The results of each test execution should be recorded in the project evidence documentation.

---

## 14. Concurrency and Inventory Integrity

Concurrency is important when two managers attempt to borrow the same equipment at approximately the same time.

The backend includes transaction and locking mechanisms intended to protect inventory consistency.

The implementation uses database transactions and row-level locking through Laravel database operations such as `lockForUpdate()`.

The expected behavior is:

- The first valid request reserves the available unit.
- A competing request must not reserve the same unit.
- Inventory must not become negative.
- Failed transactions must not leave partial loan records.

The project includes manual concurrency evidence in:

`docs/evidencias/punto-07-concurrencia/`

The recorded demonstration showed:

- One successful request returning HTTP 201.
- A second request rejected with HTTP 409.
- Database verification showing one created loan and zero available units.

This evidence demonstrates the observed request results and database consistency for that scenario. It does not, by itself, establish that a fully automated simultaneous concurrency test has been completed.

---

## 15. Technical Documentation

The project includes technical documentation to describe its requirements, design, implementation planning, and architectural decisions.

Main documents:

| Document | Purpose |
|---|---|
| `constitution.md` | Project principles and development agreements |
| `spec.md` | Functional and nonfunctional requirements |
| `plan.md` | Project implementation plan |
| `architecture.md` | System architecture and technical structure |
| `data-model.md` | Database entities and relationships |
| `api-contract.md` | API endpoints, requests, and responses |
| `tasks.md` | Project tasks and implementation tracking |
| `ACCESO_INSTRUCTOR.md` | Local instructor access and setup information |
| `LOCAL_SETUP.md` | Local development startup instructions |
| `adr/` | Architecture Decision Records |
| `evidencias/` | Technical verification evidence |

### Architecture Decision Records

The project contains four Architecture Decision Records (ADRs).

These documents preserve important technical decisions and their rationale.

They are stored in:

`docs/adr/`

The ADRs should be reviewed together with the architecture and API documentation when changes are made to the system.

---

## 16. Development Progress and Project Status

Mobility Aids has been developed through incremental implementation, documentation, testing, and verification activities.

The project has included work on:

- Public website development.
- Administrative interface development.
- Authentication and access control.
- Beneficiary management.
- Technical aids catalog.
- Inventory management.
- Loan operations.
- Return operations.
- Maintenance-related functionality.
- Dashboard and reports.
- Backend API.
- Database design.
- Automated testing.
- Concurrency evidence.
- Technical documentation.
- Local development startup automation.

The project is an academic recovery deliverable. Its documentation and implementation must remain aligned with the official SENA requirements.

Some areas still require additional verification, including:

- Full API contract consistency.
- Complete role authorization.
- Standardized API error responses.
- Additional automated test coverage.
- Automated concurrency testing.
- Complete Docker-based application startup.
- End-to-end verification of administrative workflows.
- Final verification of the 23 project tasks.

The project should not be considered production-ready solely because its development servers start successfully or its frontend builds.

---

## 17. Local Development Requirements

Before starting Mobility Aids locally, make sure the following tools are installed.

| Requirement | Purpose |
|---|---|
| PHP | Laravel backend |
| Composer | PHP dependency management |
| Node.js | React development environment |
| npm | Frontend dependency management |
| Python | Public website local server |
| MySQL | Application database |
| Git | Version control |

The MySQL service must be started separately and the application database must be configured before using database-dependent functionality.

Dependencies must be installed before the first execution.

---

## 18. Starting the Entire Project

A PowerShell startup script is provided at the project root:

`iniciar-mobility-aids.ps1`

The script is intended to start the three local application services in separate terminal windows.

It performs basic project directory checks and verifies that the public website contains `page/index.html`.

### One-command startup

Open PowerShell in the `plan-mejoramiento` directory and execute:

```powershell
powershell -ExecutionPolicy Bypass -File ".\iniciar-mobility-aids.ps1"
```

The script starts:

1. The public website using Python.
2. The administrative React application using Vite.
3. The Laravel backend API.

### Local URLs

| Service | Default URL |
|---|---|
| Public Website | http://localhost:4177/ |
| React Administrator | http://localhost:5173/ |
| Administrator Login | http://localhost:5173/login |
| Laravel API | http://127.0.0.1:8000 |

**Important:** Vite automatically selects another available port if port 5173 is already in use. For example, it may select port 5174. Always use the URL displayed in the Vite terminal.

MySQL is not started by this script and must already be running.

The startup script is a local development convenience. It is not a production deployment solution or a complete Docker orchestration process.

For additional details, see:

`docs/LOCAL_SETUP.md`

---

## 19. Manual Development Startup

If the startup script is unavailable, each component can be started manually.

### Public Website

```powershell
cd page
python -m http.server 4177 --bind 0.0.0.0
```

Open:

`http://localhost:4177/`

### React Application

```powershell
cd app
npm install
npm run dev
```

Open the URL displayed by Vite.

### Laravel API

```powershell
cd api
composer install
php artisan serve
```

The default Laravel development URL is:

`http://127.0.0.1:8000`

Database configuration and required environment variables must be prepared before using database-dependent API operations.

---

## 20. Stopping the Services

Each development server runs in its own terminal window.

To stop a service:

1. Select its terminal window.
2. Press `Ctrl + C`.
3. Confirm the process has stopped.

Repeat for the public website, React application, and Laravel API.

Do not close a terminal while its service is needed.

---

## 21. Git Repository and Branch Strategy

The project is maintained in the ADSO-3239137 repository.

The development branch associated with the current work is:

`feature/activity-6-app`

The remote repository is:

`https://github.com/fierroestiven6-cell/ADSO-3239137`

Git is used to maintain a traceable history of project development.

Commit messages should describe changes clearly and follow a consistent naming convention.

Examples:

```bash
git add .
git commit -m "feat: implement loan management"
```

```bash
git commit -m "fix: improve inventory availability validation"
```

```bash
git commit -m "docs: update technical project documentation"
```

Never commit:

- `.env` files containing secrets.
- Passwords or access tokens.
- Private keys.
- `node_modules/`.
- Unnecessary generated files.
- Database backups containing sensitive information.

Before pushing changes, verify the active branch and inspect the Git working tree.

---

## 22. Project Directory and Deliverable Location

This project is part of the SENA ADSO-3239137 academic recovery activities.

Its repository location is:

`03-execute/23-week/plan-mejoramiento/`

The directory contains the application components, technical documentation, evidence, and supporting resources for the academic deliverable.

The public website, administrative frontend, and backend are maintained as separate application components within the project structure.

---

## 23. Limitations and Important Notes

Mobility Aids is an academic development project and should be evaluated according to the actual state of its source code and verification evidence.

Important distinctions:

- A successful frontend build does not prove that all application workflows work.
- Starting the Laravel server does not prove that every API endpoint is correct.
- A visible login screen does not prove that authentication has been successfully tested.
- Manual concurrency evidence does not replace an automated concurrency test.
- Local access does not mean the application is deployed publicly.
- The local startup script does not replace complete Docker orchestration.
- Documentation must be updated whenever the API, database, or business rules change.

Before using the system in a real operational environment, the project requires complete security, integration, database, backup, and deployment verification.

---

## 24. Future Improvements

Potential improvements include:

- Complete API contract alignment.
- Expanded automated backend test coverage.
- Automated concurrency and integration tests.
- Improved error handling and API response consistency.
- Complete role-based authorization verification.
- Expanded reporting capabilities.
- Full Docker Compose orchestration.
- Automated deployment configuration.
- Additional end-to-end frontend testing.
- Improved monitoring and operational logging.
- Final accessibility and usability verification.

These improvements should be prioritized according to the approved project requirements and academic evaluation criteria.

---

## 25. Project Identity

**Project Name:** Mobility Aids

**Subtitle:** Technical Aids Bank for Mobility

**Academic Program:** Software Analysis and Development (ADSO)

**Institution:** Servicio Nacional de Aprendizaje (SENA)

**Location:** Neiva, Huila, Colombia

**Repository:** ADSO-3239137

**Development Branch:** `feature/activity-6-app`

---

## 26. Acknowledgment

Mobility Aids represents an academic and technical effort to apply software development practices to a practical social need.

The project combines requirements analysis, software architecture, database design, backend development, frontend implementation, testing, documentation, and version control.

Its central purpose is to support the organized management of technical mobility aids and contribute to a more accessible and inclusive environment.

**Mobility Aids — Empowering Mobility, Changing Lives.**