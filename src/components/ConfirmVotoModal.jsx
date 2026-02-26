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
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          {isUndoing ? (
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 shrink-0" />
          )}
          <h3 className="text-base sm:text-lg font-bold">
            {isUndoing ? "Anular Confirmación" : "Confirmar Voto"}
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 truncate">
          {votante.nombre} {votante.apellido} — CI: {votante.ci}
        </p>

        <p className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6">
          {isUndoing
            ? "¿Está seguro que desea anular la confirmación de este votante?"
            : "¿Está seguro que desea confirmar este voto? Esta acción no podrá deshacerse."}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-10 px-4 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-10 px-4 rounded-lg text-white text-sm font-medium disabled:opacity-50 ${
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
