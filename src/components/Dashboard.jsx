import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { generarAccessCode } from "../utils/accessCode";

import ReportSuperadmin from "../reports/ReportSuperadmin";
import ReportCoordinador from "../reports/ReportCoordinador";
import ReportSubcoordinador from "../reports/ReportSubcoordinador";
import { REPORT_CSS } from "../reports/reportStyles";


import {
  UserPlus,
  LogOut,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Copy,
  Phone,
  Trash2,
} from "lucide-react";

import AddPersonModal from "../AddPersonModal";
import ModalTelefono from "./ModalTelefono";

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
      <div className="space-y-1 text-xs md:text-sm">
        <p className="font-semibold">
          {persona.nombre || "-"} {persona.apellido || ""}
        </p>
        <p>
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
            className="p-1 border rounded text-red-600 inline-flex items-center gap-1"
          >
            <Copy className="w-4 h-4" /> Copiar acceso
          </button>
        )}
        {persona.seccional && <p>Seccional: {persona.seccional}</p>}
        {persona.local_votacion && <p>Local: {persona.local_votacion}</p>}
        {persona.mesa && <p>Mesa: {persona.mesa}</p>}
        {persona.orden && <p>Orden: {persona.orden}</p>}
        {persona.direccion && <p>Dirección: {persona.direccion}</p>}
        {persona.telefono && <p>Tel: {persona.telefono}</p>}
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


  // ======================= DESCARGAR REPORTE (HTML → PDF) =======================
const descargarPDF = () => {
  if (!currentUser) {
    alert("Usuario no válido");
    return;
  }

  let html = "";
  let title = "Reporte";

  if (currentUser.role === "superadmin") {
    html = ReportSuperadmin({ estructura, currentUser });
    title = "Reporte General – Superadmin";
  } else if (currentUser.role === "coordinador") {
    html = ReportCoordinador({ estructura, currentUser });
    title = "Reporte de Coordinador";
  } else if (currentUser.role === "subcoordinador") {
    html = ReportSubcoordinador({ estructura, currentUser });
    title = "Reporte de Subcoordinador";
  } else {
    alert("Rol no soportado para reportes");
    return;
  }

  const win = window.open("", "_blank");
  if (!win) {
    alert("El navegador bloqueó la ventana emergente (pop-up).");
    return;
  }

  win.document.open();
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>${REPORT_CSS}</style>
      </head>
      <body>
        <header class="report-header">
          <div class="brand">
            <div>
              <h1 class="title">${title}</h1>
              <div class="small muted">Sistema Electoral</div>
            </div>
            <div class="meta">
              <div><b>Usuario:</b> ${currentUser.nombre} ${currentUser.apellido}</div>
              <div><b>CI:</b> ${currentUser.ci}</div>
              <div><b>Generado:</b> ${new Date().toLocaleString("es-PY")}</div>
            </div>
          </div>
        </header>

        <footer class="report-footer">
          <div>Documento interno</div>
          <div class="muted">Imprimir / Guardar como PDF</div>
        </footer>

        <main class="report-body">
          ${html}
        </main>

        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
};


  // ======================= UI =======================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Sistema Electoral</h1>
            <p className="text-red-200 text-sm mt-1">
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
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* TARJETAS ESTADÍSTICAS */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentUser.role === "superadmin" && (
  <>
    {/* COORDINADORES */}
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">Coordinadores</p>
      <p className="text-4xl font-bold text-red-600">
        {stats?.coordinadores ?? 0}
      </p>
    </div>

    {/* SUBCOORDINADORES */}
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">Subcoordinadores</p>
      <p className="text-4xl font-bold text-red-600">
        {stats?.subcoordinadores ?? 0}
      </p>
    </div>

    {/* VOTANTES */}
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">Votantes</p>
      <p className="text-4xl font-bold text-red-600">
        {stats?.votantes ?? 0}
      </p>
    </div>

    {/* VOTANTES TOTALES (DESTACADO) */}
    <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow p-6">
      <p className="text-red-700 text-sm font-semibold uppercase tracking-wide">
        Votantes totales
      </p>
      <p className="text-4xl font-extrabold text-red-700 mt-1">
        {stats?.votantesTotales ?? 0}
      </p>
    </div>
  </>
)}


        {currentUser.role === "coordinador" && (
  <>
    {/* SUBCOORDINADORES */}
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">Subcoordinadores</p>
      <p className="text-4xl font-bold text-red-600">
        {stats?.subcoordinadores ?? 0}
      </p>
    </div>

    {/* VOTANTES DIRECTOS */}
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">Votantes directos</p>
      <p className="text-4xl font-bold text-red-600">
        {stats?.votantesDirectos ?? 0}
      </p>
    </div>

    {/* VOTANTES INDIRECTOS */}
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">Votantes indirectos</p>
      <p className="text-4xl font-bold text-red-600">
  {stats?.votantesIndirectos ?? 0}
</p>

    </div>

    {/* VOTANTES TOTALES (DESTACADO) */}
    <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow p-6">
      <p className="text-red-700 text-sm font-semibold uppercase tracking-wide">
        Votantes totales
      </p>
      <p className="text-4xl font-extrabold text-red-700 mt-1">
        {stats?.total ?? 0}
      </p>
    </div>
  </>
        )}

        {currentUser.role === "subcoordinador" && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* VOTANTES DIRECTOS */}
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">Votantes directos</p>
      <p className="text-4xl font-bold text-red-600">
        {stats?.votantes ?? 0}
      </p>
    </div>

    {/* VOTANTES TOTALES (DESTACADO) */}
    <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow p-6">
      <p className="text-red-700 text-sm font-semibold uppercase tracking-wide">
        Votantes totales
      </p>
      <p className="text-4xl font-extrabold text-red-700 mt-1">
        {stats?.votantes ?? 0}
      </p>
    </div>
  </div>
)}


      </div>

      {/* ACCIONES */}
      <div className="max-w-7xl mx-auto px-4 mb-6 flex flex-wrap gap-3 items-center">
        {currentUser.role === "superadmin" && (
          <button
            onClick={() => {
              setModalType("coordinador");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
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
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
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
            className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Votante
          </button>
        )}

        {/* PDF */}
<button
  onClick={descargarPDF}
  className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
>
  <BarChart3 className="w-4 h-4" />
  Descargar PDF
</button>

      </div>
{/* BUSCADOR INTERNO (solo dentro de la estructura visible por rol) */}
<div className="max-w-7xl mx-auto px-4 mb-4">
  <div className="bg-white rounded-lg shadow p-4">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Buscar dentro de mi estructura
    </label>

    <input
      value={searchCI}
      onChange={(e) => setSearchCI(e.target.value)}
      placeholder="Buscar por CI, nombre, apellido o combinación"
      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
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
  <div className="max-w-7xl mx-auto px-4 mb-6">
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="font-bold text-gray-800">Resultados de búsqueda</h3>
        <p className="text-xs text-gray-500">
          Solo dentro de la estructura permitida para tu rol.
        </p>
      </div>

      <div className="p-4 space-y-3">
        {resultadosBusqueda.length === 0 ? (
          <div className="text-sm text-gray-600">
            No se encontraron coincidencias en tu estructura.
          </div>
        ) : (
          resultadosBusqueda.slice(0, 50).map(({ tipo, persona }) => (
            <div
              key={`${tipo}-${persona.ci}`}
              className="border rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm">
                    {persona.nombre || "-"} {persona.apellido || ""}
                  </div>
                  <div className="text-xs text-gray-600">
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

                <div className="flex gap-2">
                  <button
                    onClick={() => abrirTelefono(tipo, persona)}
                    className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                    title="Editar teléfono"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

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
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Mi Estructura</h2>
          </div>

          <div className="p-6">
            {/* SUPERADMIN */}
            {currentUser.role === "superadmin" && (
              <>
                {(estructura.coordinadores || []).map((coord) => (
                  <div
                    key={coord.ci}
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-start justify-between p-4 cursor-pointer gap-4"
                      onClick={() => toggleExpand(coord.ci)}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {expandedCoords[normalizeCI(coord.ci)] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}
                        <DatosPersona
                          persona={coord}
                          rol="Coordinador"
                          loginCode={coord.login_code}
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("coordinador", coord);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPersona(coord.ci, "coordinador");
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expandedCoords[normalizeCI(coord.ci)] && (
                      <div className="bg-white px-4 pb-4">
                        {/* SUBS DEL COORD */}
                        {(estructura.subcoordinadores || [])
                          .filter(
                            (s) =>
                              normalizeCI(s.coordinador_ci) === normalizeCI(coord.ci)
                          )
                          .map((sub) => (
                            <div
                              key={sub.ci}
                              className="border rounded p-3 mb-2 bg-red-50/40 flex flex-col gap-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <DatosPersona
                                  persona={sub}
                                  rol="Sub-coordinador"
                                  loginCode={sub.login_code}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => abrirTelefono("subcoordinador", sub)}
                                    className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                  >
                                    <Phone className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => quitarPersona(sub.ci, "subcoordinador")}
                                    className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>

                              {/* Votantes del sub */}
                              {getVotantesDeSubcoord(estructura, sub.ci).map((v) => (
                                <div
                                  key={v.ci}
                                  className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                                >
                                  <DatosPersona persona={v} rol="Votante" />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => abrirTelefono("votante", v)}
                                      className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                    >
                                      <Phone className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => quitarPersona(v.ci, "votante")}
                                      className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {getVotantesDeSubcoord(estructura, sub.ci).length === 0 && (
                                <p className="text-gray-500 text-sm">
                                  Sin votantes asignados.
                                </p>
                              )}
                            </div>
                          ))}

                        {/* VOTANTES DIRECTOS DEL COORD */}
                        {getVotantesDirectosCoord(estructura, coord.ci).map((v) => (
                          <div
                            key={v.ci}
                            className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                          >
                            <DatosPersona persona={v} rol="Votante" />
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirTelefono("votante", v)}
                                className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                              >
                                <Phone className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => quitarPersona(v.ci, "votante")}
                                className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
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
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-start justify-between p-4 cursor-pointer gap-4"
                      onClick={() => toggleExpand(sub.ci)}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {expandedCoords[normalizeCI(sub.ci)] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}
                        <DatosPersona
                          persona={sub}
                          rol="Sub-coordinador"
                          loginCode={sub.login_code}
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("subcoordinador", sub);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPersona(sub.ci, "subcoordinador");
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expandedCoords[normalizeCI(sub.ci)] && (
                      <div className="bg-white px-4 pb-4">
                        <p className="text-sm font-semibold mt-2">Votantes</p>

                        {getVotantesDeSubcoord(estructura, sub.ci).map((v) => (
                          <div
                            key={v.ci}
                            className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                          >
                            <DatosPersona persona={v} rol="Votante" />
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirTelefono("votante", v)}
                                className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                              >
                                <Phone className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => quitarPersona(v.ci, "votante")}
                                className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {getVotantesDeSubcoord(estructura, sub.ci).length === 0 && (
                          <p className="text-gray-500 text-sm mt-2">
                            Sin votantes asignados.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {getMisVotantes(estructura, currentUser).length > 0 && (
                  <div className="border rounded-lg mb-3 p-4">
                    <p className="font-semibold text-gray-700 mb-3">
                      Mis votantes directos
                    </p>

                    {getMisVotantes(estructura, currentUser).map((v) => (
                      <div
                        key={v.ci}
                        className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                      >
                        <DatosPersona persona={v} rol="Votante" />
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirTelefono("votante", v)}
                            className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => quitarPersona(v.ci, "votante")}
                            className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {getMisSubcoordinadores(estructura, currentUser).length === 0 &&
                  getMisVotantes(estructura, currentUser).length === 0 && (
                    <p className="text-gray-500 py-6">
                      Aún no tiene subcoordinadores ni votantes asignados.
                    </p>
                  )}
              </>
            )}
{/* SUBCOORDINADOR */}
{currentUser.role === "subcoordinador" && (
  <>
    {getMisVotantes(estructura, currentUser).map((v) => (
      <div
        key={v.ci}
        className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
      >
        <DatosPersona persona={v} rol="Votante" />
        <div className="flex gap-2">
          <button
            onClick={() => abrirTelefono("votante", v)}
            className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => quitarPersona(v.ci, "votante")}
            className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    ))}

    {getMisVotantes(estructura, currentUser).length === 0 && (
      <p className="text-gray-500 py-6">
        No tiene votantes asignados.
      </p>
    )}
  </>
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
    </div>
  );
};

export default Dashboard;
