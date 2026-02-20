// src/utils/openReportWindow.js

export const openReportWindow = ({ title, html }) => {
  const win = window.open("", "_blank");

  if (!win) {
    alert("No se pudo abrir la ventana del reporte");
    return;
  }

  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #111;
          }
          h1 {
            color: #b91c1c;
            border-bottom: 2px solid #b91c1c;
            padding-bottom: 8px;
          }
          h2 {
            margin-top: 30px;
            color: #7f1d1d;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            font-size: 12px;
          }
          th {
            background: #fee2e2;
            text-align: left;
          }
          .muted {
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = () => {
            setTimeout(() => window.print(), 300);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
};
