// src/reports/ReportSuperadmin.jsx
export default function ReportSuperadmin({ estructura, currentUser }) {
  const { coordinadores = [], subcoordinadores = [], votantes = [] } = estructura;

  const hoy = new Date().toLocaleString("es-PY");

  const totalCoordinadores = coordinadores.length;
  const totalSubs = subcoordinadores.length;
  const totalVotantes = votantes.length;

  // Mapa subcoordinadores por coordinador
  const subsPorCoord = new Map();
  for (const s of subcoordinadores) {
    const k = String(s.coordinador_ci || "");
    if (!subsPorCoord.has(k)) subsPorCoord.set(k, []);
    subsPorCoord.get(k).push(s);
  }

  // Mapa votantes por asignado_por (sub o coord)
  const votosPorAsignador = new Map();
  for (const v of votantes) {
    const k = String(v.asignado_por || "");
    if (!votosPorAsignador.has(k)) votosPorAsignador.set(k, []);
    votosPorAsignador.get(k).push(v);
  }

  // Detectar si un votante es indirecto (asignado por un sub del mismo coord)
  const getVotantesDirectosDelCoord = (coordCI) => {
    const subs = subsPorCoord.get(String(coordCI)) || [];
    const setSubs = new Set(subs.map((x) => String(x.ci)));
    return votantes.filter(
      (v) =>
        String(v.coordinador_ci) === String(coordCI) &&
        !setSubs.has(String(v.asignado_por))
    );
  };

  let html = `
    <section class="brand">
      <div>
        <h1 class="title">Reporte General – Superadmin</h1>
        <div class="small muted">Sistema Electoral</div>
      </div>
      <div class="meta">
        <div><b>Administrador:</b> ${currentUser.nombre} ${currentUser.apellido}</div>
        <div><b>Fecha:</b> ${hoy}</div>
      </div>
    </section>

    <div class="grid-2">
      <div class="card">
        <div class="label">Coordinadores</div>
        <div class="value">${totalCoordinadores}</div>
      </div>
      <div class="card">
        <div class="label">Subcoordinadores</div>
        <div class="value">${totalSubs}</div>
      </div>
      <div class="card">
        <div class="label">Votantes</div>
        <div class="value">${totalVotantes}</div>
      </div>
      <div class="card">
        <div class="label">Estructura (personas registradas)</div>
        <div class="value">${totalCoordinadores + totalSubs + totalVotantes}</div>
      </div>
    </div>

    <h2>Listado Jerárquico</h2>
    <p class="muted small">
      Estructura: Coordinador → Subcoordinador → Votantes. Incluye votantes directos del coordinador.
    </p>
  `;

  coordinadores.forEach((coord, idx) => {
    const coordCI = String(coord.ci);
    const subs = subsPorCoord.get(coordCI) || [];

    const votosDirectos = getVotantesDirectosDelCoord(coordCI);
    let votosIndirectosCount = 0;

    for (const s of subs) {
      const vs = votosPorAsignador.get(String(s.ci)) || [];
      votosIndirectosCount += vs.length;
    }

    const totalEnRed = votosDirectos.length + votosIndirectosCount;

    html += `
      <hr />
      <h2>
        Coordinador: ${coord.nombre} ${coord.apellido}
        <span class="pill">Red: ${totalEnRed}</span>
      </h2>
      <div class="small muted">
        <b>CI:</b> ${coord.ci}
        ${coord.telefono ? ` • <b>Tel:</b> ${coord.telefono}` : ""}
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:55%">Nodo</th>
            <th style="width:15%">CI</th>
            <th style="width:15%">Teléfono</th>
            <th style="width:15%">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>Coordinador</b></td>
            <td>${coord.ci}</td>
            <td>${coord.telefono || "—"}</td>
            <td><b>${totalEnRed}</b></td>
          </tr>
        </tbody>
      </table>

      <h3>Subcoordinadores</h3>
    `;

    if (subs.length === 0) {
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

      subs.forEach((sub) => {
        const vs = votosPorAsignador.get(String(sub.ci)) || [];
        html += `
          <tr>
            <td>${sub.nombre} ${sub.apellido}</td>
            <td>${sub.ci}</td>
            <td>${sub.telefono || "—"}</td>
            <td><b>${vs.length}</b></td>
          </tr>
        `;
      });

      html += `</tbody></table>`;

      // Detalle por sub
      subs.forEach((sub) => {
        const vs = votosPorAsignador.get(String(sub.ci)) || [];
        html += `
          <h3 class="indent-1">Detalle Subcoordinador: ${sub.nombre} ${sub.apellido} <span class="pill">${vs.length}</span></h3>
          <div class="indent-1 small muted"><b>CI:</b> ${sub.ci}</div>
        `;

        if (vs.length === 0) {
          html += `<p class="indent-2 muted">Sin votantes.</p>`;
        } else {
          html += `
            <table class="indent-2">
              <thead>
                <tr>
                  <th>Votante</th>
                  <th style="width:20%">CI</th>
                  <th style="width:25%">Teléfono</th>
                </tr>
              </thead>
              <tbody>
          `;
          vs.forEach((v) => {
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
      });
    }

    // Votantes directos del coordinador
    html += `<h3>Votantes directos del Coordinador <span class="pill">${votosDirectos.length}</span></h3>`;
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

    // Salto de página entre coordinadores
    if (idx < coordinadores.length - 1) html += `<div class="page-break"></div>`;
  });

  return html;
}
