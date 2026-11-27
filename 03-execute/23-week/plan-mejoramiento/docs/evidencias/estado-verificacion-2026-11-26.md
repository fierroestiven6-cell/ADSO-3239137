# Mobility Aids — Verification Record

**Review date:** 2026-11-26
**Scope:** Documentation reconciliation, source inspection, prior responsive checks, and operator-reported local demonstrations
**Status:** Partial verification; not final acceptance

## 1. Evidence Classification

This record distinguishes:

- **Source inspection:** File or route definitions were inspected in the repository. This does not prove runtime behavior.
- **Prior browser check:** Browser viewport emulation or interaction checks were performed in an earlier work session. The session screenshots and raw output were not saved in this evidence directory.
- **Operator report:** A demonstration observation or network result was supplied by the project operator; it was not independently reproduced during this documentation review.
- **Pending:** No sufficient evidence is available to claim acceptance.

No application code, database, environment, or infrastructure file was modified during the initial documentation-reconciliation review. During the final release review, targeted presentation-only corrections were made to the admin category image mapping and Spanish category labels; no API, database, environment, or infrastructure file was changed.

## 2. Public Static Website

### Source inspected

The static website is present under [`page/`](../../page/):

- [`index.html`](../../page/index.html)
- [`styles.css`](../../page/styles.css)
- [`script.js`](../../page/script.js)
- [`icono-mobility-aids.png`](../../page/assets/images/icono-mobility-aids.png)
- [`mobility-aids-hero.png`](../../page/assets/images/mobility-aids-hero.png)
- [`wheelchairs.jpg`](../../page/assets/images/wheelchairs.jpg)
- [`crutches.jpg`](../../page/assets/images/crutches.jpg)
- [`walkers.jpg`](../../page/assets/images/walkers.jpg)
- [`canes.jpg`](../../page/assets/images/canes.jpg)
- [`cushions.jpg`](../../page/assets/images/cushions.jpg)
- [`publicidad-mobility-aids.mp4`](../../page/assets/videos/publicidad-mobility-aids.mp4)

The HTML references the official icon for the favicon and page branding, preserves the navy-blue/gold/white identity, and presents the five official categories in Spanish: Sillas de ruedas, Muletas, Caminadores, Bastones, and Cojines. The Cushions card uses the existing photograph. No separate SVG cushion illustration exists in the inspected project tree, although `styles.css` contains an unused selector for one; the prior SVG-specific presentation requirement remains unresolved. The page has hero, purpose, categories, benefits, process, promotional video, and footer content. The video element has native controls, a poster, and a fallback. Source inspection found no API client or framework dependency in `page/`.

### Responsive and access evidence

The target viewport widths recorded for this review are **1440px, 768px, 390px, and 375px**.

The [public CSS](../../page/styles.css) has breakpoints at 980px and 680px. Breakpoint inspection is source review, not screenshot verification. A prior browser session used viewport emulation and layout measurements at responsive widths; it did not produce a saved screenshot for every width. Screenshots were reviewed at 375px in that earlier session, but were not retained in the repository as evidence files.

The project operator reports:

- Local verification address: [http://127.0.0.1:4173/](http://127.0.0.1:4173/).
- Successful phone access over the local network: [http://192.168.1.27:4177/](http://192.168.1.27:4177/).

These are local/private-network addresses. Neither is a permanent public Internet deployment. The phone access is operator-reported and is not an archived screenshot or a repeatable public acceptance test.

## 3. Administrative Application and Local Services

The [React/Vite route source](../../app/src/App.jsx) contains Login, Dashboard, Beneficiaries, Inventory, Technical Aids, Loans, Returns, Reports, and Settings. A prior browser session checked responsive layouts and selected interactions at 1440px, 1024px, 768px, 390px, and 375px. Those checks used viewport emulation and layout measurements; screenshots were reviewed at 375px only and were not saved in the repository.

The project operator reports the following local demonstration sequence:

1. In `api/`, start Laravel with `php artisan serve --host=0.0.0.0 --port=8000`.
2. In `app/`, start Vite with `npm run dev -- --host 0.0.0.0`.
3. During the reported demonstration, ports 5173 and 5174 were occupied, so Vite selected port 5175.
4. The login screen was visually checked on the laptop at [http://localhost:5175/login](http://localhost:5175/login).
5. The operator reports creating Windows Firewall rules for TCP ports 5175 and 8000 under the Private profile.
6. Mobile access to the administrator was not successful; the phone displayed `ERR_CONNECTION_TIMED_OUT`.

The login-screen observation is not evidence of successful authentication. The firewall report was not independently inspected. Do not claim mobile administrator access, full mobile API integration, or end-to-end acceptance.

## 4. Backend, API, and Test Evidence

### Static source findings

- [`api.php`](../../api/routes/api.php) defines unversioned `/api` routes, with Laravel health configured as `/up` in [`bootstrap/app.php`](../../api/bootstrap/app.php).
- The current [`ReportController.php`](../../api/app/Http/Controllers/ReportController.php) returns summary counts; the specified date-range most-requested report is not present in the inspected route/controller.
- The public registration route in [`AuthController.php`](../../api/app/Http/Controllers/AuthController.php) creates a `manager` account. This differs from the specification that manager accounts are created by an administrator.
- [`TechnicalAidCategorySeeder.php`](../../api/database/seeders/TechnicalAidCategorySeeder.php) contains exactly the five official categories.
- [`UserSeeder.php`](../../api/database/seeders/UserSeeder.php) reads administrator name, username, email, and password from environment variables. No instructor demonstration email or password is documented in the repository. The generic database factory user in [`DatabaseSeeder.php`](../../api/database/seeders/DatabaseSeeder.php) is not verified as an instructor account.
- The repository contains **11 PHP test files** under [`api/tests/`](../../api/tests/).

### Test results and limits

- The final local verification ran `php artisan test` from `api/` with `APP_ENV=testing`, `DB_CONNECTION=sqlite`, and `DB_DATABASE=:memory:`. **Result: 90 tests passed, 365 assertions, 1.84 seconds.** This used the isolated PHPUnit in-memory database configuration; it did not run against the configured project database.
- The repository contains **11 PHP test files**, below the project target of at least 15. A passing suite does not establish complete acceptance of every API-contract requirement.
- The single concurrency scenario is recorded in [`punto-07-concurrencia/`](./punto-07-concurrencia/), including three images and observed HTTP 201/409 responses with post-run database counts. It is one recorded scenario, not automated repeatability evidence.
- The final local checks ran `npm run build` in `app/` successfully; Vite emitted a large-chunk warning for the 1,779.83 kB main JavaScript chunk (500 kB warning threshold). `node --check page/script.js` passed, and a source check found no missing local HTML asset paths.
- Browser viewport checks were performed on the public website at 1440px, 768px, and 390px. The category cards rendered in 3+2, 2+2+1, and 1-column rows respectively, with no horizontal overflow; all five category images loaded. The mobile menu closed after category navigation, and Escape closed it and restored focus. The video source loaded with no media error (`readyState=4`); actual playback was not manually observed. The admin login was checked at 1366px and 390px, showing the approved English brand and Spanish login form with no mobile horizontal overflow.
- The retained simultaneous-request screenshot shows the HTTP 409 response body containing an exception, local filesystem paths, and a stack trace. This conflicts with the API contract's error-disclosure requirement. It is historical evidence from the recorded run, not a fresh reproduction or proof of current runtime behavior; error-response security remains unresolved.
- No valid administrator credentials or authenticated API session were available for this review. Real authentication, API-backed CRUD, roles, loan restrictions, reports with real data, and backend error/success workflows remain unverified.

## 5. Pending Acceptance

1. Align and runtime-test the API routes, login contract, category path, health endpoint, authorization, and most-requested report.
2. Resolve and verify administrator-managed manager provisioning; do not use an undocumented or factory-generated user as instructor access.
3. Keep the 90-test/365-assertion run reproducible, meet the 15-file test requirement, and automate concurrency verification.
4. Implement and verify the API-based seed tool and full environment startup.
5. Confirm whether an administrator account is provisioned for demonstration through a private channel; do not store its password in Git.
6. Resolve mobile administrator connectivity and verify the API address from a phone without claiming success before it works.
7. Retain reviewable responsive evidence if required for assessment; distinguish source inspection, emulated layout checks, and physical-device observations.
8. Track and commit approved implementation changes before marking the relevant tasks complete.

**End of Verification Record**
