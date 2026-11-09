# API Contract — Mobility Aids

**Project ID:** `mobility-aids`  
**Document:** API Contract  
**Version:** 1.0  
**Status:** Draft
--------------------------------------------------------------------------------
## 1. Purpose

This document defines the HTTP API contract for Mobility Aids.

The API provides communication between the React frontend and the Laravel backend.

All endpoints must comply with the project specification, business rules and logical data model.

## 2. General Conventions

| Item | Convention |
|---|---|
| Base URL | `/api/v1` |
| Format | JSON, UTF-8 |
| Field naming | `snake_case` |
| Identifiers | UUID v4 |
| Dates | ISO 8601 in UTC |
| Authentication | Bearer token |
| Pagination | `?page=1&size=20` |
| Maximum page size | 50 |
| User-facing messages | Spanish |
| API identifiers | English |

### Authentication

All endpoints require:

```http
Authorization: Bearer <token>
```

Exceptions:

- `POST /auth/login`
- `GET /health`

### Pagination

Paginated endpoints use:

```http
GET /api/v1/technical-aids?page=1&size=20
```

Response:

```json
{
  "items": [],
  "page": 1,
  "size": 20,
  "total": 0
}
```

## 3. Standard Error Response

All API errors must follow this structure:

```json
{
  "code": "AID_NOT_AVAILABLE",
  "message": "No hay unidades disponibles de esta ayuda técnica.",
  "details": []
}
```

The `details` property may contain validation information.

Sensitive information, database queries, server paths and stack traces must never be exposed.

## 4. HTTP Status Codes

| Status | Description |
|---|---|
| 200 | Successful request |
| 201 | Resource successfully created |
| 204 | Successful operation without response body |
| 401 | Authentication required or invalid |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Business rule or state conflict |
| 422 | Input validation error |
| 500 | Internal server error |

## 5. Business Error Codes

| Error code | HTTP status | Description |
|---|---:|---|
| `INVALID_CREDENTIALS` | 401 | Invalid login credentials |
| `FORBIDDEN_ROLE` | 403 | Insufficient user permissions |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `REFERENCE_TAKEN` | 409 | Technical aid reference already exists |
| `DOCUMENT_TAKEN` | 409 | Beneficiary document already exists |
| `AID_NOT_AVAILABLE` | 409 | No available units |
| `BENEFICIARY_HAS_OVERDUE` | 409 | Beneficiary has overdue loans |
| `ITEM_ALREADY_RETURNED` | 409 | The loan item was already returned |
| `LAST_UNIT_CONFLICT` | 409 | Another transaction reserved the last available unit |
| `BENEFICIARY_LIMIT_EXCEEDED` | 422 | Beneficiary exceeds the maximum of two pending aids |
| `VALIDATION_ERROR` | 422 | Invalid request data |

## 6. API Endpoints

### 6.1 Authentication and Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate a user |
| GET | `/health` | Public | Check API availability |

**Login request:**

```json
{
  "username": "manager",
  "password": "********"
}
```

**Successful response:**

```json
{
  "access_token": "token_value",
  "token_type": "Bearer",
  "expires_in": 28800,
  "role": "manager"
}
```

### 6.2 Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/users` | Admin | Create a manager account |

The system must protect user credentials and never return password hashes.

### 6.3 Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | Authenticated | List the five predefined categories |

The five categories are:

1. Wheelchairs.
2. Crutches.
3. Walkers.
4. Canes.
5. Cushions.

Categories are predefined and cannot be created, edited or deleted through the API.

### 6.4 Technical Aids

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/technical-aids` | Authenticated | List and search technical aids |
| GET | `/technical-aids/{id}` | Authenticated | Retrieve technical aid details |
| POST | `/technical-aids` | Admin, Manager | Register a technical aid |
| PUT | `/technical-aids/{id}` | Admin, Manager | Update technical aid information |
| DELETE | `/technical-aids/{id}` | Admin | Logically deactivate a technical aid |

Supported query parameters:

- `q`: Search by reference.
- `category_id`: Filter by category.
- `page`: Page number.
- `size`: Number of records.

**Technical aid inventory fields:**

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

### 6.5 Beneficiaries

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/beneficiaries` | Admin, Manager | List and search beneficiaries |
| GET | `/beneficiaries/{id}` | Admin, Manager | Retrieve beneficiary details |
| POST | `/beneficiaries` | Admin, Manager | Register a beneficiary |

Supported query parameters:

- `q`: Search beneficiaries.
- `page`: Page number.
- `size`: Number of records.

The beneficiary detail response must include the number of outstanding technical aids.

### 6.6 Loans

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/loans` | Admin, Manager | Register a new loan |
| GET | `/loans` | Admin, Manager | List loan records |
| GET | `/loans/{id}` | Admin, Manager | Retrieve loan details |
| GET | `/loans/overdue` | Admin, Manager | List overdue loan items |
| POST | `/loans/{loan_id}/items/{item_id}/return` | Admin, Manager | Register a return |

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

A beneficiary may have a maximum of two technical aids outstanding.

The loan term is 30 days from the loan registration date.

**Successful response:**

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

### 6.7 Loan Returns

Returns must be registered individually for each loan item.

The return endpoint:

```http
POST /loans/{loan_id}/items/{item_id}/return
```

The server must:

1. Verify that the loan exists.
2. Verify that the loan item exists.
3. Verify that it has not already been returned.
4. Register the return date in UTC.
5. Restore one available inventory unit.
6. Preserve the historical operation.

Loan records and returns cannot be deleted.

### 6.8 Overdue Loans

Endpoint:

```http
GET /loans/overdue
```

The response must include:

- `loan_id`
- `item_id`
- `aid_reference`
- `beneficiary_name`
- `due_at`
- `days_late`

Only outstanding overdue items must be included.

### 6.9 Reports

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/reports/most-requested` | Admin | Retrieve the most requested technical aids |

Required query parameters:

- `from`
- `to`

Both dates are inclusive.

Example:

```http
GET /api/v1/reports/most-requested?from=2026-11-01&to=2026-11-30
```

Example response:

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

Historical loan information must remain consistent even when technical aids are modified or logically deactivated.

## 7. Inventory Concurrency

The backend must guarantee inventory consistency when multiple managers attempt to register loans simultaneously.

When only one unit remains available and two managers attempt to lend it:

- The first valid transaction succeeds.
- The second transaction receives HTTP `409 Conflict`.
- Available units must never become negative.
- The inventory update and loan registration must be atomic.

## 8. Security Requirements

- Passwords must be stored as secure hashes.
- Authentication tokens must be validated on protected endpoints.
- User permissions must be checked on every restricted operation.
- Sensitive information must never be included in API responses.
- Input data must be validated on the backend.
- Historical loan and return records must be protected from deletion.

## 9. Consistency Rules

The API implementation must comply with:

1. The project constitution.
2. The project specification.
3. The logical data model.
4. The six business rules.
5. The requirements of the React frontend.

The API must not implement functionality outside the approved project specification.
--------------------------------------------------------------------------------
**End of API Contract — Mobility Aids**