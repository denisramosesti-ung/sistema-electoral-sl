import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

const ConfirmVotoModal = ({
  open,
  votante,
  isUndoing,
  onCancel,
  onConfirm,
  isLoading,
}) => {
  if (!open || !votante) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          {isUndoing ? (
            <AlertCircle className="w-6 h-6 text-red-600" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
          <h3 className="text-lg font-bold">
            {isUndoing ? "Anular Confirmación" : "Confirmar Voto"}
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {votante.nombre} {votante.apellido} — CI: {votante.ci}
        </p>

        <p className="text-sm text-gray-700 mb-6">
          {isUndoing
            ? "¿Está seguro que desea anular la confirmación de este votante?"
            : "¿Confirmar que este votante ya emitió su voto?"}
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
              isUndoing
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? "Procesando..." : isUndoing ? "Anular" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmVotoModal;
