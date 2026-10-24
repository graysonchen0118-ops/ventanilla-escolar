"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Acudiente, Alerta, Caso, Documento, EstadoCaso, Estudiante, Motivo, Registro } from "./types";
import { DOCUMENTOS } from "./mock/documentos";
import { crearFamilias } from "./mock/familias";
import { crearAlertas, crearCasos, crearRegistro } from "./mock/casos";
import { persona } from "./mock/equipo";
import { CLAVES_DELICADAS, decidir, type Decision } from "./bot";
import { espera, norm, pulso, soloDigitos, uid } from "./format";

export interface Toast {
  id: string;
  texto: string;
  tono: "ok" | "error" | "info";
}

export interface Resultado {
  decision: Decision;
  casoId?: string;
  alertaId?: string;
}

interface Ctx {
  listo: boolean;
  ahora: number;
  docs: Documento[];
  familias: Estudiante[];
  casos: Caso[];
  alertas: Alerta[];
  registro: Registro[];
  claves: string[];
  toasts: Toast[];
  toast: (texto: string, tono?: Toast["tono"]) => void;
  procesar: (texto: string, telefono: string) => Promise<Resultado>;
  responderCaso: (id: string, texto: string, autor: string) => Promise<void>;
  estadoCaso: (id: string, estado: EstadoCaso) => Promise<void>;
  asignarCaso: (id: string, quien: string | undefined) => Promise<void>;
  eliminarCaso: (id: string) => Promise<void>;
  crearCaso: (c: { remitente: string; telefono: string; estudianteId?: string; motivo: Motivo; resumen: string }) => Promise<string>;
  tomarAlerta: (id: string, quien: string) => Promise<void>;
  notaAlerta: (id: string, texto: string, autor: string) => Promise<void>;
  cerrarAlerta: (id: string, nota: string, autor: string) => Promise<void>;
  reabrirAlerta: (id: string) => Promise<void>;
  agregarClave: (c: string) => void;
  quitarClave: (c: string) => void;
  guardarDoc: (d: Documento, nuevo: boolean, nota?: string) => Promise<void>;
  archivarDoc: (id: string, vigente: boolean) => Promise<void>;
  eliminarDoc: (id: string) => Promise<void>;
  guardarEstudiante: (e: Estudiante, nuevo: boolean) => Promise<void>;
  eliminarEstudiante: (id: string) => Promise<void>;
  registrarNumero: (estudianteId: string, a: Omit<Acudiente, "id">) => Promise<void>;
}

const StoreCtx = createContext<Ctx | null>(null);

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore fuera del proveedor");
  return c;
}

export class ErrorValidacion extends Error {}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [listo, setListo] = useState(false);
  const [ahora, setAhora] = useState(0);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [familias, setFamilias] = useState<Estudiante[]>([]);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [registro, setRegistro] = useState<Registro[]>([]);
  const [claves, setClaves] = useState<string[]>(CLAVES_DELICADAS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ref = useRef({ docs, familias, claves, casos, alertas });
  ref.current = { docs, familias, claves, casos, alertas };

  useEffect(() => {
    let vivo = true;
    (async () => {
      await espera(650);
      if (!vivo) return;
      const t = Date.now();
      const fam = crearFamilias();
      setAhora(t);
      setDocs(DOCUMENTOS.map((d) => ({ ...d, historial: [...d.historial] })));
      setFamilias(fam);
      setCasos(crearCasos(t, fam));
      setAlertas(crearAlertas(t, fam));
      setRegistro(crearRegistro(t, DOCUMENTOS, fam));
      setListo(true);
    })();
    const iv = setInterval(() => setAhora(Date.now()), 30000);
    return () => {
      vivo = false;
      clearInterval(iv);
    };
  }, []);

  const toast = useCallback((texto: string, tono: Toast["tono"] = "ok") => {
    const id = uid("t");
    setToasts((x) => [...x.slice(-3), { id, texto, tono }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3800);
  }, []);

  const procesar = useCallback(async (texto: string, telefono: string): Promise<Resultado> => {
    await espera(900 + Math.random() * 600);
    const { docs, familias, claves, casos, alertas } = ref.current;
    const decision = decidir(texto, telefono, { docs, familias, claves });
    const ya = new Date().toISOString();
    const out: Resultado = { decision };
    const tipoReg = decision.tipo === "saludo" || decision.tipo === "gracias" ? null : decision.tipo;
    if (tipoReg) setRegistro((r) => [{ id: uid("r"), hora: ya, tipo: tipoReg, docId: decision.doc?.id, telefono }, ...r]);
    if (decision.doc) setDocs((ds) => ds.map((d) => (d.id === decision.doc!.id ? { ...d, consultas: d.consultas + 1 } : d)));
    const remitente = decision.quien.acudiente
      ? `${decision.quien.acudiente.nombre} (${decision.quien.acudiente.relacion.toLowerCase()})`
      : decision.quien.estudiante
        ? `${decision.quien.estudiante.nombre} (estudiante)`
        : "Número no registrado";
    if (decision.tipo === "personal" || decision.tipo === "sin respuesta") {
      const numero = Math.max(1000, ...casos.map((c) => c.numero)) + 1;
      const id = `c-${numero}`;
      out.casoId = id;
      setCasos((cs) => [
        {
          id,
          numero,
          creado: ya,
          telefono,
          remitente,
          estudianteId: decision.sobre?.id ?? decision.quien.vinculados[0]?.id,
          motivo: decision.motivo ?? "Sin respuesta",
          resumen: decision.resumen ?? texto,
          mensajes: [
            { de: "familia", texto, hora: ya },
            { de: "asistente", texto: decision.respuesta, hora: ya },
          ],
          estado: "pendiente",
          prioridad: decision.motivo === "Asistencia" ? "alta" : "normal",
        },
        ...cs,
      ]);
    }
    if (decision.tipo === "delicado") {
      const numero = Math.max(200, ...alertas.map((a) => a.numero)) + 1;
      const id = `al-${numero}`;
      out.alertaId = id;
      setAlertas((as) => [
        { id, numero, creado: ya, telefono, remitente, estudianteId: decision.sobre?.id, texto, tema: decision.tema ?? "Convivencia", estado: "nueva", notas: [] },
        ...as,
      ]);
    }
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ventanilla:evento", { detail: decision.tipo }));
    return out;
  }, []);

  const mutCaso = (id: string, f: (c: Caso) => Caso) => setCasos((cs) => cs.map((c) => (c.id === id ? f(c) : c)));

  const responderCaso = useCallback(async (id: string, texto: string, autor: string) => {
    if (!texto.trim()) throw new ErrorValidacion("Escriba la respuesta antes de enviarla.");
    await espera(700);
    mutCaso(id, (c) => ({ ...c, estado: c.estado === "pendiente" ? "en curso" : c.estado, asignado: c.asignado ?? autor, mensajes: [...c.mensajes, { de: "equipo", texto: texto.trim(), hora: new Date().toISOString(), autor }] }));
    pulso("caso");
    toast("Respuesta enviada por WhatsApp");
  }, [toast]);

  const estadoCaso = useCallback(async (id: string, estado: EstadoCaso) => {
    await espera(450);
    mutCaso(id, (c) => ({ ...c, estado }));
    pulso("caso");
    toast(estado === "resuelto" ? "Caso marcado como resuelto" : estado === "en curso" ? "Caso en curso" : "Caso reabierto");
  }, [toast]);

  const asignarCaso = useCallback(async (id: string, quien: string | undefined) => {
    await espera(350);
    mutCaso(id, (c) => ({ ...c, asignado: quien }));
    toast(quien ? `Asignado a ${persona(quien)?.nombre}` : "Caso sin asignar", "info");
  }, [toast]);

  const eliminarCaso = useCallback(async (id: string) => {
    await espera(500);
    setCasos((cs) => cs.filter((c) => c.id !== id));
    toast("Caso eliminado", "info");
  }, [toast]);

  const crearCaso = useCallback(async (d: { remitente: string; telefono: string; estudianteId?: string; motivo: Motivo; resumen: string }) => {
    if (!d.remitente.trim() || !d.resumen.trim()) throw new ErrorValidacion("Falta el nombre de quien consulta o el resumen.");
    if (soloDigitos(d.telefono).length !== 10) throw new ErrorValidacion("El teléfono debe tener 10 dígitos.");
    await espera(650);
    const numero = Math.max(1000, ...ref.current.casos.map((c) => c.numero)) + 1;
    const ya = new Date().toISOString();
    const id = `c-${numero}`;
    setCasos((cs) => [
      { id, numero, creado: ya, telefono: soloDigitos(d.telefono), remitente: d.remitente.trim(), estudianteId: d.estudianteId, motivo: d.motivo, resumen: d.resumen.trim(), mensajes: [{ de: "equipo", texto: `Caso abierto por llamada: ${d.resumen.trim()}`, hora: ya, autor: "marta" }], estado: "pendiente", prioridad: "normal" },
      ...cs,
    ]);
    pulso("caso");
    toast(`Caso #${numero} creado`);
    return id;
  }, [toast]);

  const mutAlerta = (id: string, f: (a: Alerta) => Alerta) => setAlertas((as) => as.map((a) => (a.id === id ? f(a) : a)));

  const tomarAlerta = useCallback(async (id: string, quien: string) => {
    await espera(500);
    mutAlerta(id, (a) => ({ ...a, estado: "en atención", responsable: quien }));
    pulso("alerta");
    toast(`${persona(quien)?.nombre} tomó la alerta`);
  }, [toast]);

  const notaAlerta = useCallback(async (id: string, texto: string, autor: string) => {
    if (!texto.trim()) throw new ErrorValidacion("La nota está vacía.");
    await espera(500);
    mutAlerta(id, (a) => ({ ...a, notas: [...a.notas, { autor, texto: texto.trim(), fecha: new Date().toISOString() }] }));
    toast("Nota guardada");
  }, [toast]);

  const cerrarAlerta = useCallback(async (id: string, nota: string, autor: string) => {
    if (nota.trim().length < 10) throw new ErrorValidacion("Para cerrar, deje una nota de cierre de al menos una frase.");
    await espera(600);
    mutAlerta(id, (a) => ({ ...a, estado: "cerrada", responsable: a.responsable ?? autor, notas: [...a.notas, { autor, texto: nota.trim(), fecha: new Date().toISOString() }] }));
    pulso("alerta");
    toast("Alerta cerrada con nota");
  }, [toast]);

  const reabrirAlerta = useCallback(async (id: string) => {
    await espera(400);
    mutAlerta(id, (a) => ({ ...a, estado: "en atención" }));
    toast("Alerta reabierta", "info");
  }, [toast]);

  const agregarClave = useCallback((c: string) => {
    const k = c.trim().toLowerCase();
    if (!norm(k)) return;
    setClaves((cs) => (cs.some((x) => norm(x) === norm(k)) ? cs : [...cs, k]));
    toast(`"${c.trim()}" ahora activa una alerta`);
  }, [toast]);

  const quitarClave = useCallback((c: string) => {
    setClaves((cs) => cs.filter((x) => x !== c));
    toast(`"${c}" ya no activa alertas`, "info");
  }, [toast]);

  const guardarDoc = useCallback(async (d: Documento, nuevo: boolean, nota?: string) => {
    if (!d.titulo.trim() || !d.codigo.trim()) throw new ErrorValidacion("El documento necesita un código y un título.");
    if (d.respuesta.trim().length < 20) throw new ErrorValidacion("El texto que usa el asistente es muy corto.");
    if (!d.claves.length) throw new ErrorValidacion("Agregue al menos una palabra con la que lo pregunten.");
    const dup = ref.current.docs.find((x) => x.id !== d.id && norm(x.codigo) === norm(d.codigo) && norm(x.titulo) === norm(d.titulo));
    if (dup) throw new ErrorValidacion(`Ya existe "${dup.codigo} · ${dup.titulo}".`);
    await espera(800);
    const ya = new Date().toISOString();
    if (nuevo) {
      setDocs((ds) => [{ ...d, id: uid("d"), version: 1, actualizado: ya, consultas: 0, historial: [{ version: 1, fecha: ya, autor: "Marta Cifuentes", nota: "Primera versión" }] }, ...ds]);
      toast("Documento publicado. El asistente ya lo usa.");
    } else {
      setDocs((ds) => ds.map((x) => (x.id === d.id ? { ...d, version: x.version + 1, actualizado: ya, historial: [{ version: x.version + 1, fecha: ya, autor: "Marta Cifuentes", nota: nota || "Cambio de texto" }, ...x.historial] } : x)));
      toast(`Versión ${d.version + 1} publicada. El asistente ya responde con ella.`);
    }
    pulso("doc");
  }, [toast]);

  const archivarDoc = useCallback(async (id: string, vigente: boolean) => {
    await espera(500);
    setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, vigente } : d)));
    pulso("doc");
    toast(vigente ? "Documento restaurado. Vuelve a usarse." : "Documento archivado. El asistente deja de usarlo.", "info");
  }, [toast]);

  const eliminarDoc = useCallback(async (id: string) => {
    await espera(500);
    setDocs((ds) => ds.filter((d) => d.id !== id));
    toast("Documento eliminado", "info");
  }, [toast]);

  const validarTelefonos = (e: Estudiante) => {
    const todos = e.acudientes.map((a) => soloDigitos(a.telefono));
    if (e.telefonoPropio) todos.push(soloDigitos(e.telefonoPropio));
    for (const t of todos) if (t.length !== 10) throw new ErrorValidacion("Cada teléfono debe tener 10 dígitos.");
    if (new Set(todos).size !== todos.length) throw new ErrorValidacion("Hay un teléfono repetido en esta familia.");
    for (const f of ref.current.familias) {
      if (f.id === e.id) continue;
      if (f.telefonoPropio && todos.includes(f.telefonoPropio)) throw new ErrorValidacion(`Ese número ya es el de ${f.nombre}.`);
    }
  };

  const guardarEstudiante = useCallback(async (e: Estudiante, nuevo: boolean) => {
    if (!e.nombre.trim()) throw new ErrorValidacion("Falta el nombre del estudiante.");
    if (!e.acudientes.length) throw new ErrorValidacion("Registre al menos un acudiente.");
    if (e.acudientes.some((a) => !a.nombre.trim())) throw new ErrorValidacion("Cada acudiente necesita nombre.");
    validarTelefonos(e);
    await espera(700);
    const limpio = { ...e, acudientes: e.acudientes.map((a) => ({ ...a, telefono: soloDigitos(a.telefono) })), telefonoPropio: e.telefonoPropio ? soloDigitos(e.telefonoPropio) : undefined };
    setFamilias((fs) => (nuevo ? [{ ...limpio, id: uid("e") }, ...fs] : fs.map((f) => (f.id === e.id ? limpio : f))));
    pulso("familia");
    toast(nuevo ? "Familia registrada" : "Cambios guardados");
  }, [toast]);

  const eliminarEstudiante = useCallback(async (id: string) => {
    await espera(500);
    setFamilias((fs) => fs.filter((f) => f.id !== id));
    toast("Registro eliminado", "info");
  }, [toast]);

  const registrarNumero = useCallback(async (estudianteId: string, a: Omit<Acudiente, "id">) => {
    const e = ref.current.familias.find((f) => f.id === estudianteId);
    if (!e) throw new ErrorValidacion("Elija el estudiante.");
    if (!a.nombre.trim()) throw new ErrorValidacion("Escriba el nombre del acudiente.");
    const nuevo = { ...e, acudientes: [...e.acudientes, { ...a, id: uid("a"), telefono: soloDigitos(a.telefono) }] };
    validarTelefonos(nuevo);
    await espera(650);
    setFamilias((fs) => fs.map((f) => (f.id === estudianteId ? nuevo : f)));
    pulso("familia");
    toast(`Número registrado con ${e.nombre}`);
  }, [toast]);

  const value = useMemo<Ctx>(
    () => ({ listo, ahora, docs, familias, casos, alertas, registro, claves, toasts, toast, procesar, responderCaso, estadoCaso, asignarCaso, eliminarCaso, crearCaso, tomarAlerta, notaAlerta, cerrarAlerta, reabrirAlerta, agregarClave, quitarClave, guardarDoc, archivarDoc, eliminarDoc, guardarEstudiante, eliminarEstudiante, registrarNumero }),
    [listo, ahora, docs, familias, casos, alertas, registro, claves, toasts, toast, procesar, responderCaso, estadoCaso, asignarCaso, eliminarCaso, crearCaso, tomarAlerta, notaAlerta, cerrarAlerta, reabrirAlerta, agregarClave, quitarClave, guardarDoc, archivarDoc, eliminarDoc, guardarEstudiante, eliminarEstudiante, registrarNumero],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
