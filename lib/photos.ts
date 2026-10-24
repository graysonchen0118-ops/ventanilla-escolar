// Fotos reales de Unsplash, elegidas para un colegio latinoamericano.
const u = (id: string, w: number, h: number, extra = "") =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=80${extra}`;

export const FOTOS = {
  campus: "photo-1776788364600-7757fd90e693",
  arcos: "photo-1747409207355-bf833f9fcb2d",
  patio: "photo-1779370139449-42c74d55543c",
  uniformes: "photo-1612229693210-30e16029c415",
  aula: "photo-1589206946274-929e4da3996b",
  aulaMesas: "photo-1761208662734-fb46f1398551",
  salon: "photo-1577896851231-70ef18881754",
  tareas: "photo-1752652012034-b28eca1e2faa",
  archivador: "photo-1649954174454-767fd0a40fb6",
  restaurante: "photo-1675999656701-c141e77262c2",
  utiles: "photo-1654931800100-2ecf6eee7c64",
  colores: "photo-1774878520736-6cacbcce1b7b",
  biblioteca: "photo-1629470937874-f3c7ddc525af",
  cartelera: "photo-1774977867305-f0d5580e4afc",
  ruta: "photo-1583508805133-8fd03a9916d4",
  mochila: "photo-1726726192148-af52008ff663",
  libros: "photo-1503676260728-1c00da094a0b",
  mamaCelular: "photo-1687293233269-c6df38c3662f",
  celularNoche: "photo-1714327676544-48dafc3ffa41",
  marta: "photo-1664382951821-8151535191e5",
  diana: "photo-1595986630530-969786b19b4d",
  andres: "photo-1507003211169-0a1dd7228f2d",
  lucia: "photo-1573496799436-5c34ef41818d",
  carolina: "photo-1545921406-e8a234c30d85",
  camino: "photo-1772115258463-554e95b7018d",
  chicasUniforme: "photo-1753175843003-a7492d611bf9",
  celularesAula: "photo-1764720572685-632d44c6c11f",
  baile: "photo-1568805647554-0bcbfacef633",
  acto: "photo-1568805647390-a149179a06f6",
  vacuna: "photo-1576766125535-b04e15fd0273",
  escenario: "photo-1667386428097-74781c692dfb",
} as const;

export type Foto = keyof typeof FOTOS;

const RECORTE: Partial<Record<Foto, string>> = { campus: "&crop=bottom", camino: "&crop=bottom" };

export const foto = (f: Foto, w: number, h: number) => u(FOTOS[f], w, h, RECORTE[f] ?? "");
export const retrato = (f: Foto, s = 96) => u(FOTOS[f], s, s, "&crop=faces");
