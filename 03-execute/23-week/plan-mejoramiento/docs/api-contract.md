# API Contract — Mobility Aids

**Project ID:** `mobility-aids` | **Document:** API Contract | **Version:** 1.2
**Reviewed:** 2026-11-26
**Status:** Target contract under implementation; current-route deviations are listed below.
**Reference:** Acta No. 18-2026

---

## 1. Purpose

This document defines the HTTP API contract for Mobility Aids.

The API provides communication between the React frontend and the Laravel backend.

It establishes the expected endpoints, request formats, response structures, authorization requirements and error handling conventions.

All endpoints must comply with the project constitution, approved project specification, business rules and logical data model.

The API implementation must be verified against this contract before final delivery.

## 2. General Conventions

| Item | Convention |
|---|---|
| Base URL | Target contract: `/api/v1`; current Laravel application: unversioned `/api` |
| Format | JSON, UTF-8 |
| Field naming | `snake_case` |
| Identifiers | UUID v4 |
| Dates | ISO 8601 in UTC |
| Authentication | Bearer token |
| Pagination | `?page=1&size=20` |
| Maximum page size | 50 |
| User-facing messages | Spanish |
| API identifiers | English |

### 2.1 Authentication

Protected endpoints require an authentication token.

The request header must use:

```http
Authorization: Bearer <token>
```

The following endpoints are public:

- `POST /auth/login`
- `GET /health`

All other endpoints require valid authentication and the appropriate role permissions.

### 2.2 Pagination

Paginated endpoints use the following query parameters:

- `page`: Requested page number.
- `size`: Number of records per page.

Example:

```http
GET /api/v1/technical-aids?page=1&size=20
```

The maximum page size is 50.

Expected response structure:

```json
{
  "items": [],
  "page": 1,
  "size": 20,
  "total": 0
}
```

The actual response must remain consistent with the implementation and the approved API contract.

## 3. Standard Error Response

All API errors must follow a standardized response structure.

Example:

```json
{
  "code": "AID_NOT_AVAILABLE",
  "message": "No hay unidades disponibles de esta ayuda técnica.",
  "details": []
}
```

The properties are:

| Property | Description |
|---|---|
| `code` | Machine-readable error identifier. |
| `message` | User-facing error message in Spanish. |
| `details` | Additional validation or error information. |

The `details` property may contain field-level validation information.

Sensitive information, database queries, server paths and stack traces must never be exposed.

## 4. HTTP Status Codes

| Status | Description |
|---|---|
| 200 | Successful request. |
| 201 | Resource successfully created. |
| 204 | Successful operation without response body. |
| 401 | Authentication required or invalid. |
| 403 | Insufficient permissions. |
| 404 | Resource not found. |
| 409 | Business rule or state conflict. |
| 422 | Input validation error. |
| 500 | Internal server error. |

## 5. Business Error Codes

| Error code | HTTP status | Description |
|---|---:|---|
| `INVALID_CREDENTIALS` | 401 | Invalid login credentials. |
| `FORBIDDEN_ROLE` | 403 | Insufficient user permissions. |
| `NOT_FOUND` | 404 | Requested resource does not exist. |
| `REFERENCE_TAKEN` | 409 | Technical aid reference already exists. |
| `DOCUMENT_TAKEN` | 409 | Beneficiary document already exists. |
| `AID_NOT_AVAILABLE` | 409 | No available units. |
| `BENEFICIARY_HAS_OVERDUE` | 409 | Beneficiary has overdue loans. |
| `ITEM_ALREADY_RETURNED` | 409 | The loan item was already returned. |
| `LAST_UNIT_CONFLICT` | 409 | Another transaction reserved the last available unit. |
| `BENEFICIARY_LIMIT_EXCEEDED` | 422 | Beneficiary exceeds the maximum of two outstanding aids. |
| `VALIDATION_ERROR` | 422 | Invalid request data. |

Error codes must remain consistent across backend responses and frontend error handling.

## 6. Target API Endpoints

The endpoints in this section describe the required contract. They are not a claim that the current Laravel route table matches or fully passes acceptance tests.

All endpoint paths in this section are relative to the base URL `/api/v1`.

### 6.1 Authentication and Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate a user. |
| GET | `/health` | Public | Check API availability. |

**Login request:**

```json
{
  "username": "manager",
  "password": "********"
}
```

**Expected successful response:**

```json
{
  "access_token": "token_value",
  "token_type": "Bearer",
  "expires_in": 28800,
  "role": "manager"
}
```

The authentication token must have the expiration policy established in the project specification.

Passwords and password hashes must never be returned.

### 6.2 Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/users` | Admin | Create a manager account. |

The system must:

- Allow administrators to create manager accounts.
- Validate username uniqueness.
- Store passwords securely.
- Prevent assigning the `admin` role through this endpoint.
- Never return passwords or password hashes.

### 6.3 Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | Authenticated | List the five predefined categories. |

The five predefined categories are:

1. Wheelchairs.
2. Crutches.
3. Walkers.
4. Canes.
5. Cushions.

Categories are predefined and cannot be created, edited or deleted through the API.

### 6.4 Technical Aids

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/technical-aids` | Authenticated | List and search technical aids. |
| GET | `/technical-aids/{id}` | Authenticated | Retrieve technical aid details. |
| POST | `/technical-aids` | Admin | Register a technical aid. |
| PUT | `/technical-aids/{id}` | Admin | Update technical aid information. |
| DELETE | `/technical-aids/{id}` | Admin | Logically deactivate a technical aid. |

Supported query parameters:

- `q`: Search by reference.
- `category_id`: Filter by category.
- `page`: Page number.
- `size`: Number of records.

Technical aid inventory fields:

- `reference`
- `category_id`
- `total_units`
- `available_units`

The server calculates available units. Clients cannot directly overwrite inventory availability.

The following invariant must always hold:

```text
0 <= available_units <= total_units
```

Logical deactivation must preserve historical loan information.

A technical aid with outstanding loans cannot be deactivated.

### 6.5 Beneficiaries

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/beneficiaries` | Admin, Manager | List and search beneficiaries. |
| GET | `/beneficiaries/{id}` | Admin, Manager | Retrieve beneficiary details. |
| POST | `/beneficiaries` | Admin, Manager | Register a beneficiary. |

Supported query parameters:

- `q`: Search by beneficiary name or identification document.
- `page`: Page number.
- `size`: Number of records.

The beneficiary detail response must include the number of outstanding technical aids.

Duplicate identification documents must be rejected with HTTP 409.

Beneficiary records cannot be deleted.

Beneficiaries are records in the system and do not authenticate or access the application.

### 6.6 Loans

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/loans` | Manager | Register a new loan. |
| GET | `/loans` | Admin, Manager | List loan records. |
| GET | `/loans/{id}` | Admin, Manager | Retrieve loan details. |
| GET | `/loans/overdue` | Admin, Manager | List overdue loan items. |
| POST | `/loans/{loan_id}/items/{item_id}/return` | Manager | Register a return. |

Supported loan filters:

- `from`
- `to`
- `status`
- `beneficiary_id`
- `page`
- `size`

**Create loan request:**

```json
{
  "beneficiary_id": "uuid",
  "items": [
    {
      "technical_aid_id": "uuid"
    }
  ]
}
```

The following business rules apply:

- A loan belongs to exactly one beneficiary.
- A loan must contain one or more loan lines.
- A beneficiary may have a maximum of two outstanding technical aids.
- The same technical aid cannot appear more than once in the same loan.
- A beneficiary with overdue technical aids cannot receive additional aids until the overdue items are returned.
- The loan term is 30 days from the loan registration date.
- Each loan line decreases available inventory by one unit.
- Loan records cannot be edited or deleted.

**Expected successful response:**

```json
{
  "id": "uuid",
  "beneficiary_id": "uuid",
  "loaned_at": "2026-11-08T14:00:00Z",
  "status": "open",
  "items": [
    {
      "id": "uuid",
      "technical_aid_id": "uuid",
      "aid_reference": "AID-001",
      "category_name": "Wheelchairs",
      "due_at": "2026-12-08T14:00:00Z",
      "returned_at": null
    }
  ]
}
```

The technical aid reference and category name stored in the loan item are historical snapshots. They must not change when the catalog is updated.

The loan status is calculated according to the loan dates and return records.

### 6.7 Loan Returns

Returns must be registered individually for each loan item.

The return endpoint is:

```http
POST /api/v1/loans/{loan_id}/items/{item_id}/return
```

The server must:

1. Verify that the loan exists.
2. Verify that the loan item exists.
3. Verify that the item has not already been returned.
4. Register the return date in UTC.
5. Restore one available inventory unit.
6. Preserve the historical operation.
7. Update the loan status when all loan items have been returned.

Returning an already returned item must produce HTTP 409.

Available units must never exceed total units.

Loan records and returns cannot be deleted.

### 6.8 Overdue Loans

Endpoint:

```http
GET /api/v1/loans/overdue
```

Access is restricted to administrators and managers.

The response must include:

- `loan_id`
- `item_id`
- `aid_reference`
- `beneficiary_name`
- `due_at`
- `days_late`

Only outstanding overdue items must be included.

Results must be ordered by the highest number of overdue days first.

### 6.9 Reports

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/reports/most-requested` | Admin | Retrieve the most requested technical aids. |

Required query parameters:

- `from`
- `to`

Both dates are inclusive.

Example:

```http
GET /api/v1/reports/most-requested?from=2026-11-01&to=2026-11-30
```

**Expected response:**

```json
{
  "from": "2026-11-01",
  "to": "2026-11-30",
  "rows": [
    {
      "technical_aid_id": "uuid",
      "aid_reference": "AID-001",
      "category_name": "Wheelchairs",
      "times_requested": 12
    }
  ]
}
```

The report must be ordered by `times_requested` in descending order.

An end date earlier than the start date must return HTTP 422.

A period without loans must return an empty list.

Historical loan information must remain consistent even when technical aids are modified or logically deactivated.

## 7. Inventory Concurrency

The backend must guarantee inventory consistency when multiple managers attempt to register loans simultaneously.

When only one unit remains available and two managers attempt to lend it:

- The first valid transaction succeeds.
- The second transaction receives HTTP `409 Conflict`.
- Available units must never become negative.
- The inventory update and loan registration must be atomic.
- No incomplete loan may remain registered.

Return operations must also be transactional to prevent duplicate inventory increases.

## 8. Security Requirements

The following security requirements apply:

- Passwords must be stored as secure hashes.
- Authentication tokens must be validated on protected endpoints.
- User permissions must be checked on every restricted operation.
- Sensitive information must never be included in API responses.
- Input data must be validated on the backend.
- Passwords and password hashes must never be returned.
- Historical loan and return records must be protected from deletion.
- Beneficiaries must not receive authenticated application access.

Authorization must follow the roles defined in the project specification.

## 9. Consistency Rules

The API implementation must comply with:

1. The project constitution.
2. The approved project specification.
3. The logical data model.
4. The six business rules.
5. The non-functional requirements.
6. The requirements of the React frontend.
7. The accepted Architecture Decision Records.

The API must not implement functionality outside the approved project specification.

The backend implementation must remain the source of truth for business rule enforcement and inventory consistency.

## 10. Implementation and Verification Status

The route inventory below was checked against `api/routes/api.php`, `api/bootstrap/app.php`, and the frontend API base URL on 2026-11-26. It is a static source review, not a fresh runtime `route:list` or API acceptance run.

### 10.1 Current Route Inventory

The Laravel API file uses the framework's `/api` prefix. The following routes are present in source:

| Current path | Method(s) | Source-level description |
|---|---|---|
| `/up` | GET | Laravel health route configured in `api/bootstrap/app.php`; it is not `/api/health`. |
| `/api/register`, `/api/login` | POST | Public registration and login routes. |
| `/api/password/forgot`, `/api/password/reset` | POST | Public password recovery routes. |
| `/api/logout` | POST | Protected by `auth:sanctum`. |
| `/api/user` | GET | Protected current-user route. |
| `/api/beneficiaries` and `/api/beneficiaries/{beneficiary}` | API resource methods | Protected by `auth:sanctum`. |
| `/api/technical-aid-categories` | GET | Protected category listing. |
| `/api/technical-aids` and `/api/technical-aids/{technicalAid}` | API resource methods | Protected by `auth:sanctum`. |
| `/api/loans`, `/api/loans/{loan}` | GET, POST | Loan list, create, and detail routes protected by `auth:sanctum`. |
| `/api/loans/overdue` | GET | Protected overdue-loan route. |
| `/api/loans/{loanId}/items/{itemId}/return` | POST | Protected return route. |
| `/api/technical-aids/{technicalAidId}/maintenance/complete` | POST | Protected maintenance route. |
| `/api/reports/summary` | GET | Protected summary-statistics route. |

### 10.2 Requirements-to-Implementation Gaps

| Target requirement | Current source observation | Status |
|---|---|---|
| Versioned `/api/v1` base and `/health` | Frontend defaults to `/api`; Laravel health route is `/up`. | Not aligned; contract and runtime verification pending. |
| Login by username and documented token expiry | `AuthController` validates email and password; source does not establish the specified 8-hour contract. | Not verified against target. |
| Administrator-managed manager creation | No `/users` route is listed. Public `/api/register` creates a `manager` account. | Requirement mismatch; review and correction are required before production use. |
| `/categories` | Current route is `/api/technical-aid-categories`. | Not aligned. |
| Most-requested report | Current report controller exposes summary statistics at `/api/reports/summary`; the specified date-range most-requested report is not present in the inspected route/controller. | Required report pending. |
| Standardized Spanish responses | Inspected authentication and role-check responses include English messages. | Localization and response-contract verification pending. |
| Role permissions for all endpoints | Routes use `auth:sanctum`; role checks are present in parts of controllers. Complete endpoint-by-endpoint authorization verification is not available. | Partially implemented; acceptance pending. |

The public registration route creates manager-role users while the specification says an administrator registers managers. This source-level discrepancy requires owner review before treating authentication and authorization as accepted. This note documents a requirement gap; it is not a full security audit.

### 10.3 Test Evidence Limits

The repository contains 11 PHP test files under `api/tests/`. The final local verification ran `php artisan test` with the isolated SQLite in-memory test database and passed 90 tests with 365 assertions; see `evidencias/estado-verificacion-2026-11-26.md`.

The 15-file test target remains unmet, and the passing suite does not establish contract-wide response, permission, and concurrency acceptance. The concurrency screenshots and one recorded scenario are documented in `evidencias/punto-07-concurrencia/punto-07-concurrencia.md`; the retained 409 screenshot also shows exception details and local filesystem paths, so error-response disclosure remains unresolved.

A documented endpoint must not be considered fully verified solely because it appears in this contract or route table.

------------------------------------------------------------------------------------------------------------------------

**End of API Contract — Mobility Aids**