import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import api from "../../services/api";
import { getUiErrorMessage, localizeCategoryName } from "../../services/uiMessages";
import mobilityBanner from "../../assets/images/Mobility Aids.png";
import "./List.css";

const PAGE_SIZE = 10;

const STATUS = {
  returned: "Devuelta",
  active: "Pendiente",
  overdue: "Vencida",
};

function dateLabel(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
}

function returnConditionLabel(item) {
  if (!item?.returned_at) return "Pendiente";
  if (item.return_condition === "maintenance") return "Requiere mantenimiento";
  if (item.return_condition === "available") return "Disponible";
  return "No registrado";
}

function errorText(error) {
  return getUiErrorMessage(error);
}

function flattenLoanItems(loans) {
  return loans.flatMap((loan) =>
    (loan.items ?? []).map((item) => ({
      ...item,
      loan_id: loan.id,
      loan_code: `PR-${String(loan.id).slice(0, 6).toUpperCase()}`,
      beneficiary_name: loan.beneficiary_name || "Beneficiario",
      loaned_at: loan.loaned_at,
      loan_status: loan.status,
    }))
  );
}

export default function Page() {
  const [returns, setReturns] = useState([]);

  const [metrics, setMetrics] = useState({
    registered: 0,
    returned: 0,
    pending: 0,
    overdue: 0,
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState("");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnToConfirm, setReturnToConfirm] = useState(null);
  const [returnCondition, setReturnCondition] = useState("available");

  // Load loan records and calculate return statistics.
  const loadReturns = useCallback(async () => {
    setLoading(true);

    try {
      const first = await api.get("/loans", {
        params: { page: 1, size: 50 },
      });

      const total = Number(
        first.data?.total ?? (first.data?.items ?? []).length
      );

      const pages = Math.max(1, Math.ceil(total / 50));

      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, index) =>
          api.get("/loans", {
            params: {
              page: index + 2,
              size: 50,
            },
          })
        )
      );

      const loans = [
        ...(first.data?.items ?? []),
        ...rest.flatMap((response) => response.data?.items ?? []),
      ];

      const rows = flattenLoanItems(loans);

      setReturns(rows);

      setMetrics({
        registered: rows.length,
        returned: rows.filter((item) => Boolean(item.returned_at)).length,
        pending: rows.filter(
          (item) =>
            !item.returned_at && item.loan_status !== "overdue"
        ).length,
        overdue: rows.filter(
          (item) =>
            !item.returned_at && item.loan_status === "overdue"
        ).length,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: errorText(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  // Search and filter return records.
  const filteredReturns = useMemo(() => {
    const term = search.trim().toLowerCase();

    return returns.filter((item) => {
      const status = item.returned_at
        ? "returned"
        : item.loan_status === "overdue"
          ? "overdue"
          : "active";

      const statusMatch =
        statusFilter === "all" || status === statusFilter;

      const textMatch =
        !term ||
        String(item.beneficiary_name).toLowerCase().includes(term) ||
        String(item.loan_code).toLowerCase().includes(term) ||
        String(item.aid_reference ?? "").toLowerCase().includes(term);

      return statusMatch && textMatch;
    });
  }, [returns, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReturns.length / PAGE_SIZE)
  );

  const visibleReturns = filteredReturns.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Open return confirmation.
  function registerReturn(item) {
    setReturnCondition("available");
    setReturnToConfirm(item);
  }

  // Register a technical aid return.
  async function confirmReturn() {
    if (!returnToConfirm) return;

    const item = returnToConfirm;

    setReturning(String(item.id));
    setMessage({ type: "", text: "" });

    try {
      await api.post(
        `/loans/${item.loan_id}/items/${item.id}/return`,
        { condition: returnCondition }
      );

      setReturnToConfirm(null);

      setMessage({
        type: "success",
        text: "La devolución se registró correctamente.",
      });

      await loadReturns();
      setSelectedReturn(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: errorText(error),
      });
    } finally {
      setReturning("");
    }
  }

  // Export filtered return history as CSV.
  function exportCsv() {
    const rows = [
      [
        "Código del préstamo",
        "Beneficiario",
        "Ayuda técnica",
        "Fecha del préstamo",
        "Fecha de vencimiento",
        "Fecha de devolución",
        "Estado de la ayuda",
        "Estado",
      ],

      ...filteredReturns.map((item) => [
        item.loan_code,
        item.beneficiary_name,
        item.aid_reference ?? "",
        dateLabel(item.loaned_at),
        dateLabel(item.due_at),
        dateLabel(item.returned_at),
        returnConditionLabel(item),
        item.returned_at
          ? "Devuelta"
          : item.loan_status === "overdue"
            ? "Vencida"
            : "Pendiente",
      ]),
    ];

    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(value).replaceAll('"', '""')}"`
            )
            .join(";")
        )
        .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = "historial-devoluciones-mobility-aids.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <main className="returns-page">

        {/* RETURNS HERO BANNER */}
        <section
          className="returns-hero"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(5, 20, 39, 0.78) 0%, rgba(5, 20, 39, 0.45) 42%, rgba(5, 20, 39, 0.02) 100%), url("${mobilityBanner}")`,
          }}
        >
          <div className="returns-hero-content">
            <span className="returns-hero-icon">
              <RotateCcw size={38} />
            </span>

            <div>
              <span className="returns-eyebrow">
                Mobility Aids · Operaciones
              </span>

              <h2>Devoluciones</h2>

              <p>
                Gestión de devoluciones de ayudas técnicas
                <br />
                y disponibilidad de equipos.
              </p>

              <span className="returns-hero-underline" />
            </div>
          </div>
        </section>

        {/* SUCCESS AND ERROR MESSAGES */}
        {message.text && (
          <div
            className={`returns-alert ${
              message.type === "error"
                ? "returns-alert-error"
                : "returns-alert-success"
            }`}
            role="status"
          >
            {message.type === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}

            <span>{message.text}</span>

            <button
              onClick={() => setMessage({ type: "", text: "" })}
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* RETURN STATISTICS */}
        <section className="returns-metrics">
          <article className="returns-metric-card returns-metric-registered">
            <span className="returns-metric-icon">
              <CalendarDays size={23} />
            </span>

            <div>
              <strong>{metrics.registered}</strong>
              <p>Elementos prestados</p>
            </div>
          </article>

          <article className="returns-metric-card returns-metric-returned">
            <span className="returns-metric-icon">
              <CheckCircle2 size={24} />
            </span>

            <div>
              <strong>{metrics.returned}</strong>
              <p>Elementos devueltos</p>
            </div>
          </article>

          <article className="returns-metric-card returns-metric-pending">
            <span className="returns-metric-icon">
              <RotateCcw size={24} />
            </span>

            <div>
              <strong>{metrics.pending}</strong>
              <p>Devoluciones pendientes</p>
            </div>
          </article>

          <article className="returns-metric-card returns-metric-overdue">
            <span className="returns-metric-icon">
              <Clock3 size={24} />
            </span>

            <div>
              <strong>{metrics.overdue}</strong>
              <p>Elementos vencidos</p>
            </div>
          </article>
        </section>

        {/* RETURN HISTORY */}
        <section className="returns-list-card">
          <div className="returns-list-title">
            <h3>
              <span>
                <RotateCcw size={19} />
              </span>
              Historial de devoluciones
            </h3>
          </div>

          {/* SEARCH AND FILTERS */}
          <div className="returns-toolbar">
            <label className="returns-search">
              <Search size={17} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por beneficiario, ayuda técnica o código..."
              />
            </label>

            <div className="returns-toolbar-actions">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filtrar devoluciones"
              >
                <option value="all">Todos los estados</option>
                <option value="returned">Devueltas</option>
                <option value="active">Pendientes</option>
                <option value="overdue">Vencidas</option>
              </select>

              <button
                className="returns-tool-button"
                onClick={exportCsv}
              >
                <Download size={16} />
                Exportar
              </button>

              <button
                className="returns-tool-button"
                onClick={loadReturns}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "returns-spinning" : ""}
                />
                Actualizar
              </button>
            </div>
          </div>

          {/* RETURNS TABLE */}
          {loading ? (
            <div className="returns-empty">
              <RefreshCw
                className="returns-spinning"
                size={24}
              />
              Cargando devoluciones...
            </div>
          ) : visibleReturns.length === 0 ? (
            <div className="returns-empty">
              <RotateCcw size={30} />
              <strong>No hay devoluciones para mostrar</strong>
              <span>
                Las ayudas técnicas prestadas aparecerán aquí.
              </span>
            </div>
          ) : (
            <div className="returns-table-wrap">
              <table className="returns-table">
                <thead>
                  <tr>
                    <th>Código del préstamo</th>
                    <th>Beneficiario</th>
                    <th>Ayuda técnica</th>
                    <th>Fecha del préstamo</th>
                    <th>Fecha de vencimiento</th>
                    <th>Fecha de devolución</th>
                    <th>Estado de la ayuda</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleReturns.map((item) => {
                    const status = item.returned_at
                      ? "returned"
                      : item.loan_status === "overdue"
                        ? "overdue"
                        : "active";

                    return (
                      <tr key={`${item.loan_id}-${item.id}`}>
                        <td>
                          <strong className="returns-code">
                            {item.loan_code}
                          </strong>
                        </td>

                        <td>
                          <span className="returns-person">
                            <span className="returns-avatar">
                              {item.beneficiary_name.charAt(0).toUpperCase()}
                            </span>

                            {item.beneficiary_name}
                          </span>
                        </td>

                        <td>
                          <div className="returns-aid-cell">
                            <span className="returns-aid-symbol">
                              ♿
                            </span>

                            <span>
                              {item.aid_reference || "Ayuda técnica"}
                            </span>
                          </div>
                        </td>

                        <td>{dateLabel(item.loaned_at)}</td>
                        <td>{dateLabel(item.due_at)}</td>
                        <td>{dateLabel(item.returned_at)}</td>

                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              color: !item.returned_at
                                ? "#8a6a24"
                                : item.return_condition === "maintenance"
                                  ? "#b45309"
                                  : item.return_condition === "available"
                                    ? "#047857"
                                    : "#64748b",
                              background: !item.returned_at
                                ? "#fff4d6"
                                : item.return_condition === "maintenance"
                                  ? "#ffedd5"
                                  : item.return_condition === "available"
                                    ? "#d1fae5"
                                    : "#f1f5f9",
                            }}
                          >
                            {returnConditionLabel(item)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`returns-status returns-status-${status}`}
                          >
                            {status === "returned" ? (
                              <CheckCircle2 size={13} />
                            ) : status === "overdue" ? (
                              <AlertCircle size={13} />
                            ) : (
                              <Clock3 size={13} />
                            )}

                            {STATUS[status]}
                          </span>
                        </td>

                        <td>
                          <div className="returns-row-actions">
                            <button
                              title="Ver detalles de la devolución"
                              aria-label="Ver detalles de la devolución"
                              onClick={() => setSelectedReturn(item)}
                            >
                              <Eye size={17} />
                            </button>

                            {!item.returned_at ? (
                              <button
                                className="returns-register-button"
                                title="Registrar devolución"
                                onClick={() => registerReturn(item)}
                                disabled={returning === String(item.id)}
                              >
                                <RotateCcw size={16} />
                              </button>
                            ) : (
                              <span className="returns-done-mark">
                                <CheckCircle2 size={17} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          <div className="returns-pagination">
            <span>
              Mostrando {visibleReturns.length} de {filteredReturns.length} registros
              · Página {page} de {totalPages}
            </span>

            <div>
              <button
                onClick={() =>
                  setPage((value) => Math.max(1, value - 1))
                }
                disabled={page <= 1 || loading}
                aria-label="Anterior"
              >
                <ArrowLeft size={16} />
              </button>

              <button
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={page >= totalPages || loading}
                aria-label="Siguiente"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* API INFORMATION */}
        <div className="returns-api-note">
          <AlertCircle size={17} />
          La información de devoluciones se obtiene de los registros de préstamos mediante la API de Laravel.
        </div>
      </main>

      {/* RETURN DETAILS MODAL */}
      {selectedReturn && (
        <div
          className="returns-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReturn(null);
            }
          }}
        >
          <section
            className="returns-modal returns-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-details-title"
          >
            <header className="returns-modal-header">
              <div>
                <span className="returns-eyebrow">
                  INFORMACIÓN DE LA DEVOLUCIÓN
                </span>

                <h2 id="return-details-title">
                  Detalles de la devolución
                </h2>

                <p>
                  Información completa de esta ayuda técnica.
                </p>
              </div>

              <button
                className="returns-modal-close"
                onClick={() => setSelectedReturn(null)}
                aria-label="Cerrar detalles"
              >
                <X size={20} />
              </button>
            </header>

            <div className="returns-details-summary">
              <div>
                <span>Código del préstamo</span>
                <strong>{selectedReturn.loan_code}</strong>
              </div>

              <div>
                <span>Beneficiario</span>
                <strong>{selectedReturn.beneficiary_name}</strong>
              </div>

              <div>
                <span>Ayuda técnica</span>
                <strong>{selectedReturn.aid_reference || "—"}</strong>
              </div>

              <div>
                <span>Categoría</span>
                <strong>
                  {localizeCategoryName(selectedReturn.category_name || "Uncategorized")}
                </strong>
              </div>

              <div>
                <span>Fecha del préstamo</span>
                <strong>{dateLabel(selectedReturn.loaned_at)}</strong>
              </div>

              <div>
                <span>Fecha de vencimiento</span>
                <strong>{dateLabel(selectedReturn.due_at)}</strong>
              </div>

              <div>
                <span>Fecha de devolución</span>
                <strong>{dateLabel(selectedReturn.returned_at)}</strong>
              </div>

              <div>
                <span>Estado de la ayuda</span>
                <strong>{returnConditionLabel(selectedReturn)}</strong>
              </div>

              <div>
                <span>Estado de la devolución</span>
                <strong>
                  {selectedReturn.returned_at
                    ? "Devuelta"
                    : selectedReturn.loan_status === "overdue"
                      ? "Vencida"
                      : "Pendiente"}
                </strong>
              </div>
            </div>

            <footer className="returns-modal-actions">
              {!selectedReturn.returned_at && (
                <button
                  className="returns-create-button"
                  onClick={() => registerReturn(selectedReturn)}
                  disabled={returning === String(selectedReturn.id)}
                >
                  {returning === String(selectedReturn.id)
                    ? "Registrando..."
                    : "Registrar devolución"}
                </button>
              )}

              <button
                type="button"
                className="returns-secondary-button"
                onClick={() => setSelectedReturn(null)}
              >
                Cerrar
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* RETURN CONFIRMATION MODAL */}
      {returnToConfirm && (
        <div
          className="returns-confirm-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !returning
            ) {
              setReturnToConfirm(null);
            }
          }}
        >
          <section
            className="returns-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="returns-confirm-title"
          >
            <div className="returns-confirm-icon">
              <RotateCcw size={27} />
            </div>

            <span className="returns-confirm-eyebrow">
              Mobility Aids · Devoluciones
            </span>

            <h2 id="returns-confirm-title">
              ¿Confirmar esta devolución?
            </h2>

            <p className="returns-confirm-description">
              ¿Deseas registrar la devolución de esta ayuda técnica?
              Revisa la información antes de continuar.
            </p>

            <div
              style={{
                display: "grid",
                gap: "8px",
                margin: "18px 0",
                textAlign: "left",
              }}
            >
              <label
                htmlFor="return-condition"
                style={{ fontWeight: 700, color: "#10233e", fontSize: "14px" }}
              >
                Estado de la ayuda técnica
              </label>
              <select
                id="return-condition"
                value={returnCondition}
                onChange={(event) => setReturnCondition(event.target.value)}
                disabled={Boolean(returning)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #d7dee8",
                  borderRadius: "10px",
                  background: "#ffffff",
                  color: "#10233e",
                  fontSize: "14px",
                }}
              >
                <option value="available">Disponible — volver al inventario</option>
                <option value="maintenance">Requiere mantenimiento — necesita reparación</option>
              </select>
              <span style={{ color: "#718096", fontSize: "12px", lineHeight: 1.5 }}>
                Si seleccionas mantenimiento, la unidad requerirá reparación
                y no estará disponible para nuevos préstamos.
              </span>
            </div>

            <div className="returns-confirm-summary">
              <div>
                <span>Beneficiario</span>
                <strong>{returnToConfirm.beneficiary_name}</strong>
              </div>

              <div>
                <span>Código del préstamo</span>
                <strong>{returnToConfirm.loan_code}</strong>
              </div>

              <div>
                <span>Ayuda técnica</span>
                <strong>{returnToConfirm.aid_reference || "—"}</strong>
              </div>
            </div>

            <footer className="returns-confirm-actions">
              <button
                type="button"
                className="returns-confirm-cancel"
                onClick={() => setReturnToConfirm(null)}
                disabled={Boolean(returning)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="returns-confirm-submit"
                onClick={confirmReturn}
                disabled={Boolean(returning)}
              >
                {returning === String(returnToConfirm.id)
                  ? "Registrando..."
                  : "Confirmar devolución"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
