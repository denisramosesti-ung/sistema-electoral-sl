import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ======================= CONSTANTS =======================
const PAGE_FORMAT = "a4";
const PAGE_ORIENTATION = "landscape";
const M = { top: 18, bottom: 18, left: 14, right: 14 };

// Brand colors
const COLOR_PRIMARY   = [180, 20, 20];   // deep red
const COLOR_PRIMARY_LIGHT = [254, 226, 226]; // light red bg
const COLOR_HEADER_TEXT = [255, 255, 255];
const COLOR_ALT_ROW   = [248, 250, 252]; // slate-50
const COLOR_TEXT      = [15, 23, 42];    // slate-900
const COLOR_MUTED     = [100, 116, 139]; // slate-500
const COLOR_CONFIRMED = [209, 250, 229]; // emerald-100
const COLOR_CONFIRMED_TEXT = [6, 78, 59]; // emerald-900
const COLOR_PENDING   = [254, 243, 199]; // amber-100
const COLOR_PENDING_TEXT = [120, 53, 15]; // amber-900
const COLOR_LINE      = [226, 232, 240]; // slate-200

// ======================= HEADER =======================
function addHeader(doc, title, usuario, ci, fecha, subtitle = null) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top accent bar
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, pageWidth, 12, "F");

  // Title area
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_TEXT);
  doc.text("Sistema Electoral SL", M.left, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_MUTED);
  doc.text(title, M.left, 29);

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, M.left, 35);
  }

  // Right info block
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_MUTED);
  const rightX = pageWidth - M.right;
  doc.text(`Usuario: ${usuario}`, rightX, 22, { align: "right" });
  doc.text(`CI: ${ci}`, rightX, 27, { align: "right" });
  doc.text(`Generado: ${fecha}`, rightX, 32, { align: "right" });

  // Divider line
  doc.setDrawColor(...COLOR_LINE);
  doc.setLineWidth(0.4);
  doc.line(M.left, 38, pageWidth - M.right, 38);
}

// ======================= FOOTER =======================
function addFooter(doc, pageWidth, pageHeight) {
  const pageCount = doc.internal.pages.length - 1;
  const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

  doc.setDrawColor(...COLOR_LINE);
  doc.setLineWidth(0.3);
  doc.line(M.left, pageHeight - M.bottom + 1, pageWidth - M.right, pageHeight - M.bottom + 1);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_MUTED);
  doc.text("Documento confidencial — Sistema Electoral SL", M.left, pageHeight - M.bottom + 6);
  doc.text(
    `Página ${currentPage} / ${pageCount}`,
    pageWidth - M.right,
    pageHeight - M.bottom + 6,
    { align: "right" }
  );
}

// ======================= SUMMARY TABLE =======================
function addSummaryTable(doc, startY, rows) {
  autoTable(doc, {
    startY,
    head: [["Métrica", "Valor"]],
    body: rows,
    margin: { ...M },
    tableWidth: 100,
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "normal", textColor: COLOR_TEXT },
      1: { cellWidth: 30, fontStyle: "bold", halign: "right", textColor: COLOR_TEXT },
    },
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: COLOR_HEADER_TEXT,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: COLOR_ALT_ROW },
    didDrawPage: ({ doc: d }) => {
      const pw = d.internal.pageSize.getWidth();
      const ph = d.internal.pageSize.getHeight();
      addFooter(d, pw, ph);
    },
  });
}

// ======================= VOTERS TABLE =======================
function addVotersTable(doc, startY, votersData, columns) {
  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body: votersData,
    margin: { ...M },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [
        i,
        {
          cellWidth: c.width,
          overflow: "linebreak",
          halign: c.align || "left",
          fontStyle: "normal",
        },
      ])
    ),
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: COLOR_HEADER_TEXT,
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLOR_TEXT,
      cellPadding: 2.5,
      lineColor: COLOR_LINE,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: COLOR_ALT_ROW },
    didParseCell: (data) => {
      const stateIdx = columns.findIndex((c) => c.isState);
      if (data.column.index === stateIdx && data.section === "body") {
        const txt = data.cell.text[0];
        if (txt === "Confirmado") {
          data.cell.fillColor = COLOR_CONFIRMED;
          data.cell.textColor = COLOR_CONFIRMED_TEXT;
          data.cell.fontStyle = "bold";
        } else if (txt === "Pendiente") {
          data.cell.fillColor = COLOR_PENDING;
          data.cell.textColor = COLOR_PENDING_TEXT;
        }
      }
    },
    didDrawPage: ({ doc: d }) => {
      const pw = d.internal.pageSize.getWidth();
      const ph = d.internal.pageSize.getHeight();
      addFooter(d, pw, ph);
    },
  });
}

// ======================= SECTION TITLE =======================
function sectionTitle(doc, text, y) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_TEXT);
  doc.text(text, M.left, y);
}

// ======================= SUPERADMIN PDF =======================
export const generateSuperadminPDF = ({ estructura, currentUser }) => {
  const doc = new jsPDF(PAGE_ORIENTATION, "mm", PAGE_FORMAT);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const { coordinadores = [], subcoordinadores = [], votantes = [] } = estructura;
  const fechaGeneracion = new Date().toLocaleString("es-PY");
  const usuario = `${currentUser.nombre} ${currentUser.apellido}`;

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

  const totalConfirmados = votantes.filter((v) => v.voto_confirmado).length;
  const pctConfirmados = votantes.length > 0
    ? Math.round((totalConfirmados / votantes.length) * 100)
    : 0;

  // ---- PAGE 1: Summary ----
  addHeader(doc, "Reporte General", usuario, currentUser.ci, fechaGeneracion, "Vista Superadmin");

  sectionTitle(doc, "Resumen Ejecutivo", 47);

  addSummaryTable(doc, 52, [
    ["Total Coordinadores", coordinadores.length.toString()],
    ["Total Subcoordinadores", subcoordinadores.length.toString()],
    ["Total Votantes", votantes.length.toString()],
    ["Votos Confirmados", totalConfirmados.toString()],
    ["Votos Pendientes", (votantes.length - totalConfirmados).toString()],
    ["Porcentaje Confirmado", `${pctConfirmados}%`],
  ]);

  // ---- Per-coordinator pages ----
  coordinadores.forEach((coord, idx) => {
    const subs = subsPorCoord.get(String(coord.ci)) || [];
    const votosDirectos = getVotantesDirectosDelCoord(coord.ci);
    const votosIndirectos = subs.flatMap((s) => votosPorAsignador.get(String(s.ci)) || []);
    const allVotantes = [...votosDirectos, ...votosIndirectos];
    const totalCoord = allVotantes.length;
    const confirmadosCoord = allVotantes.filter((v) => v.voto_confirmado).length;
    const pctCoord = totalCoord > 0 ? Math.round((confirmadosCoord / totalCoord) * 100) : 0;

    doc.addPage();
    addHeader(
      doc,
      "Reporte General",
      usuario,
      currentUser.ci,
      fechaGeneracion,
      `Coordinador: ${coord.nombre || ""} ${coord.apellido || ""} — CI: ${coord.ci}`
    );

    let y = 47;

    sectionTitle(doc, "Resumen del Coordinador", y);
    y += 5;

    addSummaryTable(doc, y, [
      ["Subcoordinadores", subs.length.toString()],
      ["Total Votantes", totalCoord.toString()],
      ["Confirmados", confirmadosCoord.toString()],
      ["Pendientes", (totalCoord - confirmadosCoord).toString()],
      ["Porcentaje Confirmado", `${pctCoord}%`],
    ]);

    const afterSummary = doc.lastAutoTable.finalY + 7;
    sectionTitle(doc, "Listado de Votantes", afterSummary);

    if (allVotantes.length === 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...COLOR_MUTED);
      doc.text("No registra votantes.", M.left, afterSummary + 7);
    } else {
      addVotersTable(doc, afterSummary + 5, allVotantes.map((v) => [
        `${v.nombre || ""} ${v.apellido || ""}`,
        v.ci || "—",
        v.telefono || "—",
        v.voto_confirmado ? "Confirmado" : "Pendiente",
      ]), [
        { header: "Nombre y Apellido", width: 65 },
        { header: "CI", width: 30 },
        { header: "Teléfono", width: 40 },
        { header: "Estado", width: 28, align: "center", isState: true },
      ]);
    }
  });

  return doc;
};

// ======================= COORDINADOR PDF =======================
export const generateCoordinadorPDF = ({ estructura, currentUser }) => {
  const doc = new jsPDF(PAGE_ORIENTATION, "mm", PAGE_FORMAT);
  const { subcoordinadores = [], votantes = [] } = estructura;
  const fechaGeneracion = new Date().toLocaleString("es-PY");
  const usuario = `${currentUser.nombre} ${currentUser.apellido}`;

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

  const totalVotantes = votosDirectos.length + totalIndirectos;
  const confirmados = votantes.filter(
    (v) => String(v.coordinador_ci) === String(currentUser.ci) && v.voto_confirmado === true
  ).length;
  const pendientes = totalVotantes - confirmados;
  const porcentaje = totalVotantes > 0 ? Math.round((confirmados / totalVotantes) * 100) : 0;

  addHeader(doc, "Reporte de Mi Red", usuario, currentUser.ci, fechaGeneracion, "Vista Coordinador");

  sectionTitle(doc, "Resumen Ejecutivo", 47);
  addSummaryTable(doc, 52, [
    ["Subcoordinadores en mi red", misSubs.length.toString()],
    ["Votantes directos", votosDirectos.length.toString()],
    ["Votantes indirectos (vía sub)", totalIndirectos.toString()],
    ["Total Votantes", totalVotantes.toString()],
    ["Votos Confirmados", confirmados.toString()],
    ["Votos Pendientes", pendientes.toString()],
    ["Porcentaje Confirmado", `${porcentaje}%`],
  ]);

  const afterSummary = doc.lastAutoTable.finalY + 7;
  sectionTitle(doc, "Listado Completo de Votantes", afterSummary);

  const allVotantes = [...votosDirectos];
  for (const arr of votosPorSub.values()) allVotantes.push(...arr);

  if (allVotantes.length === 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLOR_MUTED);
    doc.text("No registra votantes en su red.", M.left, afterSummary + 7);
  } else {
    addVotersTable(doc, afterSummary + 5, allVotantes.map((v) => [
      `${v.nombre || ""} ${v.apellido || ""}`,
      v.ci || "—",
      v.seccional || "—",
      v.local_votacion || "—",
      v.mesa || "—",
      v.orden || "—",
      v.direccion_override || v.direccion || "—",
      v.voto_confirmado ? "Confirmado" : "Pendiente",
    ]), [
      { header: "Nombre y Apellido", width: 40 },
      { header: "CI", width: 20 },
      { header: "Seccional", width: 18 },
      { header: "Local", width: 18 },
      { header: "Mesa", width: 14, align: "center" },
      { header: "Orden", width: 14, align: "center" },
      { header: "Dirección", width: 45 },
      { header: "Estado", width: 22, align: "center", isState: true },
    ]);
  }

  return doc;
};

// ======================= SUBCOORDINADOR PDF =======================
export const generateSubcoordinadorPDF = ({ estructura, currentUser }) => {
  const doc = new jsPDF(PAGE_ORIENTATION, "mm", PAGE_FORMAT);
  const { votantes = [] } = estructura;
  const fechaGeneracion = new Date().toLocaleString("es-PY");
  const usuario = `${currentUser.nombre} ${currentUser.apellido}`;

  const misVotantes = votantes.filter(
    (v) => String(v.asignado_por) === String(currentUser.ci)
  );
  const confirmados = misVotantes.filter((v) => v.voto_confirmado === true).length;
  const pendientes = misVotantes.length - confirmados;
  const porcentaje = misVotantes.length > 0
    ? Math.round((confirmados / misVotantes.length) * 100)
    : 0;

  addHeader(doc, "Reporte de Mis Votantes", usuario, currentUser.ci, fechaGeneracion, "Vista Sub-coordinador");

  sectionTitle(doc, "Resumen Ejecutivo", 47);
  addSummaryTable(doc, 52, [
    ["Total Votantes Asignados", misVotantes.length.toString()],
    ["Votos Confirmados", confirmados.toString()],
    ["Votos Pendientes", pendientes.toString()],
    ["Porcentaje Confirmado", `${porcentaje}%`],
  ]);

  const afterSummary = doc.lastAutoTable.finalY + 7;
  sectionTitle(doc, "Listado de Mis Votantes", afterSummary);

  if (misVotantes.length === 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLOR_MUTED);
    doc.text("No tiene votantes asignados.", M.left, afterSummary + 7);
  } else {
    addVotersTable(doc, afterSummary + 5, misVotantes.map((v) => [
      `${v.nombre || ""} ${v.apellido || ""}`,
      v.ci || "—",
      v.seccional || "—",
      v.local_votacion || "—",
      v.mesa || "—",
      v.orden || "—",
      v.direccion_override || v.direccion || "—",
      v.voto_confirmado ? "Confirmado" : "Pendiente",
    ]), [
      { header: "Nombre y Apellido", width: 40 },
      { header: "CI", width: 20 },
      { header: "Seccional", width: 18 },
      { header: "Local", width: 18 },
      { header: "Mesa", width: 14, align: "center" },
      { header: "Orden", width: 14, align: "center" },
      { header: "Dirección", width: 45 },
      { header: "Estado", width: 22, align: "center", isState: true },
    ]);
  }

  return doc;
};
