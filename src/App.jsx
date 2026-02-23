// ======================= APP SISTEMA ELECTORAL =======================
// App maneja SOLO sesión/login.
// Dashboard maneja TODO lo demás.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Users } from "lucide-react";
import Dashboard from "./components/Dashboard";
import { normalizeCI } from "./utils/estructuraHelpers";

// ======================= SUPERADMINS LOCALES =======================
const SUPERADMINS = [
  {
    ci: "4630621",
    pass: "16052018",
    nombre: "Denis",
    apellido: "Ramos",
  },
];

const App = () => {
  // ======================= SESIÓN =======================
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ======================= SESIÓN PERSISTENTE =======================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (!saved) return;

    try {
      const u = JSON.parse(saved);
      if (u && u.ci && u.role) setCurrentUser(u);
    } catch (e) {
      console.error("Error leyendo sesión local:", e);
    }
  }, []);

  const getPersonasBuscables = () => {
  if (!currentUser || !estructura) return [];

  // SUPERADMIN: toda la estructura
  if (currentUser.role === "superadmin") {
    return [
      ...estructura.coordinadores.map((c) => ({
        ...c,
        tipo: "coordinador",
      })),
      ...estructura.subcoordinadores.map((s) => ({
        ...s,
        tipo: "subcoordinador",
      })),
      ...estructura.votantes.map((v) => ({
        ...v,
        tipo: "votante",
      })),
    ];
  }

  // COORDINADOR
  if (currentUser.role === "coordinador") {
    return [
      {
        ...currentUser,
        tipo: "coordinador",
      },
      ...estructura.subcoordinadores
        .filter((s) => s.coordinadorCI === currentUser.ci)
        .map((s) => ({ ...s, tipo: "subcoordinador" })),
      ...estructura.votantes
        .filter((v) => v.asignadoPor === currentUser.ci)
        .map((v) => ({ ...v, tipo: "votante" })),
    ];
  }

  // SUBCOORDINADOR
  if (currentUser.role === "subcoordinador") {
    return [
      {
        ...currentUser,
        tipo: "subcoordinador",
      },
      ...estructura.votantes
        .filter((v) => v.asignadoPor === currentUser.ci)
        .map((v) => ({ ...v, tipo: "votante" })),
    ];
  }

  return [];
};


  // ======================= LOGIN =======================
  const handleLogin = async () => {
    const code = loginID.trim();
    if (!code) return alert("Ingrese CI o código.");

    // ======================= SUPERADMIN LOCAL =======================
    const superadmin = SUPERADMINS.find((s) => s.ci === code);

    if (superadmin) {
      if (loginPass !== superadmin.pass) {
        return alert("Contraseña incorrecta.");
      }

      const u = {
        ci: superadmin.ci,
        nombre: superadmin.nombre,
        apellido: superadmin.apellido,
        role: "superadmin",
      };

      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    // ======================= COORDINADOR =======================
    const { data: coord, error: coordErr } = await supabase
      .from("coordinadores")
      .select("ci,login_code,telefono,padron(*)")
      .eq("login_code", code)
      .maybeSingle();

    if (coordErr) console.error("Error login coord:", coordErr);

    if (coord?.padron) {
      const u = {
        ci: normalizeCI(coord.ci),
        nombre: coord.padron.nombre,
        apellido: coord.padron.apellido,
        telefono: coord.telefono || "",
        role: "coordinador",
      };
      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    // ======================= SUBCOORDINADOR =======================
    const { data: sub, error: subErr } = await supabase
      .from("subcoordinadores")
      .select("ci,login_code,telefono,coordinador_ci,padron(*)")
      .eq("login_code", code)
      .maybeSingle();

    if (subErr) console.error("Error login sub:", subErr);

    if (sub?.padron) {
      const u = {
        ci: normalizeCI(sub.ci),
        nombre: sub.padron.nombre,
        apellido: sub.padron.apellido,
        telefono: sub.telefono || "",
        role: "subcoordinador",
      };
      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    alert("Usuario no encontrado.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setLoginID("");
    setLoginPass("");
  };

  // ======================= LOGIN VIEW =======================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-red-600 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800 mt-3">
              Sistema Electoral
            </h1>
            <p className="text-gray-600">Gestión de Votantes</p>
          </div>

          <label className="text-sm font-medium text-gray-700">
            CI o Código de Acceso
          </label>
          <input
            type="text"
            value={loginID}
            onChange={(e) => setLoginID(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
            placeholder="Ej: A1B2C3D4"
          />

          {/* CONTRASEÑA SOLO PARA SUPERADMINS */}
{SUPERADMINS.some((s) => s.ci === loginID.trim()) && (
  <>
    <label className="text-sm font-medium text-gray-700">
      Contraseña Superadmin
    </label>
    <input
      type="password"
      value={loginPass}
      onChange={(e) => setLoginPass(e.target.value)}
      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
      placeholder="Ingrese contraseña"
    />
  </>
)}


          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold mb-3"
          >
            Iniciar Sesión
          </button>

          <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-700">
            <p className="font-semibold mb-2">Instrucciones:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Ingrese CI o código.</li>
              <li>Ingrese su contraseña.</li>
              <li>Ante dudas, comuníquese con el administrador.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ======================= DASHBOARD =======================
  return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;
