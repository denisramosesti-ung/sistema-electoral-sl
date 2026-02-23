import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PAGE_FORMAT = "a4";
const PAGE_ORIENTATION = "landscape";
const MARGINS = { top: 15, bottom: 15, left: 15, right: 15 };
const LINE_HEIGHT = 7;

/**
 * Genera un PDF profesional para Superadmin
 */
export const generateSuperadminPDF = ({ estructura, currentUser }) => {
  const doc = new jsPDF(PAGE_ORIENTATION, "mm", PAGE_FORMAT);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const { coordinadores = [], subcoordinadores = [], votantes = [] } = estructura;
  const fechaGeneracion = new Date().toLocaleString("es-PY");
  const usuario = `${currentUser.nombre} ${currentUser.apellido}`;

  // Mapas para relaciones
  const subsPorCoord = new Map();
  for (const s of subcoordinadores) {
    const k = String(s.coordinador_ci || "");
    if (!subsPorCoord.has(k)) subsPorCoord.set(k, []);
    subsPorCoord.get(k).push(s);
  }

  const votosPorAsignador = new Map();
  for (const v of votantes) {
    const k = String(v.asignado_por || "");
    if (!votosPorAsignador.has(k)) votosPorAsignador.set(k, []);
    votosPorAsignador.get(k).push(v);
  }

  const getVotantesDirectosDelCoord = (coordCI) => {
    const subs = subsPorCoord.get(String(coordCI)) || [];
    const setSubs = new Set(subs.map((x) => String(x.ci)));
    return votantes.filter(
      (v) =>
        String(v.coordinador_ci) === String(coordCI) &&
        !setSubs.has(String(v.asignado_por))
    );
  };

  // ==================== PÁGINA 1: ENCABEZADO + RESUMEN ====================
  addHeader(doc, "Reporte General – Superadmin", usuario, currentUser.ci, fechaGeneracion);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen Ejecutivo", MARGINS.left, 45);

  const summaryData = [
    ["Total Coordinadores", coordinadores.length.toString()],
    ["Total Subcoordinadores", subcoordinadores.length.toString()],
    ["Total Votantes", votantes.length.toString()],
    ["Votos Confirmados", votantes.filter((v) => v.voto_confirmado).length.toString()],
  ];

  autoTable(doc, {
    startY: 50,
    head: [["Métrica", "Valor"]],
    body: summaryData,
    margin: { ...MARGINS },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "normal" },
      1: { cellWidth: 30, fontStyle: "bold", halign: "right" },
    },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    bodyStyles: { textColor: [0, 0, 0] },
    didDrawPage: () => {
      addFooter(doc, pageWidth, pageHeight);
    },
  });

  // ==================== COORDINADORES ====================
  coordinadores.forEach((coord, idx) => {
    const subs = subsPorCoord.get(String(coord.ci)) || [];
    const votosDirectos = getVotantesDirectosDelCoord(coord.ci);

    // Nueva página si necesario
    if (idx > 0) {
      doc.addPage();
      addHeader(doc, "Reporte General – Superadmin", usuario, currentUser.ci, fechaGeneracion);
    }

    // Título coordinador
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const coordTitle = `Coordinador: ${coord.nombre} ${coord.apellido}`;
    let currentY = idx === 0 ? 95 : 45;
    doc.text(coordTitle, MARGINS.left, currentY);

    // Info coordinador
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`CI: ${coord.ci}${coord.telefono ? ` • Teléfono: ${coord.telefono}` : ""}`, MARGINS.left, currentY + 5);

    // Tabla subcoordinadores
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Subcoordinadores", MARGINS.left, currentY + 12);

    const subsTableData = subs.map((s) => {
      const votesCount = (votosPorAsignador.get(String(s.ci)) || []).length;
      return [s.nombre + " " + s.apellido, s.ci, votesCount.toString()];
    });

    if (subsTableData.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("No registra subcoordinadores", MARGINS.left, currentY + 18);
      currentY += 8;
    } else {
      autoTable(doc, {
        startY: currentY + 15,
        head: [["Subcoordinador", "CI", "Votantes"]],
        body: subsTableData,
        margin: { ...MARGINS },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30, halign: "right" },
        },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        bodyStyles: { textColor: [0, 0, 0] },
        didDrawPage: () => {
          addFooter(doc, pageWidth, pageHeight);
        },
      });
      currentY = doc.lastAutoTable.finalY + 5;
    }

    // Tabla votantes directos
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Votantes Directos", MARGINS.left, currentY + 8);

    const votantesTableData = votosDirectos.map((v) => [
      v.nombre + " " + v.apellido,
      v.ci,
      v.telefono || "—",
    ]);

    if (votantesTableData.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("No registra votantes directos", MARGINS.left, currentY + 14);
    } else {
      autoTable(doc, {
        startY: currentY + 11,
        head: [["Votante", "CI", "Teléfono"]],
        body: votantesTableData,
        margin: { ...MARGINS },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
        },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        bodyStyles: { textColor: [0, 0, 0] },
        didDrawPage: () => {
          addFooter(doc, pageWidth, pageHeight);
        },
      });
    }
  });

  return doc;
};

/**
 * Genera un PDF profesional para Coordinador
 */
export const generateCoordinadorPDF = ({ estructura, currentUser }) => {
  const doc = new jsPDF(PAGE_ORIENTATION, "mm", PAGE_FORMAT);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const { subcoordinadores = [], votantes = [] } = estructura;
  const fechaGeneracion = new Date().toLocaleString("es-PY");
  const usuario = `${currentUser.nombre} ${currentUser.apellido}`;

  // Mapas para relaciones
  const misSubs = subcoordinadores.filter(
    (s) => String(s.coordinador_ci) === String(currentUser.ci)
  );

  const votosDirectos = votantes.filter(
    (v) => String(v.asignado_por) === String(currentUser.ci)
  );

  const votosPorSub = new Map();
  for (const s of misSubs) {
    votosPorSub.set(
      String(s.ci),
      votantes.filter((v) => String(v.asignado_por) === String(s.ci))
    );
  }

  let totalIndirectos = 0;
  for (const arr of votosPorSub.values()) totalIndirectos += arr.length;

  // ==================== ENCABEZADO + RESUMEN ====================
  addHeader(doc, "Reporte de Coordinador", usuario, currentUser.ci, fechaGeneracion);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen de Mi Red", MARGINS.left, 45);

  const summaryData = [
    ["Subcoordinadores", misSubs.length.toString()],
    ["Votantes Directos", votosDirectos.length.toString()],
    ["Votantes Indirectos", totalIndirectos.toString()],
    ["Total en Mi Red", (votosDirectos.length + totalIndirectos).toString()],
  ];

  autoTable(doc, {
    startY: 50,
    head: [["Métrica", "Valor"]],
    body: summaryData,
    margin: { ...MARGINS },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: "right" },
    },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    bodyStyles: { textColor: [0, 0, 0] },
    didDrawPage: () => {
      addFooter(doc, pageWidth, pageHeight);
    },
  });

  // ==================== SUBCOORDINADORES ====================
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Subcoordinadores", MARGINS.left, 95);

  const subsTableData = misSubs.map((s) => {
    const arr = votosPorSub.get(String(s.ci)) || [];
    return [s.nombre + " " + s.apellido, s.ci, s.telefono || "—", arr.length.toString()];
  });

  if (subsTableData.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("No registra subcoordinadores", MARGINS.left, 101);
  } else {
    autoTable(doc, {
      startY: 100,
      head: [["Subcoordinador", "CI", "Teléfono", "Votantes"]],
      body: subsTableData,
      margin: { ...MARGINS },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: "right" },
      },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0] },
      didDrawPage: () => {
        addFooter(doc, pageWidth, pageHeight);
      },
    });
  }

  // ==================== VOTANTES DIRECTOS ====================
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 110;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Votantes Directos", MARGINS.left, currentY);

  const votantesTableData = votosDirectos.map((v) => [
    v.nombre + " " + v.apellido,
    v.ci,
    v.telefono || "—",
  ]);

  if (votantesTableData.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("No registra votantes directos", MARGINS.left, currentY + 6);
  } else {
    autoTable(doc, {
      startY: currentY + 5,
      head: [["Votante", "CI", "Teléfono"]],
      body: votantesTableData,
      margin: { ...MARGINS },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
      },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0] },
      didDrawPage: () => {
        addFooter(doc, pageWidth, pageHeight);
      },
    });
  }

  return doc;
};

/**
 * Genera un PDF profesional para Subcoordinador
 */
export const generateSubcoordinadorPDF = ({ estructura, currentUser }) => {
  const doc = new jsPDF(PAGE_ORIENTATION, "mm", PAGE_FORMAT);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const { votantes = [] } = estructura;
  const fechaGeneracion = new Date().toLocaleString("es-PY");
  const usuario = `${currentUser.nombre} ${currentUser.apellido}`;

  const misVotantes = votantes.filter(
    (v) => String(v.asignado_por) === String(currentUser.ci)
  );

  const votosConfirmados = misVotantes.filter((v) => v.voto_confirmado === true).length;
  const conTelefono = misVotantes.filter((v) => !!v.telefono).length;
  const sinTelefono = misVotantes.length - conTelefono;

  // ==================== ENCABEZADO + RESUMEN ====================
  addHeader(doc, "Reporte de Subcoordinador", usuario, currentUser.ci, fechaGeneracion);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen de Mis Votantes", MARGINS.left, 45);

  const summaryData = [
    ["Total Votantes", misVotantes.length.toString()],
    ["Con Teléfono", conTelefono.toString()],
    ["Sin Teléfono", sinTelefono.toString()],
    ["Votos Confirmados", votosConfirmados.toString()],
  ];

  autoTable(doc, {
    startY: 50,
    head: [["Métrica", "Valor"]],
    body: summaryData,
    margin: { ...MARGINS },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: "right" },
    },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    bodyStyles: { textColor: [0, 0, 0] },
    didDrawPage: () => {
      addFooter(doc, pageWidth, pageHeight);
    },
  });

  // ==================== LISTADO DE VOTANTES ====================
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Listado de Votantes", MARGINS.left, 95);

  const votantesTableData = misVotantes.map((v) => [
    v.nombre + " " + v.apellido,
    v.ci,
    v.telefono || "—",
    v.voto_confirmado ? "Sí" : "No",
  ]);

  if (votantesTableData.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("No tiene votantes asignados", MARGINS.left, 101);
  } else {
    autoTable(doc, {
      startY: 100,
      head: [["Votante", "CI", "Teléfono", "Confirmado"]],
      body: votantesTableData,
      margin: { ...MARGINS },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: "center" },
      },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0] },
      didDrawPage: () => {
        addFooter(doc, pageWidth, pageHeight);
      },
    });
  }

  return doc;
};

/**
 * Añade encabezado profesional al documento
 */
function addHeader(doc, title, usuario, ci, fecha) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Sistema Electoral SL", MARGINS.left, MARGINS.top + 5);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGINS.left, MARGINS.top + 12);

  // Información del lado derecho
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const rightX = pageWidth - MARGINS.right - 60;
  doc.text(`Usuario: ${usuario}`, rightX, MARGINS.top + 5);
  doc.text(`CI: ${ci}`, rightX, MARGINS.top + 11);
  doc.text(`Generado: ${fecha}`, rightX, MARGINS.top + 17);

  // Línea divisoria
  doc.setDrawColor(180, 180, 180);
  doc.line(MARGINS.left, MARGINS.top + 22, pageWidth - MARGINS.right, MARGINS.top + 22);
}

/**
 * Añade pie de página con numeración
 */
function addFooter(doc, pageWidth, pageHeight) {
  const pageCount = doc.internal.pages.length - 1;
  const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(180, 180, 180);
  doc.line(MARGINS.left, pageHeight - MARGINS.bottom - 3, pageWidth - MARGINS.right, pageHeight - MARGINS.bottom - 3);

  const footerY = pageHeight - MARGINS.bottom + 2;
  doc.text("Documento confidencial - Sistema Electoral SL", MARGINS.left, footerY);
  doc.text(`Página ${currentPage} de ${pageCount}`, pageWidth - MARGINS.right - 30, footerY, { align: "right" });
}
