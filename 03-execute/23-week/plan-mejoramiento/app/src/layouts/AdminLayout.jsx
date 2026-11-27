import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  Home,
  Accessibility,
  CalendarDays,
  RotateCcw,
  Users,
  Package,
  ChartNoAxesColumn,
  Settings,
  Menu,
  Search,
  Bell,
  ChevronDown,
  Clock3,
  AlertTriangle,
  CheckCheck,
  Wrench,
  RefreshCw,
  LogOut,
  X,
  LoaderCircle,
} from "lucide-react";

import logo from "../assets/icons/Icono.png";
import { getUser, clearAuth } from "../services/auth";
import api from "../services/api";
import {
  getUiErrorMessage,
  localizeCategoryName,
} from "../services/uiMessages";
import "./AdminLayout.css";

const navigationLinks = [
  { to: "/", label: "Panel", icon: Home },
  { to: "/technical-aids", label: "Ayudas técnicas", icon: Accessibility },
  { to: "/loans", label: "Préstamos", icon: CalendarDays },
  { to: "/returns", label: "Devoluciones", icon: RotateCcw },
  { to: "/beneficiaries", label: "Beneficiarios", icon: Users },
  { to: "/inventory", label: "Inventario", icon: Package },
  { to: "/reports", label: "Informes", icon: ChartNoAxesColumn },
];

function extractRows(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function buildNotifications(loans, technicalAids) {
  const notifications = [];
  const maintenanceUnits = technicalAids.reduce(
    (total, aid) => total + Number(aid?.maintenance_units || 0),
    0
  );

  if (maintenanceUnits > 0) {
    notifications.push({
      id: `maintenance-${maintenanceUnits}`,
      type: "maintenance",
      title: "Ayudas técnicas en mantenimiento",
      detail: `${maintenanceUnits} ${maintenanceUnits === 1 ? "unidad requiere" : "unidades requieren"} reparación o revisión.`,
      path: "/inventory",
      count: maintenanceUnits,
      date: null,
    });
  }

  let pendingItems = 0;
  let overdueItems = 0;
  let returnedItems = 0;

  loans.forEach((loan) => {
    const items = Array.isArray(loan?.items)
      ? loan.items
      : Array.isArray(loan?.loan_lines)
        ? loan.loan_lines
        : [];

    if (items.length > 0) {
      items.forEach((item) => {
        const returnedAt = item?.returned_at || item?.return_date;
        const dueAt = item?.due_at || item?.due_date || loan?.due_at;
        if (returnedAt) {
          returnedItems += 1;
          return;
        }
        pendingItems += 1;
        if (dueAt && !Number.isNaN(new Date(dueAt).getTime()) &&
            new Date(dueAt).getTime() < Date.now()) {
          overdueItems += 1;
        }
      });
      return;
    }

    const returnedAt = loan?.returned_at || loan?.return_date;
    const status = String(loan?.status || "").toLowerCase();
    if (returnedAt || ["returned", "closed", "completed"].includes(status)) {
      returnedItems += 1;
      return;
    }
    if (loan?.id && ["pending", "active", "overdue"].includes(status)) {
      pendingItems += 1;
      const dueAt = loan?.due_at || loan?.due_date;
      if (dueAt && !Number.isNaN(new Date(dueAt).getTime()) &&
          new Date(dueAt).getTime() < Date.now()) {
        overdueItems += 1;
      }
    }
  });

  if (overdueItems > 0) {
    notifications.push({
      id: `overdue-${overdueItems}`,
      type: "overdue",
      title: "Préstamos vencidos",
      detail: `${overdueItems} ${overdueItems === 1 ? "elemento superó" : "elementos superaron"} la fecha prevista de devolución.`,
      path: "/loans",
      count: overdueItems,
      date: null,
    });
  }

  if (pendingItems > 0) {
    notifications.push({
      id: `pending-${pendingItems}`,
      type: "pending",
      title: "Préstamos pendientes",
      detail: `${pendingItems} ${pendingItems === 1 ? "elemento continúa" : "elementos continúan"} prestados.`,
      path: "/loans",
      count: pendingItems,
      date: null,
    });
  }

  if (returnedItems > 0) {
    notifications.push({
      id: `returns-${returnedItems}`,
      type: "returns",
      title: "Devoluciones registradas",
      detail: `${returnedItems} ${returnedItems === 1 ? "elemento figura" : "elementos figuran"} como devueltos en el historial.`,
      path: "/returns",
      count: returnedItems,
      date: null,
    });
  }

  return notifications;
}

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.matchMedia("(max-width: 850px)").matches
  );
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const sidebarRef = useRef(null);
  const menuToggleRef = useRef(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mobility_notifications_read") || "[]");
    } catch {
      return [];
    }
  });
  const notificationRef = useRef(null);

  const navigate = useNavigate();

  const user = getUser();
  const userName = user?.name || "Administrador";
  const userInitial = userName.charAt(0).toUpperCase();
  const navigationExpanded = isMobileViewport ? mobileNavOpen : !sidebarCollapsed;

  useEffect(() => {
    function handleResize() {
      const mobileViewport = window.matchMedia("(max-width: 850px)").matches;
      setIsMobileViewport(mobileViewport);
      if (!mobileViewport) setMobileNavOpen(false);
    }

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") closeMobileNavigation(true);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  function closeMobileNavigation(restoreFocus = false) {
    if (window.matchMedia("(max-width: 850px)").matches) {
      setMobileNavOpen(false);
      if (restoreFocus) {
        window.setTimeout(() => menuToggleRef.current?.focus(), 0);
      }
    }
  }

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationsError("");

    const [loansResult, aidsResult] = await Promise.allSettled([
      api.get("/loans", { params: { page: 1, size: 50 } }),
      api.get("/technical-aids", { params: { page: 1, size: 50 } }),
    ]);

    const loans = loansResult.status === "fulfilled"
      ? extractRows(loansResult.value.data)
      : [];
    const aids = aidsResult.status === "fulfilled"
      ? extractRows(aidsResult.value.data)
      : [];

    if (loansResult.status === "rejected" && aidsResult.status === "rejected") {
      setNotificationsError("No fue posible cargar las notificaciones. Revisa tu conexión con el servidor.");
      setNotifications([]);
    } else {
      setNotifications(buildNotifications(loans, aids));
    }

    setNotificationsLoading(false);
  }

  function markNotificationAsRead(notificationId) {
    setReadNotificationIds((previous) => {
      const next = previous.includes(notificationId)
        ? previous
        : [...previous, notificationId];
      localStorage.setItem("mobility_notifications_read", JSON.stringify(next));
      return next;
    });
  }

  function markAllNotificationsAsRead() {
    const allIds = notifications.map((notification) => notification.id);
    setReadNotificationIds((previous) => {
      const next = [...new Set([...previous, ...allIds])];
      localStorage.setItem("mobility_notifications_read", JSON.stringify(next));
      return next;
    });
  }

  function openNotification(notification) {
    markNotificationAsRead(notification.id);
    setNotificationsOpen(false);
    navigate(notification.path);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const term = globalSearch.trim();

    if (term.length < 2) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      const requests = await Promise.allSettled([
        api.get("/beneficiaries", {
          params: { q: term, page: 1, size: 6 },
        }),
        api.get("/technical-aids", {
          params: { q: term, page: 1, size: 6 },
        }),
        api.get("/loans", {
          params: { page: 1, size: 50 },
        }),
      ]);

      if (cancelled) return;

      const results = [];

      if (requests[0].status === "fulfilled") {
        extractRows(requests[0].value.data).forEach((person) => {
          results.push({
            id: `beneficiary-${person.id}`,
            type: "Beneficiario",
            title: person.full_name || "Beneficiario",
            detail: person.identification_number || "Registro de beneficiario",
            path: "/beneficiaries",
            icon: Users,
          });
        });
      }

      if (requests[1].status === "fulfilled") {
        extractRows(requests[1].value.data).forEach((aid) => {
          results.push({
            id: `aid-${aid.id}`,
            type: "Ayuda técnica",
            title: aid.name || aid.reference || "Ayuda técnica",
            detail: `${aid.reference || "Sin referencia"} · ${localizeCategoryName(aid.category?.name || aid.category_name || "Uncategorized")}`,
            path: "/technical-aids",
            icon: Accessibility,
          });
        });
      }

      if (requests[2].status === "fulfilled") {
        const loans = extractRows(requests[2].value.data);
        const normalizedTerm = term.toLocaleLowerCase();

        loans
          .filter((loan) => {
            const itemReferences = (loan.items || [])
              .map((item) => item.aid_reference || "")
              .join(" ");

            return [
              loan.beneficiary_name,
              loan.id,
              itemReferences,
            ].some((value) =>
              String(value || "").toLocaleLowerCase().includes(normalizedTerm)
            );
          })
          .slice(0, 6)
          .forEach((loan) => {
            results.push({
              id: `loan-${loan.id}`,
              type: "Préstamo",
              title: loan.beneficiary_name || "Registro de préstamo",
              detail: `PR-${String(loan.id).slice(0, 6).toUpperCase()} · ${(loan.items || []).map((item) => item.aid_reference).filter(Boolean).join(", ") || "Ayuda técnica"}`,
              path: "/loans",
              icon: CalendarDays,
            });
          });
      }

      if (!cancelled) {
        setSearchResults(results.slice(0, 12));
        const allFailed = requests.every((request) => request.status === "rejected");
        if (allFailed) {
          setSearchError("No fue posible buscar registros. Revisa tu conexión e inténtalo nuevamente.");
        }
        setSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [globalSearch]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    function handleNotificationOutsideClick(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleNotificationOutsideClick);
    return () => document.removeEventListener("mousedown", handleNotificationOutsideClick);
  }, []);

  function openSearchResult(result) {
    navigate(result.path, {
      state: { globalSearchTerm: globalSearch.trim() },
    });
    setSearchOpen(false);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      setSearchOpen(false);
    }

    if (event.key === "Enter" && searchResults.length > 0) {
      openSearchResult(searchResults[0]);
    }
  }

  async function handleLogout() {
    setLogoutError("");
    setLogoutLoading(true);

    try {
      await api.post("/logout");
      clearAuth();
      navigate("/login", { replace: true });
    } catch (error) {
      if ([401, 419].includes(error.response?.status)) {
        clearAuth();
        navigate("/login", { replace: true });
        return;
      }

      setLogoutError(
        getUiErrorMessage(error, "No fue posible cerrar la sesión. Inténtalo nuevamente.")
      );
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${mobileNavOpen ? "mobile-nav-open" : ""}`}>
      {mobileNavOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => closeMobileNavigation(true)}
          aria-label="Cerrar menú de navegación"
          tabIndex={-1}
        />
      )}
      <aside
        className="sidebar"
        id="admin-navigation"
        ref={sidebarRef}
        aria-hidden={isMobileViewport ? !mobileNavOpen : undefined}
      >
        <div className="brand">
          <img src={logo} alt="Logotipo de Mobility Aids" className="brand-logo" />
          <div className="brand-information">
            <span>Mobility <strong>Aids</strong></span>
            <small>Technical Aids Bank<br />for Mobility</small>
          </div>
        </div>

        <div className="sidebar-label">MENÚ PRINCIPAL</div>

        <nav aria-label="Navegación principal">
          {navigationLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              title={label}
              onClick={() => closeMobileNavigation(true)}
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <Icon size={23} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-divider"></div>

        <NavLink
          to="/settings"
          title="Ajustes"
          onClick={() => closeMobileNavigation(true)}
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          <Settings size={23} strokeWidth={1.9} />
          <span>Ajustes</span>
        </NavLink>

        <div className="sidebar-decoration">
          <div className="sidebar-wave sidebar-wave-one"></div>
          <div className="sidebar-wave sidebar-wave-two"></div>
          <p>Movilidad,<br />independencia y<br />calidad de vida</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            ref={menuToggleRef}
            onClick={() => {
              if (isMobileViewport) {
                setSidebarCollapsed(false);
                if (mobileNavOpen) {
                  closeMobileNavigation(true);
                } else {
                  setMobileNavOpen(true);
                  window.requestAnimationFrame(() => {
                    if (sidebarRef.current?.getAttribute("aria-hidden") === "false") {
                      sidebarRef.current.querySelector("nav a")?.focus();
                    }
                  });
                }
              } else {
                setSidebarCollapsed((previous) => !previous);
              }
            }}
            aria-label={navigationExpanded ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-controls="admin-navigation"
            aria-expanded={navigationExpanded}
          >
            {navigationExpanded && isMobileViewport ? <X size={25} /> : <Menu size={25} />}
          </button>

          <div className="global-search-container" ref={searchRef}>
            <div className="search-box">
              <Search size={19} />
              <input
                type="search"
                value={globalSearch}
                onChange={(event) => {
                  setGlobalSearch(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar ayudas técnicas, beneficiarios o préstamos..."
                aria-label="Buscar en el sistema"
                aria-expanded={searchOpen}
                aria-controls="global-search-results"
                autoComplete="off"
              />
              {globalSearch && (
                <button
                  type="button"
                  className="global-search-clear"
                  onClick={() => {
                    setGlobalSearch("");
                    setSearchResults([]);
                    setSearchOpen(true);
                  }}
                  aria-label="Borrar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {searchOpen && globalSearch.trim().length >= 2 && (
              <div className="global-search-dropdown" id="global-search-results">
                {searchLoading ? (
                  <div className="global-search-message">
                    <LoaderCircle size={17} className="global-search-spinner" />
                    Buscando registros...
                  </div>
                ) : searchError ? (
                  <div className="global-search-message global-search-error">{searchError}</div>
                ) : searchResults.length === 0 ? (
                  <div className="global-search-message">
                    No se encontraron registros para “{globalSearch.trim()}”.
                  </div>
                ) : (
                  <>
                    <div className="global-search-heading">RESULTADOS DE BÚSQUEDA</div>
                    {searchResults.map((result) => {
                      const ResultIcon = result.icon;
                      return (
                        <button
                          type="button"
                          className="global-search-result"
                          key={result.id}
                          onClick={() => openSearchResult(result)}
                        >
                          <span className="global-search-result-icon"><ResultIcon size={18} /></span>
                          <span className="global-search-result-copy">
                            <strong>{result.title}</strong>
                            <small>{result.type} · {result.detail}</small>
                          </span>
                          <span className="global-search-result-arrow">›</span>
                        </button>
                      );
                    })}
                    <div className="global-search-footer">
                      Selecciona un resultado para abrir su sección.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <div className="notification-container" ref={notificationRef}>
              <button
                type="button"
                className="notification-button"
                aria-label="Abrir notificaciones"
                aria-expanded={notificationsOpen}
                aria-controls="notifications-panel"
                onClick={() => {
                  const nextOpen = !notificationsOpen;
                  setNotificationsOpen(nextOpen);
                  if (nextOpen) loadNotifications();
                }}
              >
                <Bell size={21} />
                {notifications.some((notification) => !readNotificationIds.includes(notification.id)) && (
                  <span className="notification-dot"></span>
                )}
              </button>

              {notificationsOpen && (
                <section className="notifications-panel" id="notifications-panel" aria-label="Notificaciones">
                  <div className="notifications-panel-header">
                    <div>
                      <span className="notifications-eyebrow">Mobility Aids</span>
                      <h2>Notificaciones</h2>
                      <p>
                        Elementos pendientes por revisar: {notifications.filter((notification) => !readNotificationIds.includes(notification.id)).length}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="notifications-icon-button"
                      onClick={loadNotifications}
                      aria-label="Actualizar notificaciones"
                      title="Actualizar"
                      disabled={notificationsLoading}
                    >
                      <RefreshCw size={17} className={notificationsLoading ? "global-search-spinner" : ""} />
                    </button>
                  </div>

                  <div className="notifications-toolbar">
                    <span>Actividad del sistema</span>
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      disabled={notifications.length === 0 || notifications.every((notification) => readNotificationIds.includes(notification.id))}
                    >
                      <CheckCheck size={15} />
                      Marcar todas como leídas
                    </button>
                  </div>

                  {notificationsLoading ? (
                    <div className="notifications-state">
                      <LoaderCircle size={20} className="global-search-spinner" />
                      Consultando información...
                    </div>
                  ) : notificationsError ? (
                    <div className="notifications-state notifications-state-error" role="alert">
                      {notificationsError}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="notifications-empty">
                      <span className="notifications-empty-icon"><Bell size={23} /></span>
                      <strong>Todo está al día</strong>
                      <p>No hay alertas pendientes de préstamos o inventario.</p>
                    </div>
                  ) : (
                    <div className="notifications-list">
                      {notifications.map((notification) => {
                        const isRead = readNotificationIds.includes(notification.id);
                        const NotificationIcon = notification.type === "maintenance"
                          ? Wrench
                          : notification.type === "overdue"
                            ? AlertTriangle
                            : notification.type === "returns"
                              ? CheckCheck
                              : Clock3;

                        return (
                          <button
                            type="button"
                            key={notification.id}
                            className={`notification-item ${isRead ? "is-read" : "is-unread"} notification-${notification.type}`}
                            onClick={() => openNotification(notification)}
                          >
                            <span className="notification-item-icon">
                              <NotificationIcon size={19} />
                            </span>
                            <span className="notification-item-copy">
                              <strong>{notification.title}</strong>
                              <small>{notification.detail}</small>
                              <em>Ver sección <span aria-hidden="true">→</span></em>
                            </span>
                            {!isRead && <span className="notification-unread-dot" aria-label="Notificación sin leer"></span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="notifications-panel-footer">
                    La información proviene del sistema Mobility Aids.
                  </div>
                </section>
              )}
            </div>

            <div className="profile-menu-container">
              <button
                type="button"
                className="user-profile profile-trigger"
                onClick={() => setProfileMenuOpen((previous) => !previous)}
                aria-expanded={profileMenuOpen}
                aria-label="Abrir menú de administración"
              >
                <div className="avatar">{userInitial}</div>
                <div className="user-information">
                  <strong>{userName}</strong>
                  <small>Mobility Aids</small>
                </div>
                <ChevronDown
                  size={16}
                  className={`profile-chevron ${profileMenuOpen ? "profile-chevron-open" : ""}`}
                />
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-heading">
                    <strong>{userName}</strong>
                    <small>Mi cuenta</small>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  <button
                    type="button"
                    className="profile-logout-button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                  >
                    <LogOut size={18} />
                    <span>{logoutLoading ? "Cerrando sesión..." : "Cerrar sesión"}</span>
                  </button>
                  {logoutError && (
                    <p className="profile-logout-error" role="alert">{logoutError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
