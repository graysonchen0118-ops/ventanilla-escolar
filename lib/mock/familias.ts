import type { Acudiente, Estudiante, Relacion } from "../types";
import { mulberry32 } from "../format";

export const GRADOS = ["Transición", "1.º", "2.º", "3.º", "4.º", "5.º", "6.º", "7.º", "8.º", "9.º", "10.º", "11.º"];
export const nombreGrado = (g: number) => GRADOS[g] ?? `${g}.º`;
export const esPrimaria = (g: number) => g <= 5;

// Tres familias fijas: son las que se usan en "Probar el asistente".
export const TEL_VALENTINA = "3005550142";
export const TEL_TOMAS = "3125550163";
export const TEL_DESCONOCIDO = "3155550199";

const NOMBRES = [
  ["Samuel", "Ortiz"], ["Isabella", "Gómez"], ["Matías", "Cárdenas"], ["Sofía", "Navarro"], ["Emilia", "Duarte"],
  ["Santiago", "Beltrán"], ["Mariana", "Quintero"], ["Jerónimo", "Salazar"], ["Luciana", "Pardo"], ["Martín", "Acosta"],
  ["Antonella", "Vargas"], ["Juan José", "Molina"], ["Salomé", "Castaño"], ["Emmanuel", "Rueda"], ["Gabriela", "León"],
  ["Thiago", "Suárez"], ["Sara", "Mejía"], ["Daniel", "Ospina"], ["Violeta", "Cruz"], ["Nicolás", "Parra"],
  ["Abril", "Montoya"], ["Simón", "Restrepo"], ["Valeria", "Peña"], ["Joaquín", "Lozano"], ["Manuela", "Cortés"],
  ["Felipe", "Arango"], ["María José", "Rincón"], ["David", "Guzmán"], ["Paula", "Barrera"], ["Agustín", "Mora"],
  ["Camila", "Jiménez"], ["Lucas", "Vega"], ["Elena", "Serrano"], ["Andrés Felipe", "Bravo"], ["Juliana", "Torres"],
  ["Esteban", "Aguirre"], ["Renata", "Silva"], ["Miguel Ángel", "Rivas"], ["Laura", "Franco"], ["Sebastián", "Gil"],
  ["Ana Sofía", "Medina"], ["Pablo", "Carvajal"], ["Catalina", "Ruiz"], ["Mateo", "Hernández"], ["Lucía", "Mendoza"],
];
const MAMAS = ["Paola", "Claudia", "Liliana", "Adriana", "Sandra", "Natalia", "Carolina", "Diana", "Viviana", "Marcela", "Johana", "Andrea", "Yolanda", "Ángela", "Lorena", "Mónica"];
const PAPAS = ["Hernán", "Jorge", "Ricardo", "Fabián", "Óscar", "Mauricio", "Wilson", "Germán", "Alexander", "Camilo", "Edwin", "Luis Carlos"];
const OTROS: [Relacion, string][] = [["Abuela", "Gloria"], ["Abuela", "Rosalba"], ["Tía", "Marisol"], ["Abuelo", "Efraín"], ["Tío", "Jairo"], ["Acudiente", "Esperanza"]];

function telefono(r: () => number, usados: Set<string>) {
  for (;;) {
    const pre = ["300", "301", "304", "310", "311", "313", "316", "318", "320", "321"][Math.floor(r() * 10)];
    const t = pre + "555" + String(Math.floor(r() * 9000) + 1000);
    if (!usados.has(t)) {
      usados.add(t);
      return t;
    }
  }
}

export function crearFamilias(): Estudiante[] {
  const r = mulberry32(2026);
  const usados = new Set<string>([TEL_VALENTINA, TEL_TOMAS, TEL_DESCONOCIDO, "3005550118", "3105550187", "3115550174"]);
  const lista: Estudiante[] = [
    {
      id: "e-valentina", nombre: "Valentina Ríos", grado: 5, curso: "5.ºB", activo: true,
      acudientes: [{ id: "a-paola", nombre: "Paola Ríos", relacion: "Mamá", telefono: TEL_VALENTINA }, { id: "a-hector", nombre: "Héctor Ríos", relacion: "Papá", telefono: "3005550118" }],
    },
    {
      id: "e-tomas", nombre: "Tomás Herrera", grado: 9, curso: "9.ºA", activo: true, telefonoPropio: TEL_TOMAS,
      acudientes: [{ id: "a-claudia", nombre: "Claudia Herrera", relacion: "Mamá", telefono: "3115550174" }],
    },
    {
      id: "e-samuel", nombre: "Samuel Ortiz", grado: 2, curso: "2.ºA", activo: true,
      acudientes: [{ id: "a-hernan", nombre: "Hernán Ortiz", relacion: "Papá", telefono: "3105550187" }],
    },
  ];
  NOMBRES.slice(1).forEach(([n, ap], i) => {
    const grado = i % 12;
    const curso = `${nombreGrado(grado).replace("Transición", "T")}${r() > 0.5 ? "A" : "B"}`;
    const acudientes: Acudiente[] = [];
    const conMama = r() > 0.12;
    if (conMama) acudientes.push({ id: `a-${i}-m`, nombre: `${MAMAS[Math.floor(r() * MAMAS.length)]} ${ap}`, relacion: "Mamá", telefono: telefono(r, usados) });
    if (!conMama || r() > 0.45) acudientes.push({ id: `a-${i}-p`, nombre: `${PAPAS[Math.floor(r() * PAPAS.length)]} ${ap}`, relacion: "Papá", telefono: telefono(r, usados) });
    if (r() > 0.82) {
      const [rel, nom] = OTROS[Math.floor(r() * OTROS.length)];
      acudientes.push({ id: `a-${i}-o`, nombre: `${nom} ${ap}`, relacion: rel, telefono: telefono(r, usados) });
    }
    lista.push({
      id: `e-${i}`,
      nombre: `${n} ${ap}`,
      grado,
      curso: grado === 0 ? `Transición ${curso.slice(-1)}` : curso,
      acudientes,
      telefonoPropio: grado >= 8 && r() > 0.4 ? telefono(r, usados) : undefined,
      activo: r() > 0.04,
    });
  });
  return lista;
}
