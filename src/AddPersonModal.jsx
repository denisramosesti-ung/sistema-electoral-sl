// AddPersonModal.jsx
import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!show) {
      setSearchTerm("");
      setPage(1);
    }
  }, [show]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  if (!show) return null;

  const term = searchTerm.trim();

  // Normalizador: elimina tildes y mayúsculas
  const normalize = (text) =>
    (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // FILTRADO + BÚSQUEDA AVANZADA
  const filtered = term
    ? disponibles
        .filter((p) => {
          const fullName = `${p.nombre ?? ""} ${p.apellido ?? ""}`;
          const fullNameNorm = normalize(fullName);
          const ciTxt = (p.ci ?? "").toString().toLowerCase();

          const words = normalize(term)
            .split(" ")
            .filter(Boolean); // separa por espacios

          // Cada palabra debe existir en CI o en fullName (insensible a tildes)
          return words.every(
            (w) => ciTxt.includes(w) || fullNameNorm.includes(w)
          );
        })
        .sort((a, b) => {
          const exactA = a.ci?.toString() === searchTerm;
          const exactB = b.ci?.toString() === searchTerm;
          if (exactA && !exactB) return -1;
          if (!exactA && exactB) return 1;
          return (a.nombre || "").localeCompare(b.nombre || "");
        })
    : [];


  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const pageData = filtered.slice(startIdx, startIdx + pageSize);

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Subcoordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-4 border-b bg-red-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">{titulo}</h3>
          <button onClick={onClose} className="hover:text-gray-200 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar CI, nombre o apellido..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              Resultados: {filtered.length}
            </p>
          )}
        </div>

        {/* LISTA */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {!searchTerm ? (
            <p className="text-center text-gray-500 py-6">
              Escriba para buscar...
            </p>
          ) : pageData.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No se encontraron resultados
            </p>
          ) : (
            pageData.map((persona) => {
              const bloqueado = persona.asignado === true;
              const labelRol = persona.asignadoRol
                ? ` (${persona.asignadoRol})`
                : "";
              const asignador =
                persona.asignadoPorNombreResolved ||
                persona.asignadoPorNombre ||
                (persona.asignadoRol === "Coordinador"
                  ? "Superadmin"
                  : "Asignado");
              const asignadorRol =
                persona.asignadoPorRolResolved || persona.asignadoRol || "";

              return (
                <div
                  key={persona.ci}
                  onClick={() => !bloqueado && onAdd(persona)}
                  className={`p-4 border rounded-lg transition ${
                    bloqueado
                      ? "bg-gray-200 opacity-60 cursor-not-allowed"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-semibold text-gray-800">
                    {(persona.nombre || "").toUpperCase()}{" "}
                    {(persona.apellido || "").toUpperCase()}
                  </p>

                  <div className="text-sm text-gray-600 space-y-0.5">
                    <p>CI: {persona.ci}</p>
                    {persona.seccional && (
                      <p>Seccional: {persona.seccional}</p>
                    )}
                    {persona.local_votacion && (
                      <p>Local de votación: {persona.local_votacion}</p>
                    )}
                    {persona.mesa && <p>Mesa: {persona.mesa}</p>}
                    {persona.orden && <p>Orden: {persona.orden}</p>}
                  </div>

                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya asignado por {asignador}
                      {asignadorRol ? ` (${asignadorRol})` : labelRol}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN */}
        {filtered.length > pageSize && (
          <div className="flex justify-between items-center p-4 border-t bg-white">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              ◀ Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Siguiente ▶
            </button>
          </div>
        )}

        {/* BOTÓN CERRAR */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 hover:bg-gray-400 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPersonModal;
