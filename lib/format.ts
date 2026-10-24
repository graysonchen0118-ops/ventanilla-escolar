export function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** minúsculas, sin tildes ni signos, para comparar lo que escribe la familia */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const dfCorta = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
const dfLarga = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const dfHora = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" });

export const fechaCorta = (iso: string) => dfCorta.format(new Date(iso)).replace(".", "");
export const fechaLarga = (iso: string) => dfLarga.format(new Date(iso));
export const hora = (iso: string) => dfHora.format(new Date(iso)).replace(/ /g, " ");

export function haceCuanto(iso: string, ahora = Date.now()) {
  const s = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 1000));
  if (s < 50) return "hace un momento";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "hace 1 hora" : `hace ${h} horas`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export const tel = (t: string) => t.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3");
export const soloDigitos = (t: string) => t.replace(/\D/g, "");

export const pesos = (n: number) => "$ " + n.toLocaleString("es-CO");

export const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const uid = (p: string) => p + "-" + Math.random().toString(36).slice(2, 8);

export function pulso(detalle?: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ventanilla:pulso", { detail: detalle }));
}
