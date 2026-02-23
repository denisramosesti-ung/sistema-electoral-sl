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

  const votosConfirmadosTotales =
    coordinadores.length +
    subcoordinadores.filter((s) => s.voto_confirmado).length +
    votantes.filter((v) => v.voto_confirmado).length;

  const summaryData = [
    ["Total Coordinadores", coordinadores.length.toString()],
    ["Total Subcoordinadores", subcoordinadores.length.toString()],
    ["Total Votantes", votantes.length.toString()],
    ["Votos Confirmados (Total)", votosConfirmadosTotales.toString()],
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
    const votosIndirectos = subs.flatMap((s) => votosPorAsignador.get(String(s.ci)) || []);
    const totalVotantesCoord = votosDirectos.length + votosIndirectos.length;
    const confirmadosCoord = [...votosDirectos, ...votosIndirectos].filter((v) => v.voto_confirmado === true).length;
    const pendientesCoord = totalVotantesCoord - confirmadosCoord;
    const porcentajeCoord = totalVotantesCoord > 0 ? Math.round((confirmadosCoord / totalVotantesCoord) * 100) : 0;

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

    // Resumen de votantes del coordinador
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen de Votantes", MARGINS.left, currentY + 12);

    const coordSummaryData = [
      ["Total", totalVotantesCoord.toString()],
      ["Confirmados", confirmadosCoord.toString()],
      ["Pendientes", pendientesCoord.toString()],
      [`% Confirmado`, `${porcentajeCoord}%`],
    ];

    autoTable(doc, {
      startY: currentY + 15,
      head: [["Métrica", "Valor"]],
      body: coordSummaryData,
      margin: { ...MARGINS },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30, halign: "right" },
      },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      bodyStyles: { textColor: [0, 0, 0] },
      didDrawPage: () => {
        addFooter(doc, pageWidth, pageHeight);
      },
    });

    // Tabla única de votantes
    currentY = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Listado de Votantes", MARGINS.left, currentY);

    const allVotantes = [...votosDirectos];
    votosIndirectos.forEach((v) => allVotantes.push(v));

    if (allVotantes.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("No registra votantes", MARGINS.left, currentY + 6);
    } else {
      const votantesTableData = allVotantes.map((v) => [
        v.nombre + " " + v.apellido,
        v.ci,
        v.telefono || "—",
        v.voto_confirmado ? "Confirmado" : "Pendiente",
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Votante", "CI", "Teléfono", "Estado"]],
        body: votantesTableData,
        margin: { ...MARGINS },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
          3: { cellWidth: 30, halign: "center" },
        },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
        bodyStyles: { textColor: [0, 0, 0] },
        cellStyles: {
          3: { halign: "center" }, // Estado centrado
        },
        didDrawPage: () => {
          addFooter(doc, pageWidth, pageHeight);
        },
        willDrawCell: (data) => {
          // Colorear columna Estado (índice 3)
          if (data.column.index === 3) {
            if (data.cell.text[0] === "Confirmado") {
              data.cell.styles.textColor = [34, 139, 34]; // Verde sobrio
              data.cell.styles.fontStyle = "bold";
            } else if (data.cell.text[0] === "Pendiente") {
              data.cell.styles.textColor = [128, 128, 128]; // Gris
            }
          }
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

  // Filtrar votantes pertenecientes a esta red coordinador
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
  
  // Confirmados totales: 1 coordinador (automático) + subs confirmados + votantes confirmados
  const votantesConfirmados = votantes.filter((v) => String(v.coordinador_ci) === String(currentUser.ci) && v.voto_confirmado === true).length;
  const subsConfirmados = misSubs.filter((s) => s.voto_confirmado === true).length;
  const confirmadosTotales = 1 + subsConfirmados + votantesConfirmados;
  
  const totalConCoord = totalVotantes + misSubs.length + 1;
  const pendientes = totalConCoord - confirmadosTotales;
  const porcentajeConfirmado = totalConCoord > 0 ? Math.round((confirmadosTotales / totalConCoord) * 100) : 0;

  // ==================== ENCABEZADO ====================
  addHeader(doc, "Reporte de Mi Red", usuario, currentUser.ci, fechaGeneracion);

  // ==================== RESUMEN EJECUTIVO ====================
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen Ejecutivo", MARGINS.left, 45);

  const summaryData = [
    ["Total en Red (incluye Coord + Subs)", totalConCoord.toString()],
    ["Votos Confirmados (Total)", confirmadosTotales.toString()],
    ["Pendientes", pendientes.toString()],
    [`Porcentaje Confirmado`, `${porcentajeConfirmado}%`],
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

  // ==================== TABLA ÚNICA DE VOTANTES ====================
  let currentY = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Listado de Votantes de Mi Red", MARGINS.left, currentY);

  if (totalVotantes === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("No registra votantes en su red", MARGINS.left, currentY + 6);
  } else {
    // Combinar votantes directos e indirectos en una tabla única
    const allVotantes = [...votosDirectos];
    for (const arr of votosPorSub.values()) {
      allVotantes.push(...arr);
    }

    const votantesTableData = allVotantes.map((v) => [
      v.nombre + " " + v.apellido,
      v.ci,
      v.telefono || "—",
      v.voto_confirmado ? "Confirmado" : "Pendiente",
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Votante", "CI", "Teléfono", "Estado"]],
      body: votantesTableData,
      margin: { ...MARGINS },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30, halign: "center" },
      },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      bodyStyles: { textColor: [0, 0, 0] },
      cellStyles: {
        3: { halign: "center" }, // Estado centrado
      },
      didDrawPage: () => {
        addFooter(doc, pageWidth, pageHeight);
      },
      willDrawCell: (data) => {
        // Colorear columna Estado (índice 3)
        if (data.column.index === 3) {
          if (data.cell.text[0] === "Confirmado") {
            data.cell.styles.textColor = [34, 139, 34]; // Verde sobrio
            data.cell.styles.fontStyle = "bold";
          } else if (data.cell.text[0] === "Pendiente") {
            data.cell.styles.textColor = [128, 128, 128]; // Gris
          }
        }
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

  const { votantes = [], subcoordinadores = [] } = estructura;
  const fechaGeneracion = new Date().toLocaleString("es-PY");
  const usuario = `${currentUser.nombre} ${currentUser.apellido}`;

  // Filtrar votantes asignados a este subcoordinador
  const misVotantes = votantes.filter(
    (v) => String(v.asignado_por) === String(currentUser.ci)
  );

  const votantesConfirmados = misVotantes.filter((v) => v.voto_confirmado === true).length;
  
  // Confirmados totales: si el sub tiene voto_confirmado + votantes confirmados
  const subData = subcoordinadores.find((s) => String(s.ci) === String(currentUser.ci));
  const subConfirmado = subData?.voto_confirmado === true ? 1 : 0;
  const confirmadosTotales = subConfirmado + votantesConfirmados;
  
  const totalConSub = misVotantes.length + 1; // incluye al subcoordinador
  const pendientes = totalConSub - confirmadosTotales;
  const porcentajeConfirmado = totalConSub > 0 ? Math.round((confirmadosTotales / totalConSub) * 100) : 0;

  // ==================== ENCABEZADO ====================
  addHeader(doc, "Reporte de Mis Votantes", usuario, currentUser.ci, fechaGeneracion);

  // ==================== RESUMEN EJECUTIVO ====================
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen Ejecutivo", MARGINS.left, 45);

  const summaryData = [
    ["Total en Red (incluye Sub)", totalConSub.toString()],
    ["Votos Confirmados (Total)", confirmadosTotales.toString()],
    ["Pendientes", pendientes.toString()],
    [`Porcentaje Confirmado`, `${porcentajeConfirmado}%`],
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

  // ==================== TABLA DE VOTANTES ====================
  let currentY = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Listado de Votantes", MARGINS.left, currentY);

  if (misVotantes.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("No tiene votantes asignados", MARGINS.left, currentY + 6);
  } else {
    const votantesTableData = misVotantes.map((v) => [
      v.nombre + " " + v.apellido,
      v.ci,
      v.telefono || "—",
      v.voto_confirmado ? "Confirmado" : "Pendiente",
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Votante", "CI", "Teléfono", "Estado"]],
      body: votantesTableData,
      margin: { ...MARGINS },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30, halign: "center" },
      },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      bodyStyles: { textColor: [0, 0, 0] },
      cellStyles: {
        3: { halign: "center" }, // Estado centrado
      },
      didDrawPage: () => {
        addFooter(doc, pageWidth, pageHeight);
      },
      willDrawCell: (data) => {
        // Colorear columna Estado (índice 3)
        if (data.column.index === 3) {
          if (data.cell.text[0] === "Confirmado") {
            data.cell.styles.textColor = [34, 139, 34]; // Verde sobrio
            data.cell.styles.fontStyle = "bold";
          } else if (data.cell.text[0] === "Pendiente") {
            data.cell.styles.textColor = [128, 128, 128]; // Gris
          }
        }
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
