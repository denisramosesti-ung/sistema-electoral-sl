// src/reports/ReportCoordinador.jsx
export default function ReportCoordinador({ estructura, currentUser }) {
  const { subcoordinadores = [], votantes = [] } = estructura;

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

  const totalRed = votosDirectos.length + totalIndirectos;

  let html = `
    <section class="summary-section">
      <h2>Resumen de Mi Red</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">Subcoordinadores</span>
          <span class="value">${misSubs.length}</span>
        </div>
        <div class="summary-item">
          <span class="label">Votantes Directos</span>
          <span class="value">${votosDirectos.length}</span>
        </div>
        <div class="summary-item">
          <span class="label">Votantes Indirectos</span>
          <span class="value">${totalIndirectos}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total en Mi Red</span>
          <span class="value">${totalRed}</span>
        </div>
      </div>
    </section>

    <h2>Subcoordinadores</h2>
  `;

  if (misSubs.length === 0) {
    html += `<p class="muted">No registra subcoordinadores.</p>`;
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th>Subcoordinador</th>
            <th style="width:20%">CI</th>
            <th style="width:20%">Teléfono</th>
            <th style="width:15%">Votantes</th>
          </tr>
        </thead>
        <tbody>
    `;

    misSubs.forEach((s) => {
      const arr = votosPorSub.get(String(s.ci)) || [];
      html += `
        <tr>
          <td>${s.nombre} ${s.apellido}</td>
          <td>${s.ci}</td>
          <td>${s.telefono || "—"}</td>
          <td>${arr.length}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
  }

  html += `
    <h2>Votantes Directos <span class="pill">${votosDirectos.length}</span></h2>
  `;
  
  if (votosDirectos.length === 0) {
    html += `<p class="muted">No registra votantes directos.</p>`;
  } else {
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
    votosDirectos.forEach((v) => {
      html += `
        <tr>
          <td>${v.nombre} ${v.apellido}</td>
          <td>${v.ci}</td>
          <td>${v.telefono || "—"}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  return html;
}
