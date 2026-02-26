import { normalizeCI } from "../utils/estructuraHelpers";

export const getEstadisticas = (estructura, currentUser) => {
  if (!currentUser) return {};

  // ======================= SUPERADMIN =======================
  if (currentUser.role === "superadmin") {
    const coordinadores = estructura.coordinadores.length;
    const subcoordinadores = estructura.subcoordinadores.length;
    const votantes = estructura.votantes.length;

    // Votos confirmados (coordinadores automáticamente + subs con voto_confirmado + votantes con voto_confirmado)
    const votosConfirmadosTotales =
      coordinadores +
      estructura.subcoordinadores.filter((s) => s.voto_confirmado === true).length +
      estructura.votantes.filter((v) => v.voto_confirmado === true).length;

    // Votos confirmados solo votantes (para compatibilidad)
    const votosConfirmados = estructura.votantes.filter(
      (v) => v.voto_confirmado === true
    ).length;
    
    const porcentajeConfirmados =
      votantes > 0 ? Math.round((votosConfirmados / votantes) * 100) : 0;

    return {
      coordinadores,
      subcoordinadores,
      votantes,
      votantesTotales: coordinadores + subcoordinadores + votantes,
      votosConfirmados,
      votosConfirmadosTotales,
      porcentajeConfirmados,
    };
  }

  // ======================= COORDINADOR =======================
  if (currentUser.role === "coordinador") {
    const miCI = normalizeCI(currentUser.ci);

    const subs = estructura.subcoordinadores.filter(
      (s) => normalizeCI(s.coordinador_ci) === miCI
    );

    const votantesDirectos = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === miCI
    );

    const votantesDeSubs = subs.reduce(
      (acc, sub) =>
        acc +
        estructura.votantes.filter(
          (v) => normalizeCI(v.asignado_por) === normalizeCI(sub.ci)
        ).length,
      0
    );

    const totalEnRed =
      votantesDirectos.length +
      votantesDeSubs +
      subs.length +
      1; // 👈 LOS SUBS CUENTAN + EL COORDINADOR

    // Votos confirmados en la red
    const votosDirectosConfirmados = votantesDirectos.filter(
      (v) => v.voto_confirmado === true
    ).length;

    const votosSubsConfirmados = subs.reduce(
      (acc, sub) =>
        acc +
        estructura.votantes.filter(
          (v) =>
            normalizeCI(v.asignado_por) === normalizeCI(sub.ci) &&
            v.voto_confirmado === true
        ).length,
      0
    );

    // Votos confirmados totales: 1 coordinador (automático) + subs confirmados + votantes confirmados
    const votosConfirmadosTotales =
      1 + // El coordinador se cuenta automáticamente
      subs.filter((s) => s.voto_confirmado === true).length +
      votosDirectosConfirmados +
      votosSubsConfirmados;
    
    const porcentajeConfirmados =
      totalEnRed > 0 ? Math.round((votosConfirmadosTotales / totalEnRed) * 100) : 0;

    return {
      subcoordinadores: subs.length,
      votantesDirectos: votantesDirectos.length,
      votantesIndirectos: votantesDeSubs,
      total: totalEnRed,
      votantesTotales: totalEnRed,
      votosConfirmados: votosConfirmadosTotales,
      votosConfirmadosTotales,
      porcentajeConfirmados,
    };
  }

  // ======================= SUBCOORDINADOR =======================
  if (currentUser.role === "subcoordinador") {
    const miCI = normalizeCI(currentUser.ci);

    const misVotantes = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === miCI
    );

    // Votos confirmados (votantes)
    const votosConfirmados = misVotantes.filter(
      (v) => v.voto_confirmado === true
    ).length;

    // Votos confirmados totales: si el sub tiene voto_confirmado + votantes confirmados
    const subData = estructura.subcoordinadores.find((s) => normalizeCI(s.ci) === miCI);
    const subConfirmado = subData?.voto_confirmado === true ? 1 : 0;
    const votosConfirmadosTotales = subConfirmado + votosConfirmados;

    const totalConSub = misVotantes.length + 1; // el sub también es votante
    const porcentajeConfirmados =
      totalConSub > 0
        ? Math.round((votosConfirmadosTotales / totalConSub) * 100)
        : 0;

    return {
      votantes: misVotantes.length,
      votantesTotales: totalConSub,
      votosConfirmados,
      votosConfirmadosTotales,
      porcentajeConfirmados,
    };
  }

  return {};
};
