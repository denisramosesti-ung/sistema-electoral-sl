import { normalizeCI } from "../utils/estructuraHelpers";

export const getEstadisticas = (estructura, currentUser) => {
  if (!currentUser) return {};

  // ======================= SUPERADMIN =======================
  if (currentUser.role === "superadmin") {
    const coordinadores = estructura.coordinadores.length;
    const subcoordinadores = estructura.subcoordinadores.length;
    const votantes = estructura.votantes.length;

    // Votos confirmados
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
      subs.length; // 👈 LOS SUBS CUENTAN COMO VOTANTES

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

    const votosConfirmadosTotales =
      votosDirectosConfirmados + votosSubsConfirmados;
    const porcentajeConfirmados =
      totalEnRed > 0 ? Math.round((votosConfirmadosTotales / totalEnRed) * 100) : 0;

    return {
      subcoordinadores: subs.length,
      votantesDirectos: votantesDirectos.length,
      votantesIndirectos: votantesDeSubs,
      total: totalEnRed,
      votantesTotales: totalEnRed,
      votosConfirmados: votosConfirmadosTotales,
      porcentajeConfirmados,
    };
  }

  // ======================= SUBCOORDINADOR =======================
  if (currentUser.role === "subcoordinador") {
    const miCI = normalizeCI(currentUser.ci);

    const misVotantes = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === miCI
    );

    // Votos confirmados
    const votosConfirmados = misVotantes.filter(
      (v) => v.voto_confirmado === true
    ).length;
    const porcentajeConfirmados =
      misVotantes.length > 0
        ? Math.round((votosConfirmados / misVotantes.length) * 100)
        : 0;

    return {
      votantes: misVotantes.length,
      votantesTotales: misVotantes.length + 1, // 👈 el sub también es votante
      votosConfirmados,
      porcentajeConfirmados,
    };
  }

  return {};
};
