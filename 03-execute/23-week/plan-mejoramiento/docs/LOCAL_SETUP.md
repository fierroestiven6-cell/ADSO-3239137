# Local Development Setup

## 1. Purpose

This guide explains how to start the Mobility Aids public website, React administrator, and Laravel API for local development on Windows.

## 2. Prerequisites

Install and make available on your `PATH`:

- PHP and Composer
- Node.js and npm
- Python
- MySQL

## 3. Project Directory Structure

The startup script expects this layout in the project directory:

```text
plan-mejoramiento/
├── api/       # Laravel API
├── app/       # React/Vite administrator
├── page/      # Public website
│   └── index.html
└── iniciar-mobility-aids.ps1
```

## 4. Database Startup Prerequisite

Start MySQL separately before using features that require the database. The startup script does not start MySQL, modify the database, or change environment files.

## 5. Startup Script Location

The script is `iniciar-mobility-aids.ps1` in the project directory shown above. Run the command from that directory in PowerShell.

## 6. Start the Services

Run this exact command:

```powershell
powershell -ExecutionPolicy Bypass -File ".\iniciar-mobility-aids.ps1"
```

The script opens a separate PowerShell window for each service:

- Public website: `http://localhost:4177/`
- React administrator: normally `http://localhost:5173/`. Vite may select another available port if 5173 is occupied; use the actual URL printed in the Vite terminal.
- Login: use the actual Vite URL followed by `/login`.
- Laravel API: `http://127.0.0.1:8000`

## 7. Troubleshooting

- **Missing `page/index.html`:** Confirm that `page\index.html` exists inside the project directory. The script checks this before starting any services.
- **Port 4177 already in use:** Stop the other process using that port, then run the startup script again.
- **Vite uses port 5174 or another port:** This is expected when its configured port is unavailable. Use the actual URL shown in the Vite terminal, including that port, for the administrator and login.
- **Laravel fails to start:** Confirm that PHP is installed and available in PowerShell, Composer dependencies are installed, and the `api` directory contains the Laravel application.
- **MySQL is not running:** Start MySQL separately, then retry database-dependent features.

## 8. Stop the Services

Press `Ctrl+C` in each service's PowerShell window to stop that service. Keep the windows open while using the services.

## 9. Limitations

This is a local development startup procedure. It is not a production deployment process or Docker orchestration.
