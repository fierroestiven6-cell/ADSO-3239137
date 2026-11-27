# Concurrency Test Evidence — Mobility Aids

**Project:** Mobility Aids | **Evidence:** Point 07 — Concurrency Control | **Version:** 1.1
**Reviewed:** 2026-11-26
**Status:** One recorded scenario; automated repeatability not established
**Related ADR:** ADR-002 — Inventory Concurrency Control

---

## 1. Objective

The objective of this test is to verify that the Mobility Aids system maintains inventory consistency when two managers attempt to register a loan for the last available unit of the same technical aid.

The system must prevent both requests from registering a loan for the same available unit.

## 2. Test Scenario

The test was performed using two manager requests:

- **Manager A:** Attempts to register a loan for the last available technical aid.
- **Manager B:** Attempts to register a loan for the same technical aid.

The test uses the technical aid reference `WH-CONC-001` and the database `mobility_aids_concurrency_test`.

The expected behavior is:

1. Only one loan request succeeds.
2. The other request receives HTTP `409 Conflict`.
3. Inventory availability does not become negative.
4. Only one loan and one loan line are registered.

## 3. Evidence 1 — Simultaneous Loan Requests

**Image:** [01-solicitudes-simultaneas.png](./01-solicitudes-simultaneas.png)

The PowerShell output shows the results of the two manager requests.

| Manager | HTTP Status | Result |
|---|---:|---|
| Manager A | 201 | Loan successfully created |
| Manager B | 409 | Request rejected because no units were available |

Manager A received HTTP `201 Created`, confirming that the loan was registered.

Manager B received HTTP `409 Conflict`, with the message indicating that there were no available units for one of the requested technical aids.

**Result:** The system allowed one loan operation and rejected the competing request.

**Security observation:** The retained screenshot also shows exception details, `file` and `trace` fields, including a local Windows filesystem path. This violates the API contract's requirement not to expose stack traces or local paths. The observed `409` status does not establish that the error response format is safe.

## 4. Evidence 2 — Database Verification

**Image:** [02-verificacion-mysql.png](./02-verificacion-mysql.png)

After the requests, the database was inspected using Laravel Tinker.

The verification returned the following values:

| Field | Observed Value |
|---|---:|
| Database | `mobility_aids_concurrency_test` |
| Available units | 0 |
| Loans created | 1 |
| Loan lines created | 1 |

These values show that the last available unit was consumed by one successful loan operation.

Only one loan and one associated loan line were recorded.

**Result:** The database state is consistent with the expected outcome of the concurrency test.

## 5. Evidence 3 — Backend Server

**Image:** [03-servidor-8001.png](./03-servidor-8001.png)

The screenshot shows the local server running at:

`http://127.0.0.1:8001`

The server log displays requests to:

- `/api/user`
- `/api/loans`

The visible log entries confirm that the local server was active and received API requests during the test session.

**Result:** The backend server was running and processing application requests during the evidence collection.

## 6. Final Test Results

| Verification | Expected Result | Observed Result |
|---|---|---|
| Manager A loan request | HTTP 201 | HTTP 201 |
| Manager B loan request | HTTP 409 | HTTP 409 |
| Available inventory | Never negative | 0 |
| Registered loans | One | 1 |
| Registered loan lines | One | 1 |

**Overall result:** The recorded outputs match the expected behavior for this single scenario. The evidence supports only the observed run; it does not establish repeatability, automated concurrency coverage, or correctness for all inventory paths.

## 7. Related Architecture Decision

This test supports the objective of `ADR-002.md — Inventory Concurrency Control`.

The decision establishes that inventory updates and loan registration must be handled transactionally to prevent inconsistent inventory quantities when multiple requests compete for the same unit.

The test evidence demonstrates the expected successful and rejected responses and the resulting database state.

## 8. Evidence Limits and Conclusion

The concurrency test demonstrated that, when two managers attempted to register a loan for the last available unit, only one request succeeded.

The second request was rejected with HTTP `409 Conflict`.

The database verification showed zero available units, one registered loan and one loan line.

These observations support the inventory consistency requirement for the tested scenario only. The original execution date and a reproducible test command are not recorded in this evidence document. The images are retained in this folder, but no automated concurrency test result is attached here.

Accordingly, task T-13 remains **In Progress** until the scenario is covered by a repeatable automated test and its full test output is retained.

---

**End of Concurrency Test Evidence — Mobility Aids**