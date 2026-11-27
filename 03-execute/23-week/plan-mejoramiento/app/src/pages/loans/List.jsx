import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2,
  Clock3, Download, Eye, Plus, RefreshCw, RotateCcw, Search, X,
} from "lucide-react";
import api from "../../services/api";
import { getUiErrorMessage, localizeCategoryName } from "../../services/uiMessages";
import mobilityBanner from "../../assets/images/Mobility Aids.png";
import "./List.css";

const PAGE_SIZE = 10;
const STATUS = { open: "Activo", overdue: "Vencido", closed: "Finalizado" };

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function errorText(error, fallback = "No fue posible completar la operación. Verifica la información e inténtalo nuevamente.") {
  return getUiErrorMessage(error, fallback);
}

export default function Page() {
  const [loans, setLoans] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [aids, setAids] = useState([]);
  const [metrics, setMetrics] = useState({ registered: 0, active: 0, closed: 0, overdue: 0 });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState("");
  const [returnToConfirm, setReturnToConfirm] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [selectedAidIds, setSelectedAidIds] = useState([]);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/loans", { params: { page, size: PAGE_SIZE } });
      setLoans(response.data?.items ?? []);
      setTotal(Number(response.data?.total ?? 0));
    } catch (error) {
      setMessage({ type: "error", text: errorText(error) });
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadMetrics = useCallback(async () => {
    try {
      const first = await api.get("/loans", { params: { page: 1, size: 50 } });
      const pages = Math.max(1, Math.ceil(Number(first.data?.total ?? 0) / 50));
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
          api.get("/loans", { params: { page: index + 2, size: 50 } })
        )
      );
      const all = [...(first.data?.items ?? []), ...rest.flatMap((item) => item.data?.items ?? [])];
      setMetrics({
        registered: Number(first.data?.total ?? all.length),
        active: all.filter((loan) => loan.status === "open").length,
        closed: all.filter((loan) => loan.status === "closed").length,
        overdue: all.filter((loan) => loan.status === "overdue").length,
      });
    } catch {
      // Los indicadores no bloquean el funcionamiento de la lista.
    }
  }, []);

  const loadFormData = useCallback(async () => {
    try {
      const [beneficiaryResponse, aidResponse] = await Promise.all([
        api.get("/beneficiaries", { params: { page: 1 } }),
        api.get("/technical-aids", { params: { page: 1, size: 50 } }),
      ]);
      const beneficiaryData = beneficiaryResponse.data;
      setBeneficiaries(
        Array.isArray(beneficiaryData?.data) ? beneficiaryData.data :
        Array.isArray(beneficiaryData?.items) ? beneficiaryData.items : []
      );
      setAids(aidResponse.data?.items ?? []);
    } catch (error) {
      setMessage({ type: "error", text: errorText(error) });
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadLoans(), loadMetrics(), loadFormData()]);
  }, [loadLoans, loadMetrics, loadFormData]);

  useEffect(() => { loadLoans(); }, [loadLoans]);
  useEffect(() => { loadMetrics(); loadFormData(); }, [loadMetrics, loadFormData]);

  const filteredLoans = useMemo(() => {
    const term = search.trim().toLowerCase();
    return loans.filter((loan) => {
      const statusMatch = statusFilter === "all" || loan.status === statusFilter;
      const textMatch = !term ||
        String(loan.beneficiary_name ?? "").toLowerCase().includes(term) ||
        String(loan.id ?? "").toLowerCase().includes(term) ||
        (loan.items ?? []).some((line) => String(line.aid_reference ?? "").toLowerCase().includes(term));
      return statusMatch && textMatch;
    });
  }, [loans, search, statusFilter]);

  const availableAids = aids.filter((aid) => Number(aid.available_units) > 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleAid(id) {
    setSelectedAidIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function createLoan(event) {
    event.preventDefault();
    if (!beneficiaryId || selectedAidIds.length === 0) {
      setMessage({ type: "error", text: "Selecciona un beneficiario y al menos una ayuda técnica." });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await api.post("/loans", {
        beneficiary_id: beneficiaryId,
        items: selectedAidIds.map((id) => ({ technical_aid_id: id })),
      });
      setModalOpen(false);
      setBeneficiaryId("");
      setSelectedAidIds([]);
      setMessage({ type: "success", text: "El préstamo se registró correctamente." });
      await refreshAll();
    } catch (error) {
      setMessage({ type: "error", text: errorText(error) });
    } finally {
      setSaving(false);
    }
  }

  function returnAid(loanId, lineId) {
    const loan = loans.find((item) => String(item.id) === String(loanId));
    const line = loan?.items?.find((item) => String(item.id) === String(lineId));

    setMessage({ type: "", text: "" });
    setReturnToConfirm({ loanId, lineId, loan, line });
  }

  async function confirmReturn() {
    if (!returnToConfirm) return;

    const { loanId, lineId } = returnToConfirm;
    setReturning(String(lineId));
    setMessage({ type: "", text: "" });

    try {
      await api.post(`/loans/${loanId}/items/${lineId}/return`);
      setReturnToConfirm(null);
      setMessage({
        type: "success",
        text: "La devolución de la ayuda técnica se registró correctamente.",
      });
      await refreshAll();
    } catch (error) {
      setReturnToConfirm(null);
      setMessage({
        type: "error",
        text: errorText(error, "No fue posible registrar la devolución. Inténtalo nuevamente."),
      });
    } finally {
      setReturning("");
    }
  }

  function exportCsv() {
    const rows = [
      ["Código", "Beneficiario", "Ayuda técnica", "Fecha del préstamo", "Fecha de vencimiento / devolución", "Estado"],
      ...filteredLoans.map((loan) => [
        String(loan.id ?? "").slice(0, 8).toUpperCase(),
        loan.beneficiary_name ?? "",
        (loan.items ?? []).map((item) => item.aid_reference).join(" / "),
        dateLabel(loan.loaned_at),
        (loan.items ?? []).map((item) => dateLabel(item.due_at)).join(" / "),
        STATUS[loan.status] ?? loan.status,
      ]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "historial-prestamos-mobility-aids.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <main className="loans-page">
        <section
          className="loans-hero"
          style={{
            backgroundImage: `linear-gradient(
              90deg,
              rgba(5, 20, 39, 0.78) 0%,
              rgba(5, 20, 39, 0.45) 42%,
              rgba(5, 20, 39, 0.02) 100%
            ), url("${mobilityBanner}")`,
          }}
        >
          <div className="loans-hero-content">
            <span className="loans-hero-icon"><CalendarDays size={38} /></span>
            <div>
              <span className="loans-eyebrow">Mobility Aids · Operaciones</span>
              <h2>Préstamos</h2>
              <p>Gestión de préstamos de ayudas técnicas<br />para la movilidad.</p>
              <span className="loans-hero-underline" />
            </div>
          </div>
        </section>

        {message.text && (
          <div className={`loans-alert ${message.type === "error" ? "loans-alert-error" : "loans-alert-success"}`} role="status">
            {message.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })} aria-label="Cerrar"><X size={16} /></button>
          </div>
        )}

        <section className="loans-metrics">
          <article className="loans-metric-card metric-registered">
            <span className="loans-metric-icon"><CalendarDays size={23} /></span>
            <div><strong>{metrics.registered}</strong><p>Préstamos registrados</p></div>
          </article>
          <article className="loans-metric-card metric-active">
            <span className="loans-metric-icon"><CheckCircle2 size={24} /></span>
            <div><strong>{metrics.active}</strong><p>Préstamos activos</p></div>
          </article>
          <article className="loans-metric-card metric-closed">
            <span className="loans-metric-icon"><RotateCcw size={24} /></span>
            <div><strong>{metrics.closed}</strong><p>Finalizados</p></div>
          </article>
          <article className="loans-metric-card metric-overdue">
            <span className="loans-metric-icon"><Clock3 size={24} /></span>
            <div><strong>{metrics.overdue}</strong><p>Vencidos</p></div>
          </article>
        </section>

        <section className="loans-list-card">
          <div className="loans-list-title">
            <h3><span><CalendarDays size={19} /></span>Historial de préstamos</h3>
          </div>
          <div className="loans-toolbar">
            <label className="loans-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por beneficiario, ayuda técnica o código..." /></label>
            <div className="loans-toolbar-actions">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar préstamos">
                <option value="all">Todos los estados</option><option value="open">Activos</option><option value="overdue">Vencidos</option><option value="closed">Finalizados</option>
              </select>
              <button className="loans-tool-button" onClick={exportCsv}><Download size={16} /> Exportar</button>
              <button className="loans-create-button" onClick={() => { setMessage({ type: "", text: "" }); setModalOpen(true); }}><Plus size={18} /> Registrar préstamo</button>
            </div>
          </div>

          {loading ? (
            <div className="loans-empty"><RefreshCw className="loans-spinning" size={24} />Cargando préstamos...</div>
          ) : filteredLoans.length === 0 ? (
            <div className="loans-empty"><CalendarDays size={30} /><strong>No hay préstamos para mostrar</strong><span>Cuando registres un préstamo, aparecerá en este historial.</span></div>
          ) : (
            <div className="loans-table-wrap">
              <table className="loans-table">
                <thead><tr><th>Código</th><th>Beneficiario</th><th>Ayuda técnica</th><th>Fecha del préstamo</th><th>Vencimiento / devolución</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {filteredLoans.map((loan) => {
                    const firstLine = loan.items?.[0];
                    const pending = (loan.items ?? []).filter((line) => !line.returned_at);
                    const allReturned = (loan.items ?? []).length > 0 && pending.length === 0;
                    return (
                      <tr key={loan.id}>
                        <td><strong className="loans-code">PR-{String(loan.id).slice(0, 6).toUpperCase()}</strong></td>
                        <td><span className="loans-person"><span className="loans-avatar">{(loan.beneficiary_name || "B").charAt(0).toUpperCase()}</span>{loan.beneficiary_name || "Beneficiario"}</span></td>
                        <td><div className="loans-aid-cell"><span className="loans-aid-symbol">♿</span><span>{firstLine?.aid_reference || "Ayuda técnica"}{(loan.items?.length ?? 0) > 1 ? ` +${loan.items.length - 1}` : ""}</span></div></td>
                        <td>{dateLabel(loan.loaned_at)}</td>
                        <td>{allReturned ? dateLabel(firstLine?.returned_at) : dateLabel(firstLine?.due_at)}</td>
                        <td><span className={`loans-status loans-status-${loan.status}`}>{loan.status === "open" ? <CheckCircle2 size={13} /> : loan.status === "overdue" ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}{STATUS[loan.status] || "Sin estado"}</span></td>
                        <td><div className="loans-row-actions">
                          <button className="loans-view-button" title="Ver detalles del préstamo" aria-label="Ver detalles del préstamo" onClick={() => setSelectedLoan(loan)}><Eye size={17} /></button>
                          {pending.length > 0 ? <button className="loans-return-button" onClick={() => returnAid(loan.id, pending[0].id)} disabled={returning === pending[0].id} title="Registrar devolución"><RotateCcw size={16} /></button> : <span className="loans-done-mark"><CheckCircle2 size={17} /></span>}
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="loans-pagination"><span>Mostrando {filteredLoans.length} de {total} registros · Página {page} de {totalPages}</span><div><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} aria-label="Anterior"><ArrowLeft size={16} /></button><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || loading} aria-label="Siguiente"><ArrowRight size={16} /></button></div></div>
        </section>

        <div className="loans-api-note"><AlertCircle size={17} /> La información de préstamos está conectada a la API de Laravel.</div>
      </main>

      {selectedLoan && (
        <div className="loans-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedLoan(null); }}>
          <section className="loans-modal loans-details-modal" role="dialog" aria-modal="true" aria-labelledby="loan-details-title">
            <header className="loans-modal-header">
              <div>
                <span className="loans-eyebrow">INFORMACIÓN DEL PRÉSTAMO</span>
                <h2 id="loan-details-title">Detalles del préstamo</h2>
                <p>Información completa de este préstamo de ayuda técnica.</p>
              </div>
              <button className="loans-modal-close" onClick={() => setSelectedLoan(null)} aria-label="Cerrar detalles"><X size={20} /></button>
            </header>

            <div className="loans-details-summary">
              <div><span>Código del préstamo</span><strong>PR-{String(selectedLoan.id).slice(0, 6).toUpperCase()}</strong></div>
              <div><span>Beneficiario</span><strong>{selectedLoan.beneficiary_name || "—"}</strong></div>
              <div><span>Fecha del préstamo</span><strong>{dateLabel(selectedLoan.loaned_at)}</strong></div>
              <div><span>Estado del préstamo</span><strong className={`loans-status loans-status-${selectedLoan.status}`}>{STATUS[selectedLoan.status] || "Sin estado"}</strong></div>
            </div>

            <div className="loans-details-section-title">
              <h3>Ayudas técnicas</h3>
              <span>{(selectedLoan.items ?? []).length} elemento(s)</span>
            </div>
            <div className="loans-details-items">
              {(selectedLoan.items ?? []).length === 0 ? (
                <p className="loans-no-aids">No hay detalles de ayudas técnicas disponibles.</p>
              ) : (selectedLoan.items ?? []).map((line) => (
                <article className="loans-details-item" key={line.id}>
                  <span className="loans-aid-symbol">♿</span>
                  <div className="loans-details-item-main">
                    <strong>{line.aid_reference || "Ayuda técnica"}</strong>
                    <small>{localizeCategoryName(line.category_name || "Uncategorized")}</small>
                  </div>
                  <div className="loans-details-dates">
                    <span>Vence: {dateLabel(line.due_at)}</span>
                    {line.returned_at ? <span>Devuelta: {dateLabel(line.returned_at)}</span> : <span>Pendiente de devolución</span>}
                  </div>
                  <span className={`loans-status ${line.returned_at ? "loans-status-closed" : selectedLoan.status === "overdue" ? "loans-status-overdue" : "loans-status-open"}`}>
                    {line.returned_at ? "Devuelta" : selectedLoan.status === "overdue" ? "Vencida" : "Activa"}
                  </span>
                </article>
              ))}
            </div>
            <footer className="loans-modal-actions">
              <button type="button" className="loans-secondary-button" onClick={() => setSelectedLoan(null)}>Cerrar</button>
            </footer>
          </section>
        </div>
      )}

      {modalOpen && (
        <div className="loans-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
          <section className="loans-modal" role="dialog" aria-modal="true" aria-labelledby="loan-modal-title">
            <header className="loans-modal-header"><div><span className="loans-eyebrow">NUEVA OPERACIÓN</span><h2 id="loan-modal-title">Registrar préstamo</h2><p>Selecciona al beneficiario y las ayudas técnicas que se entregarán.</p></div><button className="loans-modal-close" onClick={() => setModalOpen(false)} disabled={saving} aria-label="Cerrar"><X size={20} /></button></header>
            <form onSubmit={createLoan}>
              <label className="loans-form-label" htmlFor="loan-beneficiary">Beneficiario</label>
              <select id="loan-beneficiary" value={beneficiaryId} onChange={(event) => setBeneficiaryId(event.target.value)} required><option value="">Selecciona un beneficiario</option>{beneficiaries.map((person) => <option key={person.id} value={person.id}>{person.full_name} {person.identification_number ? `— ${person.identification_number}` : ""}</option>)}</select>
              <div className="loans-aids-heading"><label className="loans-form-label">Ayudas técnicas disponibles</label><span>{selectedAidIds.length} seleccionadas</span></div>
              <div className="loans-aid-options">{availableAids.length === 0 ? <p className="loans-no-aids">No hay ayudas técnicas disponibles.</p> : availableAids.map((aid) => <label className="loans-aid-option" key={aid.id}><input type="checkbox" checked={selectedAidIds.includes(aid.id)} onChange={() => toggleAid(aid.id)} /><span className="loans-aid-info"><strong>{aid.name || aid.reference}</strong><small>{aid.reference} · {localizeCategoryName(aid.category?.name || "Uncategorized")} · {aid.available_units} disponibles</small></span></label>)}</div>
              <p className="loans-form-note">Cada ayuda técnica seleccionada representa una unidad. El sistema validará las reglas del proceso antes de guardar.</p>
              <footer className="loans-modal-actions"><button type="button" className="loans-secondary-button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button type="submit" className="loans-create-button" disabled={saving || availableAids.length === 0}>{saving ? "Registrando..." : "Confirmar préstamo"}</button></footer>
            </form>
          </section>
        </div>
      )}

      {returnToConfirm && (
        <div
          className="loans-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !returning) {
              setReturnToConfirm(null);
            }
          }}
        >
          <section
            className="loans-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loans-confirm-title"
          >
            <div className="loans-confirm-icon">
              <RotateCcw size={27} />
            </div>

            <span className="loans-confirm-eyebrow">
              Mobility Aids · Devoluciones
            </span>

            <h2 id="loans-confirm-title">Confirmar devolución</h2>

            <p className="loans-confirm-description">
              ¿Confirmas que deseas registrar la devolución de esta ayuda técnica?
              Revisa los detalles antes de continuar.
            </p>

            <div className="loans-confirm-summary">
              <div>
                <span>Beneficiario</span>
                <strong>{returnToConfirm.loan?.beneficiary_name || "No disponible"}</strong>
              </div>
              <div>
                <span>Código del préstamo</span>
                <strong>PR-{String(returnToConfirm.loanId).slice(0, 6).toUpperCase()}</strong>
              </div>
              <div>
                <span>Ayuda técnica</span>
                <strong>{returnToConfirm.line?.aid_reference || "No disponible"}</strong>
              </div>
            </div>

            <footer className="loans-confirm-actions">
              <button
                type="button"
                className="loans-confirm-cancel"
                onClick={() => setReturnToConfirm(null)}
                disabled={Boolean(returning)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="loans-confirm-submit"
                onClick={confirmReturn}
                disabled={Boolean(returning)}
              >
                {returning === String(returnToConfirm.lineId)
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
