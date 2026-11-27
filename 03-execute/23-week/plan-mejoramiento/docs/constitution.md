# Mobility Aids — Project Constitution

**Project:** Mobility Aids | **Identifier:** `mobility-aids` | **Version:** 1.1.0
**Reviewed:** 2026-11-26 | **Status:** Governing principles; implementation progress is tracked separately in `tasks.md`.
**Reference:** Acta No. 18-2026

## 1. Purpose

Mobility Aids is a technical-aids management system for people with mobility needs. It manages beneficiaries, the technical-aids catalog, inventory, loans, returns, and operational information.

This constitution establishes project-wide principles. It does not assert that every requirement has been implemented or accepted; evidence-based progress is recorded in `tasks.md` and the evidence documents.

## 2. Domain Integrity

- The system must use the Mobility Aids domain.
- Technical aids are identified by their reference and have total and available unit counts.
- The catalog is distinct from historical loan records.
- The five official categories are Wheelchairs, Crutches, Walkers, Canes, and Cushions.
- No additional category may be introduced without an approved specification change.

## 3. Business Rules

1. A beneficiary may have no more than two outstanding technical aids.
2. The loan period is 30 days.
3. Beneficiaries with overdue technical aids cannot receive additional aids until the overdue items are returned.
4. Available units must remain between zero and total units.
5. Transaction snapshots must not change when catalog information changes.
6. Loans and returns must not be physically deleted; catalog records use logical deactivation.

These are requirements, not claims that each rule has passed acceptance testing.

## 4. Data and Time Integrity

- Dates and timestamps must be stored and processed in UTC.
- Inventory changes must preserve data consistency.
- Historical loan and return information must remain traceable.
- Concurrent operations must not assign the same last available unit twice.

## 5. Concurrency Control

When two operators attempt to loan the last available unit simultaneously:

- At most one operation may succeed.
- The competing operation must receive HTTP 409 Conflict.
- Failed operations must not leave partial loan or inventory changes.

## 6. Technology Requirements

- React and Vite for the administrative frontend.
- PHP with Laravel for the backend API.
- MySQL 8.4 in the Docker infrastructure, as recorded in accepted ADR-004.
- An API-based demonstration-data seeder.
- A static public website independent of React, Laravel, and the API.

The presence of a configuration or source file is not proof that the complete environment has been started or accepted.

## 7. Language Standards

- Source-code identifiers, API identifiers, and database identifiers use English.
- Visitor-facing and administrator-facing text is Spanish. The five official category identifiers remain in English in the data/API, while user-facing category labels are displayed in Spanish.
- Core technical specifications and ADRs remain in English; instructor access instructions and relevant handoff material may be in Spanish.
- Credentials and secrets must not be included in tracked documentation.

## 8. Specification-Driven Development

The approved specification defines 10 user stories, 6 business rules, and 5 non-functional requirements. The project tracks 23 implementation tasks and has four accepted ADRs.

The project target of at least 15 automated test files remains a requirement. The current repository contains 11 PHP test files; the target has not been demonstrated as met.

## 9. Quality and Verification

- Every task status must be supported by identifiable source, test, or evidence references.
- Implementation, source inspection, prior test reports, and current verification must be distinguished.
- A documented or visually present feature is not automatically considered functionally accepted.
- Concurrency, authorization, API integration, and data integrity require appropriate tests.
- No completion claim may exceed the available evidence.

## 10. Version Control

- Preserve the existing Git history.
- Use small, meaningful commits and the required project commit distribution.
- Do not commit `.env` files, secrets, or dependency directories.
- Verify actual Git history rather than inferring delivery or merge status from documentation.

## 11. Source of Truth

Acta No. 18-2026 is the source of the assigned project requirements. The constitution, specification, data model, API contract, accepted ADRs, implementation, and test evidence must remain consistent with it.

When the implementation differs from the specification, document the gap; do not silently redefine the requirement as complete.

## 12. Visual Identity and Color Palette

The Mobility Aids application and public website maintain the established navy-blue, gold, and white visual identity. Light gray supports neutral surfaces; green and red communicate positive and critical states where appropriate.

| Color | Meaning | Intended Use |
|---|---|---|
| Navy Blue | Trust, security, stability, and professionalism. | Main navigation, headers, primary backgrounds, and important interface elements. |
| Gold | Excellence, attention, and visual emphasis. | Primary action buttons, highlights, icons, and important accents. |
| White | Clarity, cleanliness, and simplicity. | Main content backgrounds, cards, forms, and panels. |
| Light Gray | Organization, neutrality, and visual separation. | Secondary backgrounds, borders, dividers, and disabled elements. |
| Green | Availability, successful operations, and positive status. | Success messages and available inventory indicators. |
| Red | Errors, warnings, and critical conditions. | Error messages, overdue indicators, and destructive actions. |

Text/background combinations must remain readable. Gold is an accent and must not compromise text contrast. Components should use the existing design tokens and color meanings.

## 13. Public Website and Responsive Presentation

The public product website is a static HTML, CSS, and JavaScript deliverable in `page/`. It must remain independent of the administrator and backend, present the actual Mobility Aids service, preserve the official identity, and avoid horizontal overflow at supported viewport sizes.

Responsive CSS inspection and browser/device verification must be recorded separately. A local or private-network URL is not a permanent public Internet deployment.

**End of Mobility Aids Project Constitution**