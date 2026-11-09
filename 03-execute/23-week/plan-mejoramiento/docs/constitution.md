# Mobility Aids — Project Constitution

**Project:** Mobility Aids  
**Identifier:** `mobility-aids`  
**Version:** 1.0.0  
**Status:** Initial  
**Reference:** Acta No. 18 - 2026

## 1. Purpose

Mobility Aids is a technical aid management system designed to manage assistive devices for people with mobility needs.

The system must provide reliable management of beneficiaries, assistive devices, inventory units, loans, returns, and the most requested assistive devices report.

## 2. Domain Integrity

- The system must use the Mobility Aids domain.
- Assistive devices must be identified by their reference.
- Each assistive device must have a total number of units.
- The system must distinguish between the assistive device catalog and individual loan operation records.

## 3. Business Rules

The following rules are mandatory:

1. Each beneficiary may have a maximum of two unreturned assistive devices.
2. The loan period is 30 days.
3. Beneficiaries with overdue loans cannot receive additional devices until they return the overdue devices.
4. Available units must always remain between zero and the total number of units.
5. Device information recorded in an operation must remain independent of subsequent catalog changes.
6. Loan operations and returns must never be physically deleted.
7. Catalog records must use logical deletion.

## 4. Data and Time Integrity

- All dates and timestamps must be stored and handled in UTC.
- Inventory operations must preserve data consistency.
- Concurrent operations must not allow the same available unit to be assigned twice.

## 5. Concurrency Control

When two operators attempt to assign the last available unit simultaneously:

- Only one operation may succeed.
- The competing operation must receive HTTP 409 Conflict.

## 6. Technology Requirements

The project must use:

- React for the frontend.
- PHP with Laravel for the backend.
- A database running through containers.
- A single command to start the containerized environment.
- An API-based data seeder.

## 7. Language Standards

- Source code identifiers must be written in English.
- Technical documentation must be written in English.
- ADRs and automated tests must be written in English.
- User-facing messages must be written in Spanish.

## 8. Specification-Driven Development

All implementation work must follow the approved project specification.

The project must include:

- 10 user stories.
- 6 business rules.
- 5 non-functional requirements.
- All equivalent API endpoints defined in the API contract.
- 23 implementation tasks.
- At least 15 automated test files.
- At least 3 Architecture Decision Records (ADRs).

No functionality outside the approved specification may be implemented.

## 9. Quality and Verification

- Every implementation task must have verifiable evidence.
- Automated tests must validate the required business behavior.
- Inventory integrity and concurrent operations must be tested.
- The complete application must be executable in the containerized environment.

## 10. Version Control

- Changes must be committed in small, meaningful increments.
- Commits must be distributed across at least eight different days.
- The project history must not be rewritten.
- `.env` files and `node_modules` must not be included in the repository.

## 11. Source of Truth

The official requirements for this individual improvement plan are defined in:

**Acta No. 18 - 2026 — Mobility Aids.**

The project specification and all implementation decisions must remain consistent with that document.

Any requirement not established by the official source must be reviewed before implementation.
--------------------------------------------------------------------------------
**End of Constitution**