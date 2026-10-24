import { CalendarCheck, CircleHelp, ClipboardCheck, FileBadge, GraduationCap, NotebookPen, Wallet, type LucideIcon } from "lucide-react";
import type { EstadoAlerta, EstadoCaso, Motivo, Tema } from "./types";

export const ICONO_MOTIVO: Record<Motivo, LucideIcon> = {
  Notas: GraduationCap,
  Pagos: Wallet,
  Tareas: NotebookPen,
  Asistencia: ClipboardCheck,
  Permisos: CalendarCheck,
  Certificados: FileBadge,
  "Sin respuesta": CircleHelp,
};

export const TONO_ESTADO: Record<EstadoCaso, "aviso" | "info" | "ok"> = {
  pendiente: "aviso",
  "en curso": "info",
  resuelto: "ok",
};

export const TONO_ALERTA: Record<EstadoAlerta, "error" | "apoyo" | "ok"> = {
  nueva: "error",
  "en atención": "apoyo",
  cerrada: "ok",
};

export const TONO_TEMA: Record<Tema, "error" | "apoyo" | "info" | "aviso"> = {
  Seguridad: "error",
  Convivencia: "apoyo",
  Ánimo: "info",
  Casa: "aviso",
};

export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
