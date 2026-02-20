export default function StatsCards({ role, stats }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {role === "superadmin" && (
        <>
          <Card title="Coordinadores" value={stats.coordinadores} />
          <Card title="Subcoordinadores" value={stats.subcoordinadores} />
          <Card title="Votantes" value={stats.votantes} />
        </>
      )}

      {role === "coordinador" && (
        <>
          <Card title="Subcoordinadores" value={stats.subcoordinadores} />
          <Card title="Votantes directos" value={stats.votantesDirectos} />
          <Card title="Total en red" value={stats.total} />
        </>
      )}

      {role === "subcoordinador" && (
        <Card title="Mis votantes" value={stats.votantes} />
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-4xl font-bold text-red-600">{value}</p>
    </div>
  );
}
