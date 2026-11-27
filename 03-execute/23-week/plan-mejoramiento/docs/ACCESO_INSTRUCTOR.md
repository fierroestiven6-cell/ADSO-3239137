# Instructor Access Guide

**Project:** Mobility Aids — Technical Mobility Aids Bank
**Guide validity date:** November 26, 2026
**Account status:** Pending confirmation or provisioning

## Purpose

The instructor's account will be used to demonstrate and review the Mobility Aids administrative application with an authorized user. A real account or production password must not be shared for demonstration purposes.

## Access Details

- **Local administrator URL:** [http://localhost:5175/login](http://localhost:5175/login)
- **Email address:** `[TO BE CONFIRMED WITH THE PROJECT OWNER; NO DEMONSTRATION EMAIL IS DOCUMENTED]`
- **Password:** `[PROVIDE TEMPORARY PASSWORD THROUGH A PRIVATE CHANNEL]`

The password must be provided separately through a private channel. It must not be added to this document, Git, screenshots, or public messages.

The documentation and seeders review did not identify a demonstration account with a specifically documented email address. `UserSeeder.php` requires the administrator's details from the local environment and fails if they are missing; it does not contain hardcoded credentials. The generic user created by the factory in `DatabaseSeeder.php` has not been confirmed as an authorized instructor account. Therefore, the responsible project owner must create or confirm the demonstration account before the session.

## Starting the Local Services

The dependencies for each project must be installed, and the local database must be properly configured and available.

### Laravel API

Open a terminal and run:

```powershell
Set-Location api
php artisan serve --host=0.0.0.0 --port=8000
```

### React/Vite Administrator Application

Open a second terminal and run:

```powershell
Set-Location app
npm run dev -- --host 0.0.0.0
```

During the reported demonstration, ports 5173 and 5174 were already occupied, so Vite selected port 5175. Confirm the URL displayed in the terminal because the port may change depending on availability. If it changes, use the local URL announced by Vite.

The login screen was visually reviewed on the laptop at `http://localhost:5175/login`. This observation does not confirm that authentication was successfully completed or that API-connected operations have been accepted.

## Access from the Local Network

If the laptop's local IP address is used instead of `localhost`, the laptop and the instructor's phone must be connected to the same local network.

The address format would be:

```text
http://<LAPTOP_LOCAL_IP>:<VITE_PORT>/login
```

The API must also be reachable from that network, and the frontend configuration must point to the laptop's IP address rather than the phone's `localhost`.

The API client currently uses `http://localhost:8000/api` as its default value in `app/src/services/api.js`. This mobile configuration has not been verified. During a reported test, the phone displayed `ERR_CONNECTION_TIMED_OUT` when attempting to access the administrator application. Mobile administrator access must not be presented as functional until a successful test has been completed.

The operator reported creating Windows Firewall rules for TCP ports 5175 and 8000 under the Private profile. Their current status has not been independently verified. If the port changes, the corresponding firewall rule may also need to be updated.

## Notice Regarding URLs

The `localhost` addresses, private local network IP addresses, and development ports are intended only for demonstrations on the local computer or network.

**They are not public Internet addresses and do not constitute a permanent deployment.**

**End of Instructor Access Guide**