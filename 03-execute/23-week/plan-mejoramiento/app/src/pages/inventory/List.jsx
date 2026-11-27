import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Accessibility,
  ClipboardList,
  Activity,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Boxes,
  Filter,
  Wrench,
  X,
} from "lucide-react";

import api from "../../services/api";
import { getUser } from "../../services/auth";
import { getUiErrorMessage, localizeCategoryName } from "../../services/uiMessages";
import "./List.css";

// TECHNICAL AID PHOTOGRAPHS
import wheelchairImage from "../../assets/images/1. Wheelchair (silla de ruedas).jpg";
import walkerImage from "../../assets/images/2. Walker (caminador).jpg";
import crutchesImage from "../../assets/images/3. Crutches (muletas).jpg";
import walkingCaneImage from "../../assets/images/4. Walking Cane (bastón).jpg";
import cushionsImage from "../../assets/images/cushions.jpg";
import inventoryBanner from "../../assets/images/inventory-banner.png";

// MATCH API RECORDS WITH LOCAL PHOTOGRAPHS
const aidImages = [
  {
    terms: ["wheelchair", "wheel", "silla de ruedas"],
    image: wheelchairImage
  },
  {
    terms: ["walker", "caminador"],
    image: walkerImage
  },
  {
    terms: ["crutch", "muleta"],
    image: crutchesImage
  },
  {
    terms: ["walking cane", "cane", "baston"],
    image: walkingCaneImage
  },
  {
    terms: ["cushion", "cojin"],
    image: cushionsImage
  },
];

function getCollection(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getPaginationMeta(payload) {
  const candidates = [
    payload,
    payload?.meta,
    payload?.data,
    payload?.data?.meta
  ].filter(Boolean);

  const read = (...keys) => {
    for (const candidate of candidates) {
      for (const key of keys) {
        const value = candidate?.[key];
        if (value !== undefined && value !== null && value !== "") {
          const number = Number(value);
          if (Number.isFinite(number)) return number;
        }
      }
    }
    return null;
  };

  return {
    total: read("total"),
    lastPage: read("last_page", "lastPage"),
    perPage: read("per_page", "perPage", "size")
  };
}

async function fetchAllPages(endpoint) {
  const pageSize = 50;

  const firstResponse = await api.get(endpoint, {
    params: {
      page: 1,
      size: pageSize,
      per_page: pageSize
    }
  });

  const firstPayload = firstResponse.data;
  const firstItems = getCollection(firstPayload);
  const pagination = getPaginationMeta(firstPayload);

  const total = pagination.total ?? firstItems.length;

  if (!firstItems.length || firstItems.length >= total) {
    return firstItems;
  }

  const pageCount =
    pagination.lastPage ||
    Math.ceil(total / (pagination.perPage || firstItems.length));

  const requests = [];

  for (let page = 2; page <= pageCount; page++) {
    requests.push(
      api.get(endpoint, {
        params: {
          page,
          size: pageSize,
          per_page: pageSize
        }
      })
    );
  }

  const responses = await Promise.all(requests);

  const allItems = [
    ...firstItems,
    ...responses.flatMap((response) =>
      getCollection(response.data)
    )
  ];

  return Array.from(
    new Map(
      allItems.map((item, index) => [
        item.id ?? item.reference ?? `${endpoint}-${index}`,
        item
      ])
    ).values()
  );
}

function getAidName(aid) {
  return (
    aid.name ||
    localizeCategoryName(aid.category_name || aid.category?.name) ||
    aid.reference ||
    "Ayuda técnica"
  );
}

function getAidCategory(aid) {
  return (
    aid.category?.name ||
    aid.category_name ||
    "Uncategorized"
  );
}

function getAidReference(aid) {
  return aid.reference || aid.code || "—";
}

function getAidImage(aid) {
  const searchable = [
    aid.name,
    aid.category_name,
    aid.category?.name,
    aid.reference
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return (
    aidImages.find(({ terms }) =>
      terms.some((term) => searchable.includes(term))
    )?.image || null
  );
}

function getLoanItems(loan) {
  return Array.isArray(loan?.items) ? loan.items : [];
}

function getLoanAidIdentifier(item) {
  return {
    id:
      item.technical_aid_id ??
      item.technical_aid?.id ??
      null,
    reference:
      item.aid_reference ??
      item.technical_aid?.reference ??
      null
  };
}

function countAidLoans(aid, outstandingItems) {
  return outstandingItems.filter((item) => {
    const identifier = getLoanAidIdentifier(item);

    if (identifier.id != null && aid.id != null) {
      return String(identifier.id) === String(aid.id);
    }

    if (identifier.reference && aid.reference) {
      return identifier.reference === aid.reference;
    }

    return false;
  }).length;
}

const numberFormat = (value) =>
  Number(value || 0).toLocaleString("es-CO");

export default function Inventory() {
  const [technicalAids, setTechnicalAids] = useState([]);
  const [loans, setLoans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [completingMaintenance, setCompletingMaintenance] = useState("");
  const [maintenanceAid, setMaintenanceAid] = useState(null);

  const currentUser = getUser();
  const isAdmin = String(
    currentUser?.role ?? currentUser?.user?.role ?? ""
  ).toLowerCase() === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // LOAD INVENTORY FROM LARAVEL
  const loadInventory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [aidsResult, loansResult] = await Promise.allSettled([
        fetchAllPages("/technical-aids"),
        fetchAllPages("/loans")
      ]);

      if (aidsResult.status === "rejected") {
        throw aidsResult.reason;
      }

      setTechnicalAids(aidsResult.value);

      if (loansResult.status === "fulfilled") {
        setLoans(loansResult.value);
      } else {
        setLoans([]);
        setError(
          "El inventario se cargó, pero no fue posible obtener la información de los préstamos."
        );
      }
    } catch (err) {
      console.error("Inventory loading error:", err);

      setError(
        "No fue posible cargar el inventario. Verifica la conexión con la API de Laravel."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // ACTIVE LOAN ITEMS
  const outstandingItems = useMemo(
    () =>
      loans.flatMap(getLoanItems).filter(
        (item) => !item.returned_at
      ),
    [loans]
  );

  // CALCULATE INVENTORY STATISTICS
  const stats = useMemo(() => {
    const totalAids = technicalAids.length;

    const totalUnits = technicalAids.reduce(
      (sum, aid) =>
        sum + (Number(aid.total_units) || 0),
      0
    );

    const availableUnits = technicalAids.reduce(
      (sum, aid) =>
        sum + (Number(aid.available_units) || 0),
      0
    );

    const maintenanceUnits = technicalAids.reduce(
      (sum, aid) => sum + (Number(aid.maintenance_units) || 0),
      0
    );

    const onLoanUnits = outstandingItems.length;

    return {
      totalAids,
      totalUnits,
      availableUnits,
      onLoanUnits,
      maintenanceUnits
    };
  }, [technicalAids, outstandingItems]);

  // OPEN THE CUSTOM MAINTENANCE CONFIRMATION DIALOG.
  const completeMaintenance = useCallback((aid) => {
    if ((Number(aid.maintenance_units) || 0) < 1) return;
    setError("");
    setNotice("");
    setMaintenanceAid(aid);
  }, []);

  // ADMINISTRATOR: MOVE A REPAIRED AID BACK TO AVAILABLE INVENTORY.
  const confirmCompleteMaintenance = useCallback(async () => {
    if (!maintenanceAid) return;

    const aid = maintenanceAid;
    setCompletingMaintenance(String(aid.id));
    setError("");
    setNotice("");

    try {
      await api.post(
        `/technical-aids/${aid.id}/maintenance/complete`
      );

      setMaintenanceAid(null);
      setNotice("El mantenimiento finalizó correctamente. La unidad vuelve a estar disponible.");
      await loadInventory(true);
    } catch (err) {
      console.error("Maintenance completion error:", err);
      setError(getUiErrorMessage(err, "No fue posible finalizar el mantenimiento. Inténtalo nuevamente."));
    } finally {
      setCompletingMaintenance("");
    }
  }, [maintenanceAid, loadInventory]);

  // CATEGORIES FROM REAL INVENTORY
  const categories = useMemo(
    () => [
      ...new Set(
        technicalAids
          .map(getAidCategory)
          .filter((category) => category !== "Uncategorized")
      )
    ].sort(),
    [technicalAids]
  );

  // SEARCH AND CATEGORY FILTER
  const filteredItems = useMemo(() => {
    return technicalAids.filter((aid) => {
      const name = getAidName(aid).toLowerCase();
      const reference = getAidReference(aid).toLowerCase();
      const category = getAidCategory(aid);

      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        reference.includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [technicalAids, searchTerm, selectedCategory]);

  return (
    <div className="inventory-page">

      {/* INVENTORY HERO BANNER */}
      <section className="inventory-hero">

        <img
          src={inventoryBanner}
          alt="Inventario de ayudas técnicas Mobility Aids"
          className="inventory-hero-image"
        />

        <div className="inventory-hero-overlay">
          <div className="inventory-hero-content">

            <div className="inventory-hero-icon">
              <Package size={42} />
            </div>

            <div className="inventory-hero-text">
              <span className="inventory-eyebrow">
                Mobility Aids · Inventario
              </span>

              <h1>
                Inventario de <span>ayudas técnicas</span>
              </h1>

              <p>
                Administra y supervisa las ayudas técnicas,
                las existencias y su disponibilidad.
              </p>

              <div className="inventory-hero-accent" />
            </div>

          </div>
        </div>

        <button
          type="button"
          className="inventory-refresh-button inventory-hero-refresh"
          onClick={() => loadInventory(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "inventory-spinning" : ""}
          />
          {refreshing ? "Actualizando..." : "Actualizar datos"}
        </button>

      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="inventory-error">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          style={{
            marginBottom: "14px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#ecfdf5",
            color: "#047857",
            border: "1px solid #a7f3d0",
            fontWeight: 600
          }}
        >
          {notice}
        </div>
      )}

      {/* STATISTICS */}
      <section className="inventory-stats">

        <article className="inventory-stat stat-blue">
          <div className="inventory-stat-icon">
            <Package size={26} />
          </div>

          <div className="inventory-stat-content">
            <strong>
              {loading ? "—" : numberFormat(stats.totalAids)}
            </strong>
            <span>Ayudas técnicas registradas</span>
            <small>Registros de ayudas</small>
          </div>
        </article>

        <article className="inventory-stat stat-green">
          <div className="inventory-stat-icon">
            <Accessibility size={26} />
          </div>

          <div className="inventory-stat-content">
            <strong>
              {loading ? "—" : numberFormat(stats.availableUnits)}
            </strong>
            <span>Unidades disponibles</span>
            <small>Disponibles actualmente</small>
          </div>
        </article>

        <article className="inventory-stat stat-orange">
          <div className="inventory-stat-icon">
            <ClipboardList size={26} />
          </div>

          <div className="inventory-stat-content">
            <strong>
              {loading || !loans.length
                ? (loading ? "—" : numberFormat(0))
                : numberFormat(stats.onLoanUnits)}
            </strong>
            <span>Unidades prestadas</span>
            <small>Elementos pendientes de devolución</small>
          </div>
        </article>

        <article className="inventory-stat stat-purple">
          <div className="inventory-stat-icon">
            <Activity size={26} />
          </div>

          <div className="inventory-stat-content">
            <strong>
              {loading ? "—" : numberFormat(stats.maintenanceUnits)}
            </strong>
            <span>En mantenimiento</span>
            <small>Seguimiento de mantenimiento</small>
          </div>
        </article>

      </section>

      {/* INVENTORY TABLE */}
      <section className="inventory-panel">

        <div className="inventory-panel-header">
          <div className="inventory-panel-title">
            <Package size={23} />
            <h2>Lista de inventario</h2>
          </div>

          <span className="inventory-record-count">
            {loading
              ? "Cargando registros..."
              : `${filteredItems.length} registros`}
          </span>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="inventory-toolbar">

          <div className="inventory-search">
            <Search size={19} />

            <input
              type="search"
              placeholder="Buscar por nombre o referencia..."
              aria-label="Buscar ayudas técnicas"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Borrar búsqueda"
              >
                ×
              </button>
            )}
          </div>

          <div className="inventory-filter">
            <Filter size={17} />

            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
              aria-label="Filtrar por categoría"
            >
              <option value="all">Todas las categorías</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {localizeCategoryName(category)}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* TABLE */}
        <div className="inventory-table-wrapper">

          <table className="inventory-table">
            <thead>
              <tr>
                <th>AYUDA TÉCNICA</th>
                <th>CATEGORÍA</th>
                <th>UNIDADES TOTALES</th>
                <th>DISPONIBLES</th>
                <th>PRESTADAS</th>
                <th>MANTENIMIENTO</th>
                <th>DISPONIBILIDAD</th>
                {isAdmin && <th>ACCIONES</th>}
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="inventory-empty">
                    <RefreshCw
                      size={22}
                      className="inventory-spinning"
                    />
                    <span>Cargando registros del inventario...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="inventory-empty">
                    <Boxes size={27} />
                    <strong>No se encontraron ayudas técnicas</strong>
                    <span>
                      Prueba con otra búsqueda o categoría.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((aid) => {
                  const available = Number(aid.available_units) || 0;
                  const total = Number(aid.total_units) || 0;
                  const maintenance = Number(aid.maintenance_units) || 0;
                  const onLoan = countAidLoans(aid, outstandingItems);
                  const image = getAidImage(aid);

                  return (
                    <tr key={aid.id ?? aid.reference}>
                      <td>
                        <div className="inventory-product">

                          <div className="inventory-product-image">
                            {image ? (
                              <img
                                src={image}
                                alt={getAidName(aid)}
                              />
                            ) : (
                              <Package size={25} />
                            )}
                          </div>

                          <div className="inventory-product-info">
                            <strong>{getAidName(aid)}</strong>
                            <small>{getAidReference(aid)}</small>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="inventory-category">
                          {localizeCategoryName(getAidCategory(aid))}
                        </span>
                      </td>

                      <td className="inventory-number">
                        {numberFormat(total)}
                      </td>

                      <td>
                        <span className="inventory-available">
                          {numberFormat(available)}
                        </span>
                      </td>

                      <td className="inventory-number">
                        {numberFormat(onLoan)}
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "34px",
                            padding: "7px 10px",
                            borderRadius: "999px",
                            background: maintenance > 0 ? "#fee2e2" : "#f1f5f9",
                            color: maintenance > 0 ? "#b91c1c" : "#64748b",
                            fontWeight: 700
                          }}
                        >
                          {numberFormat(maintenance)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`inventory-status ${
                            available > 0
                              ? "status-available"
                              : "status-unavailable"
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          {available > 0 ? "Disponible" : "No disponible"}
                        </span>
                      </td>

                      {isAdmin && (
                        <td>
                          {maintenance > 0 ? (
                            <button
                              type="button"
                              onClick={() => completeMaintenance(aid)}
                              disabled={completingMaintenance === String(aid.id)}
                              title="Marcar el mantenimiento como finalizado"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "7px",
                                padding: "8px 11px",
                                border: "1px solid #d1fae5",
                                borderRadius: "9px",
                                background: "#ecfdf5",
                                color: "#047857",
                                fontWeight: 700,
                                cursor: completingMaintenance === String(aid.id)
                                  ? "wait"
                                  : "pointer",
                                opacity: completingMaintenance === String(aid.id)
                                  ? 0.65
                                  : 1,
                                whiteSpace: "nowrap"
                              }}
                            >
                              <Wrench size={14} />
                              {completingMaintenance === String(aid.id)
                                ? "Procesando..."
                                : "Finalizar mantenimiento"}
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}

            </tbody>
          </table>

        </div>

        {/* TABLE FOOTER */}
        <footer className="inventory-table-footer">
          <span>
            Mostrando {filteredItems.length} de {technicalAids.length} ayudas técnicas
          </span>

          <span>
            {loading ? "Sincronizando..." : "Inventario sincronizado con Laravel"}
          </span>
        </footer>

      </section>

      {/* CUSTOM CONFIRMATION DIALOG — MOBILITY AIDS NAVY & GOLD */}
      {maintenanceAid && (
        <div
          className="maintenance-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !completingMaintenance) {
              setMaintenanceAid(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(5, 20, 36, 0.72)",
            backdropFilter: "blur(7px)"
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-dialog-title"
            aria-describedby="maintenance-dialog-description"
            style={{
              position: "relative",
              width: "min(100%, 560px)",
              overflow: "hidden",
              borderRadius: "22px",
              background: "#ffffff",
              boxShadow: "0 28px 90px rgba(2, 12, 27, 0.38)",
              border: "1px solid rgba(255,255,255,0.75)"
            }}
          >
            <div
              style={{
                height: "7px",
                background: "linear-gradient(90deg, #D18A16 0%, #F5A623 52%, #E9B95D 100%)"
              }}
            />

            <button
              type="button"
              onClick={() => setMaintenanceAid(null)}
              disabled={Boolean(completingMaintenance)}
              aria-label="Cerrar diálogo"
              style={{
                position: "absolute",
                top: "22px",
                right: "22px",
                width: "38px",
                height: "38px",
                display: "grid",
                placeItems: "center",
                border: "1px solid #e2e8f0",
                borderRadius: "11px",
                background: "#ffffff",
                color: "#64748b",
                cursor: "pointer"
              }}
            >
              <X size={18} />
            </button>

            <div style={{ padding: "34px 38px 30px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "76px",
                    height: "76px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "22px",
                    color: "#D18A16",
                    background: "#FFF7E9",
                    border: "1px solid #F4D9AA",
                    boxShadow: "0 8px 22px rgba(209, 138, 22, 0.10)"
                  }}
                >
                  <Wrench size={34} strokeWidth={1.8} />
                </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "25px" }}>
                <div
                  style={{
                    marginBottom: "10px",
                    color: "#B7791F",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "1.55px"
                  }}
                >
                  Mobility Aids · Gestión de inventario
                </div>
                <h2
                  id="maintenance-dialog-title"
                  style={{
                    margin: "0 0 10px",
                    color: "#142238",
                    fontSize: "clamp(22px, 4vw, 28px)",
                    lineHeight: 1.2,
                    fontWeight: 800
                  }}
                >
                  Finalizar mantenimiento
                </h2>
                <p
                  id="maintenance-dialog-description"
                  style={{
                    maxWidth: "430px",
                    margin: "0 auto",
                    color: "#718096",
                    fontSize: "14px",
                    lineHeight: 1.65
                  }}
                >
                  Confirma que las reparaciones de esta ayuda técnica finalizaron
                  y que está lista para volver a estar disponible.
                </p>
              </div>

              <div
                style={{
                  padding: "19px 20px",
                  borderRadius: "15px",
                  background: "#F5F8FC",
                  border: "1px solid #E2EAF3"
                }}
              >
                <div
                  style={{
                    marginBottom: "7px",
                    color: "#8796AA",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "1.1px"
                  }}
                >
                  AYUDA TÉCNICA
                </div>
                <div
                  style={{
                    color: "#142238",
                    fontSize: "17px",
                    fontWeight: 800,
                    marginBottom: "4px"
                  }}
                >
                  {getAidName(maintenanceAid)}
                </div>
                <div style={{ color: "#B7791F", fontSize: "13px", fontWeight: 700 }}>
                  Referencia: {getAidReference(maintenanceAid)}
                </div>

                <div
                  style={{
                    height: "1px",
                    margin: "16px 0 13px",
                    background: "#DFE7F0"
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                  <span style={{ color: "#718096", fontSize: "13px" }}>Estado actual</span>
                  <span style={{ color: "#B7791F", fontSize: "13px", fontWeight: 800 }}>
                    En mantenimiento · {numberFormat(maintenanceAid.maintenance_units)} unidad(es)
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <span style={{ color: "#718096", fontSize: "13px" }}>Después de confirmar</span>
                  <span style={{ color: "#07845D", fontSize: "13px", fontWeight: 800 }}>
                    Disponible para préstamo
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: "11px",
                  marginTop: "25px"
                }}
              >
                <button
                  type="button"
                  onClick={() => setMaintenanceAid(null)}
                  disabled={Boolean(completingMaintenance)}
                  style={{
                    minHeight: "46px",
                    padding: "0 21px",
                    border: "1px solid #D9E2EC",
                    borderRadius: "12px",
                    background: "#ffffff",
                    color: "#526176",
                    fontSize: "13px",
                    fontWeight: 750,
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmCompleteMaintenance}
                  disabled={Boolean(completingMaintenance)}
                  style={{
                    minHeight: "46px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "9px",
                    padding: "0 22px",
                    border: "1px solid #D18A16",
                    borderRadius: "12px",
                    background: "#D18A16",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: completingMaintenance ? "wait" : "pointer",
                    opacity: completingMaintenance ? 0.7 : 1,
                    boxShadow: "0 7px 16px rgba(209, 138, 22, 0.22)"
                  }}
                >
                  <CheckCircle2 size={17} />
                  {completingMaintenance ? "Procesando..." : "Confirmar reparación"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
