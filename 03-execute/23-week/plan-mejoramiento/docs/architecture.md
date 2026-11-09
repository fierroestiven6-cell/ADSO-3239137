# System Architecture — Mobility Aids

**Project:** Mobility Aids  
**Identifier:** `mobility-aids`  
**Document type:** System Architecture  
**Status:** Draft for review
--------------------------------------------------------------------------------
## 1. Purpose

This document describes the high-level architecture of the Mobility Aids system.

The architecture follows the technical requirements established in Acta 18-2026.

The system will manage technical aids, beneficiaries, managers, lending operations, returns, inventory and historical information.
--------------------------------------------------------------------------------
## 2. Architectural Overview

The solution is organized into the following components:

1. **Frontend Application:** React application for system users.
2. **Backend API:** PHP application developed with Laravel.
3. **Database:** Persistent storage for system information.
4. **Public Website:** Static website presenting the product.
5. **Infrastructure:** Containerized environment for the database and application services.
6. **Seed Tool:** Data initialization through the API.
--------------------------------------------------------------------------------
## 3. Technology Stack

| Component | Required technology |
|---|---|
| Frontend | React |
| Backend | PHP |
| Backend Framework | Laravel |
| Public Website | Static website |
| Database | To be defined in an architecture decision |
| Containers | Containerized environment |
| Data Initialization | API-based seeder |

No additional framework or infrastructure technology is assumed without a documented decision.
--------------------------------------------------------------------------------
## 4. System Components

### 4.1 Frontend Application

**Location:** `app/`

The React application provides the interface for authorized system users.

Its responsibilities include:

- Displaying system information.
- Managing user interactions.
- Communicating with the backend API.
- Displaying operation results and validation messages.
- Presenting inventory and lending information.

### 4.2 Backend API

**Location:** `api/`

The backend is implemented using PHP and Laravel.

Its responsibilities include:

- Processing application requests.
- Validating business rules.
- Managing technical aid records.
- Managing beneficiaries and managers.
- Processing lending and return operations.
- Maintaining inventory consistency.
- Preserving historical information.
- Returning appropriate HTTP responses.

Business rules must be enforced by the backend, not exclusively by the frontend.

### 4.3 Database

The database stores the information required by the application.

Its responsibilities include:

- Persisting technical aids and categories.
- Storing beneficiary information.
- Storing lending operations and returns.
- Maintaining inventory quantities.
- Preserving historical operation data.
- Supporting consistent concurrent operations.

The database engine and physical implementation will be documented through an Architecture Decision Record (ADR).

### 4.4 Public Website

**Location:** `page/`

A static website presents the Mobility Aids product.

It must communicate the purpose and characteristics of the system.

It must present the product itself, not the technical evaluation or recovery test.

### 4.5 Infrastructure

**Location:** `infra/`

The infrastructure contains the configuration required to run the containerized environment.

The database containers must be started using a single command.

Sensitive credentials must not be committed to the public repository.

### 4.6 Seed Tool

**Location:** `tool/`

The seed tool initializes the application with the required initial data through the API.

The five predefined technical aid categories must be included.
--------------------------------------------------------------------------------
## 5. Communication Flow

The main application communication follows this flow:

1. The user interacts with the React application.
2. The frontend sends an HTTP request to the Laravel API.
3. The backend validates the request and applicable business rules.
4. The backend processes the operation using persistent storage.
5. The API returns the operation result.
6. The frontend displays the corresponding response to the user.

The public website is independent of the internal application interface.
--------------------------------------------------------------------------------
## 6. Business Rule Enforcement

The backend must enforce the following project rules:

- A beneficiary may have a maximum of two technical aids without returning them.
- The lending period is 30 days.
- Beneficiaries with overdue technical aids cannot receive additional aids until the overdue items are returned.
- Available inventory must always remain between zero and total inventory.
- Historical information stored in an operation line must not change when the catalog changes.
- Lending operations and returns cannot be deleted.
- Catalog records use logical deactivation instead of physical deletion.
--------------------------------------------------------------------------------
## 7. Concurrency Management

The backend and database must guarantee inventory consistency during simultaneous lending operations.

When two managers attempt to lend the last available unit:

- Only one operation may succeed.
- The other operation must receive HTTP 409 Conflict.
- Inventory must never become negative.
- Incomplete operations must not be persisted.
--------------------------------------------------------------------------------
## 8. Security and Data Protection

The architecture must protect application information and enforce the access rules defined in the project specification.

Sensitive credentials must not be stored in the public repository.

Dates and timestamps must be handled in UTC.

User-facing messages must be written in Spanish.
--------------------------------------------------------------------------------
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
--------------------------------------------------------------------------------
## 10. Architectural Decisions

Technology choices and significant implementation decisions must be documented in Architecture Decision Records.

The ADR documents will explain:

- The context of each decision.
- The alternatives considered.
- The selected approach.
- The consequences of the decision.
--------------------------------------------------------------------------------
## 11. Source of Truth

The architecture must remain consistent with:

- Acta 18-2026.
- `constitution.md`.
- `spec.md`.
- `data-model.md`.

Any architectural change that affects requirements must be reviewed and documented.
--------------------------------------------------------------------------------
**End of System Architecture — Mobility Aids**