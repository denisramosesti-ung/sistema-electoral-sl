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
      totalVotantes: votantes,
      votosConfirmados,
      votosPendientes: votantes - votosConfirmados,
      porcentajeConfirmados,
    };
  }

  // ======================= COORDINADOR =======================
  if (currentUser.role === "coordinador") {
    const miCI = normalizeCI(currentUser.ci);

    // Subcoordinadores under this coord
    const subs = estructura.subcoordinadores.filter(
      (s) => normalizeCI(s.coordinador_ci) === miCI
    );

    // Voters assigned directly by this coord
    const votantesDirectos = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === miCI
    );

    // Voters assigned by each sub (indirect)
    const votantesIndirectos = subs.reduce(
      (acc, sub) =>
        acc +
        estructura.votantes.filter(
          (v) => normalizeCI(v.asignado_por) === normalizeCI(sub.ci)
        ).length,
      0
    );

    // Total voters = direct + indirect (subs are NOT voters, no inflation)
    const totalVotantes = votantesDirectos.length + votantesIndirectos;

    // Confirmed votes: direct confirmed + indirect confirmed
    const votosDirectosConfirmados = votantesDirectos.filter(
      (v) => v.voto_confirmado === true
    ).length;

    const votosIndirectosConfirmados = subs.reduce(
      (acc, sub) =>
        acc +
        estructura.votantes.filter(
          (v) =>
            normalizeCI(v.asignado_por) === normalizeCI(sub.ci) &&
            v.voto_confirmado === true
        ).length,
      0
    );

    const votosConfirmados = votosDirectosConfirmados + votosIndirectosConfirmados;

    // Percentage based on actual voters only
    const porcentajeConfirmados =
      totalVotantes > 0 ? Math.round((votosConfirmados / totalVotantes) * 100) : 0;

    return {
      subcoordinadores: subs.length,
      votantesDirectos: votantesDirectos.length,
      votantesIndirectos,
      totalVotantes,
      votosConfirmados,
      votosPendientes: totalVotantes - votosConfirmados,
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
      totalVotantes: misVotantes.length,
      votosConfirmados,
      votosPendientes: misVotantes.length - votosConfirmados,
      porcentajeConfirmados,
    };
  }

  return {};
};
