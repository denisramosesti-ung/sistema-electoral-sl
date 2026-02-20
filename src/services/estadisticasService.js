import { normalizeCI } from "../utils/estructuraHelpers";

export const getEstadisticas = (estructura, currentUser) => {
  if (!currentUser) return {};

  // ======================= SUPERADMIN =======================
  if (currentUser.role === "superadmin") {
    const coordinadores = estructura.coordinadores.length;
    const subcoordinadores = estructura.subcoordinadores.length;
    const votantes = estructura.votantes.length;

    return {
      coordinadores,
      subcoordinadores,
      votantes,
      votantesTotales: coordinadores + subcoordinadores + votantes,
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

    return {
      subcoordinadores: subs.length,
      votantesDirectos: votantesDirectos.length,
      votantesIndirectos: votantesDeSubs,
      total: totalEnRed,
      votantesTotales: totalEnRed,
    };
  }

  // ======================= SUBCOORDINADOR =======================
  if (currentUser.role === "subcoordinador") {
    const miCI = normalizeCI(currentUser.ci);

    const misVotantes = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === miCI
    );

    return {
      votantes: misVotantes.length,
      votantesTotales: misVotantes.length + 1, // 👈 el sub también es votante
    };
  }

  return {};
};
