import { useEffect, useState } from "react";

import {
  ChartNoAxesCombined,
  FileBarChart,
  CalendarDays,
  RotateCcw,
  Users,
  Package,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Download,
  RefreshCw
} from "lucide-react";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api";
import { getUiErrorMessage } from "../../services/uiMessages";
import reportsBanner from "../../assets/images/reports-banner.png";
import "./Reports.css";

const reportCategories = [
  {
    id: "loans",
    number: "01",
    title: "Informes de préstamos",
    description: "Consulta los préstamos registrados, las ayudas activas y los elementos vencidos.",
    icon: CalendarDays,
    color: "blue",
    status: "Gestión de préstamos"
  },
  {
    id: "returns",
    number: "02",
    title: "Informes de devoluciones",
    description: "Analiza las ayudas técnicas devueltas y el historial de devoluciones.",
    icon: RotateCcw,
    color: "orange",
    status: "Gestión de devoluciones"
  },
  {
    id: "beneficiaries",
    number: "03",
    title: "Informes de beneficiarios",
    description: "Consulta los registros de beneficiarios y su actividad de préstamos.",
    icon: Users,
    color: "green",
    status: "Gestión de personas"
  },
  {
    id: "inventory",
    number: "04",
    title: "Informes de inventario",
    description: "Supervisa las ayudas registradas y las unidades disponibles.",
    icon: Package,
    color: "purple",
    status: "Gestión de inventario"
  }
];

const initialSummary = {
  loans_count: 0,
  returns_count: 0,
  beneficiaries_count: 0,
  technical_aids_count: 0,
  total_units: 0,
  available_units: 0,
  borrowed_units: 0
};

const reportDefinitions = [
  {
    key: "loans_count",
    label: "Informes de préstamos",
    description: "Préstamos registrados",
    icon: CalendarDays,
    color: "blue"
  },
  {
    key: "returns_count",
    label: "Informes de devoluciones",
    description: "Devoluciones procesadas",
    icon: RotateCcw,
    color: "orange"
  },
  {
    key: "beneficiaries_count",
    label: "Informes de beneficiarios",
    description: "Beneficiarios registrados",
    icon: Users,
    color: "green"
  },
  {
    key: "technical_aids_count",
    label: "Informes de inventario",
    description: "Registros activos de ayudas técnicas",
    icon: Package,
    color: "purple"
  }
];

function getReportRows(summary) {
  return [
    ["Préstamos registrados", summary.loans_count],
    ["Devoluciones procesadas", summary.returns_count],
    ["Beneficiarios registrados", summary.beneficiaries_count],
    ["Ayudas técnicas activas", summary.technical_aids_count],
    ["Unidades totales en inventario", summary.total_units],
    ["Unidades disponibles", summary.available_units],
    ["Unidades actualmente prestadas", summary.borrowed_units]
  ];
}

function getDateLabel() {
  return new Date().toLocaleDateString("es-CO");
}

export default function Reports() {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/reports/summary");
      setSummary({
        ...initialSummary,
        ...response.data
      });
    } catch (err) {
      console.error("Error loading report summary:", err);
      setError(getUiErrorMessage(err, "No fue posible cargar la información de los informes. Inténtalo nuevamente."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const exportExcel = async () => {
    try {
      setExporting("excel");

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Mobility Aids";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Informe de gestión");

      worksheet.columns = [
        { header: "Indicador", key: "indicator", width: 34 },
        { header: "Valor", key: "value", width: 18 }
      ];

      worksheet.addRows(
        getReportRows(summary).map(([indicator, value]) => ({
          indicator,
          value
        }))
      );

      worksheet.insertRow(1, ["MOBILITY AIDS - INFORME DE GESTIÓN"]);
      worksheet.mergeCells("A1:B1");

      worksheet.getRow(1).font = {
        bold: true,
        size: 16,
        color: { argb: "FFFFFFFF" }
      };

      worksheet.getRow(1).height = 30;
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center"
      };

      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF14243A" }
      };

      worksheet.getRow(2).font = {
        bold: true,
        color: { argb: "FFFFFFFF" }
      };

      worksheet.getRow(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC69A43" }
      };

      worksheet.addRow([]);
      worksheet.addRow(["Generado el", getDateLabel()]);

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      saveAs(blob, `informe-mobility-aids-${Date.now()}.xlsx`);
    } catch (err) {
      console.error("Excel export error:", err);
      window.alert("No fue posible generar el informe de Excel.");
    } finally {
      setExporting("");
    }
  };

  const exportPDF = () => {
    try {
      setExporting("pdf");

      const doc = new jsPDF();

      doc.setFillColor(20, 36, 58);
      doc.rect(0, 0, 210, 38, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(19);
      doc.text("MOBILITY AIDS", 14, 17);

      doc.setFontSize(11);
      doc.text("Informe de gestión y análisis", 14, 27);

      doc.setTextColor(70, 70, 70);
      doc.setFontSize(10);
      doc.text(`Generado el: ${getDateLabel()}`, 14, 48);

      autoTable(doc, {
        startY: 57,
        head: [["Indicador", "Valor"]],
        body: getReportRows(summary),
        theme: "grid",
        headStyles: {
          fillColor: [198, 154, 67],
          textColor: [255, 255, 255],
          fontStyle: "bold"
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Mobility Aids - Banco de ayudas técnicas para la movilidad",
        14,
        285
      );

      doc.save(`informe-mobility-aids-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      window.alert("No fue posible generar el informe en PDF.");
    } finally {
      setExporting("");
    }
  };

  return (
    <div className="reports-page">

      <section
        className="reports-hero"
        style={{ backgroundImage: `url(${reportsBanner})` }}
      >
        <div className="reports-hero-content">
          <div className="reports-hero-icon">
            <ChartNoAxesCombined size={38} strokeWidth={1.8} />
          </div>

          <div className="reports-hero-copy">
            <span>GESTIÓN Y ANÁLISIS</span>

            <h2>
              Informes y <strong>análisis</strong>
            </h2>

            <p>
              Consulta los préstamos, las devoluciones, los beneficiarios
              y el inventario de ayudas técnicas en un solo lugar.
            </p>

            <div className="reports-hero-line"></div>
          </div>
        </div>
      </section>

      <section className="reports-stats">
        {reportDefinitions.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              className={`reports-stat reports-stat-${stat.color}`}
              key={stat.key}
            >
              <div className="reports-stat-icon">
                <Icon size={27} strokeWidth={1.9} />
              </div>

              <div className="reports-stat-content">
                <strong>
                  {loading ? "..." : summary[stat.key].toLocaleString()}
                </strong>

                <span>{stat.label}</span>
                <small>{stat.description}</small>
              </div>
            </article>
          );
        })}
      </section>

      {error && (
        <div className="reports-api-notice" role="alert">
          <span></span>
          {error}
          <button type="button" onClick={loadSummary}>
            <RefreshCw size={15} /> Reintentar
          </button>
        </div>
      )}

      <section className="reports-panel">
        <div className="reports-section-heading">
          <div>
            <h2>
              <FileBarChart size={23} />
              Categorías de informes
            </h2>

            <p>
              Explora las distintas áreas de informes de Mobility Aids.
            </p>
          </div>

          <span className="reports-section-label">
            04 CATEGORÍAS
          </span>
        </div>

        <div className="reports-category-grid">
          {reportCategories.map((category) => {
            const Icon = category.icon;

            return (
              <article
                className={`reports-category-card reports-category-${category.color}`}
                key={category.id}
              >
                <div className="reports-category-top">
                  <div className="reports-category-icon">
                    <Icon size={25} strokeWidth={1.9} />
                  </div>

                  <span className="reports-category-number">
                    {category.number}
                  </span>
                </div>

                <h3>{category.title}</h3>
                <p>{category.description}</p>

                <div className="reports-category-footer">
                  <span className="reports-category-dot"></span>
                  {category.status}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="reports-generation-panel">
        <div className="reports-generation-heading">
          <div className="reports-generation-icon">
            <FileBarChart size={26} />
          </div>

          <div>
            <h2>Generación de informes</h2>
            <p>
              Prepara y exporta informes resumidos de gestión.
            </p>
          </div>
        </div>

        <div className="reports-generation-content">
          <div className="reports-generation-message">
            <ShieldCheck size={21} />

            <div>
              <strong>Informes centralizados</strong>
              <p>
                Los datos de los informes se obtienen directamente del
                sistema Mobility Aids.
              </p>
            </div>
          </div>

          <div className="reports-export-options">
            <button
              type="button"
              className="reports-export-item"
              onClick={exportExcel}
              disabled={loading || Boolean(error) || Boolean(exporting)}
            >
              <FileSpreadsheet size={22} />

              <div>
                <strong>
                  {exporting === "excel" ? "Generando..." : "Excel"}
                </strong>
                <small>Descargar hoja de cálculo .xlsx</small>
              </div>

              <Download size={17} />
            </button>

            <button
              type="button"
              className="reports-export-item"
              onClick={exportPDF}
              disabled={loading || Boolean(error) || Boolean(exporting)}
            >
              <FileText size={22} />

              <div>
                <strong>
                  {exporting === "pdf" ? "Generando..." : "PDF"}
                </strong>
                <small>Descargar documento PDF</small>
              </div>

              <Download size={17} />
            </button>
          </div>
        </div>

        <div className="reports-api-notice">
          <span></span>
          {loading
            ? "Cargando información de los informes..."
            : error
              ? "No se pudo sincronizar la información de los informes."
              : "La información de los informes se sincronizó correctamente con la API."}
        </div>
      </section>

      <footer className="reports-footer">
        <span>Mobility Aids · Gestión y análisis</span>
        <span>Banco de ayudas técnicas para la movilidad</span>
      </footer>

    </div>
  );
}
