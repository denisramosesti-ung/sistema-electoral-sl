import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { generarAccessCode } from "../utils/accessCode";

import {
  UserPlus,
  LogOut,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Copy,
  Phone,
  Trash2,
  Check,
  X,
  Download,
} from "lucide-react";

import AddPersonModal from "../AddPersonModal";
import ModalTelefono from "./ModalTelefono";
import ConfirmVotoModal from "./ConfirmVotoModal";
import {
  generateSuperadminPDF,
  generateCoordinadorPDF,
  generateSubcoordinadorPDF,
} from "../services/pdfService";

import { getEstadisticas } from "../services/estadisticasService";

import {
  normalizeCI,
  getMisSubcoordinadores,
  getVotantesDeSubcoord,
  getMisVotantes,
  getVotantesDirectosCoord,
  getPersonasDisponibles,
} from "../utils/estructuraHelpers";

const Dashboard = ({ currentUser, onLogout }) => {
  // ======================= ESTADO CRÍTICO =======================
  const [padron, setPadron] = useState([]);
  const [estructura, setEstructura] = useState({
    coordinadores: [],
    subcoordinadores: [],
    votantes: [],
  });

  // UI
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [expandedCoords, setExpandedCoords] = useState({});
  const [searchCI, setSearchCI] = useState("");

  // Teléfono
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneTarget, setPhoneTarget] = useState(null);
  const [phoneValue, setPhoneValue] = useState("+595");

  // Confirmación de voto
  const [confirmVotoModalOpen, setConfirmVotoModalOpen] = useState(false);
  const [confirmVotoTarget, setConfirmVotoTarget] = useState(null);
  const [isVotoUndoing, setIsVotoUndoing] = useState(false);
  const [isConfirmVotoLoading, setIsConfirmVotoLoading] = useState(false);

  // PDF MENU (ESTO FALTABA)
const [pdfMenuOpen, setPdfMenuOpen] = useState(false);


  // ======================= HELPERS UI =======================
  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("Código copiado!");
    } catch {
      alert("No se pudo copiar.");
    }
  };

  const toggleExpand = (ci) => {
    const key = normalizeCI(ci);
    setExpandedCoords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ======================= CARGAR PADRÓN COMPLETO =======================
  const cargarPadronCompleto = async () => {
    try {
      const { count, error: countError } = await supabase
        .from("padron")
        .select("ci", { count: "exact", head: true });

      if (countError) {
        console.error("Error count padrón:", countError);
        return;
      }

      if (!count || count <= 0) {
        setPadron([]);
        return;
      }

      const { data, error } = await supabase
        .from("padron")
        .select("*")
        .range(0, count - 1);

      if (error) {
        console.error("Error cargando padrón:", error);
        return;
      }

      setPadron(data || []);
    } catch (e) {
      console.error("Error cargando padrón:", e);
    }
  };

  // ======================= RECARGAR ESTRUCTURA =======================
  const recargarEstructura = async () => {
    try {
      // Asegurar padrón cargado para merge
      let padronData = padron;
      if (!padronData || padronData.length === 0) {
        const { data: p } = await supabase.from("padron").select("*");
        padronData = p || [];
        setPadron(padronData);
      }

      const padronMap = new Map(
        (padronData || []).map((p) => [normalizeCI(p.ci), p])
      );

      const { data: coordsRaw, error: coordsErr } = await supabase
        .from("coordinadores")
        .select("*");
      if (coordsErr) console.error("Error coords:", coordsErr);

      const { data: subsRaw, error: subsErr } = await supabase
        .from("subcoordinadores")
        .select("*");
      if (subsErr) console.error("Error subs:", subsErr);

      const { data: votosRaw, error: votosErr } = await supabase
        .from("votantes")
        .select("*");
      if (votosErr) console.error("Error votos:", votosErr);

      const mergePadron = (arr) =>
        (arr || []).map((x) => {
          const ci = normalizeCI(x.ci);
          const p = padronMap.get(ci);
          return { ...x, ...(p || {}), ci };
        });

      setEstructura({
        coordinadores: mergePadron(coordsRaw),
        subcoordinadores: mergePadron(subsRaw),
        votantes: mergePadron(votosRaw),
      });
    } catch (e) {
      console.error("Error recargando estructura:", e);
    }
  };

  // ======================= INIT =======================
  useEffect(() => {
    cargarPadronCompleto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    recargarEstructura();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

// ======================= PERMISOS (RBAC) =======================
const getMiCoordinadorCI = () => {
  // Si soy coordinador, mi coordinador_ci soy yo
  if (currentUser?.role === "coordinador") return normalizeCI(currentUser.ci);

  // Si soy subcoordinador, tengo que mirar mi fila en subcoordinadores
  if (currentUser?.role === "subcoordinador") {
    const sub = (estructura.subcoordinadores || []).find(
      (s) => normalizeCI(s.ci) === normalizeCI(currentUser.ci)
    );
    return normalizeCI(sub?.coordinador_ci);
  }

  return null;
};

// Puede editar teléfono?
const canEditarTelefono = (tipo, persona) => {
  const role = currentUser?.role;
  if (!role || !persona) return false;

  if (role === "superadmin") return true;

  // Coordinador: puede editar teléfono de su red (subs + votantes de su coordinador_ci)
  if (role === "coordinador") {
    const miCoordCI = normalizeCI(currentUser.ci);

    if (tipo === "subcoordinador") {
      return normalizeCI(persona.coordinador_ci) === miCoordCI;
    }
    if (tipo === "votante") {
      return normalizeCI(persona.coordinador_ci) === miCoordCI;
    }
    // coordinador editando otro coordinador: NO
    return false;
  }

  // Subcoordinador: solo sus votantes directos
  if (role === "subcoordinador") {
    if (tipo !== "votante") return false;
    return normalizeCI(persona.asignado_por) === normalizeCI(currentUser.ci);
  }

  return false;
};

// Puede eliminar?
const canEliminar = (tipo, persona) => {
  const role = currentUser?.role;
  if (!role || !persona) return false;

  if (role === "superadmin") return true;

  if (role === "coordinador") {
    const miCoordCI = normalizeCI(currentUser.ci);

    // puede eliminar sus subcoordinadores
    if (tipo === "subcoordinador") {
      return normalizeCI(persona.coordinador_ci) === miCoordCI;
    }

    // puede eliminar votantes de su red
    if (tipo === "votante") {
      return normalizeCI(persona.coordinador_ci) === miCoordCI;
    }

    // no puede eliminar coordinadores
    return false;
  }

  if (role === "subcoordinador") {
    // solo puede eliminar sus votantes directos
    if (tipo !== "votante") return false;
    return normalizeCI(persona.asignado_por) === normalizeCI(currentUser.ci);
  }

  return false;
};

// ======================= CONFIRMACIÓN DE VOTO =======================

// Verificar permisos para confirmar voto
const canConfirmarVoto = (votante) => {
  const role = currentUser?.role;
  if (!role || !votante) return false;

  // Superadmin no puede confirmar (no tiene rol de coordinador/subcoordinador)
  if (role === "superadmin") return false;

  // Coordinador puede confirmar votantes de su red
  if (role === "coordinador") {
    const miCoordCI = normalizeCI(currentUser.ci);
    // Si el votante tiene coordinador_ci igual al del coordinador actual
    return normalizeCI(votante.coordinador_ci) === miCoordCI;
  }

  // Subcoordinador solo puede confirmar sus votantes directos
  if (role === "subcoordinador") {
    return normalizeCI(votante.asignado_por) === normalizeCI(currentUser.ci);
  }

  return false;
};

// Verificar permisos para anular confirmación (solo Coordinador)
const canAnularConfirmacion = (votante) => {
  const role = currentUser?.role;
  if (!role || !votante) return false;

  // Solo Coordinador puede anular
  if (role === "coordinador") {
    const miCoordCI = normalizeCI(currentUser.ci);
    return normalizeCI(votante.coordinador_ci) === miCoordCI;
  }

  return false;
};

// Abrir modal de confirmación
const abrirConfirmVoto = (votante) => {
  if (!canConfirmarVoto(votante)) return;
  setConfirmVotoTarget(votante);
  setIsVotoUndoing(false);
  setConfirmVotoModalOpen(true);
};

// Abrir modal de anulación
const abrirAnularConfirmacion = (votante) => {
  if (!canAnularConfirmacion(votante)) return;
  setConfirmVotoTarget(votante);
  setIsVotoUndoing(true);
  setConfirmVotoModalOpen(true);
};

// Confirmar/Anular voto
const handleConfirmVoto = async () => {
  if (!confirmVotoTarget) return;

  setIsConfirmVotoLoading(true);
  try {
    const newStatus = !isVotoUndoing;
    const { error } = await supabase
      .from("votantes")
      .update({ voto_confirmado: newStatus })
      .eq("ci", confirmVotoTarget.ci);

    if (error) {
      console.error("Error confirmando voto:", error);
      alert(error.message || "Error procesando confirmación");
      setIsConfirmVotoLoading(false);
      return;
    }

    // Recargar estructura y cerrar modal
    setConfirmVotoModalOpen(false);
    setConfirmVotoTarget(null);
    await recargarEstructura();
  } catch (e) {
    console.error("Error confirmando voto:", e);
    alert("Error procesando confirmación");
  } finally {
    setIsConfirmVotoLoading(false);
  }
};

 // ======================= BUSCADOR INTERNO POR CI (SEGÚN ROL) =======================
// - Superadmin: busca en toda la estructura (coords + subs + votantes). Si no está, muestra "padron" como fallback.
// - Coordinador: busca SOLO dentro de su red (sus subcoordinadores + votantes directos + votantes de sus subcoordinadores).
// - Subcoordinador: busca SOLO sus votantes directos.

  // ======================= LOGOUT =======================
  const handleLogout = () => {
  setExpandedCoords({});
  setSearchCI("");
  onLogout?.();
};


  // ======================= TELÉFONO =======================

// Abre el modal de teléfono
// OJO: acá NO validamos permisos, solo abrimos.
// La validación REAL se hace al guardar (backend lógico).
const abrirTelefono = (tipo, p) => {
  setPhoneTarget({ tipo, ...p });
  setPhoneValue(p.telefono || "+595");
  setPhoneModalOpen(true);
};

// Guarda el teléfono con VALIDACIÓN DE PERMISOS
const guardarTelefono = async () => {
  if (!phoneTarget) return;

  // ======================= VALIDACIÓN DE PERMISOS =======================
  // Superadmin: siempre permitido
  if (currentUser.role !== "superadmin") {
    // COORDINADOR
    if (currentUser.role === "coordinador") {
      const miCI = normalizeCI(currentUser.ci);

      // Puede editar:
      // - subcoordinadores de su red
      // - votantes de su red
      const perteneceAMiRed =
        normalizeCI(phoneTarget.coordinador_ci) === miCI;

      if (!perteneceAMiRed) {
        alert("No tiene permiso para editar el teléfono de esta persona.");
        return;
      }

      // Un coordinador NO puede editar otro coordinador
      if (phoneTarget.tipo === "coordinador") {
        alert("No tiene permiso para editar el teléfono de otro coordinador.");
        return;
      }
    }

    // SUBCOORDINADOR
    if (currentUser.role === "subcoordinador") {
      // Solo puede editar votantes
      if (phoneTarget.tipo !== "votante") {
        alert("No tiene permiso para editar esta persona.");
        return;
      }

      // Solo sus votantes directos
      const esMiVotante =
        normalizeCI(phoneTarget.asignado_por) ===
        normalizeCI(currentUser.ci);

      if (!esMiVotante) {
        alert("No tiene permiso para editar el teléfono de este votante.");
        return;
      }
    }
  }

  // ======================= VALIDACIÓN DE TELÉFONO =======================
  const telefono = String(phoneValue || "").trim();
  if (!telefono) {
    alert("Ingrese número de teléfono.");
    return;
  }

  // ======================= RESOLVER TABLA =======================
  let tabla = "votantes";
  if (phoneTarget.tipo === "coordinador") tabla = "coordinadores";
  if (phoneTarget.tipo === "subcoordinador") tabla = "subcoordinadores";

  // ======================= UPDATE EN SUPABASE =======================
  const { error } = await supabase
    .from(tabla)
    .update({ telefono })
    .eq("ci", phoneTarget.ci);

  if (error) {
    console.error("Error guardando teléfono:", error);
    alert(error.message || "Error guardando teléfono");
    return;
  }

  // ======================= LIMPIEZA Y RECARGA =======================
  setPhoneModalOpen(false);
  setPhoneTarget(null);
  setPhoneValue("+595");
  recargarEstructura();
};


  // ======================= AGREGAR PERSONA =======================
const handleAgregarPersona = async (persona) => {
  if (!modalType) return alert("Seleccione tipo.");

  const ci = normalizeCI(persona.ci);
  let tabla = "";
  let data = {};

  // ======================= COORDINADOR =======================
  if (modalType === "coordinador") {
    if (currentUser.role !== "superadmin") {
      alert("Solo el superadmin puede agregar coordinadores.");
      return;
    }

    const accessCode = generarAccessCode(8);

    tabla = "coordinadores";
    data = {
      ci,
      login_code: accessCode,
      asignado_por_nombre: "Superadmin",
    };

    const { error } = await supabase.from(tabla).insert([data]);
    if (error) {
      console.error("Error creando coordinador:", error);
      alert(error.message || "Error creando coordinador");
      return;
    }

    alert(`Código de acceso del coordinador:\n\n${accessCode}`);
    setShowAddModal(false);
    recargarEstructura();
    return;
  }

  // ======================= SUBCOORDINADOR =======================
  if (modalType === "subcoordinador") {
    if (currentUser.role !== "coordinador") {
      alert("Solo un coordinador puede agregar subcoordinadores.");
      return;
    }

    const accessCode = generarAccessCode(8);

    tabla = "subcoordinadores";
    data = {
      ci,
      coordinador_ci: normalizeCI(currentUser.ci),
      login_code: accessCode,
      asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
    };

    const { error } = await supabase.from(tabla).insert([data]);
    if (error) {
      console.error("Error creando subcoordinador:", error);
      alert(error.message || "Error creando subcoordinador");
      return;
    }

    alert(`Código de acceso del subcoordinador:\n\n${accessCode}`);
    setShowAddModal(false);
    recargarEstructura();
    return;
  }

  // ======================= VOTANTE =======================
  if (modalType === "votante") {
    if (
      currentUser.role !== "coordinador" &&
      currentUser.role !== "subcoordinador"
    ) {
      alert("No permitido.");
      return;
    }

    tabla = "votantes";

    let coordinador_ci = null;

    if (currentUser.role === "coordinador") {
      coordinador_ci = normalizeCI(currentUser.ci);
    } else {
      const sub = (estructura.subcoordinadores || []).find(
        (s) => normalizeCI(s.ci) === normalizeCI(currentUser.ci)
      );
      coordinador_ci = normalizeCI(sub?.coordinador_ci);
    }

    if (!coordinador_ci) {
      alert("Error interno: no se pudo resolver coordinador_ci");
      return;
    }

    data = {
      ci,
      asignado_por: normalizeCI(currentUser.ci),
      asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
      coordinador_ci,
    };

    const { error } = await supabase.from(tabla).insert([data]);
    if (error) {
      console.error("Error creando votante:", error);
      alert(error.message || "Error creando votante");
      return;
    }

    setShowAddModal(false);
    recargarEstructura();
    return;
  }
};

  // ======================= QUITAR PERSONA =======================
  const quitarPersona = async (ci, tipo) => {
    if (!window.confirm("¿Quitar persona?")) return;

    const isSuper = currentUser.role === "superadmin";
    ci = normalizeCI(ci);

    try {
      if (tipo === "coordinador") {
        if (!isSuper) return alert("Solo superadmin.");
        await supabase.from("subcoordinadores").delete().eq("coordinador_ci", ci);
        await supabase.from("votantes").delete().eq("coordinador_ci", ci);
        await supabase.from("votantes").delete().eq("asignado_por", ci);
        await supabase.from("coordinadores").delete().eq("ci", ci);
      }

      if (tipo === "subcoordinador") {
        await supabase.from("votantes").delete().eq("asignado_por", ci);
        await supabase.from("subcoordinadores").delete().eq("ci", ci);
      }

      if (tipo === "votante") {
        await supabase.from("votantes").delete().eq("ci", ci);
      }

      recargarEstructura();
    } catch (e) {
      console.error("Error quitando persona:", e);
      alert("Error quitando persona");
    }
  };

  // ======================= COMPONENTE DATOS PERSONA =======================
  const DatosPersona = ({ persona, rol, loginCode }) => {
    return (
      <div className="space-y-1 text-xs sm:text-sm">
        <p className="font-semibold truncate">
          {persona.nombre || "-"} {persona.apellido || ""}
        </p>
        <p className="truncate">
          <b>CI:</b> {persona.ci}
        </p>
        {rol && (
          <p>
            <b>Rol:</b> {rol}
          </p>
        )}
        {loginCode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(loginCode);
            }}
            className="px-2 py-1 border rounded text-red-600 inline-flex items-center gap-1 text-xs hover:bg-red-50"
          >
            <Copy className="w-3 h-3 sm:w-4 sm:h-4" /> Copiar acceso
          </button>
        )}
        {persona.seccional && <p className="truncate">Seccional: {persona.seccional}</p>}
        {persona.local_votacion && <p className="truncate">Local: {persona.local_votacion}</p>}
        {persona.mesa && <p>Mesa: {persona.mesa}</p>}
        {persona.orden && <p>Orden: {persona.orden}</p>}
        {persona.direccion && <p className="truncate">Dirección: {persona.direccion}</p>}
        {persona.telefono && <p className="truncate">Tel: {persona.telefono}</p>}
      </div>
    );
  };

  // ======================= STATS =======================
  const stats = useMemo(() => getEstadisticas(estructura, currentUser), [estructura, currentUser]);

  // ======================= DISPONIBLES PARA MODAL =======================
  const disponibles = useMemo(
    () => getPersonasDisponibles(padron, estructura),
    [padron, estructura]
  );

  // ======================= BUSCADOR INTERNO (SEGÚN ROL) =======================
// Busca SOLO dentro de lo que el rol puede ver (estructura).
// Soporta CI, nombre, apellido, nombre+apellido (en cualquier orden), y acentos.

const normalizeText = (v) =>
  (v ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\s+/g, " ")
    .trim();

const personasVisibles = useMemo(() => {
  const role = currentUser?.role;
  const miCI = normalizeCI(currentUser?.ci);

  const coords = estructura.coordinadores || [];
  const subs = estructura.subcoordinadores || [];
  const vots = estructura.votantes || [];

  // Vamos a devolver una lista plana con objetos { tipo, persona }
  // tipo: "coordinador" | "subcoordinador" | "votante"
  const out = [];
  const pushUnique = (tipo, persona) => {
    const key = `${tipo}:${normalizeCI(persona?.ci)}`;
    if (!pushUnique._set) pushUnique._set = new Set();
    if (pushUnique._set.has(key)) return;
    pushUnique._set.add(key);
    out.push({ tipo, persona });
  };

  // SUPERADMIN: ve todo
  if (role === "superadmin") {
    coords.forEach((p) => pushUnique("coordinador", p));
    subs.forEach((p) => pushUnique("subcoordinador", p));
    vots.forEach((p) => pushUnique("votante", p));
    return out;
  }

  // COORDINADOR: ve sus subcoordinadores + sus votantes directos + votantes de sus subcoordinadores
  if (role === "coordinador") {
    const misSubs = subs.filter((s) => normalizeCI(s.coordinador_ci) === miCI);
    const misSubsSet = new Set(misSubs.map((s) => normalizeCI(s.ci)));

    misSubs.forEach((p) => pushUnique("subcoordinador", p));

    // votantes directos del coordinador
    vots
      .filter((v) => normalizeCI(v.asignado_por) === miCI)
      .forEach((p) => pushUnique("votante", p));

    // votantes de mis subcoordinadores
    vots
      .filter((v) => misSubsSet.has(normalizeCI(v.asignado_por)))
      .forEach((p) => pushUnique("votante", p));

    return out;
  }

  // SUBCOORDINADOR: ve solo sus votantes directos
  if (role === "subcoordinador") {
    vots
      .filter((v) => normalizeCI(v.asignado_por) === miCI)
      .forEach((p) => pushUnique("votante", p));

    return out;
  }

  // Otros roles: por defecto nada
  return [];
}, [estructura, currentUser]);

const resultadosBusqueda = useMemo(() => {
  const qRaw = normalizeText(searchCI);

  if (!qRaw) return personasVisibles;

  // tokens permite buscar "juan perez" y que encuentre aunque esté como "Perez Juan"
  const tokens = qRaw.split(" ").filter(Boolean);

  return personasVisibles.filter(({ persona }) => {
    const ci = normalizeText(persona?.ci);
    const nombre = normalizeText(persona?.nombre);
    const apellido = normalizeText(persona?.apellido);

    const full1 = `${nombre} ${apellido}`.trim();
    const full2 = `${apellido} ${nombre}`.trim();

    // Si el usuario puso varios tokens, exigimos que TODOS estén contenidos
    return tokens.every((t) => {
      return (
        ci.includes(t) ||
        nombre.includes(t) ||
        apellido.includes(t) ||
        full1.includes(t) ||
        full2.includes(t)
      );
    });
  });
}, [searchCI, personasVisibles]);


  // ======================= DESCARGAR REPORTE (jsPDF + autoTable) =======================
const descargarPDF = async () => {
  if (!currentUser) {
    alert("Usuario no válido");
    return;
  }

  try {
    let doc;
    let filename = "reporte";

    if (currentUser.role === "superadmin") {
      doc = generateSuperadminPDF({ estructura, currentUser });
      filename = "reporte-superadmin";
    } else if (currentUser.role === "coordinador") {
      doc = generateCoordinadorPDF({ estructura, currentUser });
      filename = "reporte-coordinador";
    } else if (currentUser.role === "subcoordinador") {
      doc = generateSubcoordinadorPDF({ estructura, currentUser });
      filename = "reporte-subcoordinador";
    } else {
      alert("Rol no soportado para reportes");
      return;
    }

    // Generar nombre de archivo con timestamp
    const fecha = new Date();
    const timestamp = fecha.toISOString().slice(0, 10);
    const nombreArchivo = `${filename}-${timestamp}.pdf`;

    // Descargar PDF
    doc.save(nombreArchivo);
  } catch (error) {
    console.error("Error generando PDF:", error);
    alert("Error al generar el reporte PDF");
  }
};





  // ======================= UI =======================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Sistema Electoral</h1>
            <p className="text-red-200 text-xs sm:text-sm mt-1 truncate">
              {currentUser.nombre} {currentUser.apellido} —{" "}
              {currentUser.role === "superadmin"
                ? "⭐ Superadmin"
                : currentUser.role === "coordinador"
                ? "Coordinador"
                : "Sub-coordinador"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-4 h-10 rounded-lg transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* TARJETAS ESTADÍSTICAS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {currentUser.role === "superadmin" && (
  <>
    {/* COORDINADORES */}
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <p className="text-gray-600 text-xs sm:text-sm">Coordinadores</p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
        {stats?.coordinadores ?? 0}
      </p>
    </div>

    {/* SUBCOORDINADORES */}
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <p className="text-gray-600 text-xs sm:text-sm">Subcoordinadores</p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
        {stats?.subcoordinadores ?? 0}
      </p>
    </div>

    {/* VOTANTES */}
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <p className="text-gray-600 text-xs sm:text-sm">Votantes</p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
        {stats?.votantes ?? 0}
      </p>
    </div>

    {/* VOTANTES TOTALES (DESTACADO) */}
    <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow p-3 sm:p-4">
      <p className="text-red-700 text-xs sm:text-sm font-semibold uppercase tracking-wide">
        Votantes totales
      </p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-red-700 mt-1">
        {stats?.votantesTotales ?? 0}
      </p>
    </div>
  </>
)}


        {currentUser.role === "coordinador" && (
  <>
    {/* SUBCOORDINADORES */}
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <p className="text-gray-600 text-xs sm:text-sm">Subcoordinadores</p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
        {stats?.subcoordinadores ?? 0}
      </p>
    </div>

    {/* VOTANTES DIRECTOS */}
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <p className="text-gray-600 text-xs sm:text-sm">Votantes directos</p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
        {stats?.votantesDirectos ?? 0}
      </p>
    </div>

    {/* VOTANTES INDIRECTOS */}
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <p className="text-gray-600 text-xs sm:text-sm">Votantes indirectos</p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
  {stats?.votantesIndirectos ?? 0}
</p>

    </div>

    {/* VOTANTES TOTALES (DESTACADO) */}
    <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow p-3 sm:p-4">
      <p className="text-red-700 text-xs sm:text-sm font-semibold uppercase tracking-wide">
        Votantes totales
      </p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-red-700 mt-1">
        {stats?.total ?? 0}
      </p>
    </div>
        </>)}

        {currentUser.role === "subcoordinador" && (
  <>
    {/* VOTANTES DIRECTOS */}
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <p className="text-gray-600 text-xs sm:text-sm">Votantes directos</p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
        {stats?.votantes ?? 0}
      </p>
    </div>

    {/* VOTANTES TOTALES (DESTACADO) */}
    <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow p-3 sm:p-4">
      <p className="text-red-700 text-xs sm:text-sm font-semibold uppercase tracking-wide">
        Votantes totales
      </p>
      <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-red-700 mt-1">
        {stats?.votantes ?? 0}
      </p>
    </div>
  </>
)}


      </div>

      {/* ACCIONES */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex flex-wrap gap-2 sm:gap-3 items-center">
        {currentUser.role === "superadmin" && (
          <button
            onClick={() => {
              setModalType("coordinador");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 h-10 rounded-lg hover:bg-red-700 w-full sm:w-auto text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Coordinador
          </button>
        )}

        {currentUser.role === "coordinador" && (
          <button
            onClick={() => {
              setModalType("subcoordinador");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 h-10 rounded-lg hover:bg-red-700 w-full sm:w-auto text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Subcoordinador
          </button>
        )}

        {(currentUser.role === "coordinador" ||
          currentUser.role === "subcoordinador") && (
          <button
            onClick={() => {
              setModalType("votante");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 h-10 rounded-lg hover:bg-red-50 w-full sm:w-auto text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Votante
          </button>
        )}

        {/* PDF */}
<button
  onClick={descargarPDF}
  className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 h-10 rounded-lg hover:bg-red-50 w-full sm:w-auto text-sm"
>
  <BarChart3 className="w-4 h-4" />
  Descargar PDF
</button>

      </div>
{/* BUSCADOR INTERNO (solo dentro de la estructura visible por rol) */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
  <div className="bg-white rounded-lg shadow p-4 sm:p-5">
    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
      Buscar dentro de mi estructura
    </label>

    <input
      value={searchCI}
      onChange={(e) => setSearchCI(e.target.value)}
      placeholder="Buscar por CI, nombre, apellido o combinación"
      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
    />

    {normalizeText(searchCI) && (
      <p className="text-xs text-gray-500 mt-2">
        Resultados: <b>{resultadosBusqueda.length}</b>
      </p>
    )}
  </div>
</div>

{/* RESULTADOS (solo si hay búsqueda escrita) */}
{normalizeText(searchCI) && (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
    <div className="bg-white rounded-lg shadow">
      <div className="p-3 sm:p-4 border-b">
        <h3 className="font-bold text-sm sm:text-base text-gray-800">Resultados de búsqueda</h3>
        <p className="text-xs text-gray-500">
          Solo dentro de la estructura permitida para tu rol.
        </p>
      </div>

      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {resultadosBusqueda.length === 0 ? (
          <div className="text-xs sm:text-sm text-gray-600">
            No se encontraron coincidencias en tu estructura.
          </div>
        ) : (
          resultadosBusqueda.slice(0, 50).map(({ tipo, persona }) => (
            <div
              key={`${tipo}-${persona.ci}`}
              className="border rounded-lg p-2 sm:p-3 hover:bg-gray-50"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-sm flex flex-wrap items-center gap-2">
                    <span className="truncate">{persona.nombre || "-"} {persona.apellido || ""}</span>
                    {tipo === "votante" && persona.voto_confirmado && (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium shrink-0">
                        Voto Confirmado
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    <b>CI:</b> {persona.ci}{" "}
                    <span className="ml-2">
                      <b>Tipo:</b>{" "}
                      {tipo === "coordinador"
                        ? "Coordinador"
                        : tipo === "subcoordinador"
                        ? "Subcoordinador"
                        : "Votante"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end shrink-0">
                  <button
                    onClick={() => abrirTelefono(tipo, persona)}
                    className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                    title="Editar teléfono"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  {tipo === "votante" && !persona.voto_confirmado && canConfirmarVoto(persona) && (
                    <button
                      onClick={() => abrirConfirmVoto(persona)}
                      className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      title="Confirmar voto"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  {tipo === "votante" && persona.voto_confirmado && canAnularConfirmacion(persona) && (
                    <button
                      onClick={() => abrirAnularConfirmacion(persona)}
                      className="inline-flex items-center justify-center w-10 h-10 border-2 border-red-600 text-red-700 rounded-lg hover:bg-red-50"
                      title="Anular confirmación"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => quitarPersona(tipo, persona)}
                    className="inline-flex items-center justify-center w-10 h-10 border-2 border-red-600 text-red-700 rounded-lg hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {resultadosBusqueda.length > 50 && (
          <div className="text-xs text-gray-500">
            Mostrando 50 resultados. Refiná la búsqueda para acotar.
          </div>
        )}
      </div>
    </div>
  </div>
)}


      {/* MI ESTRUCTURA (UI REAL) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-5 border-b">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Mi Estructura</h2>
          </div>

          <div className="p-4 sm:p-5">
            {/* SUPERADMIN */}
            {currentUser.role === "superadmin" && (
              <div>
                {(estructura.coordinadores || []).map((coord) => (
                  <div
                    key={coord.ci}
                    className="border rounded-lg mb-2 sm:mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-start justify-between p-3 sm:p-4 cursor-pointer gap-3"
                      onClick={() => toggleExpand(coord.ci)}
                    >
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        {expandedCoords[normalizeCI(coord.ci)] ? (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <DatosPersona
                            persona={coord}
                            rol="Coordinador"
                            loginCode={coord.login_code}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("coordinador", coord);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPersona(coord.ci, "coordinador");
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedCoords[normalizeCI(coord.ci)] && (
                      <div className="bg-white px-3 sm:px-4 pb-3 sm:pb-4 border-t animate-in fade-in duration-200 overflow-x-auto">
                        {/* SUBS DEL COORD */}
                        {(estructura.subcoordinadores || [])
                          .filter(
                            (s) =>
                              normalizeCI(s.coordinador_ci) === normalizeCI(coord.ci)
                          )
                          .map((sub) => (
                            <div
                              key={sub.ci}
                              className="border rounded p-2 sm:p-3 mb-2 bg-red-50/40 flex flex-col gap-2 sm:gap-3 ml-2 sm:ml-4"
                            >
                              <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                  {expandedCoords[normalizeCI(sub.ci)] ? (
                                    <ChevronDown className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                  )}
                                  <div
                                    className="cursor-pointer flex-1 min-w-0"
                                    onClick={() => toggleExpand(sub.ci)}
                                  >
                                    <DatosPersona
                                      persona={sub}
                                      rol="Sub-coordinador"
                                      loginCode={sub.login_code}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => abrirTelefono("subcoordinador", sub)}
                                    className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => quitarPersona(sub.ci, "subcoordinador")}
                                    className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Votantes del sub - expandable */}
                              {expandedCoords[normalizeCI(sub.ci)] && (
                                <div className="ml-2 sm:ml-4 border-l-2 border-gray-200 pl-2 sm:pl-3 animate-in fade-in duration-200">
                                  {getVotantesDeSubcoord(estructura, sub.ci).map((v) => (
                                    <div
                                      key={v.ci}
                                      className="bg-white border p-2 sm:p-3 mb-2 rounded flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <DatosPersona persona={v} rol="Votante" />
                                        {v.voto_confirmado && (
                                          <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                            Voto Confirmado
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-2 shrink-0 justify-end">
                                        <button
                                          onClick={() => abrirTelefono("votante", v)}
                                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                        >
                                          <Phone className="w-4 h-4" />
                                        </button>

                                        {!v.voto_confirmado && canConfirmarVoto(v) && (
                                          <button
                                            onClick={() => abrirConfirmVoto(v)}
                                            className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            title="Confirmar voto"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                        )}

                                        {v.voto_confirmado && canAnularConfirmacion(v) && (
                                          <button
                                            onClick={() => abrirAnularConfirmacion(v)}
                                            className="inline-flex items-center justify-center w-10 h-10 border-2 border-red-600 text-red-700 rounded-lg hover:bg-red-50"
                                            title="Anular confirmación"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        )}

                                        <button
                                          onClick={() => quitarPersona(v.ci, "votante")}
                                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {getVotantesDeSubcoord(estructura, sub.ci).length === 0 && (
                                    <p className="text-gray-500 text-xs sm:text-sm">
                                      Sin votantes asignados.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                  </div>
                ))}

                {(estructura.coordinadores || []).length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No hay coordinadores aún.
                  </p>
                )}
              </>
            )}

            {/* COORDINADOR */}
            {currentUser.role === "coordinador" && (
            <>
                {getMisSubcoordinadores(estructura, currentUser).map((sub) => (
                  <div
                    key={sub.ci}
                    className="border rounded-lg mb-2 sm:mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-start justify-between p-3 sm:p-4 cursor-pointer gap-3"
                      onClick={() => toggleExpand(sub.ci)}
                    >
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        {expandedCoords[normalizeCI(sub.ci)] ? (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <DatosPersona
                            persona={sub}
                            rol="Sub-coordinador"
                            loginCode={sub.login_code}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("subcoordinador", sub);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPersona(sub.ci, "subcoordinador");
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedCoords[normalizeCI(sub.ci)] && (
                      <div className="bg-white px-3 sm:px-4 pb-3 sm:pb-4 border-t animate-in fade-in duration-200 overflow-x-auto">
                        <p className="text-xs sm:text-sm font-semibold mt-3 mb-2">Votantes</p>

                        {getVotantesDeSubcoord(estructura, sub.ci).map((v) => (
                          <div
                            key={v.ci}
                            className="bg-white border p-2 sm:p-3 mb-2 rounded flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 ml-1 sm:ml-2"
                          >
                            <div className="flex-1 min-w-0">
                              <DatosPersona persona={v} rol="Votante" />
                              {v.voto_confirmado && (
                                <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                  Voto Confirmado
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0 justify-end">
                              <button
                                onClick={() => abrirTelefono("votante", v)}
                                className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                              >
                                <Phone className="w-4 h-4" />
                              </button>

                              {!v.voto_confirmado && canConfirmarVoto(v) && (
                                <button
                                  onClick={() => abrirConfirmVoto(v)}
                                  className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                  title="Confirmar voto"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              {v.voto_confirmado && canAnularConfirmacion(v) && (
                                <button
                                  onClick={() => abrirAnularConfirmacion(v)}
                                  className="inline-flex items-center justify-center w-10 h-10 border-2 border-red-600 text-red-700 rounded-lg hover:bg-red-50"
                                  title="Anular confirmación"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => quitarPersona(v.ci, "votante")}
                                className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {getVotantesDeSubcoord(estructura, sub.ci).length === 0 && (
                          <p className="text-gray-500 text-xs sm:text-sm ml-1 sm:ml-2">
                            Sin votantes asignados.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {getMisVotantes(estructura, currentUser).length > 0 && (
                  <div className="border rounded-lg mb-2 sm:mb-3 p-3 sm:p-4">
                    <p className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">
                      Mis votantes directos
                    </p>

                    {getMisVotantes(estructura, currentUser).map((v) => (
                      <div
                        key={v.ci}
                        className="bg-white border p-2 sm:p-3 mt-2 rounded flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <DatosPersona persona={v} rol="Votante" />
                          {v.voto_confirmado && (
                            <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                              Voto Confirmado
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0 justify-end">
                          <button
                            onClick={() => abrirTelefono("votante", v)}
                            className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                          >
                            <Phone className="w-4 h-4" />
                          </button>

                          {!v.voto_confirmado && canConfirmarVoto(v) && (
                            <button
                              onClick={() => abrirConfirmVoto(v)}
                              className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              title="Confirmar voto"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {v.voto_confirmado && canAnularConfirmacion(v) && (
                            <button
                              onClick={() => abrirAnularConfirmacion(v)}
                              className="inline-flex items-center justify-center w-10 h-10 border-2 border-red-600 text-red-700 rounded-lg hover:bg-red-50"
                              title="Anular confirmación"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => quitarPersona(v.ci, "votante")}
                            className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {getMisSubcoordinadores(estructura, currentUser).length === 0 &&
                  getMisVotantes(estructura, currentUser).length === 0 && (
                    <p className="text-gray-500 py-6 text-sm sm:text-base">
                      Aún no tiene subcoordinadores ni votantes asignados.
                    </p>
                  )}
            </>
            )} 
{/* SUBCOORDINADOR */}
{currentUser.role === "subcoordinador" && (
  <div>
    {getMisVotantes(estructura, currentUser).map((v) => (
      <div
        key={v.ci}
        className="bg-white border p-2 sm:p-3 mt-2 rounded flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3"
      >
        <div className="flex-1 min-w-0">
          <DatosPersona persona={v} rol="Votante" />
          {v.voto_confirmado && (
            <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
              Voto Confirmado
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0 justify-end">
          <button
            onClick={() => abrirTelefono("votante", v)}
            className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
          >
            <Phone className="w-4 h-4" />
          </button>

          {!v.voto_confirmado && canConfirmarVoto(v) && (
            <button
              onClick={() => abrirConfirmVoto(v)}
              className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700"
              title="Confirmar voto"
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => quitarPersona(v.ci, "votante")}
            className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    ))}

    {getMisVotantes(estructura, currentUser).length === 0 && (
      <p className="text-gray-500 py-6 text-sm sm:text-base">
        No tiene votantes asignados.
      </p>
    )}
  </div>
)}

          </div>
        </div>
      </div>

      {/* MODAL TELÉFONO (tu componente) */}
      <ModalTelefono
        open={phoneModalOpen}
        persona={phoneTarget}
        value={phoneValue}
        onChange={setPhoneValue}
        onCancel={() => {
          setPhoneModalOpen(false);
          setPhoneTarget(null);
          setPhoneValue("+595");
        }}
        onSave={guardarTelefono}
      />

      {/* MODAL AGREGAR PERSONA (tu modal real) */}
      <AddPersonModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        tipo={modalType}
        onAdd={handleAgregarPersona}
        disponibles={disponibles}
      />

      {/* MODAL CONFIRMACIÓN DE VOTO */}
      <ConfirmVotoModal
        open={confirmVotoModalOpen}
        votante={confirmVotoTarget}
        isUndoing={isVotoUndoing}
        onCancel={() => {
          setConfirmVotoModalOpen(false);
          setConfirmVotoTarget(null);
          setIsVotoUndoing(false);
        }}
        onConfirm={handleConfirmVoto}
        isLoading={isConfirmVotoLoading}
      />
    </div>
  );
};

export default Dashboard;
