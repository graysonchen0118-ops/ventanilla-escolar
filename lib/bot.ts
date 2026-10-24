import type { Acudiente, Documento, Estudiante, Motivo, Tema } from "./types";
import { fechaCorta, hora, norm, tel } from "./format";
import { COLEGIO } from "./mock/equipo";
import { TEXTO_HANDOFF, TEXTO_SIN_RESPUESTA } from "./mock/casos";

export type TipoDecision = "saludo" | "gracias" | "general" | "personal" | "bloqueado" | "delicado" | "sin respuesta";

export interface Quien {
  tipo: "acudiente" | "estudiante" | "desconocido";
  telefono: string;
  acudiente?: Acudiente;
  estudiante?: Estudiante;
  vinculados: Estudiante[];
}

export interface Paso {
  titulo: string;
  detalle: string;
  tono: "ok" | "alto" | "aviso" | "info";
}

export interface Decision {
  tipo: TipoDecision;
  respuesta: string;
  quien: Quien;
  doc?: Documento;
  archivado?: Documento;
  sobre?: Estudiante;
  motivo?: Motivo;
  tema?: Tema;
  resumen?: string;
  pasos: Paso[];
}

export const CLAVES_DELICADAS = [
  "no me dejan en paz", "me molestan", "me pegan", "le pegan", "lo empujan", "la empujan", "me empujan", "acoso", "bullying",
  "matoneo", "se burlan", "me siento solo", "me siento sola", "no quiero volver", "no quiero ir al colegio", "no quiero vivir",
  "me quiero morir", "hacerme daño", "haciendo daño", "me gritan", "muchos gritos", "tengo miedo", "me amenazan", "me quitan",
  "le quitan", "llorando", "nadie me habla", "apodos",
];

const PERSONALES = [
  "mi hijo", "mi hija", "mis hijos", "mi nieto", "mi nieta", "mi sobrino", "mi sobrina", "mis notas", "mi nota", "mi boletin",
  "cuanto debo", "lo que debo", "saldo", "como va", "como le fue", "como me fue", "le pusieron falla", "me pusieron falla",
  "tiene tareas", "le dejaron tareas", "tengo tareas", "permiso para", "recoger a", "retirar a", "certificado de", "constancia de",
  "notas de", "boletin de", "voy perdiendo", "va perdiendo", "recuperacion", "mis fallas", "sus notas", "su boletin",
];

const MOTIVOS: [Motivo, string[]][] = [
  ["Pagos", ["debo", "saldo", "pension", "pago", "paz y salvo", "recibo"]],
  ["Tareas", ["tarea", "tareas", "guia"]],
  ["Asistencia", ["falla", "fallas", "falto", "inasistencia", "llego tarde"]],
  ["Permisos", ["permiso", "recoger", "retirar", "salir temprano"]],
  ["Certificados", ["certificado", "constancia"]],
  ["Notas", ["nota", "notas", "boletin", "como va", "le fue", "me fue", "perdiendo", "recuperacion", "materia"]],
];

const FRASE_MOTIVO: Record<Motivo, string> = {
  Notas: "Pregunta por las notas de",
  Pagos: "Pregunta por el saldo de",
  Tareas: "Pregunta por las tareas de",
  Asistencia: "Consulta una inasistencia de",
  Permisos: "Pide un permiso para",
  Certificados: "Pide un certificado de",
  "Sin respuesta": "Pregunta sin respuesta en los documentos sobre",
};

const tiene = (t: string, frase: string) => t.includes(" " + frase + " ");

export function identificar(telefono: string, familias: Estudiante[]): Quien {
  const vinculados = familias.filter((f) => f.activo && f.acudientes.some((a) => a.telefono === telefono));
  if (vinculados.length) {
    return { tipo: "acudiente", telefono, acudiente: vinculados[0].acudientes.find((a) => a.telefono === telefono), vinculados };
  }
  const propio = familias.find((f) => f.activo && f.telefonoPropio === telefono);
  if (propio) return { tipo: "estudiante", telefono, estudiante: propio, vinculados: [propio] };
  return { tipo: "desconocido", telefono, vinculados: [] };
}

export function buscarDocumento(texto: string, docs: Documento[]) {
  const t = " " + norm(texto) + " ";
  const puntaje = (d: Documento) =>
    d.claves.reduce((s, c) => {
      const k = norm(c);
      if (!k) return s;
      if (tiene(t, k)) return s + k.split(" ").length * 2;
      if (k.length > 4 && !k.includes(" ") && t.includes(" " + k)) return s + 1;
      return s;
    }, 0);
  let mejor: Documento | undefined;
  let pm = 0;
  let archivado: Documento | undefined;
  let pa = 0;
  for (const d of docs) {
    const p = puntaje(d);
    if (!p) continue;
    if (d.vigente && p > pm) {
      mejor = d;
      pm = p;
    }
    if (!d.vigente && p > pa) {
      archivado = d;
      pa = p;
    }
  }
  return { doc: mejor, archivado: archivado && pa >= pm ? archivado : undefined };
}

function mencionado(texto: string, familias: Estudiante[]) {
  const t = " " + norm(texto) + " ";
  return familias.find((f) => {
    const partes = norm(f.nombre).split(" ");
    return tiene(t, norm(f.nombre)) || (partes.length >= 2 && tiene(t, partes[0] + " " + partes[partes.length - 1]));
  });
}

const cuando = () => {
  const h = new Date().getHours();
  return h >= 6 && h < 15 ? "hoy mismo" : "mañana a primera hora";
};

export function decidir(texto: string, telefono: string, ctx: { docs: Documento[]; familias: Estudiante[]; claves: string[] }): Decision {
  const quien = identificar(telefono, ctx.familias);
  const t = " " + norm(texto) + " ";
  const tu = quien.tipo === "estudiante";
  const pasos: Paso[] = [];

  if (quien.tipo === "acudiente") {
    const e = quien.vinculados[0];
    const mas = quien.vinculados.length > 1 ? ` y ${quien.vinculados.length - 1} más` : "";
    pasos.push({ titulo: "Quién escribe", detalle: `${tel(telefono)} · ${quien.acudiente?.nombre}, ${quien.acudiente?.relacion.toLowerCase()} de ${e.nombre} (${e.curso})${mas}. Número registrado.`, tono: "ok" });
  } else if (quien.tipo === "estudiante") {
    pasos.push({ titulo: "Quién escribe", detalle: `${tel(telefono)} · ${quien.estudiante?.nombre}, estudiante de ${quien.estudiante?.curso}. Número registrado.`, tono: "ok" });
  } else {
    pasos.push({ titulo: "Quién escribe", detalle: `${tel(telefono)} · este número no está registrado en ninguna familia.`, tono: "aviso" });
  }

  // 1. Lo delicado va primero: no se responde, se avisa.
  const claveDelicada = ctx.claves.find((c) => tiene(t, norm(c)));
  if (claveDelicada) {
    const otro = mencionado(texto, ctx.familias);
    const sobre = quien.estudiante ?? otro ?? quien.vinculados[0];
    const tema: Tema = /gritos|casa/.test(t) ? "Casa" : /miedo|amenaz|quitan|dano|morir|vivir/.test(t) ? "Seguridad" : /sol[oa]|habla|llorando|ganas/.test(t) ? "Ánimo" : "Convivencia";
    pasos.push({ titulo: "Qué tipo de mensaje es", detalle: `Delicado: habla de cómo está un estudiante ("${claveDelicada}"). El asistente no aconseja.`, tono: "alto" });
    pasos.push({ titulo: "De dónde sale la respuesta", detalle: "De ningún documento. Solo una frase de acompañamiento, siempre la misma.", tono: "info" });
    pasos.push({ titulo: "Qué hizo", detalle: "Avisó a orientación en este momento, con el mensaje completo.", tono: "alto" });
    return {
      tipo: "delicado",
      quien,
      sobre,
      tema,
      pasos,
      respuesta: tu
        ? `Gracias por contármelo. Esto no te lo voy a responder yo: ya le avisé a Lucía Rangel, la orientadora del colegio, para que te busque ${cuando()}. Si sientes que estás en peligro ahora mismo, busca a un adulto de confianza que esté cerca.`
        : `Gracias por avisarnos. Esto no lo responde el asistente: ya le pasé su mensaje a Lucía Rangel, la orientadora del colegio, que se comunica con usted ${cuando()}.`,
    };
  }

  const palabras = norm(texto).split(" ").filter(Boolean);
  if (palabras.length <= 4 && /^(hola|buenas|buenos|buen dia|saludos)/.test(norm(texto))) {
    pasos.push({ titulo: "Qué tipo de mensaje es", detalle: "Saludo.", tono: "info" });
    pasos.push({ titulo: "Qué hizo", detalle: "Se presentó y dijo qué puede responder.", tono: "ok" });
    return {
      tipo: "saludo",
      quien,
      pasos,
      respuesta: tu
        ? `Hola, ${quien.estudiante?.nombre.split(" ")[0]}. Soy el asistente del ${COLEGIO.nombre}. Te ayudo con fechas, horarios, salidas y todo lo que está en las circulares.`
        : `Hola, soy el asistente del ${COLEGIO.nombre}. Le ayudo con fechas, costos, matrículas, uniformes, ruta y todo lo que está en las circulares. Lo de cada estudiante se lo paso a la secretaría.`,
    };
  }
  if (palabras.length <= 5 && /gracias/.test(norm(texto))) {
    pasos.push({ titulo: "Qué tipo de mensaje es", detalle: "Agradecimiento.", tono: "info" });
    return { tipo: "gracias", quien, pasos, respuesta: "Con mucho gusto. Aquí estoy para lo que necesite." };
  }

  // 2. Lo de un estudiante: solo avanza con el número registrado de su familia.
  const otro = mencionado(texto, ctx.familias);
  const esPersonal = PERSONALES.some((p) => tiene(t, p)) || !!otro;
  if (esPersonal) {
    const motivo = (MOTIVOS.find(([, ks]) => ks.some((k) => t.includes(" " + k)))?.[0] ?? "Notas") as Motivo;
    const ajeno = otro && !quien.vinculados.some((v) => v.id === otro.id);
    if (quien.tipo === "desconocido" || ajeno) {
      pasos.push({
        titulo: "Qué tipo de mensaje es",
        detalle: ajeno ? `Personal: menciona a ${otro!.nombre}, que no está vinculado a este número.` : "Personal: pide información de un estudiante.",
        tono: "alto",
      });
      pasos.push({ titulo: "De dónde sale la respuesta", detalle: "No se consulta nada del estudiante.", tono: "alto" });
      pasos.push({ titulo: "Qué hizo", detalle: "No compartió nada y explicó cómo registrar el número en secretaría.", tono: "alto" });
      return {
        tipo: "bloqueado",
        quien,
        sobre: otro,
        motivo,
        pasos,
        respuesta: ajeno && quien.tipo !== "desconocido"
          ? "Ese estudiante no está registrado con este número, así que no puedo compartir su información. Si usted es su acudiente, puede registrar el número en secretaría."
          : "Por el cuidado de nuestros estudiantes, la información de cada uno solo se comparte con los números que la familia registró en el colegio. Si este es su número nuevo, puede registrarlo en secretaría con su documento de identidad.",
      };
    }
    const sobre = otro ?? quien.estudiante ?? quien.vinculados[0];
    pasos.push({ titulo: "Qué tipo de mensaje es", detalle: `Personal: es sobre ${sobre.nombre}. Esto no sale de una circular.`, tono: "aviso" });
    pasos.push({ titulo: "De dónde sale la respuesta", detalle: "No se busca en documentos. Lo de cada estudiante lo responde una persona.", tono: "info" });
    pasos.push({ titulo: "Qué hizo", detalle: "Pasó el caso a secretaría con un resumen, para que nadie tenga que volver a preguntar.", tono: "ok" });
    return {
      tipo: "personal",
      quien,
      sobre,
      motivo,
      pasos,
      resumen: `${FRASE_MOTIVO[motivo]} ${sobre.nombre} (${sobre.curso}). Escribió a las ${hora(new Date().toISOString())}: "${texto.trim()}"`,
      respuesta: tu
        ? "Eso es sobre ti, y lo de cada estudiante lo responde una persona del colegio. Ya le pasé tu pregunta a la secretaría y te escriben por aquí mismo en horario de atención."
        : TEXTO_HANDOFF.replace("su hijo o hija", sobre.nombre.split(" ")[0]),
    };
  }

  // 3. Lo general: solo con lo que el colegio cargó.
  pasos.push({ titulo: "Qué tipo de mensaje es", detalle: "General: la respuesta es la misma para cualquier familia.", tono: "info" });
  const { doc, archivado } = buscarDocumento(texto, ctx.docs);
  if (!doc) {
    pasos.push({
      titulo: "De dónde sale la respuesta",
      detalle: archivado
        ? `Solo ${archivado.codigo} habla de esto, y está archivada, así que no se usa. No se inventa una respuesta.`
        : "Ningún documento vigente habla de esto. No se inventa una respuesta.",
      tono: "aviso",
    });
    pasos.push({ titulo: "Qué hizo", detalle: "Pasó la pregunta a secretaría para que la responda una persona.", tono: "aviso" });
    return { tipo: "sin respuesta", quien, archivado, motivo: "Sin respuesta", pasos, respuesta: TEXTO_SIN_RESPUESTA, resumen: `El asistente no encontró esto en los documentos: "${texto.trim()}"` };
  }
  pasos.push({ titulo: "De dónde sale la respuesta", detalle: `${doc.codigo} · ${doc.titulo}, versión ${doc.version}, actualizada el ${fechaCorta(doc.actualizado)}.`, tono: "ok" });
  if (archivado) pasos.push({ titulo: "Lo que se dejó afuera", detalle: `${archivado.codigo} también habla de esto, pero está archivada y no se usa.`, tono: "info" });
  pasos.push({ titulo: "Qué hizo", detalle: "Respondió al instante con el texto del documento, sin agregar nada.", tono: "ok" });
  return { tipo: "general", quien, doc, archivado, pasos, respuesta: doc.respuesta };
}
