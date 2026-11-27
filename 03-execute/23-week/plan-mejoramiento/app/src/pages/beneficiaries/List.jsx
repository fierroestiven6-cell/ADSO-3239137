import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "../../services/api";
import { getUiErrorMessage, localizeUiMessage } from "../../services/uiMessages";
import "./List.css";
import beneficiariesBanner from "../../assets/images/beneficiaries-banner.png";

const PAGE_SIZE = 10;

function getErrorMessage(error) {
  return getUiErrorMessage(error);
}

export default function Page() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    identification_number: "",
  });

  const loadBeneficiaries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/beneficiaries", {
        params: { page, per_page: PAGE_SIZE },
      });

      const payload = response.data;
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      setBeneficiaries(rows);
      setTotal(Number(payload?.total ?? rows.length));
      setLastPage(
        Number(payload?.last_page ?? Math.max(1, Math.ceil((payload?.total ?? rows.length) / PAGE_SIZE)))
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadBeneficiaries();
  }, [loadBeneficiaries]);

  const visibleBeneficiaries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return beneficiaries;

    return beneficiaries.filter((beneficiary) =>
      `${beneficiary.full_name ?? ""} ${beneficiary.identification_number ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [beneficiaries, search]);

  function openCreate() {
    setEditingId(null);
    setForm({ full_name: "", identification_number: "" });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(beneficiary) {
    setEditingId(beneficiary.id);
    setForm({
      full_name: beneficiary.full_name ?? "",
      identification_number: beneficiary.identification_number ?? "",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      full_name: form.full_name.trim(),
      identification_number: form.identification_number.trim(),
    };

    try {
      if (editingId) {
        await api.put(`/beneficiaries/${editingId}`, payload);
        setSuccess("Los datos del beneficiario se actualizaron correctamente.");
      } else {
        await api.post("/beneficiaries", payload);
        setSuccess("El beneficiario se registró correctamente.");
        setPage(1);
      }

      setModalOpen(false);
      await loadBeneficiaries();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(beneficiary) {
    setError("");
    setSuccess("");
    setDeleteError("");
    setDeleteTarget(beneficiary);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const beneficiary = deleteTarget;
    setDeletingId(beneficiary.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/beneficiaries/${beneficiary.id}`);
      setDeleteTarget(null);
      setSuccess("El beneficiario se eliminó correctamente.");
      if (beneficiaries.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadBeneficiaries();
      }
    } catch (requestError) {
      const serverMessage = localizeUiMessage(
        requestError?.response?.data?.message,
        ""
      );
      const normalizedMessage = serverMessage.toLowerCase();

      const hasLoanHistory =
        normalizedMessage.includes("loan history") ||
        normalizedMessage.includes("loans associated") ||
        normalizedMessage.includes("cannot be deleted");

      setDeleteTarget(null);
      setDeleteError(
        hasLoanHistory
          ? "No se pueden eliminar beneficiarios con préstamos registrados."
          : "No fue posible eliminar al beneficiario. " +
              (serverMessage || "Inténtalo nuevamente o contacta a un administrador.")
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <main className="beneficiaries-page">
        <section className="beneficiaries-hero">
          <img className="beneficiaries-hero-image" src={beneficiariesBanner} alt="" aria-hidden="true" />
          <div className="beneficiaries-hero-content">
            <span className="beneficiaries-eyebrow">Mobility Aids · Personas</span>
            <div className="beneficiaries-hero-title">
              <span className="beneficiaries-hero-icon"><Users size={31} /></span>
              <div>
                <h2>Beneficiarios</h2>
                <p>Gestión y seguimiento de las personas que reciben ayudas para la movilidad.</p>
                <span className="beneficiaries-hero-line" />
              </div>
            </div>
          </div>
          <div className="beneficiaries-hero-decoration" aria-hidden="true">
            <Users size={150} />
          </div>
        </section>

        {error && (
          <div className="beneficiaries-alert beneficiaries-alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Cerrar"><X size={17} /></button>
          </div>
        )}

        {success && (
          <div className="beneficiaries-alert beneficiaries-alert-success" role="status">
            <CheckCircle2 size={18} />
            <span>{success}</span>
            <button onClick={() => setSuccess("")} aria-label="Cerrar"><X size={17} /></button>
          </div>
        )}

        <section className="beneficiaries-summary">
          <article className="beneficiaries-summary-card">
            <span className="beneficiaries-summary-icon beneficiaries-blue"><Users size={21} /></span>
            <div>
              <strong>{total}</strong>
              <span>Beneficiarios registrados</span>
            </div>
          </article>
          <article className="beneficiaries-summary-card">
            <span className="beneficiaries-summary-icon beneficiaries-green"><CheckCircle2 size={21} /></span>
            <div>
              <strong>{beneficiaries.length}</strong>
              <span>En esta página</span>
            </div>
          </article>
        </section>

        <section className="beneficiaries-list-card">
          <header className="beneficiaries-list-header">
            <div className="beneficiaries-list-title">
              <span><Users size={19} /></span>
              <div>
                <h3>Directorio de beneficiarios</h3>
                <p>{total} registros en el sistema</p>
              </div>
            </div>
            <button className="beneficiaries-primary" onClick={openCreate}>
              <Plus size={17} /> Agregar beneficiario
            </button>
          </header>

          <div className="beneficiaries-toolbar">
            <label className="beneficiaries-search">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o número de identificación..."
              />
            </label>
            <button
              className="beneficiaries-refresh"
              onClick={loadBeneficiaries}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "beneficiaries-spin" : ""} />
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="beneficiaries-empty">
              <RefreshCw size={23} className="beneficiaries-spin" />
              <span>Cargando beneficiarios...</span>
            </div>
          ) : visibleBeneficiaries.length === 0 ? (
            <div className="beneficiaries-empty">
              <Users size={30} />
              <strong>{search ? "No se encontraron beneficiarios coincidentes" : "Todavía no hay beneficiarios registrados"}</strong>
              <span>
                {search
                  ? "Prueba con otro nombre o número de identificación."
                  : "Registra al primer beneficiario para asignarle ayudas técnicas."}
              </span>
              {!search && (
                <button className="beneficiaries-primary" onClick={openCreate}>
                  <Plus size={16} /> Agregar beneficiario
                </button>
              )}
            </div>
          ) : (
            <div className="beneficiaries-table-wrap">
              <table className="beneficiaries-table">
                <thead>
                  <tr>
                    <th>Beneficiario</th>
                    <th>Número de identificación</th>
                    <th>Estado del registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBeneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id}>
                      <td>
                        <div className="beneficiaries-person">
                          <span className="beneficiaries-avatar">
                            {(beneficiary.full_name || "B").trim().charAt(0).toUpperCase()}
                          </span>
                          <strong>{beneficiary.full_name}</strong>
                        </div>
                      </td>
                      <td>{beneficiary.identification_number}</td>
                      <td>
                        <span className="beneficiaries-record-status">
                          <CheckCircle2 size={14} /> Registrado
                        </span>
                      </td>
                      <td>
                        <div className="beneficiaries-actions">
                          <button
                            className="beneficiaries-edit"
                            onClick={() => openEdit(beneficiary)}
                            title="Editar beneficiario"
                            aria-label={`Editar a ${beneficiary.full_name}`}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            className="beneficiaries-delete"
                            onClick={() => handleDelete(beneficiary)}
                            disabled={deletingId === beneficiary.id}
                            title="Eliminar beneficiario"
                            aria-label={`Eliminar a ${beneficiary.full_name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="beneficiaries-pagination">
            <span>Página {page} de {lastPage}</span>
            <div>
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                aria-label="Página anterior"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                disabled={page >= lastPage || loading}
                aria-label="Página siguiente"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </footer>
        </section>
      </main>

      {deleteTarget && (
        <div
          className="beneficiaries-delete-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setDeleteTarget(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(5, 20, 35, 0.76)",
            backdropFilter: "blur(8px)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="beneficiary-delete-title"
            style={{
              position: "relative",
              width: "min(100%, 590px)",
              overflow: "hidden",
              borderRadius: "24px",
              background: "#FFFFFF",
              boxShadow: "0 28px 90px rgba(0, 0, 0, 0.3)",
              color: "#14243A",
            }}
          >
            <div
              style={{
                height: "9px",
                background: "linear-gradient(90deg, #C78316, #F4B84D)",
              }}
            />
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={Boolean(deletingId)}
              aria-label="Cerrar diálogo"
              style={{
                position: "absolute",
                top: "25px",
                right: "25px",
                width: "44px",
                height: "44px",
                display: "grid",
                placeItems: "center",
                border: "1px solid #DCE5EF",
                borderRadius: "14px",
                background: "#FFFFFF",
                color: "#64748B",
                cursor: deletingId ? "not-allowed" : "pointer",
              }}
            >
              <X size={20} />
            </button>

            <div style={{ padding: "38px 42px 34px", textAlign: "center" }}>
              <div
                style={{
                  width: "82px",
                  height: "82px",
                  margin: "0 auto 23px",
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid #F3D5A5",
                  borderRadius: "25px",
                  background: "#FFF7E9",
                  color: "#C78316",
                }}
              >
                <Trash2 size={34} strokeWidth={1.9} />
              </div>

              <span
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#B97816",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "1.7px",
                }}
              >
                Mobility Aids · Gestión de beneficiarios
              </span>

              <h2
                id="beneficiary-delete-title"
                style={{
                  margin: "0 0 13px",
                  color: "#172338",
                  fontSize: "clamp(24px, 4vw, 31px)",
                  lineHeight: 1.2,
                  fontWeight: 800,
                }}
              >
                ¿Eliminar beneficiario?
              </h2>

              <p
                style={{
                  maxWidth: "440px",
                  margin: "0 auto 27px",
                  color: "#71819A",
                  fontSize: "15px",
                  lineHeight: 1.7,
                }}
              >
                ¿Confirmas que deseas eliminar a este beneficiario?
                Revisa la información antes de continuar.
              </p>

              <div
                style={{
                  padding: "23px 24px",
                  marginBottom: "18px",
                  border: "1px solid #DFE8F2",
                  borderRadius: "18px",
                  background: "#F5F8FC",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    display: "block",
                    marginBottom: "9px",
                    color: "#8796AB",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "1.2px",
                  }}
                >
                  BENEFICIARIO SELECCIONADO
                </span>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    color: "#172338",
                    fontSize: "20px",
                    fontWeight: 800,
                  }}
                >
                  {deleteTarget.full_name}
                </strong>
                <span style={{ color: "#B97816", fontSize: "14px", fontWeight: 700 }}>
                  Número de identificación: {deleteTarget.identification_number || "No disponible"}
                </span>
              </div>

              <div
                role="note"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "13px 15px",
                  marginBottom: "27px",
                  border: "1px solid #F3D5D5",
                  borderRadius: "13px",
                  background: "#FFF5F4",
                  color: "#9F4545",
                  textAlign: "left",
                  fontSize: "12px",
                  lineHeight: 1.55,
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>
                  Esta acción puede afectar los registros asociados al beneficiario.
                  Si tiene préstamos asociados, el sistema aplicará sus reglas de protección.
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={Boolean(deletingId)}
                  style={{
                    minWidth: "122px",
                    minHeight: "52px",
                    padding: "0 22px",
                    border: "1px solid #D8E2EE",
                    borderRadius: "15px",
                    background: "#FFFFFF",
                    color: "#52627A",
                    fontWeight: 750,
                    cursor: deletingId ? "not-allowed" : "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={Boolean(deletingId)}
                  style={{
                    minWidth: "174px",
                    minHeight: "52px",
                    padding: "0 23px",
                    border: "none",
                    borderRadius: "15px",
                    background: deletingId ? "#C78A8A" : "#B94A48",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    boxShadow: "0 9px 20px rgba(185, 74, 72, 0.2)",
                    cursor: deletingId ? "wait" : "pointer",
                  }}
                >
                  {deletingId ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {deleteError && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteError("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(5, 20, 35, 0.76)",
            backdropFilter: "blur(8px)",
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="beneficiary-delete-error-title"
            aria-describedby="beneficiary-delete-error-description"
            style={{
              position: "relative",
              width: "min(100%, 520px)",
              overflow: "hidden",
              borderRadius: "24px",
              background: "#FFFFFF",
              boxShadow: "0 28px 90px rgba(0, 0, 0, 0.3)",
              color: "#14243A",
            }}
          >
            <div
              style={{
                height: "8px",
                background: "linear-gradient(90deg, #B94A48, #E17A72)",
              }}
            />
            <div style={{ padding: "38px 38px 32px", textAlign: "center" }}>
              <div
                style={{
                  width: "76px",
                  height: "76px",
                  margin: "0 auto 22px",
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid #F3D0CE",
                  borderRadius: "23px",
                  background: "#FFF3F2",
                  color: "#B94A48",
                }}
              >
                <AlertCircle size={34} strokeWidth={1.9} />
              </div>

              <span
                style={{
                  display: "block",
                  marginBottom: "11px",
                  color: "#B97816",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "1.5px",
                }}
              >
                Mobility Aids · Gestión de beneficiarios
              </span>

              <h2
                id="beneficiary-delete-error-title"
                style={{
                  margin: "0 0 12px",
                  color: "#172338",
                  fontSize: "clamp(23px, 4vw, 29px)",
                  lineHeight: 1.2,
                  fontWeight: 800,
                }}
              >
                No se pudo eliminar
              </h2>

              <p
                id="beneficiary-delete-error-description"
                style={{
                  margin: "0 0 24px",
                  color: "#71819A",
                  fontSize: "15px",
                  lineHeight: 1.65,
                }}
              >
                El sistema no pudo completar esta acción.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "17px 18px",
                  marginBottom: "26px",
                  border: "1px solid #F3D5D3",
                  borderRadius: "15px",
                  background: "#FFF5F4",
                  color: "#A33F3F",
                  textAlign: "left",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                <AlertCircle size={19} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>{deleteError}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => setDeleteError("")}
                  style={{
                    minWidth: "150px",
                    minHeight: "50px",
                    padding: "0 24px",
                    border: "none",
                    borderRadius: "14px",
                    background: "#B94A48",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(185, 74, 72, 0.2)",
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {modalOpen && (
        <div
          className="beneficiaries-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setModalOpen(false);
          }}
        >
          <section
            className="beneficiaries-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="beneficiaries-modal-title"
          >
            <header className="beneficiaries-modal-header">
              <div>
                <span className="beneficiaries-eyebrow">Mobility Aids · Registro de beneficiario</span>
                <h2 id="beneficiaries-modal-title">
                  {editingId ? "Editar beneficiario" : "Registrar beneficiario"}
                </h2>
                <p>Ingresa la información básica del beneficiario.</p>
              </div>
              <button
                className="beneficiaries-close"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <label htmlFor="beneficiary-name">Nombre completo</label>
              <input
                id="beneficiary-name"
                type="text"
                value={form.full_name}
                onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                placeholder="Ej.: María García López"
                maxLength={255}
                required
              />

              <label htmlFor="beneficiary-identification">Número de identificación</label>
              <input
                id="beneficiary-identification"
                type="text"
                value={form.identification_number}
                onChange={(event) => setForm((current) => ({ ...current, identification_number: event.target.value }))}
                placeholder="Ingresa el número de identificación"
                maxLength={50}
                required
              />

              {error && (
                <div className="beneficiaries-alert beneficiaries-alert-error" role="alert">
                  <AlertCircle size={17} /><span>{error}</span>
                </div>
              )}

              <footer className="beneficiaries-modal-actions">
                <button
                  type="button"
                  className="beneficiaries-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="beneficiaries-primary" disabled={saving}>
                  {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar beneficiario"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
