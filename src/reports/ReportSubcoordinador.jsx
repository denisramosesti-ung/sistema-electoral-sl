// src/reports/ReportSubcoordinador.jsx
export default function ReportSubcoordinador({ estructura, currentUser }) {
  const { votantes = [] } = estructura;
  const hoy = new Date().toLocaleString("es-PY");

  const misVotantes = votantes.filter(
    (v) => String(v.asignado_por) === String(currentUser.ci)
  );

  const conTelefono = misVotantes.filter((v) => !!v.telefono).length;
  const sinTelefono = misVotantes.length - conTelefono;

  let html = `
    <section class="brand">
      <div>
        <h1 class="title">Reporte de Subcoordinador</h1>
        <div class="small muted">Mis votantes asignados</div>
      </div>
      <div class="meta">
        <div><b>Subcoordinador:</b> ${currentUser.nombre} ${currentUser.apellido}</div>
        <div><b>CI:</b> ${currentUser.ci}</div>
        <div><b>Fecha:</b> ${hoy}</div>
      </div>
    </section>

    <div class="grid-2">
      <div class="card">
        <div class="label">Votantes</div>
        <div class="value">${misVotantes.length}</div>
      </div>
      <div class="card">
        <div class="label">Con teléfono</div>
        <div class="value">${conTelefono}</div>
      </div>
      <div class="card">
        <div class="label">Sin teléfono</div>
        <div class="value">${sinTelefono}</div>
      </div>
      <div class="card">
        <div class="label">Calidad mínima (teléfono)</div>
        <div class="value">${misVotantes.length ? Math.round((conTelefono / misVotantes.length) * 100) : 0}%</div>
      </div>
    </div>

    <h2>Listado de votantes</h2>
  `;

  if (misVotantes.length === 0) {
    html += `<p class="muted">No tiene votantes asignados.</p>`;
    return html;
  }

  html += `
    <table>
      <thead>
        <tr>
          <th>Votante</th>
          <th style="width:20%">CI</th>
          <th style="width:25%">Teléfono</th>
        </tr>
      </thead>
      <tbody>
  `;

  misVotantes.forEach((v) => {
    html += `
      <tr>
        <td>${v.nombre} ${v.apellido}</td>
        <td>${v.ci}</td>
        <td>${v.telefono || "—"}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  return html;
}
