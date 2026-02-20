// src/reports/ReportCoordinador.jsx
export default function ReportCoordinador({ estructura, currentUser }) {
  const { subcoordinadores = [], votantes = [] } = estructura;
  const hoy = new Date().toLocaleString("es-PY");

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
    <section class="brand">
      <div>
        <h1 class="title">Reporte de Coordinador</h1>
        <div class="small muted">Mi red jerárquica</div>
      </div>
      <div class="meta">
        <div><b>Coordinador:</b> ${currentUser.nombre} ${currentUser.apellido}</div>
        <div><b>CI:</b> ${currentUser.ci}</div>
        <div><b>Fecha:</b> ${hoy}</div>
      </div>
    </section>

    <div class="grid-2">
      <div class="card">
        <div class="label">Subcoordinadores</div>
        <div class="value">${misSubs.length}</div>
      </div>
      <div class="card">
        <div class="label">Votantes directos</div>
        <div class="value">${votosDirectos.length}</div>
      </div>
      <div class="card">
        <div class="label">Votantes indirectos</div>
        <div class="value">${totalIndirectos}</div>
      </div>
      <div class="card">
        <div class="label">Total de votantes en mi red</div>
        <div class="value">${totalRed}</div>
      </div>
    </div>

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
            <th style="width:18%">CI</th>
            <th style="width:18%">Teléfono</th>
            <th style="width:18%">Votantes</th>
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
          <td><b>${arr.length}</b></td>
        </tr>
      `;
    });

    html += `</tbody></table>`;

    misSubs.forEach((s, idx) => {
      const arr = votosPorSub.get(String(s.ci)) || [];
      html += `
        <h3>Detalle: ${s.nombre} ${s.apellido} <span class="pill">${arr.length}</span></h3>
      `;

      if (arr.length === 0) {
        html += `<p class="muted">Sin votantes.</p>`;
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
        arr.forEach((v) => {
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

      if (idx < misSubs.length - 1) html += `<div class="page-break"></div>`;
    });
  }

  html += `
    <h2>Votantes directos <span class="pill">${votosDirectos.length}</span></h2>
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
