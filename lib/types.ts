import type { Foto } from "./photos";

export type Categoria =
  | "Calendario"
  | "Costos y pagos"
  | "Matrículas"
  | "Uniformes"
  | "Transporte"
  | "Alimentación"
  | "Reglamento"
  | "Salidas"
  | "Horarios"
  | "Certificados"
  | "Útiles"
  | "Orientación"
  | "Salud";

export interface Version {
  version: number;
  fecha: string;
  autor: string;
  nota: string;
}

export interface Documento {
  id: string;
  codigo: string;
  titulo: string;
  categoria: Categoria;
  respuesta: string;
  claves: string[];
  vigente: boolean;
  actualizado: string;
  version: number;
  historial: Version[];
  consultas: number;
  foto?: Foto;
}

export type Relacion = "Mamá" | "Papá" | "Abuela" | "Abuelo" | "Tía" | "Tío" | "Acudiente";

export interface Acudiente {
  id: string;
  nombre: string;
  relacion: Relacion;
  telefono: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  grado: number; // 0 = transición, 1 a 11
  curso: string; // "5.ºB"
  acudientes: Acudiente[];
  telefonoPropio?: string;
  activo: boolean;
}

export type Motivo = "Notas" | "Pagos" | "Tareas" | "Asistencia" | "Permisos" | "Certificados" | "Sin respuesta";
export type EstadoCaso = "pendiente" | "en curso" | "resuelto";

export interface Mensaje {
  de: "familia" | "asistente" | "equipo";
  texto: string;
  hora: string;
  autor?: string;
}

export interface Caso {
  id: string;
  numero: number;
  creado: string;
  telefono: string;
  remitente: string;
  estudianteId?: string;
  motivo: Motivo;
  resumen: string;
  mensajes: Mensaje[];
  estado: EstadoCaso;
  asignado?: string;
  prioridad: "normal" | "alta";
}

export type Tema = "Convivencia" | "Ánimo" | "Casa" | "Seguridad";
export type EstadoAlerta = "nueva" | "en atención" | "cerrada";

export interface Nota {
  autor: string;
  texto: string;
  fecha: string;
}

export interface Alerta {
  id: string;
  numero: number;
  creado: string;
  telefono: string;
  remitente: string;
  estudianteId?: string;
  texto: string;
  tema: Tema;
  estado: EstadoAlerta;
  responsable?: string;
  notas: Nota[];
}

export type TipoRegistro = "general" | "personal" | "bloqueado" | "delicado" | "sin respuesta";

export interface Registro {
  id: string;
  hora: string;
  tipo: TipoRegistro;
  docId?: string;
  telefono: string;
}

export interface Persona {
  id: string;
  nombre: string;
  cargo: string;
  foto: string;
}
