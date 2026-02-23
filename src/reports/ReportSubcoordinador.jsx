// src/reports/ReportSubcoordinador.jsx
export default function ReportSubcoordinador({ estructura, currentUser }) {
  const { votantes = [] } = estructura;

  const misVotantes = votantes.filter(
    (v) => String(v.asignado_por) === String(currentUser.ci)
  );

  const votosConfirmados = misVotantes.filter((v) => v.voto_confirmado === true).length;
  const conTelefono = misVotantes.filter((v) => !!v.telefono).length;
  const sinTelefono = misVotantes.length - conTelefono;

  let html = `
    <section class="summary-section">
      <h2>Resumen de Mis Votantes</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">Total Votantes</span>
          <span class="value">${misVotantes.length}</span>
        </div>
        <div class="summary-item">
          <span class="label">Con Teléfono</span>
          <span class="value">${conTelefono}</span>
        </div>
        <div class="summary-item">
          <span class="label">Sin Teléfono</span>
          <span class="value">${sinTelefono}</span>
        </div>
        <div class="summary-item">
          <span class="label">Votos Confirmados</span>
          <span class="value">${votosConfirmados}</span>
        </div>
      </div>
    </section>

    <h2>Listado de Votantes</h2>
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
          <th style="width:18%">CI</th>
          <th style="width:20%">Teléfono</th>
          <th style="width:15%">Confirmado</th>
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
        <td>${v.voto_confirmado ? "Sí" : "No"}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  return html;
}

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
