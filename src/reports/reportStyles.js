// src/reports/reportStyles.js
export const REPORT_CSS = `
  :root {
    --text: #111827;
    --muted: #4b5563;
    --border: #d1d5db;
    --gray-light: #f3f4f6;
  }

  * {
    box-sizing: border-box;
  }

  body {
    font-family: Arial, sans-serif;
    color: var(--text);
    margin: 0;
    padding: 20px;
    background: #f5f5f5;
  }

  /* ==================== ENCABEZADO ==================== */
  header.report-header {
    background: white;
    padding: 30px;
    margin-bottom: 30px;
    border-bottom: 1px solid var(--border);
  }

  .brand {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .brand > div:first-child {
    flex: 1;
  }

  .brand .title {
    font-size: 24px;
    font-weight: bold;
    color: var(--text);
    margin: 0 0 4px 0;
  }

  .brand .subtitle {
    font-size: 12px;
    color: var(--muted);
    margin: 0;
  }

  .brand .meta {
    text-align: right;
    font-size: 11px;
    color: var(--muted);
    line-height: 1.8;
  }

  .brand .meta div {
    margin: 0;
  }

  /* ==================== CONTENIDO PRINCIPAL ==================== */
  main.report-body {
    background: white;
    padding: 30px;
  }

  /* RESUMEN EJECUTIVO */
  .summary-section {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  .summary-section h2 {
    font-size: 14px;
    font-weight: bold;
    color: var(--text);
    margin: 0 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid var(--gray-light);
    padding-bottom: 10px;
  }

  .summary-item .label {
    font-size: 11px;
    color: var(--muted);
    font-weight: normal;
  }

  .summary-item .value {
    font-size: 13px;
    font-weight: bold;
    color: var(--text);
  }

  /* SECCIONES */
  h2 {
    font-size: 13px;
    font-weight: bold;
    color: var(--text);
    margin: 25px 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11px;
    font-weight: bold;
    color: var(--text);
    margin: 15px 0 10px 0;
    page-break-after: avoid;
  }

  h4 {
    font-size: 10px;
    font-weight: bold;
    color: var(--muted);
    margin: 12px 0 8px 0;
    page-break-after: avoid;
  }

  /* INFORMACIÓN BÁSICA */
  .info-block {
    font-size: 10px;
    color: var(--muted);
    margin: 8px 0;
    line-height: 1.6;
  }

  .info-block b {
    color: var(--text);
  }

  /* TABLAS */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10px;
  }

  table thead {
    background: var(--gray-light);
  }

  th {
    padding: 8px;
    text-align: left;
    font-weight: bold;
    color: var(--text);
    border: 1px solid var(--border);
  }

  td {
    padding: 8px;
    border: 1px solid var(--border);
    color: var(--text);
  }

  tr:nth-child(even) {
    background: #fafafa;
  }

  /* ETIQUETAS */
  .pill {
    display: inline-block;
    font-size: 9px;
    color: var(--text);
    margin-left: 8px;
  }

  /* SEPARADORES */
  hr {
    margin: 20px 0;
    border: none;
    border-top: 1px solid var(--border);
    page-break-after: avoid;
  }

  /* PÁRRAFOS */
  p {
    margin: 6px 0;
    font-size: 10px;
    line-height: 1.6;
    color: var(--muted);
  }

  .muted {
    color: var(--muted);
  }

  .small {
    font-size: 9px;
  }

  /* INDENTACIÓN */
  .indent-1 {
    margin-left: 15px;
  }

  .indent-2 {
    margin-left: 30px;
  }

  /* PIE DE PÁGINA */
  footer.report-footer {
    background: white;
    border-top: 1px solid var(--border);
    padding: 20px 30px;
    margin-top: 30px;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--muted);
  }

  /* ==================== IMPRESIÓN / PDF ==================== */
  @media print {
    * {
      margin: 0;
      padding: 0;
    }

    body {
      background: white;
      padding: 0;
      margin: 0;
    }

    @page {
      size: A4 landscape;
      margin: 0;
    }

    /* Header fijo */
    header.report-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      padding: 20mm;
      margin: 0;
      background: white;
      border-bottom: 1px solid var(--border);
      z-index: 1000;
    }

    /* Footer fijo */
    footer.report-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      padding: 15mm 20mm;
      margin: 0;
      background: white;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      z-index: 1000;
    }

    /* Contenido con márgenes */
    main.report-body {
      margin: 0;
      padding: 22mm 20mm 25mm 20mm;
      background: white;
    }

    /* Estilos de impresión */
    h1 {
      display: none;
    }

    h2 {
      margin: 15px 0 10px 0;
      font-size: 12px;
      page-break-after: avoid;
    }

    h3 {
      margin: 12px 0 8px 0;
      font-size: 10px;
      page-break-after: avoid;
    }

    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    table {
      page-break-inside: auto;
      margin: 10px 0;
      font-size: 9px;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th, td {
      padding: 6px;
      border: 1px solid var(--border);
    }

    hr {
      margin: 15px 0;
      page-break-after: avoid;
    }

    p {
      font-size: 9px;
      margin: 4px 0;
    }

    .pill {
      font-size: 8px;
    }

    .no-print {
      display: none;
    }
  }
`;


