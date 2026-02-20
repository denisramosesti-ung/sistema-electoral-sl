// src/reports/reportStyles.js
export const REPORT_CSS = `
  :root{
    --red:#b91c1c;
    --red-soft:#fee2e2;
    --text:#111827;
    --muted:#6b7280;
    --border:#e5e7eb;
  }

  @page { margin: 16mm 12mm; }
  * { box-sizing: border-box; }

  body{
    font-family: Arial, sans-serif;
    color: var(--text);
    padding: 0;
    margin: 0;
  }

  /* Header / Footer impresión */
  header.report-header{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 10mm 12mm 6mm 12mm;
    border-bottom: 2px solid var(--red);
    background: #fff;
  }

  footer.report-footer{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 6mm 12mm 10mm 12mm;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 11px;
    display:flex;
    justify-content: space-between;
    background: #fff;
  }

  /* Área real del reporte (evitar solapar header/footer) */
  main.report-body{
    padding: 32mm 12mm 22mm 12mm; /* deja espacio para header/footer */
  }

  .brand{
    display:flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .brand .title{
    font-size: 22px;
    font-weight: 800;
    color: var(--red);
    margin: 0;
  }
  .brand .meta{
    text-align:right;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.4;
  }

  h2{
    margin: 18px 0 8px 0;
    color: var(--red);
    font-size: 16px;
  }
  h3{
    margin: 14px 0 8px 0;
    font-size: 13px;
    color: #1f2937;
  }

  .grid-2{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
  }

  .card{
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px;
    background: #fff;
  }
  .card .label{
    color: var(--muted);
    font-size: 12px;
  }
  .card .value{
    font-size: 22px;
    font-weight: 800;
    color: var(--red);
    margin-top: 4px;
  }

  .pill{
    display:inline-block;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--red-soft);
    color: var(--red);
    font-size: 11px;
    font-weight: 700;
  }

  table{
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }
  th, td{
    border: 1px solid var(--border);
    padding: 8px;
    font-size: 12px;
    text-align: left;
    vertical-align: top;
  }
  th{
    background: var(--red-soft);
    font-weight: 700;
  }

  .muted{ color: var(--muted); }
  .small{ font-size: 11px; }

  .indent-1{ margin-left: 14px; }
  .indent-2{ margin-left: 28px; }
  .indent-3{ margin-left: 42px; }

  .page-break{
    page-break-after: always;
  }

  /* Evita que títulos queden al final de una página */
  h2, h3, table { break-inside: avoid; }
`;
