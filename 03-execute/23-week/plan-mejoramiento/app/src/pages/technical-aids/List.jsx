import { useCallback, useEffect, useState } from "react";

import {

  Accessibility,

  Plus,

  Search,

  RefreshCw,

  Pencil,

  Power,

  Package,

  ChevronLeft,

  ChevronRight,

  X,

  AlertCircle,

  Filter,

  ImagePlus,

  FileSpreadsheet,

  FileText

} from "lucide-react";

import ExcelJS from "exceljs";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

import api from "../../services/api";
import { getUser } from "../../services/auth";
import {
  getUiErrorMessage,
  localizeCategoryName,
  localizeUiMessage,
} from "../../services/uiMessages";
import mobilityBanner from "../../assets/images/Mobility Aids.png";

import mobilityLogo from "../../assets/icons/Icono.png";

async function loadImageAsDataUrl(source) {

  const response = await fetch(source);

  if (!response.ok) throw new Error("Unable to load the Mobility Aids logo.");

  const blob = await response.blob();

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(blob);

  });

}

const emptyForm = {

  category_id: "",

  name: "",

  reference: "",

  description: "",

  total_units: "1"

};

const API_ORIGIN = (

  api.defaults.baseURL || "http://localhost:8000/api"

).replace(/\/api\/?$/, "");

function getImageUrl(imagePath) {

  if (!imagePath) return "";

  return `${API_ORIGIN}/storage/${imagePath}`;

}

export default function TechnicalAids() {

  const user = getUser();

  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState([]);

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  const [page, setPage] = useState(1);

  const size = 10;

  const [total, setTotal] = useState(0);

  const [metrics, setMetrics] = useState({

    registered: 0,

    available: 0,

    onLoan: 0,

    maintenance: 0

  });

  const [metricsLoading, setMetricsLoading] = useState(true);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [deactivationTarget, setDeactivationTarget] = useState(null);

  const [deactivating, setDeactivating] = useState(false);

  const loadCategories = useCallback(async () => {

    try {

      const response = await api.get("/technical-aid-categories");

      setCategories(response.data.items ?? []);

    } catch {

      setError("No fue posible cargar las categorías de ayudas técnicas.");

    }

  }, []);

  // Load metrics for all active aids, regardless of table filters or pagination.

  const loadDashboardMetrics = useCallback(async () => {

    setMetricsLoading(true);

    try {

      const pageSize = 50;

      const firstResponse = await api.get("/technical-aids", {

        params: { page: 1, size: pageSize }

      });

      const firstItems = Array.isArray(firstResponse.data.items)

        ? firstResponse.data.items

        : [];

      const recordsTotal = Number(firstResponse.data.total ?? firstItems.length);

      const pages = Math.max(1, Math.ceil(recordsTotal / pageSize));

      const allItems = [...firstItems];

      for (let currentPage = 2; currentPage <= pages; currentPage += 1) {

        const response = await api.get("/technical-aids", {

          params: { page: currentPage, size: pageSize }

        });

        allItems.push(

          ...(Array.isArray(response.data.items) ? response.data.items : [])

        );

      }

      const available = allItems.reduce(

        (sum, item) => sum + Number(item.available_units ?? 0),

        0

      );

      const maintenance = allItems.reduce(

        (sum, item) => sum + Number(item.maintenance_units ?? 0),

        0

      );

      const onLoan = allItems.reduce((sum, item) => {

        const totalUnits = Number(item.total_units ?? 0);

        const availableUnits = Number(item.available_units ?? 0);

        const maintenanceUnits = Number(item.maintenance_units ?? 0);

        return sum + Math.max(0, totalUnits - availableUnits - maintenanceUnits);

      }, 0);

      setMetrics({

        registered: Number.isFinite(recordsTotal) ? recordsTotal : allItems.length,

        available,

        onLoan,

        maintenance

      });

    } catch {

      setMetrics({ registered: 0, available: 0, onLoan: 0, maintenance: 0 });

      setError("No fue posible cargar los indicadores del inventario. Actualiza la página.");

    } finally {

      setMetricsLoading(false);

    }

  }, []);

  const loadTechnicalAids = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const response = await api.get("/technical-aids", {

        params: {

          q: search || undefined,

          category_id: categoryFilter || undefined,

          page,

          size

        }

      });

      const loadedItems = Array.isArray(response.data.items)

        ? response.data.items

        : [];

      setItems(loadedItems);

      // The API contract returns `total`. Keep a safe fallback for responses

      // where that field is missing or zero while the current page has records.

      const apiTotal = Number(

        response.data.total ??

        response.data.meta?.total ??

        response.data.pagination?.total ??

        0

      );

      const minimumKnownTotal = (page - 1) * size + loadedItems.length;

      setTotal(Math.max(Number.isFinite(apiTotal) ? apiTotal : 0, minimumKnownTotal));

    } catch (err) {

      setError(getUiErrorMessage(err, "No fue posible cargar las ayudas técnicas. Inténtalo nuevamente."));

    } finally {

      setLoading(false);

    }

  }, [search, categoryFilter, page]);

  useEffect(() => {

    loadCategories();

  }, [loadCategories]);

  useEffect(() => {

    loadTechnicalAids();

  }, [loadTechnicalAids]);

  useEffect(() => {

    loadDashboardMetrics();

  }, [loadDashboardMetrics]);

  const resetForm = () => {

    setForm(emptyForm);

    setSelectedImage(null);

    setImagePreview("");

  };

  const openCreateModal = () => {

    setEditingId(null);

    resetForm();

    setError("");

    setNotice("");

    setModalOpen(true);

  };

  const openEditModal = (item) => {

    setEditingId(item.id);

    setForm({

      category_id: item.category_id ?? "",

      name: item.name ?? "",

      reference: item.reference ?? "",

      description: item.description ?? "",

      total_units: String(item.total_units ?? 1)

    });

    setSelectedImage(null);

    setImagePreview(getImageUrl(item.image_path));

    setError("");

    setNotice("");

    setModalOpen(true);

  };

  const closeModal = () => {

    if (saving) return;

    setModalOpen(false);

    setEditingId(null);

    resetForm();

  };

  const handleImageChange = (event) => {

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

      setError("Selecciona una imagen válida.");

      event.target.value = "";

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      setError("La imagen no debe superar los 5 MB.");

      event.target.value = "";

      return;

    }

    setError("");

    setSelectedImage(file);

    setImagePreview(URL.createObjectURL(file));

  };

  const handleSubmit = async (event) => {

    event.preventDefault();

    setSaving(true);

    setError("");

    setNotice("");

    const payload = new FormData();

    payload.append("category_id", form.category_id);

    payload.append("name", form.name.trim());

    payload.append("reference", form.reference.trim());

    payload.append("description", form.description.trim());

    payload.append("total_units", String(Number(form.total_units)));

    if (selectedImage) {

      payload.append("image", selectedImage);

    }

    try {

      if (editingId) {

        payload.append("_method", "PUT");

        await api.post(

          `/technical-aids/${editingId}`,

          payload,

          {

            headers: {

              "Content-Type": "multipart/form-data"

            }

          }

        );

        setNotice("La ayuda técnica se actualizó correctamente.");

      } else {

        await api.post(

          "/technical-aids",

          payload,

          {

            headers: {

              "Content-Type": "multipart/form-data"

            }

          }

        );

        setNotice("La ayuda técnica se registró correctamente.");

      }

      setModalOpen(false);

      setEditingId(null);

      resetForm();

      await Promise.all([loadTechnicalAids(), loadDashboardMetrics()]);

    } catch (err) {

      const validationErrors = err.response?.data?.errors;

      const firstValidationError = validationErrors

        ? Object.values(validationErrors).flat()[0]

        : null;

      setError(
        localizeUiMessage(
          firstValidationError || err.response?.data?.message,
          "No fue posible completar la operación."
        )
      );

    } finally {

      setSaving(false);

    }

  };

  const handleDeactivate = (item) => {

    setError("");

    setNotice("");

    setDeactivationTarget(item);

  };

  const closeDeactivateModal = () => {

    if (deactivating) return;

    setDeactivationTarget(null);

  };

  const confirmDeactivate = async () => {

    if (!deactivationTarget || deactivating) return;

    setDeactivating(true);

    setError("");

    setNotice("");

    try {

      await api.delete(`/technical-aids/${deactivationTarget.id}`);

      setDeactivationTarget(null);

      setNotice(`La ayuda técnica "${deactivationTarget.name || deactivationTarget.reference}" se desactivó correctamente.`);

      await Promise.all([loadTechnicalAids(), loadDashboardMetrics()]);

    } catch (err) {

      const message = getUiErrorMessage(
        err,
        "No fue posible desactivar esta ayuda técnica. Verifica si tiene préstamos pendientes."
      );

      setDeactivationTarget(null);

      setError(message);

    } finally {

      setDeactivating(false);

    }

  };

  // Retrieve every page matching the current filters so exports are not

  // limited to the ten records currently visible in the table.

  const loadAllFilteredTechnicalAids = async () => {

    const pageSize = 50;

    const params = {

      q: search || undefined,

      category_id: categoryFilter || undefined,

      page: 1,

      size: pageSize

    };

    const firstResponse = await api.get("/technical-aids", { params });

    const firstItems = firstResponse.data.items ?? [];

    const recordsTotal = Number(firstResponse.data.total ?? firstItems.length);

    const pages = Math.ceil(recordsTotal / pageSize);

    const allItems = [...firstItems];

    for (let currentPage = 2; currentPage <= pages; currentPage += 1) {

      const response = await api.get("/technical-aids", {

        params: { ...params, page: currentPage }

      });

      allItems.push(...(response.data.items ?? []));

    }

    return allItems;

  };

  const handleExportExcel = async () => {

    setExporting(true);

    setError("");

    setNotice("");

    try {

      const records = await loadAllFilteredTechnicalAids();

      if (records.length === 0) {

        setNotice("No hay registros para exportar con los filtros actuales.");

        return;

      }

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "Mobility Aids";

      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Ayudas técnicas");

      worksheet.columns = [

        { header: "Ayuda técnica", key: "name", width: 30 },
        { header: "Referencia", key: "reference", width: 20 },
        { header: "Categoría", key: "category", width: 22 },
        { header: "Descripción", key: "description", width: 48 },
        { header: "Unidades totales", key: "total", width: 14 },
        { header: "Unidades disponibles", key: "available", width: 17 },
        { header: "Unidades prestadas", key: "onLoan", width: 15 },
        { header: "Unidades en mantenimiento", key: "maintenance", width: 20 },
        { header: "Estado", key: "status", width: 14 }

      ];

      records.forEach((item) => {

        const totalUnits = Number(item.total_units ?? 0);

        const availableUnits = Number(item.available_units ?? 0);

        const maintenanceUnits = Number(item.maintenance_units ?? 0);

        worksheet.addRow({

          name: item.name || item.reference || "",

          reference: item.reference || "",

          category: localizeCategoryName(item.category?.name || "Uncategorized"),

          description: item.description || "",

          total: totalUnits,

          available: availableUnits,

          onLoan: Math.max(0, totalUnits - availableUnits - maintenanceUnits),

          maintenance: maintenanceUnits,

          status: item.is_active === false ? "Inactiva" : "Activa"

        });

      });

      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      worksheet.getRow(1).fill = {

        type: "pattern",

        pattern: "solid",

        fgColor: { argb: "FF172B4D" }

      };

      worksheet.getRow(1).alignment = { vertical: "middle", wrapText: true };

      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      worksheet.autoFilter = {

        from: { row: 1, column: 1 },

        to: { row: 1, column: worksheet.columns.length }

      };

      worksheet.eachRow((row, rowNumber) => {

        if (rowNumber > 1) {

          row.alignment = { vertical: "top", wrapText: true };

        }

      });

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {

        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `inventario-mobility-aids-${new Date().toISOString().slice(0, 10)}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);

      setNotice(`Informe de Excel exportado correctamente (${records.length} registros).`);

    } catch (err) {

      setError(getUiErrorMessage(err, "No fue posible exportar el informe de Excel. Inténtalo nuevamente."));

    } finally {

      setExporting(false);

    }

  };

  const handleExportPdf = async () => {

    setExporting(true);

    setError("");

    setNotice("");

    try {

      const records = await loadAllFilteredTechnicalAids();

      if (records.length === 0) {

        setNotice("No hay registros para exportar con los filtros actuales.");

        return;

      }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      const generatedAt = new Date().toLocaleString("es-CO");

      const availableTotal = records.reduce(

        (sum, item) => sum + Number(item.available_units ?? 0), 0

      );

      const maintenanceTotal = records.reduce(

        (sum, item) => sum + Number(item.maintenance_units ?? 0), 0

      );

      const unitsTotal = records.reduce(

        (sum, item) => sum + Number(item.total_units ?? 0), 0

      );

      const pageWidth = doc.internal.pageSize.getWidth();

      const logoData = await loadImageAsDataUrl(mobilityLogo);

      // Corporate header with official logo and golden brand accent.

      doc.setFillColor(10, 29, 51);

      doc.rect(0, 0, pageWidth, 48, "F");

      doc.setFillColor(245, 158, 11);

      doc.rect(0, 47, pageWidth, 1.5, "F");

      doc.addImage(logoData, "PNG", 13, 7, 32, 32);

      doc.setFont("helvetica", "bold");

      doc.setFontSize(20);

      doc.setTextColor(255, 255, 255);

      doc.text("MOBILITY AIDS", 52, 18);

      doc.setFont("helvetica", "normal");

      doc.setFontSize(10);

      doc.setTextColor(226, 232, 240);

      doc.text("INFORME DE INVENTARIO DE AYUDAS TÉCNICAS", 52, 25);

      doc.setFontSize(8);

      doc.setTextColor(255, 193, 7);

      doc.text(`Generado: ${generatedAt}`, 52, 33);

      // Inventory summary cards.

      const cardY = 55;

      const cardH = 17;

      const cardGap = 5;

      const marginX = 14;

      const cardW = (pageWidth - marginX * 2 - cardGap * 3) / 4;

      const summaryCards = [

        { label: "REGISTROS", value: String(records.length) },

        { label: "UNIDADES TOTALES", value: String(unitsTotal) },

        { label: "UNIDADES DISPONIBLES", value: String(availableTotal) },

        { label: "EN MANTENIMIENTO", value: String(maintenanceTotal) }

      ];

      summaryCards.forEach((card, index) => {

        const x = marginX + index * (cardW + cardGap);

        doc.setFillColor(248, 250, 252);

        doc.setDrawColor(221, 228, 237);

        doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "FD");

        doc.setFillColor(245, 158, 11);

        doc.roundedRect(x, cardY, 2, cardH, 1, 1, "F");

        doc.setFont("helvetica", "bold");

        doc.setFontSize(7);

        doc.setTextColor(91, 105, 124);

        doc.text(card.label, x + 6, cardY + 6);

        doc.setFontSize(12);

        doc.setTextColor(10, 29, 51);

        doc.text(card.value, x + 6, cardY + 13.5);

      });

      let tableStartY = 78;

      if (search || categoryFilter) {

        const selectedCategory = categories.find(

          (category) => String(category.id) === String(categoryFilter)

        )?.name;

        const filterText = [

          search ? `Búsqueda: ${search}` : "",
          selectedCategory ? `Categoría: ${localizeCategoryName(selectedCategory)}` : ""

        ].filter(Boolean).join("   |   ");

        doc.setFont("helvetica", "normal");

        doc.setFontSize(8);

        doc.setTextColor(75, 85, 99);

        doc.text(`Filtros aplicados: ${filterText}`, 14, 76);

        tableStartY = 82;

      }

      autoTable(doc, {

        startY: tableStartY,

        head: [[

          "Ayuda técnica",
          "Referencia",
          "Categoría",
          "Descripción",

          "Total",

          "Disponible",
          "Prestadas",
          "Mantenimiento",
          "Estado"

        ]],

        body: records.map((item) => {

          const totalUnits = Number(item.total_units ?? 0);

          const availableUnits = Number(item.available_units ?? 0);

          const maintenanceUnits = Number(item.maintenance_units ?? 0);

          return [

            item.name || item.reference || "",

            item.reference || "",

            localizeCategoryName(item.category?.name || "Uncategorized"),

            item.description || "—",

            String(totalUnits),

            String(availableUnits),

            String(Math.max(0, totalUnits - availableUnits - maintenanceUnits)),

            String(maintenanceUnits),

            item.is_active === false ? "Inactiva" : "Activa"

          ];

        }),

        theme: "grid",

        headStyles: {

          fillColor: [10, 29, 51],

          textColor: [255, 255, 255],

          fontStyle: "bold",

          lineColor: [245, 158, 11],

          lineWidth: 0.25

        },

        alternateRowStyles: { fillColor: [245, 247, 250] },

        styles: { fontSize: 7.5, cellPadding: 2.5, overflow: "linebreak" },

        columnStyles: {

          0: { cellWidth: 34 },

          1: { cellWidth: 25 },

          2: { cellWidth: 27 },

          3: { cellWidth: "auto" },

          4: { cellWidth: 15, halign: "center" },

          5: { cellWidth: 17, halign: "center" },

          6: { cellWidth: 16, halign: "center" },

          7: { cellWidth: 20, halign: "center" },

          8: { cellWidth: 18, halign: "center" }

        },

        didDrawPage: () => {

          const pageCount = doc.internal.getNumberOfPages();

          doc.setFontSize(8);

          doc.setTextColor(120, 130, 145);

          doc.text(

            `Mobility Aids  •  Página ${pageCount}`,

            doc.internal.pageSize.getWidth() - 14,

            doc.internal.pageSize.getHeight() - 7,

            { align: "right" }

          );

        }

      });

      doc.save(`inventario-mobility-aids-${new Date().toISOString().slice(0, 10)}.pdf`);
      setNotice(`Informe PDF exportado correctamente (${records.length} registros).`);

    } catch (err) {

      setError(getUiErrorMessage(err, "No fue posible exportar el informe en PDF. Inténtalo nuevamente."));

    } finally {

      setExporting(false);

    }

  };

  const totalPages = Math.max(1, Math.ceil(total / size));

  return (

    <div className="dashboard-page technical-aids-page">

      <section className="technical-aid-hero">

        <img

          src={mobilityBanner}

          alt="Ayudas técnicas para la movilidad de Mobility Aids"

        />

        <div className="technical-aid-hero-overlay">

          <div className="technical-aid-hero-icon">

            <Accessibility size={34} />

          </div>

          <div className="technical-aid-hero-copy">

            <span>BANCO DE AYUDAS TÉCNICAS PARA LA MOVILIDAD</span>

            <h1>

              Ayudas <strong>técnicas</strong>

            </h1>

            <p>

              Administra el catálogo de ayudas para la movilidad, su información,
              estado y disponibilidad.

            </p>

            <div className="technical-aid-hero-line" />

          </div>

        </div>

      </section>

      <div className="technical-aid-page-heading">

        <div>

          <span className="technical-aid-eyebrow">

            SISTEMA DE GESTIÓN

          </span>

          <h2>Gestión de ayudas técnicas</h2>

          <p>

            Registra, organiza y supervisa la disponibilidad de ayudas técnicas.

          </p>

        </div>

        {isAdmin && (

          <button

            className="btn btn-primary"

            onClick={openCreateModal}

          >

            <Plus size={18} />

            Registrar ayuda técnica

          </button>

        )}

      </div>

      <section className="technical-aid-stats">

        <article className="technical-aid-stat stat-total">

          <div className="technical-aid-stat-icon">

            <Package size={26} />

          </div>

          <div>

            <strong>{metricsLoading ? "—" : metrics.registered}</strong>

            <span>Ayudas registradas</span>

          </div>

        </article>

        <article className="technical-aid-stat stat-available">

          <div className="technical-aid-stat-icon">

            <Accessibility size={26} />

          </div>

          <div>

            <strong>{metricsLoading ? "—" : metrics.available}</strong>

            <span>Unidades disponibles</span>
            <small>Disponibilidad actual del inventario</small>

          </div>

        </article>

        <article className="technical-aid-stat stat-loan">

          <div className="technical-aid-stat-icon">

            <Package size={26} />

          </div>

          <div>

            <strong>{metricsLoading ? "—" : metrics.onLoan}</strong>

            <span>Unidades prestadas</span>
            <small>Unidades que no están disponibles</small>

          </div>

        </article>

        <article className="technical-aid-stat stat-maintenance">

          <div className="technical-aid-stat-icon">

            <RefreshCw size={26} />

          </div>

          <div>

            <strong>{metricsLoading ? "—" : metrics.maintenance}</strong>

            <span>En mantenimiento</span>
            <small>Unidades que están en reparación</small>

          </div>

        </article>

      </section>

      {notice && (

        <div className="technical-aid-message success">

          {notice}

          <button

            onClick={() => setNotice("")}

            aria-label="Cerrar mensaje"

          >

            <X size={16} />

          </button>

        </div>

      )}

      {error && !modalOpen && (

        <div className="technical-aid-message error">

          <AlertCircle size={18} />

          <span>{error}</span>

          <button

            onClick={() => setError("")}

            aria-label="Cerrar error"

          >

            <X size={16} />

          </button>

        </div>

      )}

      <section className="dashboard-panel technical-aid-panel">

        <div className="technical-aid-list-heading">

          <div>

            <Accessibility size={25} />

            <h2>Lista de ayudas técnicas</h2>

          </div>

          <span>{total} registros</span>

        </div>

        <div className="technical-aid-toolbar">

          <div className="technical-aid-search">

            <Search size={19} />

            <input

              type="search"

              placeholder="Buscar por nombre o referencia..."

              value={search}

              onChange={(event) => {

                setSearch(event.target.value);

                setPage(1);

              }}

              aria-label="Buscar por nombre o referencia"

            />

          </div>

          <div className="technical-aid-filter">

            <Filter size={17} />

            <select

              value={categoryFilter}

              onChange={(event) => {

                setCategoryFilter(event.target.value);

                setPage(1);

              }}

              aria-label="Filtrar por categoría"

            >

              <option value="">Todas las categorías</option>

              {categories.map((category) => (

                <option key={category.id} value={category.id}>

                  {localizeCategoryName(category.name)}

                </option>

              ))}

            </select>

          </div>

          <button

            type="button"

            className="technical-aid-export-button technical-aid-export-excel"

            onClick={handleExportExcel}

            disabled={exporting || loading || total === 0}

            title="Exportar a Excel todos los registros filtrados"
            aria-label="Exportar a Excel"

            style={{

              display: "inline-flex",

              flexDirection: "row",

              alignItems: "center",

              justifyContent: "center",

              gap: "9px",

              minWidth: "112px",

              height: "48px",

              padding: "0 17px",

              border: "1px solid #b7e4ce",

              borderRadius: "12px",

              background: "#effaf4",

              color: "#167447",

              fontSize: "14px",

              fontWeight: 700,

              lineHeight: 1,

              whiteSpace: "nowrap",

              cursor: exporting || loading || total === 0 ? "not-allowed" : "pointer",

              opacity: exporting || loading || total === 0 ? 0.55 : 1,

              transition: "all 160ms ease"

            }}

          >

            <FileSpreadsheet size={18} strokeWidth={2.1} />

            <span>Excel</span>

          </button>

          <button

            type="button"

            className="technical-aid-export-button technical-aid-export-pdf"

            onClick={handleExportPdf}

            disabled={exporting || loading || total === 0}

            title="Exportar a PDF todos los registros filtrados"
            aria-label="Exportar a PDF"

            style={{

              display: "inline-flex",

              flexDirection: "row",

              alignItems: "center",

              justifyContent: "center",

              gap: "9px",

              minWidth: "104px",

              height: "48px",

              padding: "0 17px",

              border: "1px solid #f0c9c9",

              borderRadius: "12px",

              background: "#fff5f5",

              color: "#a83232",

              fontSize: "14px",

              fontWeight: 700,

              lineHeight: 1,

              whiteSpace: "nowrap",

              cursor: exporting || loading || total === 0 ? "not-allowed" : "pointer",

              opacity: exporting || loading || total === 0 ? 0.55 : 1,

              transition: "all 160ms ease"

            }}

          >

            <FileText size={18} strokeWidth={2.1} />

            <span>PDF</span>

          </button>

          <button

            className="technical-aid-refresh-button"

            onClick={() => {

              loadTechnicalAids();

              loadDashboardMetrics();

            }}

            disabled={loading || metricsLoading}

            title="Actualizar lista"

          >

            <RefreshCw size={17} />

          </button>

        </div>

        <div className="table-container technical-aid-table-container" style={{ overflowX: "auto" }}>

          <table style={{ minWidth: "1120px", width: "100%", tableLayout: "auto" }}>

            <thead>

              <tr>

                <th style={{ minWidth: "390px", textAlign: "left" }}>Ayuda técnica / Código / Descripción</th>
                <th>Categoría</th>
                <th>Unidades totales</th>
                <th>Disponibles</th>
                <th>Prestadas</th>
                <th>Mantenimiento</th>
                {isAdmin && <th>Acciones</th>}

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td

                    colSpan={isAdmin ? 7 : 6}

                    className="technical-aid-empty"

                  >

                    Cargando ayudas técnicas...

                  </td>

                </tr>

              ) : items.length === 0 ? (

                <tr>

                  <td

                    colSpan={isAdmin ? 7 : 6}

                    className="technical-aid-empty"

                  >

                    No se encontraron ayudas técnicas.

                  </td>

                </tr>

              ) : (

                items.map((item) => {

                  const onLoan = Math.max(

                    0,

                    Number(item.total_units ?? 0) -

                      Number(item.available_units ?? 0) -

                      Number(item.maintenance_units ?? 0)

                  );

                  const maintenanceUnits = Number(item.maintenance_units ?? 0);

                  return (

                    <tr key={item.id}>

                      <td>

                        <div
              className="technical-aid-reference"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                minWidth: "360px",
                padding: "8px 10px 8px 0"
              }}
            >
              {item.image_path ? (
                <img
                  src={getImageUrl(item.image_path)}
                  alt={item.name || item.reference}
                  style={{
                    width: "58px",
                    height: "58px",
                    flex: "0 0 58px",
                    objectFit: "contain",
                    borderRadius: "10px",
                    border: "1px solid #e1e8f0",
                    background: "#fff"
                  }}
                />
              ) : (
                <span className="technical-aid-row-icon" style={{ flex: "0 0 58px", width: "58px", height: "58px" }}>
                  <Accessibility size={22} />
                </span>
              )}

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "5px", minWidth: 0, whiteSpace: "normal" }}>
                <strong style={{ color: "#172b45", fontSize: "14px", lineHeight: 1.45, whiteSpace: "normal" }}>
                  {item.name || "Ayuda técnica sin nombre"}
                </strong>

                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  width: "fit-content",
                  padding: "3px 9px",
                  borderRadius: "7px",
                  background: "#fff5e5",
                  color: "#a86608",
                  border: "1px solid #f4dfbd",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.35px"
                }}>
                  CÓDIGO: {item.reference || "Sin código"}
                </span>

                <span style={{ color: "#71819a", fontSize: "12px", lineHeight: 1.5, whiteSpace: "normal", overflowWrap: "anywhere", maxWidth: "430px" }}>
                  {item.description?.trim() || "No hay una descripción registrada."}
                </span>
              </div>
            </div>

                      </td>

                      <td>

                        {localizeCategoryName(item.category?.name ?? "Uncategorized")}

                      </td>

                      <td>{item.total_units}</td>

                      <td>

                        <span className="technical-aid-available">

                          {item.available_units}

                        </span>

                      </td>

                      <td>{onLoan}</td>

                      <td>{maintenanceUnits}</td>

                      {isAdmin && (

                        <td>

                          <div className="technical-aid-actions">

                            <button

                              className="technical-aid-action edit"

                              onClick={() => openEditModal(item)}

                              title="Editar ayuda técnica"

                              aria-label={`Editar ${item.reference}`}

                            >

                              <Pencil size={17} />

                            </button>

                            <button

                              className="technical-aid-action deactivate"

                              onClick={() => handleDeactivate(item)}

                              title="Desactivar ayuda técnica"

                              aria-label={`Desactivar ${item.reference}`}

                            >

                              <Power size={17} />

                            </button>

                          </div>

                        </td>

                      )}

                    </tr>

                  );

                })

              )}

            </tbody>

          </table>

        </div>

        <div className="technical-aid-pagination">

          <span>

            Página {page} de {totalPages} · {total} registros

          </span>

          <div>

            <button

              onClick={() =>

                setPage((current) => Math.max(1, current - 1))

              }

              disabled={page <= 1 || loading}

              aria-label="Página anterior"

            >

              <ChevronLeft size={18} />

            </button>

            <button

              onClick={() =>

                setPage((current) =>

                  Math.min(totalPages, current + 1)

                )

              }

              disabled={page >= totalPages || loading}

              aria-label="Página siguiente"

            >

              <ChevronRight size={18} />

            </button>

          </div>

        </div>

      </section>

      {deactivationTarget && (

        <div

          className="technical-aid-modal-backdrop"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) closeDeactivateModal();

          }}

          style={{

            position: "fixed",

            inset: 0,

            zIndex: 1200,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            padding: "24px",

            background: "rgba(5, 19, 34, 0.78)",

            backdropFilter: "blur(7px)"

          }}

        >

          <section

            role="dialog"

            aria-modal="true"

            aria-labelledby="deactivate-aid-title"

            style={{

              position: "relative",

              width: "min(100%, 650px)",

              overflow: "hidden",

              borderRadius: "28px",

              background: "#ffffff",

              boxShadow: "0 28px 90px rgba(0, 0, 0, 0.30)",

              padding: "42px 42px 36px",

              textAlign: "center"

            }}

          >

            <div style={{ height: "9px", position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, #D88912, #F4B942)" }} />

            <button

              type="button"

              onClick={closeDeactivateModal}

              disabled={deactivating}

              aria-label="Cerrar"

              style={{

                position: "absolute",

                top: "22px",

                right: "22px",

                width: "46px",

                height: "46px",

                border: "1px solid #dbe4ef",

                borderRadius: "15px",

                background: "#fff",

                color: "#64748b",

                display: "grid",

                placeItems: "center",

                cursor: deactivating ? "not-allowed" : "pointer"

              }}

            >

              <X size={22} />

            </button>

            <div style={{

              width: "88px",

              height: "88px",

              margin: "8px auto 22px",

              display: "grid",

              placeItems: "center",

              borderRadius: "25px",

              color: "#C98212",

              background: "#FFF7E9",

              border: "1px solid #F5D59E"

            }}>

              <Power size={37} strokeWidth={1.9} />

            </div>

            <span style={{

              display: "block",

              marginBottom: "13px",

              color: "#B97812",

              fontSize: "13px",

              fontWeight: 800,

              letterSpacing: "2px"

            }}>

              Mobility Aids · Gestión de inventario

            </span>

            <h2 id="deactivate-aid-title" style={{

              margin: "0 0 12px",

              color: "#17243A",

              fontSize: "30px",

              lineHeight: 1.2,

              fontWeight: 800

            }}>

              ¿Desactivar ayuda técnica?

            </h2>

            <p style={{

              maxWidth: "490px",

              margin: "0 auto 26px",

              color: "#71819A",

              fontSize: "16px",

              lineHeight: 1.7

            }}>

              ¿Confirmas que deseas desactivar esta ayuda técnica? Ya no estará disponible para nuevos préstamos.

            </p>

            <div style={{

              padding: "22px 24px",

              marginBottom: "20px",

              border: "1px solid #DCE6F2",

              borderRadius: "19px",

              background: "#F4F7FB",

              textAlign: "left"

            }}>

              <span style={{

                display: "block",

                marginBottom: "10px",

                color: "#8796AB",

                fontSize: "12px",

                fontWeight: 800,

                letterSpacing: "1.2px"

              }}>

                AYUDA TÉCNICA SELECCIONADA

              </span>

              <strong style={{ display: "block", color: "#17243A", fontSize: "21px", marginBottom: "5px" }}>

                {deactivationTarget.name || "Ayuda técnica"}

              </strong>

              <span style={{ color: "#B97812", fontSize: "14px", fontWeight: 700 }}>

                Referencia: {deactivationTarget.reference}

              </span>

            </div>

            <div style={{

              display: "flex",

              alignItems: "flex-start",

              gap: "12px",

              padding: "15px 17px",

              marginBottom: "27px",

              border: "1px solid #F3D7A7",

              borderRadius: "15px",

              background: "#FFFAF0",

              color: "#8B5A13",

              textAlign: "left",

              fontSize: "13px",

              lineHeight: 1.6

            }}>

              <AlertCircle size={19} style={{ flexShrink: 0, marginTop: "1px" }} />

              <span>La ayuda técnica permanecerá en el sistema, pero no estará activa para nuevos préstamos. El sistema impedirá desactivarla si tiene préstamos pendientes.</span>

            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "13px", flexWrap: "wrap" }}>

              <button

                type="button"

                onClick={closeDeactivateModal}

                disabled={deactivating}

                style={{

                  minWidth: "135px",

                  padding: "15px 24px",

                  border: "1px solid #D7E1ED",

                  borderRadius: "15px",

                  background: "#fff",

                  color: "#52647D",

                  fontWeight: 700,

                  fontSize: "14px",

                  cursor: deactivating ? "not-allowed" : "pointer"

                }}

              >

                Cancelar

              </button>

              <button

                type="button"

                onClick={confirmDeactivate}

                disabled={deactivating}

                style={{

                  minWidth: "175px",

                  padding: "15px 24px",

                  border: "none",

                  borderRadius: "15px",

                  background: deactivating ? "#D7A3A1" : "#B94A48",

                  color: "#fff",

                  fontWeight: 800,

                  fontSize: "14px",

                  cursor: deactivating ? "wait" : "pointer",

                  boxShadow: "0 9px 22px rgba(185, 74, 72, 0.20)"

                }}

              >

                {deactivating ? "Desactivando..." : "Sí, desactivar"}

              </button>

            </div>

          </section>

        </div>

      )}

      {modalOpen && (

        <div className="technical-aid-modal-backdrop">

          <section

            className="technical-aid-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="technical-aid-modal-title"

          >

            <div className="technical-aid-modal-heading">

              <div>

                <span>AYUDAS TÉCNICAS</span>

                <h2 id="technical-aid-modal-title">

                  {editingId

                    ? "Editar ayuda técnica"
                    : "Registrar ayuda técnica"}

                </h2>

              </div>

              <button

                onClick={closeModal}

                disabled={saving}

                aria-label="Cerrar diálogo"

              >

                <X size={21} />

              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {error && (

                <div className="technical-aid-message error">

                  <AlertCircle size={17} />

                  {error}

                </div>

              )}

              <div className="form-group">

                <label htmlFor="aid-name">Nombre de la ayuda técnica</label>

                <input

                  id="aid-name"

                  className="form-control"

                  type="text"

                  placeholder="Ejemplo: silla de ruedas estándar"

                  maxLength={255}

                  value={form.name}

                  onChange={(event) =>

                    setForm({

                      ...form,

                      name: event.target.value

                    })

                  }

                  required

                />

              </div>

              <div className="form-group">

                <label htmlFor="aid-category">Categoría</label>

                <select

                  id="aid-category"

                  className="form-control"

                  value={form.category_id}

                  onChange={(event) =>

                    setForm({

                      ...form,

                      category_id: event.target.value

                    })

                  }

                  required

                >

                  <option value="">Selecciona una categoría</option>

                  {categories.map((category) => (

                    <option key={category.id} value={category.id}>

                      {localizeCategoryName(category.name)}

                    </option>

                  ))}

                </select>

              </div>

              <div className="form-group">

                <label htmlFor="aid-reference">Referencia</label>

                <input

                  id="aid-reference"

                  className="form-control"

                  type="text"

                  placeholder="Ejemplo: SILLA-001"

                  maxLength={255}

                  value={form.reference}

                  onChange={(event) =>

                    setForm({

                      ...form,

                      reference: event.target.value

                    })

                  }

                  required

                />

              </div>

              <div className="form-group">

                <label htmlFor="aid-description">Descripción</label>

                <textarea

                  id="aid-description"

                  className="form-control"

                  placeholder="Describe la ayuda técnica..."

                  rows={3}

                  maxLength={5000}

                  value={form.description}

                  onChange={(event) =>

                    setForm({

                      ...form,

                      description: event.target.value

                    })

                  }

                />

              </div>

              <div className="form-group">

                <label htmlFor="aid-image">Fotografía</label>

                <label

                  htmlFor="aid-image"

                  style={{

                    display: "flex",

                    alignItems: "center",

                    gap: "10px",

                    padding: "12px",

                    border: "1px dashed #aeb8c7",

                    borderRadius: "9px",

                    cursor: "pointer"

                  }}

                >

                  <ImagePlus size={21} />

                  <span>

                    {selectedImage

                      ? selectedImage.name

                      : "Selecciona una imagen (máximo 5 MB)"}

                  </span>

                </label>

                <input

                  id="aid-image"

                  type="file"

                  accept="image/*"

                  onChange={handleImageChange}

                  style={{ display: "none" }}

                />

                {imagePreview && (

                  <div style={{ marginTop: "12px" }}>

                    <img

                      src={imagePreview}

                      alt="Vista previa de la ayuda técnica"

                      style={{

                        width: "130px",

                        height: "110px",

                        objectFit: "cover",

                        borderRadius: "10px",

                        border: "1px solid #d9dee7"

                      }}

                    />

                  </div>

                )}

              </div>

              <div className="form-group">

                <label htmlFor="aid-quantity">Unidades totales</label>

                <input

                  id="aid-quantity"

                  className="form-control"

                  type="number"

                  min="1"

                  step="1"

                  value={form.total_units}

                  onChange={(event) =>

                    setForm({

                      ...form,

                      total_units: event.target.value

                    })

                  }

                  required

                />

              </div>

              <div className="technical-aid-modal-actions">

                <button

                  type="button"

                  className="btn btn-secondary"

                  onClick={closeModal}

                  disabled={saving}

                >

                  Cancelar

                </button>

                <button

                  type="submit"

                  className="btn btn-primary"

                  disabled={

                    saving ||

                    categories.length === 0 ||

                    !form.name.trim() ||

                    !form.reference.trim()

                  }

                >

                  {saving

                    ? "Guardando..."
                    : editingId
                      ? "Guardar cambios"
                      : "Registrar ayuda"}

                </button>

              </div>

            </form>

          </section>

        </div>

      )}

    </div>

  );

}
