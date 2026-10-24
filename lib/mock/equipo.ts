import type { Persona } from "../types";
import { retrato } from "../photos";

export const EQUIPO: Persona[] = [
  { id: "marta", nombre: "Marta Cifuentes", cargo: "Secretaría académica", foto: retrato("marta") },
  { id: "diana", nombre: "Diana Rojas", cargo: "Auxiliar de secretaría", foto: retrato("diana") },
  { id: "carolina", nombre: "Carolina Méndez", cargo: "Tesorería", foto: retrato("carolina") },
  { id: "andres", nombre: "Andrés Pinzón", cargo: "Coordinación de convivencia", foto: retrato("andres") },
  { id: "lucia", nombre: "Lucía Rangel", cargo: "Orientación escolar", foto: retrato("lucia") },
];

export const persona = (id?: string) => EQUIPO.find((p) => p.id === id);

export const COLEGIO = {
  nombre: "Colegio Monteverde",
  linea: "320 555 0130",
  atencion: "lunes a viernes, de 7:00 a. m. a 3:30 p. m.",
};
