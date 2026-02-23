import React from "react";
import { MapPin } from "lucide-react";

const ModalDireccion = ({
  open,
  persona,
  value,
  onChange,
  onCancel,
  onSave,
}) => {
  if (!open || !persona) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold">Editar Dirección</h3>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 truncate">
          {persona.nombre} {persona.apellido} — CI: {persona.ci}
        </p>

        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Dirección
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
          placeholder="Ingrese la dirección..."
          rows={3}
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 px-4 rounded-lg border text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex-1 h-10 px-4 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDireccion;
