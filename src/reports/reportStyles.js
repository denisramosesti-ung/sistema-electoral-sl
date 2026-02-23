// src/reports/reportStyles.js
export const REPORT_CSS = `
  :root{
    --red:#b91c1c;
    --red-soft:#fee2e2;
    --text:#111827;
    --muted:#6b7280;
    --border:#e5e7eb;
  }

  @page { 
    size: A4 landscape;
    margin: 20mm 15mm;
  }
  
  * { box-sizing: border-box; }

  body{
    font-family: Arial, sans-serif;
    color: var(--text);
    padding: 0;
    margin: 0;
  }

  /* Header profesional */
  header.report-header{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 12mm 15mm 8mm;
    border-bottom: 2px solid var(--red);
    background: #fff;
    z-index: 1000;
  }

  /* Footer con página X de Y */
  footer.report-footer{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8mm 15mm 12mm;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 10px;
    display: flex;
    justify-content: space-between;
    background: #fff;
    z-index: 1000;
  }

  /* Área principal sin solapamiento */
  main.report-body{
    padding: 40mm 15mm 28mm 15mm;
  }

  .brand{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  
  .brand .title{
    font-size: 20px;
    font-weight: 800;
    color: var(--red);
    margin: 0;
    padding: 0;
  }
  
  .brand .meta{
    text-align: right;
    font-size: 11px;
    color: var(--muted);
    line-height: 1.3;
    margin: 0;
  }

  h2{
    margin: 16px 0 6px 0;
    color: var(--red);
    font-size: 15px;
    page-break-after: avoid;
  }
  
  h3{
    margin: 12px 0 6px 0;
    font-size: 12px;
    color: #1f2937;
    page-break-after: avoid;
  }

  .grid-2{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 12px 0;
  }

  .card{
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px;
    background: #fff;
    page-break-inside: avoid;
  }
  
  .card .label{
    color: var(--muted);
    font-size: 11px;
  }
  
  .card .value{
    font-size: 20px;
    font-weight: 800;
    color: var(--red);
    margin-top: 3px;
  }

  .pill{
    display: inline-block;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--red-soft);
    color: var(--red);
    font-size: 10px;
    font-weight: 700;
  }

  table{
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    page-break-inside: auto;
  }
  
  table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  
  th, td{
    border: 1px solid var(--border);
    padding: 6px;
    font-size: 11px;
    text-align: left;
    vertical-align: top;
  }
  
  th{
    background: var(--red-soft);
    font-weight: 700;
  }

  hr{
    margin: 16px 0;
    border: none;
    border-top: 1px solid var(--border);
    page-break-after: avoid;
  }

  .muted{ color: var(--muted); }
  .small{ font-size: 10px; }

  .indent-1{ margin-left: 12px; }
  .indent-2{ margin-left: 24px; }
  .indent-3{ margin-left: 36px; }

  p{
    margin: 6px 0;
    line-height: 1.4;
  }

  /* Evita que contenedores se corten en nuevas páginas */
  h2, h3, section { break-inside: avoid; }
`;
