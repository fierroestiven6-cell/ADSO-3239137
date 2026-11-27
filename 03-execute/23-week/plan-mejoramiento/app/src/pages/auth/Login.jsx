
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LockKeyhole,
  Mail,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Accessibility,
  Users
} from "lucide-react";

import logo from "../../assets/icons/Icono.png";
import wheelchair from "../../assets/images/Cilla_Rueda.png";

import api from "../../services/api";
import { saveAuth } from "../../services/auth";
import { localizeUiMessage } from "../../services/uiMessages";

import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email,
        password
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Respuesta de autenticación no válida.");
      }

      saveAuth(token, user);

      navigate("/", { replace: true });

    } catch (error) {
      if (error.response?.status === 401) {
        setError("El correo electrónico o la contraseña no son correctos.");
      } else if (error.response?.status === 422) {
        setError("Verifica el correo electrónico y la contraseña.");
      } else if (error.response) {
        setError(
          localizeUiMessage(
            error.response.data?.message,
            "No fue posible iniciar sesión. Inténtalo nuevamente."
          )
        );
      } else {
        setError(
          "No fue posible conectar con el servidor. Revisa tu conexión."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordRecovery() {
    setError("La recuperación de contraseña todavía no está disponible.");
  }

  return (
    <main className="login-page">

      {/* LEFT VISUAL SECTION */}
      <section className="login-visual">

        <img
          src={wheelchair}
          alt="Familia que promueve la movilidad y la independencia"
          className="login-background"
        />

        <div className="login-visual-overlay"></div>

        {/* Brand */}
        <div className="login-brand">
          <img src={logo} alt="Logotipo de Mobility Aids" />

          <div>
            <h2>
              Mobility <strong>Aids</strong>
            </h2>
            <span>Technical Aids Bank for Mobility</span>
          </div>
        </div>

        {/* Main promotional content */}
        <div className="login-message">

          <span className="login-eyebrow">
            ACCESIBILIDAD · INDEPENDENCIA · BIENESTAR
          </span>

          <div className="login-headline-wrapper">

            <span className="login-headline-accent"></span>

            <h1>
              Promovemos
              <br />
              <span>la movilidad,</span>
              <br />
              transformamos vidas.
            </h1>

          </div>

          <p>
            Gestionamos ayudas técnicas con compromiso y eficiencia
            para contribuir a un futuro más inclusivo y accesible.
          </p>

        </div>

        {/* Accessibility symbol */}
        <div className="login-mobility-symbol">
          <Accessibility size={48} strokeWidth={2} />
        </div>

        {/* Decorative golden waves */}
        <div className="login-gold-waves" aria-hidden="true">

          <svg
            viewBox="0 0 1000 150"
            preserveAspectRatio="none"
          >
            <path
              d="M-20 72 C180 145 330 145 520 80 S830 0 1020 35"
              fill="none"
              stroke="#E9A600"
              strokeWidth="4"
            />

            <path
              d="M-20 100 C190 155 380 145 570 100 S850 40 1020 75"
              fill="none"
              stroke="#F5C04A"
              strokeWidth="2"
            />
          </svg>

        </div>

        {/* Bottom benefits */}
        <div className="login-benefits">

          <div className="login-benefit">

            <div className="login-benefit-icon">
              <Accessibility size={25} />
            </div>

            <span>
              Acceso a
              <br />
              ayudas técnicas
            </span>

          </div>

          <span className="login-benefit-divider"></span>

          <div className="login-benefit">

            <div className="login-benefit-icon">
              <ShieldCheck size={25} />
            </div>

            <span>
              Acompañamiento y
              <br />
              seguimiento
            </span>

          </div>

          <span className="login-benefit-divider"></span>

          <div className="login-benefit">

            <div className="login-benefit-icon">
              <Users size={25} />
            </div>

            <span>
              Inclusión
              <br />
              y calidad de vida
            </span>

          </div>

        </div>

      </section>

      {/* RIGHT LOGIN SECTION */}
      <section className="login-form-section">

        <div className="login-form-container">

          {/* Mobile brand */}
          <div className="login-mobile-brand">
            <img src={logo} alt="Logotipo de Mobility Aids" />
            <div>
              <strong>Mobility <span>Aids</span></strong>
              <small>Technical Aids Bank for Mobility</small>
            </div>
          </div>

          {/* Security emblem */}
          <div className="login-security-emblem">
            <LockKeyhole size={35} strokeWidth={1.8} />
          </div>

          {/* Heading */}
          <div className="login-heading">

            <span className="login-welcome">
              BIENVENIDO DE NUEVO
            </span>

            <h1>Accede a tu cuenta</h1>

            <p>
              Ingresa al panel de administración de Mobility Aids
              y gestiona el banco de ayudas técnicas.
            </p>

          </div>

          {/* Login form */}
          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <label htmlFor="email">
              Correo electrónico
            </label>

            <div className="login-input-wrapper">

              <Mail size={19} />

              <input
                id="email"
                type="email"
                placeholder="Ingresa tu correo electrónico"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                autoComplete="username"
                required
              />

            </div>

            <label htmlFor="password">
              Contraseña
            </label>

            <div className="login-input-wrapper">

              <LockKeyhole size={19} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() =>
                  setShowPassword(previous => !previous)
                }
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>

            </div>

            {/* Error message */}
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            {/* Password recovery */}
            <button
              type="button"
              className="login-recovery-button"
              onClick={handlePasswordRecovery}
              disabled={loading}
            >
              <KeyRound size={19} />
              <span>Recuperar contraseña</span>
              <ArrowRight size={19} />
            </button>

            {/* Sign in */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              <ArrowRight size={20} />
            </button>

          </form>

          {/* Security message */}
          <div className="login-security">

            <span className="login-security-line"></span>

            <ShieldCheck size={31} />

            <span className="login-security-message">
              Tu información está protegida con
              <br />
              seguridad avanzada.
            </span>

            <span className="login-security-line"></span>

          </div>

          {/* Footer */}
          <p className="login-footer">
            Mobility Aids · Technical Aids Bank for Mobility
          </p>

        </div>

      </section>

    </main>
  );
}
