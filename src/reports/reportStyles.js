// src/reports/reportStyles.js
export const REPORT_CSS = `
  :root {
    --red: #b91c1c;
    --red-soft: #fee2e2;
    --text: #111827;
    --muted: #6b7280;
    --border: #e5e7eb;
  }

  /* ==================== PANTALLA NORMAL ==================== */
  * {
    box-sizing: border-box;
  }

  body {
    font-family: Arial, sans-serif;
    color: var(--text);
    background: #f3f4f6;
    margin: 0;
    padding: 20px;
  }

  header.report-header {
    background: white;
    border-bottom: 2px solid var(--red);
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 4px;
  }

  .brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .brand .title {
    font-size: 22px;
    font-weight: 800;
    color: var(--red);
    margin: 0;
  }

  .brand .subtitle {
    font-size: 12px;
    color: var(--muted);
    margin: 4px 0 0 0;
  }

  .brand .meta {
    text-align: right;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
  }

  .brand .meta div {
    margin: 2px 0;
  }

  main.report-body {
    background: white;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin: 20px 0 10px 0;
    color: var(--red);
    font-size: 16px;
    border-bottom: 1px solid var(--red-soft);
    padding-bottom: 6px;
  }

  h3 {
    margin: 14px 0 8px 0;
    font-size: 13px;
    color: #1f2937;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 10px 0;
  }

  .card {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 10px;
    background: #f9fafb;
  }

  .card .label {
    color: var(--muted);
    font-size: 12px;
  }

  .card .value {
    font-size: 22px;
    font-weight: 800;
    color: var(--red);
    margin-top: 4px;
  }

  .pill {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--red-soft);
    color: var(--red);
    font-size: 11px;
    font-weight: 700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
  }

  th, td {
    border: 1px solid var(--border);
    padding: 8px;
    font-size: 12px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: var(--red-soft);
    font-weight: 700;
    color: var(--red);
  }

  hr {
    margin: 16px 0;
    border: none;
    border-top: 1px solid var(--border);
  }

  .muted {
    color: var(--muted);
  }

  .small {
    font-size: 11px;
  }

  p {
    margin: 6px 0;
    line-height: 1.5;
  }

  footer.report-footer {
    background: white;
    border-top: 1px solid var(--border);
    padding: 15px 20px;
    margin-top: 20px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
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

    /* Header fijo en cada página */
    header.report-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      margin: 0;
      padding: 15mm 20mm;
      background: white;
      border-bottom: 2px solid var(--red);
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .brand {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand .title {
      font-size: 20px;
    }

    .brand .meta {
      font-size: 10px;
      line-height: 1.4;
    }

    /* Footer fijo en cada página */
    footer.report-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      margin: 0;
      padding: 12mm 20mm;
      background: white;
      border-top: 1px solid var(--border);
      font-size: 9px;
      display: flex;
      justify-content: space-between;
      z-index: 1000;
    }

    /* Contenido principal con márgenes para header y footer */
    main.report-body {
      margin: 0;
      padding: 25mm 20mm 20mm 20mm;
      background: white;
      box-shadow: none;
      border-radius: 0;
    }

    /* Configuración de página */
    @page {
      size: A4 landscape;
      margin: 0;
    }

    /* Títulos sin duplicar */
    h1 {
      display: none;
    }

    h2 {
      margin: 12px 0 8px 0;
      font-size: 14px;
      page-break-after: avoid;
    }

    h3 {
      margin: 10px 0 6px 0;
      font-size: 11px;
      page-break-after: avoid;
    }

    .grid-2 {
      margin: 8px 0;
      gap: 8px;
    }

    .card {
      padding: 8px;
      font-size: 11px;
    }

    .card .value {
      font-size: 18px;
    }

    /* Tablas con paginación natural */
    table {
      page-break-inside: auto;
      margin: 6px 0;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th, td {
      padding: 6px;
      font-size: 10px;
      border: 1px solid var(--border);
    }

    th {
      background: var(--red-soft);
      font-weight: 700;
    }

    hr {
      margin: 12px 0;
      border: none;
      border-top: 1px solid var(--border);
      page-break-after: avoid;
    }

    p {
      margin: 4px 0;
      font-size: 10px;
      line-height: 1.4;
    }

    .pill {
      font-size: 9px;
      padding: 2px 6px;
    }

    .small {
      font-size: 9px;
    }

    /* No imprimir elementos innecesarios */
    .no-print {
      display: none;
    }
  }
`;

