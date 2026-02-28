// ======================= SERVICIO DE ESTRUCTURA =======================

import { supabase } from "../supabaseClient";
import { normalizeCI } from "../utils/estructuraHelpers";
import { savePadron, getAllPadron } from "../utils/padronDB";

// ======================= CARGAR ESTRUCTURA COMPLETA =======================
export const cargarEstructuraCompleta = async () => {
// 1) Intentar cargar padrón desde IndexedDB
let padron = await getAllPadron();

// 2) Si no existe, descargar desde Supabase y guardar
if (!padron || padron.length === 0) {
  const { data, error } = await supabase
    .from("padron")
    .select("*")
    .range(0, 100000);

  if (error) throw error;

  padron = data || [];
  await savePadron(padron);
}
  // 3) Cargar estructura (estas tablas suelen ser mucho más chicas)
  const { data: coords, error: e1 } = await supabase.from("coordinadores").select("*");
  if (e1) throw e1;

  const { data: subs, error: e2 } = await supabase.from("subcoordinadores").select("*");
  if (e2) throw e2;

  const { data: votos, error: e3 } = await supabase.from("votantes").select("*");
  if (e3) throw e3;

  // 4) Crear mapa para búsquedas O(1) (clave para velocidad)
  const padronMap = new Map(
    (padron || []).map((p) => [normalizeCI(p.ci), p])
  );

  const mapPadron = (ci) => padronMap.get(normalizeCI(ci));

  // 5) Retornar estructura enriquecida
 return {
  padron: padron || [],

  coordinadores: (coords || []).map((c) => ({
    ...c,
    ...mapPadron(c.ci),
  })),

  subcoordinadores: (subs || []).map((s) => ({
    ...s,
    ...mapPadron(s.ci),
  })),

  votantes: (votos || []).map((v) => ({
    ...v,
    ...mapPadron(v.ci),
  })),
};

// ======================= AGREGAR PERSONA =======================
export const agregarPersonaService = async ({
  persona,
  modalType,
  currentUser,
  estructura,
}) => {
  const ci = normalizeCI(persona.ci);
  let tabla = "";
  let data = {};

  if (modalType === "coordinador") {
    tabla = "coordinadores";
    data = { ci, login_code: persona.login_code };
  }

  if (modalType === "subcoordinador") {
    tabla = "subcoordinadores";
    data = {
      ci,
      coordinador_ci: currentUser.ci,
      login_code: persona.login_code,
    };
  }

  if (modalType === "votante") {
    tabla = "votantes";
    data = {
      ci,
      asignado_por: currentUser.ci,
      coordinador_ci:
        currentUser.role === "coordinador"
          ? currentUser.ci
          : estructura.subcoordinadores.find(
              (s) => normalizeCI(s.ci) === currentUser.ci
            )?.coordinador_ci,
    };
  }

  const { error } = await supabase.from(tabla).insert([data]);
  if (error) throw error;
};

// ======================= ELIMINAR PERSONA =======================
export const eliminarPersonaService = async (ci, tipo, currentUser) => {
  ci = normalizeCI(ci);

  if (tipo === "coordinador" && currentUser.role === "superadmin") {
    await supabase.from("subcoordinadores").delete().eq("coordinador_ci", ci);
    await supabase.from("votantes").delete().eq("coordinador_ci", ci);
    await supabase.from("coordinadores").delete().eq("ci", ci);
  }

  if (tipo === "subcoordinador") {
    await supabase.from("votantes").delete().eq("asignado_por", ci);
    await supabase.from("subcoordinadores").delete().eq("ci", ci);
  }

  if (tipo === "votante") {
    await supabase.from("votantes").delete().eq("ci", ci);
  }
};

// ======================= ACTUALIZAR TELÉFONO =======================
export const actualizarTelefonoService = async (persona, telefono) => {
  let tabla = "votantes";
  if (persona.tipo === "coordinador") tabla = "coordinadores";
  if (persona.tipo === "subcoordinador") tabla = "subcoordinadores";

  const { error } = await supabase
    .from(tabla)
    .update({ telefono })
    .eq("ci", persona.ci);

  if (error) throw error;
};
