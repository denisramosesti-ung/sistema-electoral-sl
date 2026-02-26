import React from "react";
import { MapPin, X } from "lucide-react";

const ModalDireccion = ({ open, persona, value, onChange, onCancel, onSave }) => {
  if (!open || !persona) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-modal overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Editar dirección</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border-0 bg-transparent shadow-none"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-slate-600 font-medium truncate">
            {persona.nombre} {persona.apellido}
            <span className="ml-1.5 text-slate-400 font-normal">— CI: {persona.ci}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Dirección
            </label>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50 resize-none leading-relaxed"
              placeholder="Calle, número, barrio, ciudad..."
              rows={3}
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1">
              La dirección ingresada reemplazará la del padrón para esta persona.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors bg-white"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex-1 h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors border-0 shadow-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDireccion;
