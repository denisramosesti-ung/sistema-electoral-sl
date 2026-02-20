import { Users } from "lucide-react";

export default function Login({
  loginID,
  setLoginID,
  loginPass,
  setLoginPass,
  onLogin,
}) {
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
          placeholder="Ej: 1234567 o ABC123"
        />

        {loginID && (
  <div className="mb-4">
    <label className="text-sm font-medium text-gray-700">
      Contraseña
    </label>
    <input
      type="password"
      value={loginPass}
      onChange={(e) => setLoginPass(e.target.value)}
      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500"
      placeholder="Ingrese contraseña"
    />
  </div>
)}


        <button
          onClick={onLogin}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold mb-3"
        >
          Iniciar Sesión
        </button>

        <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-700">
          <p className="font-semibold mb-2">📋 Instrucciones:</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Ingrese el código proporcionado.</li>
            <li>Si es coordinador o sub, cuide su acceso.</li>
            <li>Ante dudas, comuníquese con el administrador.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
