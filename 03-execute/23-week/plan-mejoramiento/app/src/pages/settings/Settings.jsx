
import { useState } from "react";

import {
  Settings as SettingsIcon,
  UserRound,
  ShieldCheck,
  Bell,
  Monitor,
  LockKeyhole,
  Info,
  Save,
  CheckCircle2
} from "lucide-react";

import { getUser } from "../../services/auth";
import settingsBanner from "../../assets/images/Settings.png";
import "./Settings.css";

export default function Settings() {
  const user = getUser();

  const [preferences, setPreferences] = useState(() => ({
    notifications: localStorage.getItem("mobility_notifications") !== "false",
    compactView: localStorage.getItem("mobility_compact_view") === "true"
  }));

  const [saved, setSaved] = useState(false);

  const userName =
    user?.name ||
    user?.full_name ||
    user?.username ||
    "Usuario de Mobility Aids";

  const userEmail = user?.email || "Correo electrónico no disponible";
  const role = String(user?.role || "").toLowerCase();
  const userRole = role === "admin" || role === "administrator"
    ? "Administrador"
    : role === "manager"
      ? "Gestor"
      : "Usuario del sistema";

  const handlePreference = (key) => {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key]
    }));

    setSaved(false);
  };

  const savePreferences = () => {
    localStorage.setItem(
      "mobility_notifications",
      String(preferences.notifications)
    );

    localStorage.setItem(
      "mobility_compact_view",
      String(preferences.compactView)
    );

    setSaved(true);
  };

  return (
    <main className="settings-page">

      {/* PAGE HEADER */}
      <section
        className="settings-hero"
        style={{
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(9, 29, 49, 0.38),
              rgba(9, 29, 49, 0.08)
            ),
            url("${settingsBanner}")
          `
        }}
      >
        <div className="settings-hero-icon">
          <SettingsIcon size={36} strokeWidth={1.8} />
        </div>

        <div className="settings-hero-content">
          <span>CONFIGURACIÓN DE CUENTA Y SISTEMA</span>

          <h1>
            <strong>Configuración</strong> del sistema
          </h1>

          <p>
            Administra la información de tu cuenta, tus preferencias
            y la configuración del sistema.
          </p>

          <div className="settings-hero-line"></div>
        </div>
      </section>

      {/* ACCOUNT OVERVIEW */}
      <section className="settings-section">
        <div className="settings-section-heading">
          <div className="settings-heading-icon">
            <UserRound size={22} />
          </div>

          <div>
            <h2>Información de la cuenta</h2>
            <p>Cuenta con la que has iniciado sesión.</p>
          </div>
        </div>

        <div className="settings-account-card">
          <div className="settings-avatar">
            <UserRound size={34} />
          </div>

          <div className="settings-account-details">
            <h3>{userName}</h3>
            <p>{userEmail}</p>

            <span className="settings-role">
              <ShieldCheck size={14} />
              {userRole}
            </span>
          </div>

          <div className="settings-account-status">
            <span></span>
            Sesión autenticada
          </div>
        </div>
      </section>

      {/* SYSTEM PREFERENCES */}
      <section className="settings-section">
        <div className="settings-section-heading">
          <div className="settings-heading-icon">
            <Monitor size={22} />
          </div>

          <div>
            <h2>Preferencias del sistema</h2>
            <p>Personaliza tu experiencia en Mobility Aids.</p>
          </div>
        </div>

        <div className="settings-options">

          <article className="settings-option">
            <div className="settings-option-icon">
              <Bell size={21} />
            </div>

            <div className="settings-option-info">
              <strong>Notificaciones</strong>
              <p>Activa las notificaciones para tu cuenta.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={() => handlePreference("notifications")}
              />
              <span className="settings-switch-slider"></span>
            </label>
          </article>

          <article className="settings-option">
            <div className="settings-option-icon">
              <Monitor size={21} />
            </div>

            <div className="settings-option-info">
              <strong>Vista compacta</strong>
              <p>Guarda tu preferencia para usar una interfaz más compacta.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.compactView}
                onChange={() => handlePreference("compactView")}
              />
              <span className="settings-switch-slider"></span>
            </label>
          </article>

        </div>

        <div className="settings-save-area">
          {saved && (
            <span className="settings-saved-message">
              <CheckCircle2 size={17} />
              Las preferencias se guardaron correctamente.
            </span>
          )}

          <button
            type="button"
            className="settings-save-button"
            onClick={savePreferences}
          >
            <Save size={17} />
            Guardar preferencias
          </button>
        </div>
      </section>

      {/* SECURITY */}
      <section className="settings-section">
        <div className="settings-section-heading">
          <div className="settings-heading-icon">
            <LockKeyhole size={22} />
          </div>

          <div>
            <h2>Seguridad y privacidad</h2>
            <p>Información sobre la protección de tu cuenta.</p>
          </div>
        </div>

        <div className="settings-security-card">
          <div className="settings-security-icon">
            <ShieldCheck size={27} />
          </div>

          <div>
            <strong>Cuenta protegida</strong>
            <p>
              Mobility Aids utiliza acceso autenticado y solicitudes
              protegidas a la API para resguardar la información administrativa.
            </p>
          </div>

          <span className="settings-security-label">
            Sesión activa
          </span>
        </div>
      </section>

      {/* SYSTEM INFORMATION */}
      <section className="settings-information">
        <Info size={20} />

        <div>
          <strong>Sistema de gestión Mobility Aids</strong>
          <p>
            Banco de ayudas técnicas para la movilidad · Configuración de cuenta y sistema.
          </p>
        </div>

        <span>Versión 1.0</span>
      </section>

      {/* FOOTER */}
      <footer className="settings-footer">
        <span>Mobility Aids · Configuración del sistema</span>
        <span>Promovemos la movilidad, transformamos vidas</span>
      </footer>

    </main>
  );
}
