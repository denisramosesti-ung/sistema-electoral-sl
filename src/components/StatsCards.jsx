import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function StatsCards({ role, stats }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {role === "superadmin" && (
        <>
          <Card label="Coordinadores" value={stats.coordinadores} />
          <Card label="Subcoordinadores" value={stats.subcoordinadores} />
          <Card label="Votantes" value={stats.votantes} />
          <CardProgress
            confirmed={stats.votosConfirmados}
            total={stats.votantes}
            percentage={stats.porcentajeConfirmados}
          />
        </>
      )}

      {role === "coordinador" && (
        <>
          <Card label="Subcoordinadores" value={stats.subcoordinadores} />
          <Card label="Votantes directos" value={stats.votantesDirectos} />
          <Card label="Total en red" value={stats.total} />
          <CardProgress
            confirmed={stats.votosConfirmados}
            total={stats.total}
            percentage={stats.porcentajeConfirmados}
          />
        </>
      )}

      {role === "subcoordinador" && (
        <>
          <Card label="Mis votantes" value={stats.votantes} />
          <CardProgress
            confirmed={stats.votosConfirmados}
            total={stats.votantes}
            percentage={stats.porcentajeConfirmados}
          />
        </>
      )}
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-800">{value ?? 0}</p>
    </div>
  );
}

function CardProgress({ confirmed, total, percentage }) {
  const pct = percentage ?? 0;
  const colorBar =
    pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-brand-500";
  const colorText =
    pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-slate-600";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Votos Confirmados
        </p>
        <div className="p-1.5 bg-emerald-50 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-2">
        {confirmed ?? 0}
        <span className="text-base text-slate-400 font-normal">/{total ?? 0}</span>
      </p>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${colorBar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs font-bold mt-1.5 ${colorText}`}>{pct}% confirmado</p>
    </div>
  );
}
