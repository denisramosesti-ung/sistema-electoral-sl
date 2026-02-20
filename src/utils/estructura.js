// ======================= HELPERS BASE =======================
  const normalizeCI = (v) => Number(v) || 0;

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("Código copiado!");
    } catch {
      alert("No se pudo copiar.");
    }
  };

  const toggleExpand = (ci) => {
    setExpandedCoords((prev) => ({
      ...prev,
      [normalizeCI(ci)]: !prev[normalizeCI(ci)],
    }));
  };