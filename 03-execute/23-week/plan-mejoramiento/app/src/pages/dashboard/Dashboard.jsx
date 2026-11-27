import { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import api from "../../services/api";
import { localizeCategoryName } from "../../services/uiMessages";

import "./Dashboard.css";

import {

  CalendarDays,

  RotateCcw,

  Users,

  Package,

  ShieldCheck,

  ChartNoAxesColumn,

  Clock3,

  ArrowRight,

  Star,

  CircleCheck,

  ChevronLeft,

  ChevronRight

} from "lucide-react";

import heroImage from "../../assets/images/Cilla_Rueda.png";

import institutionalVideo from "../../assets/videos/publicidad-mobility-aids.mp4";

// PHOTOGRAPHS OF TECHNICAL AIDS

import wheelchairImage from "../../assets/images/1. Wheelchair (silla de ruedas).jpg";

import walkerImage from "../../assets/images/2. Walker (caminador).jpg";

import crutchesImage from "../../assets/images/3. Crutches (muletas).jpg";

import walkingCaneImage from "../../assets/images/4. Walking Cane (bastón).jpg";

import cushionsImage from "../../assets/images/cushions.jpg";


// LOCAL PHOTOGRAPHS MATCHED TO API TECHNICAL-AID RECORDS

const aidImageByName = [

  { match: ["wheelchair", "wheel", "silla de ruedas"], image: wheelchairImage },

  { match: ["walker", "walk", "caminador"], image: walkerImage },

  { match: ["crutch", "muleta"], image: crutchesImage },

  { match: ["walking cane", "cane", "baston"], image: walkingCaneImage },

  { match: ["cushion", "cojin"], image: cushionsImage },

];


function getAidDisplayName(aid) {
  return (
    aid.name ||
    localizeCategoryName(aid.category_name || aid.category?.name) ||
    aid.reference ||
    "Ayuda técnica"
  );
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

    aidImageByName.find(({ match }) =>

      match.some((term) => searchable.includes(term))

    )?.image || null

  );

}


function getCollection(payload) {

  // API Contract format: { items: [], page, size, total }

  if (Array.isArray(payload?.items)) return payload.items;

  // Compatibility with Laravel paginator responses.

  if (Array.isArray(payload?.data?.data)) return payload.data.data;

  if (Array.isArray(payload?.data)) return payload.data;



  return [];

}

function getCollectionTotal(payload, currentItems) {

  const total =

    payload?.total ??

    payload?.meta?.total ??

    payload?.data?.total ??

    payload?.data?.meta?.total;



  if (total === undefined || total === null || total === "") {

    return currentItems.length;

  }



  return Number.isFinite(Number(total)) ? Number(total) : currentItems.length;

}



function getPaginationMeta(payload) {

  // Supports Laravel paginator, Laravel Resource paginator,

  // and the project's { items, page, size, total } API contract.

  const candidates = [

    payload,

    payload?.meta,

    payload?.data,

    payload?.data?.meta,

    payload?.data?.data?.meta

  ].filter(Boolean);



  const readNumber = (...keys) => {

    for (const candidate of candidates) {

      for (const key of keys) {

        const value = candidate?.[key];

        if (value !== undefined && value !== null && value !== "") {

          const parsed = Number(value);

          if (Number.isFinite(parsed)) return parsed;

        }

      }

    }

    return null;

  };



  return {

    currentPage: readNumber("current_page", "currentPage", "page"),

    lastPage: readNumber("last_page", "lastPage", "pages"),

    perPage: readNumber("per_page", "perPage", "size"),

    total: readNumber("total")

  };

}



async function fetchAllPages(endpoint) {

  // Send both common pagination parameter names. Laravel commonly

  // uses per_page, while this project's API contract uses size.

  const requestedPageSize = 50;



  const firstResponse = await api.get(endpoint, {

    params: {

      page: 1,

      size: requestedPageSize,

      per_page: requestedPageSize

    }

  });



  const firstPayload = firstResponse.data;

  const firstItems = getCollection(firstPayload);

  const pagination = getPaginationMeta(firstPayload);

  const total = pagination.total ?? getCollectionTotal(firstPayload, firstItems);



  if (firstItems.length === 0 || firstItems.length >= total) {

    return { items: firstItems, total };

  }



  // Prefer the server's actual last_page/per_page metadata. If the

  // endpoint returns only total + a short first page, infer page count

  // from the number of rows actually returned (not the requested size).

  const effectivePageSize = Math.min(

    pagination.perPage || firstItems.length || requestedPageSize,

    firstItems.length || requestedPageSize

  );



  const pageCount =

    pagination.lastPage ||

    Math.ceil(total / effectivePageSize);



  if (pageCount <= 1) {

    return { items: firstItems, total };

  }



  const pageRequests = [];



  for (let page = 2; page <= pageCount; page += 1) {

    pageRequests.push(

      api.get(endpoint, {

        params: {

          page,

          size: requestedPageSize,

          per_page: requestedPageSize

        }

      })

    );

  }



  const responses = await Promise.all(pageRequests);

  const allItems = [

    ...firstItems,

    ...responses.flatMap((response) => getCollection(response.data))

  ];



  // Deduplicate records in case the backend ignores pagination params.

  const uniqueItems = Array.from(

    new Map(

      allItems.map((item, index) => [

        item.id ?? item.reference ?? `${endpoint}-${index}`,

        item

      ])

    ).values()

  );



  return {

    items: uniqueItems,

    total: Math.max(total, uniqueItems.length)

  };

}



async function fetchLoansWithDetails() {

  const result = await fetchAllPages("/loans");



  // The list endpoint may return summary rows. Retrieve details when

  // the loan items are not included so return and active-loan counts

  // are calculated from the actual loan lines.

  const detailedLoans = await Promise.all(

    result.items.map(async (loan) => {

      if (Array.isArray(loan.items) || !loan.id) return loan;



      try {

        const response = await api.get(`/loans/${loan.id}`);

        const detail = response.data?.data ?? response.data;

        return { ...loan, ...detail };

      } catch {

        return loan;

      }

    })

  );



  return { ...result, items: detailedLoans };

}



function getLoanItems(loan) {

  return Array.isArray(loan?.items) ? loan.items : [];

}



function getRecentActivityEvents(loans) {

  const events = [];



  loans.forEach((loan) => {

    const loanDate = loan.loaned_at || loan.created_at;



    if (loanDate) {

      const references = getLoanItems(loan)

        .map((item) => item.aid_reference || item.technical_aid?.reference)

        .filter(Boolean);



      events.push({

        date: new Date(loanDate),

        title: "Registro de préstamo",

        description: references.length

          ? references.join(", ")

          : `Préstamo ${String(loan.id || "").slice(0, 8)}`,

        icon: CalendarDays,

        color: "green"

      });

    }



    getLoanItems(loan).forEach((item) => {

      if (!item.returned_at) return;



      events.push({

        date: new Date(item.returned_at),

        title: "Ayuda técnica devuelta",

        description:

          item.aid_reference ||

          item.technical_aid?.reference ||

          "Devolución registrada",

        icon: RotateCcw,

        color: "orange"

      });

    });

  });



  return events

    .filter((event) => !Number.isNaN(event.date.getTime()))

    .sort((a, b) => b.date - a.date)

    .slice(0, 4)

    .map((event) => ({

      ...event,

      description: `${event.description} · ${event.date.toLocaleDateString("es-CO")}`

    }));

}



// SYSTEM FEATURES

const systemFeatures = [

  {

    title: "Acceso seguro",
    description: "Control de acceso según roles",

    icon: ShieldCheck

  },

  {

    title: "Gestión de préstamos",
    description: "Registro y seguimiento",

    icon: CalendarDays

  },

  {

    title: "Control de inventario",
    description: "Disponibilidad de ayudas técnicas",

    icon: Package

  },

  {

    title: "Informes",
    description: "Trazabilidad y estadísticas",

    icon: ChartNoAxesColumn

  }

];



export default function Dashboard() {

  // DASHBOARD API DATA

  const [dashboardData, setDashboardData] = useState({

    technicalAids: [],

    loans: [],

    beneficiariesTotal: null

  });

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [aidOffset, setAidOffset] = useState(0);



  const loadDashboardData = useCallback(async () => {

    setLoading(true);

    setLoadError("");



    const [aidsResult, loansResult, beneficiariesResult] =

      await Promise.allSettled([

        fetchAllPages("/technical-aids"),

        fetchLoansWithDetails(),

        fetchAllPages("/beneficiaries")

      ]);



    const failedSections = [];



    const technicalAids =

      aidsResult.status === "fulfilled"

        ? aidsResult.value.items

        : (failedSections.push("ayudas técnicas"), []);



    const loans =

      loansResult.status === "fulfilled"

        ? loansResult.value.items

        : (failedSections.push("préstamos"), []);



    const beneficiariesTotal =

      beneficiariesResult.status === "fulfilled"

        ? beneficiariesResult.value.total

        : (failedSections.push("beneficiarios"), null);



    setDashboardData({

      technicalAids,

      loans,

      beneficiariesTotal

    });



    if (failedSections.length > 0) {

      setLoadError(

        `No fue posible cargar: ${failedSections.join(", ")}. Revisa la conexión con la API y actualiza los datos.`

      );

    }



    setLoading(false);

  }, []);



  useEffect(() => {

    loadDashboardData();

  }, [loadDashboardData]);



  const technicalAids = dashboardData.technicalAids;

  const loans = dashboardData.loans;



  // INVENTORY TOTALS — calculated from Laravel records.

  const inventoryStats = useMemo(() => {

    const registeredAids = technicalAids.length;



    const totalUnits = technicalAids.reduce(

      (sum, aid) => sum + (Number(aid.total_units) || 0),

      0

    );



    const availableUnits = technicalAids.reduce(

      (sum, aid) => sum + (Number(aid.available_units) || 0),

      0

    );

    // Units currently assigned to maintenance, supplied by the Laravel API.
    const maintenanceUnits = technicalAids.reduce(
      (sum, aid) => sum + (Number(aid.maintenance_units) || 0),
      0
    );



    const loanItems = loans.flatMap(getLoanItems);

    const outstandingItems = loanItems.filter((item) => !item.returned_at);

    const returnedItems = loanItems.filter((item) => Boolean(item.returned_at));



    const activeLoans = loans.filter((loan) =>

      getLoanItems(loan).some((item) => !item.returned_at)

    ).length;



    return {

      registeredAids,

      totalUnits,

      availableUnits,

      maintenanceUnits,

      onLoanUnits: outstandingItems.length,

      returnedItems: returnedItems.length,

      activeLoans,

      beneficiaries: dashboardData.beneficiariesTotal

    };

  }, [technicalAids, loans, dashboardData.beneficiariesTotal]);



  // Inventory distribution includes available, loaned and maintenance units.

  const chartTotal = inventoryStats.totalUnits;

  const availablePercent = chartTotal
    ? (inventoryStats.availableUnits / chartTotal) * 100
    : 0;

  const loanPercent = chartTotal
    ? (inventoryStats.onLoanUnits / chartTotal) * 100
    : 0;

  const maintenancePercent = chartTotal
    ? (inventoryStats.maintenanceUnits / chartTotal) * 100
    : 0;

  const availableEnd = Math.min(availablePercent, 100);
  const loanEnd = Math.min(availableEnd + loanPercent, 100);
  const maintenanceEnd = Math.min(loanEnd + maintenancePercent, 100);

  const chartStyle = {
    background: chartTotal
      ? `conic-gradient(
          #16b978 0% ${availableEnd}%,
          #f59e0b ${availableEnd}% ${loanEnd}%,
          #ef4444 ${loanEnd}% ${maintenanceEnd}%,
          #e5e7eb ${maintenanceEnd}% 100%
        )`
      : "#e5e7eb"
  };



  // FEATURED AIDS COME FROM THE LIVE INVENTORY.

  const featuredTechnicalAids = useMemo(

    () =>

      technicalAids.map((aid) => ({

        ...aid,

        displayName: getAidDisplayName(aid),

        available: Number(aid.available_units) || 0,

        image: getAidImage(aid)

      })),

    [technicalAids]

  );



  // Show up to three products at a time.
  // The arrows rotate through the complete inventory, including all five aids.
  const visibleTechnicalAids = useMemo(() => {
    if (featuredTechnicalAids.length === 0) return [];

    const visibleCount = Math.min(3, featuredTechnicalAids.length);

    return Array.from({ length: visibleCount }, (_, index) => {
      const productIndex =
        (aidOffset + index) % featuredTechnicalAids.length;

      return featuredTechnicalAids[productIndex];
    });
  }, [featuredTechnicalAids, aidOffset]);



  const recentActivities = useMemo(

    () => getRecentActivityEvents(loans),

    [loans]

  );



  const showPreviousAids = () => {

    setAidOffset((previous) =>

      featuredTechnicalAids.length

        ? (previous - 1 + featuredTechnicalAids.length) %

          featuredTechnicalAids.length

        : 0

    );

  };



  const showNextAids = () => {

    setAidOffset((previous) =>

      featuredTechnicalAids.length

        ? (previous + 1) % featuredTechnicalAids.length

        : 0

    );

  };



  const numberOrDash = (value) =>

    loading || value === null || value === undefined

      ? "—"

      : Number(value).toLocaleString();



  return (

    <div className="dashboard-page">



      {/* HERO AND BANK STATUS */}

      <section className="dashboard-top-grid">



        <div className="dashboard-hero">



          <img

            src={heroImage}

            alt="Mobility Aids: banco de ayudas técnicas"

            className="dashboard-hero-image"

          />



          <div className="dashboard-hero-overlay">



            <span className="eyebrow">

              BANCO DE AYUDAS TÉCNICAS

            </span>



            <h2>

              Te damos la bienvenida a

              <br />

              Mobility <span>Aids</span>

            </h2>



            <p>

              Administra el banco de ayudas técnicas para la movilidad
              y contribuye a la independencia y calidad de vida de sus beneficiarios.

            </p>



            <div className="hero-accent"></div>



          </div>

        </div>



        {/* BANK STATUS */}

        <section className="bank-status-card">



          <div className="dashboard-card-title">

            <Package size={21} />

            <h2>Resumen del banco</h2>

          </div>



          <div className="bank-status-content">



            <div className="bank-chart" style={chartStyle}>

              <div className="bank-chart-center">

                <strong>{numberOrDash(inventoryStats.totalUnits)}</strong>

                <span>Unidades totales</span>

              </div>

            </div>



            <div className="bank-legend">



              <div>

                <span className="status-dot available"></span>

                <span>Disponibles</span>

                <strong>{numberOrDash(inventoryStats.availableUnits)}</strong>

              </div>



              <div>

                <span className="status-dot loaned"></span>

                <span>Prestadas</span>

                <strong>{numberOrDash(inventoryStats.onLoanUnits)}</strong>

              </div>



              <div>

                <span className="status-dot maintenance"></span>

                <span>En mantenimiento</span>

                <strong>{numberOrDash(inventoryStats.maintenanceUnits)}</strong>

              </div>



            </div>

          </div>

        </section>



      </section>



      {/* DATA STATUS AND MANUAL REFRESH */}

      <div

        className="dashboard-data-status"

        style={{

          display: "flex",

          justifyContent: "flex-end",

          alignItems: "center",

          gap: "12px",

          margin: "0 0 10px",

          color: "#718096",

          fontSize: "12px"

        }}

      >

        {loadError && (

          <span role="alert" style={{ color: "#b45309" }}>

            {loadError}

          </span>

        )}

        <button

          type="button"

          onClick={loadDashboardData}

          disabled={loading}

          style={{

            border: "1px solid #d7dee8",

            borderRadius: "9px",

            padding: "7px 12px",

            background: "#ffffff",

            color: "#10233e",

            fontWeight: 700,

            cursor: loading ? "wait" : "pointer",

            opacity: loading ? 0.65 : 1

          }}

        >

          {loading ? "Actualizando..." : "Actualizar datos"}

        </button>

      </div>



      {/* MAIN STATISTICS */}

      <section className="dashboard-stats">



        <article className="dashboard-stat stat-blue">

          <div className="dashboard-stat-icon">

            <Package size={27} />

          </div>

          <div>

            <strong>{numberOrDash(inventoryStats.registeredAids)}</strong>

            <span>Ayudas técnicas</span>

          </div>

        </article>



        <article className="dashboard-stat stat-orange">

          <div className="dashboard-stat-icon">

            <CalendarDays size={27} />

          </div>

          <div>

            <strong>{numberOrDash(inventoryStats.activeLoans)}</strong>

            <span>Préstamos activos</span>

          </div>

        </article>



        <article className="dashboard-stat stat-green">

          <div className="dashboard-stat-icon">

            <RotateCcw size={27} />

          </div>

          <div>

            <strong>{numberOrDash(inventoryStats.returnedItems)}</strong>

            <span>Devoluciones</span>

          </div>

        </article>



        <article className="dashboard-stat stat-purple">

          <div className="dashboard-stat-icon">

            <Users size={27} />

          </div>

          <div>

            <strong>{numberOrDash(inventoryStats.beneficiaries)}</strong>

            <span>Beneficiarios</span>

          </div>

        </article>



      </section>



      {/* MAIN DASHBOARD CONTENT */}

      <section className="dashboard-main-grid">



        {/* FEATURED TECHNICAL AIDS */}

        <section className="dashboard-panel featured-panel">



          <div className="dashboard-panel-heading">



            <h2>

              <Star size={22} />

              Ayudas técnicas destacadas

            </h2>



            <Link
              to="/technical-aids"
              className="dashboard-action"
              aria-label="Ver el catálogo completo de ayudas técnicas"
            >
              Ver catálogo <ArrowRight size={16} />
            </Link>



          </div>



          {/* TECHNICAL AIDS CAROUSEL */}

          <div className="featured-carousel">



            {/* LEFT ARROW */}

            <button

              type="button"

              className="carousel-arrow carousel-arrow-left"

              onClick={showPreviousAids}

              aria-label="Ayudas técnicas anteriores"

            >

              <ChevronLeft size={22} />

            </button>



            {/* TECHNICAL AIDS CARDS */}

            <div className="featured-aids-grid">



              {visibleTechnicalAids.length === 0 && (

                <p className="dashboard-empty-state">

                  {loading

                    ? "Cargando ayudas técnicas..."
                    : "Todavía no hay ayudas técnicas registradas."}

                </p>

              )}



              {visibleTechnicalAids.map((aid) => (



                <article

                  className="featured-aid-card"

                  key={aid.id || aid.reference || aid.displayName}

                >



                  <div className="featured-aid-image">



                    {aid.image ? (

                      <img

                        src={aid.image}

                        alt={aid.displayName}

                        loading="lazy"

                      />

                    ) : (

                      <div className="featured-aid-image-placeholder">

                        <Package size={34} />

                      </div>

                    )}



                  </div>



                  <div className="featured-aid-information">



                    <h3>{aid.displayName}</h3>



                    <p>

                      <CircleCheck size={13} />

                      Disponibles: {numberOrDash(aid.available)}

                    </p>



                  </div>



                </article>



              ))}



            </div>



            {/* RIGHT ARROW */}

            <button

              type="button"

              className="carousel-arrow carousel-arrow-right"

              onClick={showNextAids}

              aria-label="Siguientes ayudas técnicas"

            >

              <ChevronRight size={22} />

            </button>



          </div>



        </section>



        {/* RECENT ACTIVITY */}

        <section className="dashboard-panel recent-panel">



          <div className="dashboard-panel-heading">



            <h2>

              <Clock3 size={21} />

              Actividad reciente

            </h2>



          </div>



          <div className="recent-activity-list">



            {recentActivities.length === 0 && (

              <p className="dashboard-empty-state">

                {loading

                  ? "Cargando actividad reciente..."
                  : "No hay actividad reciente de préstamos o devoluciones."}

              </p>

            )}



              {recentActivities.map((activity, index) => {
              const Icon = activity.icon;



              return (



              <article
                className="recent-activity-item"
                key={`${activity.title}-${activity.date.getTime()}-${index}`}
              >



                  <div className={`recent-activity-icon ${activity.color}`}>

                    <Icon size={19} />

                  </div>



                  <div>

                    <h3>{activity.title}</h3>

                    <p>{activity.description}</p>

                  </div>



                </article>



              );

            })}



          </div>



          <Link
            to="/reports"
            className="dashboard-action recent-action"
            aria-label="Ver toda la actividad del sistema"
          >
            Ver toda la actividad <ArrowRight size={15} />
          </Link>



        </section>



      </section>



      {/* SYSTEM FEATURES AND INSTITUTIONAL VIDEO */}

      <section className="dashboard-bottom-grid">



        {/* SYSTEM FEATURES */}

        <div className="dashboard-panel system-features-panel">



          <div className="system-features-grid">



            {systemFeatures.map((feature) => {

              const Icon = feature.icon;



              return (



                <article

                  className="system-feature"

                  key={feature.title}

                >



                  <Icon size={35} strokeWidth={1.7} />



                  <h3>{feature.title}</h3>



                  <p>{feature.description}</p>



                </article>



              );

            })}



          </div>



        </div>



        {/* INSTITUTIONAL VIDEO */}

        <section className="institutional-video">



          <div className="institutional-video-heading">



            <span className="video-label">

              CONOCE NUESTRO PROYECTO

            </span>



            <h2>

              Descubre Mobility <span>Aids</span>

            </h2>



            <p>

              Movilidad, independencia y calidad de vida.

            </p>



          </div>

          <div className="institutional-video-media">

            <video

              className="institutional-video-player"

              autoPlay

              muted

              loop

              playsInline

              preload="auto"

              controls

              poster={heroImage}

            >



              <source

                src={institutionalVideo}

                type="video/mp4"

              />



              Your browser does not support video playback.



            </video>



          </div>



        </section>



      </section>



    </div>

  );

}
