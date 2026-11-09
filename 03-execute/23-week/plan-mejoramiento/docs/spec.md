# Project Specification — Mobility Aids

**Project identifier:** `mobility-aids`  
**Project type:** Technical aids lending management system  
**Reference:** Manager Library specification, adapted to the assigned Mobility Aids domain.

--------------------------------------------------------------------------------
## 1. Purpose

Mobility Aids is a system designed to manage a technical aids bank. It allows administrators and managers to maintain a catalog of technical aids, register beneficiaries, manage loans and returns, monitor overdue loans, and generate reports of the most requested technical aids.

The system must preserve inventory consistency, maintain the history of operations, and prevent unauthorized access.

The project follows the principles established in `constitution.md`.

The data model is defined exclusively in `data-model.md`, and the HTTP interface is defined exclusively in `api-contract.md`.
--------------------------------------------------------------------------------
## 2. Actors

| Actor | Responsibilities | Authentication |
|---|---|---|
| Administrator (`admin`) | Manages the technical aids catalog, creates managers, and accesses all reports. | Username and password → token |
| Manager (`manager`) | Registers loans and returns, manages beneficiaries, and consults the catalog and overdue loans. | Username and password → token |
| Beneficiary | Receives technical aids through the lending process. | Does not access the system. |

The `admin` role is provisioned during deployment through environment variables. It cannot be assigned through the application API.

Beneficiaries are records in the system, not authenticated users.
--------------------------------------------------------------------------------
## 3. Scope

### 3.1 Included functionality

The system includes:

- User authentication with role-based access.
- Manager registration by an administrator.
- Technical aids catalog management.
- Five predefined technical aid categories:
  - Wheelchairs.
  - Crutches.
  - Walkers.
  - Canes.
  - Cushions.
- Technical aid identification by reference.
- Inventory management and availability tracking.
- Beneficiary registration and search.
- Loans containing one or more technical aid lines, subject to the maximum outstanding limit.
- Returns registered individually by loan line.
- Overdue loan monitoring.
- Loan history and status consultation.
- Reports of the most requested technical aids.

### 3.2 Excluded functionality

The implementation must not introduce functionality outside the approved specification.

Any additional feature requires an explicit change to the specification before implementation.
--------------------------------------------------------------------------------
## 4. User Stories and Acceptance Criteria

### HU-01 — User Authentication

As a system user, I want to authenticate myself so that I can access the functionalities permitted by my assigned role.

**Acceptance Criteria**

- **CA-01.1:** Valid credentials return an authentication token with an expiration time of 8 hours.
- **CA-01.2:** Invalid credentials return HTTP 401 with a generic message that does not reveal whether the username or password was incorrect.
- **CA-01.3:** Every endpoint except authentication and `/health` requires a valid token. Missing or invalid tokens return HTTP 401. Insufficient permissions return HTTP 403.

### HU-02 — Register Managers

As an administrator, I want to register managers so that authorized personnel can operate the technical aids bank.

**Acceptance Criteria**

- **CA-02.1:** The administrator can create a manager account with a username, password, and `manager` role.
- **CA-02.2:** Usernames are trimmed, converted to lowercase, and unique. Duplicate usernames return HTTP 409.
- **CA-02.3:** Assigning the `admin` role through the API returns HTTP 422. Passwords must never be returned in responses or recorded in logs.

### HU-03 — Manage Technical Aids

As an administrator, I want to manage technical aids so that the catalog and inventory remain accurate.

**Acceptance Criteria**

- **CA-03.1:** The administrator can register a technical aid using its unique reference, category, and total number of units. Initially, available units equal total units.
- **CA-03.2:** A technical aid reference must be unique among active records. Duplicate references return HTTP 409.
- **CA-03.3:** The total number of units must be at least 1. Changing the total adjusts available units by the same difference and must never result in negative availability. Invalid changes return HTTP 422.
- **CA-03.4:** Technical aids can be updated while preserving inventory consistency.
- **CA-03.5:** Removing a technical aid is a logical deletion. It must remain available in historical loan records. A technical aid with outstanding loans cannot be deactivated and returns HTTP 409.

### HU-04 — Search Technical Aids

As a system user, I want to search for technical aids so that I can identify available resources.

**Acceptance Criteria**

- **CA-04.1:** The system supports partial reference searches, category filtering, active records only, reference-based ordering, and pagination using `page` and `size`. The maximum page size is 50.
- **CA-04.2:** Search responses include the total number of matching records.
- **CA-04.3:** Requesting a nonexistent or deactivated technical aid returns HTTP 404.

### HU-05 — Manage Beneficiaries

As an administrator or manager, I want to register and search beneficiaries so that their information can be used during lending operations.

**Acceptance Criteria**

- **CA-05.1:** Administrators and managers can register beneficiaries using their name and identification document. Duplicate identification documents return HTTP 409.
- **CA-05.2:** The system allows beneficiaries to be listed and searched by name or identification document, with pagination.
- **CA-05.3:** Beneficiary records cannot be deleted.

### HU-06 — Register a Loan

As a manager, I want to register a technical aids loan so that the delivery of resources to a beneficiary is properly recorded.

**Acceptance Criteria**

- **CA-06.1:** A loan belongs to exactly one beneficiary, is registered by the authenticated user, and contains one or more loan lines. A beneficiary cannot exceed the maximum of two outstanding technical aids.
- **CA-06.2:** The same technical aid cannot appear more than once in the same loan. Invalid requests return HTTP 422.
- **CA-06.3:** Each loan line decreases available inventory by one unit in the same transaction. If no units are available, the operation returns HTTP 409 and no partial loan is registered.
- **CA-06.4:** A beneficiary cannot have more than two technical aids without returning them. Violations return HTTP 422 with the current outstanding count.
- **CA-06.5:** A beneficiary with an overdue technical aid cannot receive another technical aid until the overdue item is returned. The operation returns HTTP 409.
- **CA-06.6:** The due date is calculated as `loaned_at + 30 days`. Information frozen in each loan line must remain unchanged when catalog information is modified.
- **CA-06.7:** Registered loans cannot be edited or deleted.

### HU-07 — Register a Return

As a manager, I want to register the return of a technical aid so that inventory availability is updated correctly.

**Acceptance Criteria**

- **CA-07.1:** Returns are processed one loan line at a time. The system records `returned_at` and increases available inventory by one unit.
- **CA-07.2:** Returning an already returned line returns HTTP 409. Inventory must never be increased twice.
- **CA-07.3:** Available units must never exceed total units.
- **CA-07.4:** When all loan lines have been returned, the loan status becomes `closed`.

### HU-08 — Consult and List Loans

As a manager or administrator, I want to consult loan details and search loan records so that I can monitor lending operations.

**Acceptance Criteria**

- **CA-08.1:** Consulting a loan returns its details, loan lines, and calculated status: `open`, `overdue`, or `closed`.
- **CA-08.2:** Loans can be filtered by date range, status, and beneficiary, ordered by descending loan date, and paginated.
- **CA-08.3:** Loan status is calculated from the loan dates and return records. It is not stored as an independent value.

### HU-09 — Consult Overdue Loans

As a manager or administrator, I want to consult overdue technical aids so that I can identify beneficiaries with pending returns.

**Acceptance Criteria**

- **CA-09.1:** The system lists unreturned loan lines whose `due_at` date is earlier than the current UTC time. Results include the technical aid, beneficiary, and number of overdue days.
- **CA-09.2:** Results are ordered by the highest number of overdue days first. Access is restricted to `admin` and `manager` roles.

### HU-10 — Report Most Requested Technical Aids

As an administrator, I want to generate reports of the most requested technical aids so that I can identify demand and evaluate resource utilization.

**Acceptance Criteria**

- **CA-10.1:** Given a date range, the report returns one row per technical aid and its frozen category name, including the number of times it was requested, ordered from highest to lowest.
- **CA-10.2:** An end date earlier than the start date returns HTTP 422. A period without loans returns an empty list.
- **CA-10.3:** The report is not grouped by manager or beneficiary.
- **CA-10.4:** Historical reports must not change when a technical aid or its category is subsequently modified.
- **CA-10.5:** Only administrators can access this report.
--------------------------------------------------------------------------------
## 5. Business Rules

| ID | Business Rule |
|---|---|
| BR-01 | Available units must always remain between zero and the total number of units. |
| BR-02 | The maximum loan period is 30 days. A beneficiary may have a maximum of two technical aids without returning them. |
| BR-03 | A beneficiary with overdue technical aids cannot receive additional aids until all overdue items are returned. |
| BR-04 | Information frozen in a loan line must not change when the technical aids catalog is updated. |
| BR-05 | Loans and returns cannot be deleted. Technical aids can only be removed through logical deletion. |
| BR-06 | All dates are stored and processed in UTC. User-facing messages must be in Spanish, while code identifiers and database columns must be in English. |
--------------------------------------------------------------------------------
## 6. Non-Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-01 | Technical aid searches must respond in less than 300 ms with 5,000 catalog records. | Load test using the demonstration data seeder. |
| NFR-02 | When two managers attempt to deliver the last available unit simultaneously, only one operation succeeds. The other receives HTTP 409. | Automated concurrency test. |
| NFR-03 | Passwords must never be transmitted or stored in plain text and must never appear in application logs. | Security and log inspection. |
| NFR-04 | All HTTP errors must follow the same standardized response structure defined in `api-contract.md`. | Automated API contract tests. |
| NFR-05 | The complete environment must start with a single command, and the database must initially be empty. | Infrastructure startup verification. |
--------------------------------------------------------------------------------
## 7. Authorization Requirements

The system must enforce role-based access control.

- `admin`: manages the catalog, creates managers, and accesses reports.
- `manager`: registers beneficiaries, processes loans and returns, and consults operational information.
- `beneficiary`: does not authenticate or access the application.

Unauthorized requests must return HTTP 401 or HTTP 403 according to the authentication and authorization rules.
--------------------------------------------------------------------------------
## 8. Inventory and Concurrency Integrity

Inventory operations must be transactional.

When two managers attempt to register a loan for the last available unit simultaneously:

1. The system must validate the available inventory.
2. Only one transaction can successfully reserve the unit.
3. The other transaction must fail with HTTP 409.
4. The inventory must never become negative.
5. No incomplete loan must remain registered.

Returns must also be transactional to prevent duplicate inventory increases.
--------------------------------------------------------------------------------
## 9. Localization and Date Handling

- All code identifiers, variable names, class names, database columns, and API identifiers must use English.
- All messages displayed to users must be written in Spanish.
- All dates and timestamps must use UTC.
- The system must calculate overdue periods consistently using UTC.
--------------------------------------------------------------------------------
## 10. Scope Compliance

The implementation must correspond exactly to the ten user stories, six business rules, and five non-functional requirements defined in this document.

The API endpoints must be documented in `api-contract.md`.

The implementation tasks and their verification evidence must be documented in `tasks.md`.

No functionality outside this specification may be introduced without an approved specification change.

--------------------------------------------------------------------------------
**End of Project Specification — Mobility Aids**