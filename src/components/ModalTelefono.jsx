// ======================= MODAL TELÉFONO =======================
// Modal reutilizable para editar teléfono
// No conoce Supabase, solo emite eventos

import React from "react";

const ModalTelefono = ({
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
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
        <h3 className="text-lg font-bold mb-2">Editar teléfono</h3>
        <p className="text-sm text-gray-600 mb-4">
          {persona.nombre} {persona.apellido} — CI: {persona.ci}
        </p>

        <label className="text-sm font-medium text-gray-700">
          Número (formato +595…)
        </label>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          placeholder="+595..."
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTelefono;
