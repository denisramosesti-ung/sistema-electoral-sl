// src/utils/padronCache.js

const PADRON_VERSION = "v1"; // cambialo a v2 si algún día cambias el padrón
const PADRON_KEY = "padron_data";
const PADRON_VER_KEY = "padron_version";

export const getPadronCache = () => {
  try {
    const ver = localStorage.getItem(PADRON_VER_KEY);
    const raw = localStorage.getItem(PADRON_KEY);
    if (ver !== PADRON_VERSION || !raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
};

export const setPadronCache = (padronArray) => {
  try {
    localStorage.setItem(PADRON_KEY, JSON.stringify(padronArray));
    localStorage.setItem(PADRON_VER_KEY, PADRON_VERSION);
    return true;
  } catch (e) {
    // si el storage se llena, fallará (quota exceeded)
    console.error("No se pudo guardar padrón en localStorage:", e);
    return false;
  }
};

export const clearPadronCache = () => {
  localStorage.removeItem(PADRON_KEY);
  localStorage.removeItem(PADRON_VER_KEY);
};
