import type { Alerta, Caso, Estudiante, Mensaje, Motivo, Registro, TipoRegistro, Documento } from "../types";
import { mulberry32 } from "../format";
import { COLEGIO } from "./equipo";

const MATERIAS = ["matemáticas", "sociales", "inglés", "ciencias naturales", "lengua castellana", "química"];

interface Plantilla {
  pregunta: (n: string, m: string) => string;
  resumen: (n: string, m: string) => string;
  respuesta: string;
  quien: string;
}

const P: Record<Exclude<Motivo, "Sin respuesta">, Plantilla> = {
  Notas: {
    pregunta: (n, m) => `Buenas noches, quería saber cómo va ${n} en ${m}, le fue mal en la última evaluación`,
    resumen: (n, m) => `Pregunta por el rendimiento de ${n} en ${m} después de la última evaluación.`,
    respuesta: "Buenos días. Le pedí el reporte a la docente y se lo envío hoy en la tarde.",
    quien: "marta",
  },
  Pagos: {
    pregunta: (n) => `Hola, me puede decir cuánto debo de pensión de ${n}? Creo que septiembre quedó pendiente`,
    resumen: (n) => `Quiere saber el saldo de pensión de ${n}. Cree que septiembre está pendiente.`,
    respuesta: "Buen día. Septiembre aparece pago, queda pendiente solo octubre. Le envío el recibo por aquí.",
    quien: "carolina",
  },
  Tareas: {
    pregunta: (n) => `${n.split(" ")[0]} dice que hoy no le dejaron tareas, es verdad?`,
    resumen: (n) => `Pregunta si ${n} tiene tareas para mañana. El estudiante dice que no.`,
    respuesta: "Buenos días. Para mañana tiene la guía de ciencias, página 34, y repasar las tablas.",
    quien: "diana",
  },
  Asistencia: {
    pregunta: (n) => `Me dicen que a ${n.split(" ")[0]} le pusieron falla en primera hora, pero estaba en enfermería`,
    resumen: (n) => `Reclama una inasistencia de ${n} en primera hora. Dice que estaba en enfermería.`,
    respuesta: "Coordinación ya lo revisó: la falla quedó anulada, estaba registrado en enfermería.",
    quien: "andres",
  },
  Permisos: {
    pregunta: (n) => `Necesito recoger a ${n.split(" ")[0]} el jueves a las 11 por una cita médica, a quién le aviso?`,
    resumen: (n) => `Pide permiso para retirar a ${n} el jueves a las 11:00 por cita médica.`,
    respuesta: "Listo, quedó anotado en portería. Por favor traiga su documento al recogerlo.",
    quien: "diana",
  },
  Certificados: {
    pregunta: (n) => `Necesito un certificado de estudio de ${n} para el subsidio, se puede para el viernes?`,
    resumen: (n) => `Pide un certificado de estudio de ${n} para un subsidio. Lo necesita el viernes.`,
    respuesta: "El certificado queda listo el jueves. Puede pagarlo en tesorería al recogerlo.",
    quien: "marta",
  },
};

const SIN_RESPUESTA = [
  "El colegio tiene clases de natación?",
  "Puedo dejar a mi hijo antes de las 6:30 de la mañana?",
  "Hay enfermería los sábados cuando hay actividades?",
  "Se puede pagar la matrícula en dos cuotas?",
  "Los niños pueden traer patineta al descanso?",
  "Venden el uniforme usado en algún lado?",
];

export const TEXTO_HANDOFF = `Esa consulta es sobre su hijo o hija, y lo de cada estudiante lo responde una persona del colegio. Ya le pasé a la secretaría un resumen con su pregunta. Le escriben por aquí mismo, ${COLEGIO.atencion}.`;
export const TEXTO_SIN_RESPUESTA = `No encuentro eso en los documentos del colegio, y prefiero no adivinar. Ya le pasé su pregunta a la secretaría, que le responde ${COLEGIO.atencion}.`;

// Más mensajes de noche: así escriben las familias cuando por fin se sientan.
export const PESO_HORA = [0.3, 0.2, 0.1, 0.1, 0.2, 0.6, 2.4, 3, 1.6, 1.4, 1.3, 1.4, 2, 1.9, 1.6, 1.7, 1.8, 2.3, 2.6, 4, 5.2, 4.9, 3, 1.2];

function momento(r: () => number, ahora: number, maxDias: number) {
  const total = PESO_HORA.reduce((a, b) => a + b, 0);
  for (;;) {
    let x = r() * total;
    let h = 0;
    while (x > PESO_HORA[h]) x -= PESO_HORA[h++];
    const dia = Math.floor(r() * maxDias);
    const d = new Date(ahora - dia * 86400000);
    d.setHours(h, Math.floor(r() * 60), Math.floor(r() * 60), 0);
    if (d.getTime() < ahora - 60000) return d.getTime();
  }
}

export function crearCasos(ahora: number, familias: Estudiante[]): Caso[] {
  const r = mulberry32(77);
  const motivos: Motivo[] = ["Notas", "Pagos", "Tareas", "Asistencia", "Permisos", "Certificados", "Sin respuesta"];
  const lista: Caso[] = [];
  for (let i = 0; i < 34; i++) {
    const motivo = motivos[i % 7 === 6 && r() > 0.3 ? 6 : Math.floor(r() * 6)];
    const est = familias[3 + Math.floor(r() * (familias.length - 3))];
    const acu = est.acudientes[0];
    const materia = MATERIAS[Math.floor(r() * MATERIAS.length)];
    const t = momento(r, ahora, i < 8 ? 1 : 6);
    const edad = (ahora - t) / 3600000;
    const estado = edad < 14 ? (r() > 0.7 ? "en curso" : "pendiente") : r() > 0.18 ? "resuelto" : "en curso";
    let pregunta: string;
    let resumen: string;
    let respuesta: string;
    let quien: string;
    if (motivo === "Sin respuesta") {
      pregunta = SIN_RESPUESTA[Math.floor(r() * SIN_RESPUESTA.length)];
      resumen = `El asistente no encontró esto en los documentos: "${pregunta}"`;
      respuesta = "Gracias por preguntar. Lo consulté con coordinación y le confirmo mañana a primera hora.";
      quien = "marta";
    } else {
      const p = P[motivo];
      pregunta = p.pregunta(est.nombre, materia);
      resumen = p.resumen(est.nombre, materia);
      respuesta = p.respuesta;
      quien = p.quien;
    }
    const mensajes: Mensaje[] = [
      { de: "familia", texto: pregunta, hora: new Date(t).toISOString() },
      { de: "asistente", texto: motivo === "Sin respuesta" ? TEXTO_SIN_RESPUESTA : TEXTO_HANDOFF, hora: new Date(t + 6000).toISOString() },
    ];
    if (estado !== "pendiente") {
      const tr = Math.min(ahora - 30000, t + (2 + r() * 14) * 3600000);
      mensajes.push({ de: "equipo", texto: respuesta, hora: new Date(tr).toISOString(), autor: quien });
    }
    lista.push({
      id: `c-${1000 + i}`,
      numero: 1000 + i,
      creado: new Date(t).toISOString(),
      telefono: acu.telefono,
      remitente: `${acu.nombre} (${acu.relacion.toLowerCase()})`,
      estudianteId: est.id,
      motivo,
      resumen,
      mensajes,
      estado,
      asignado: estado === "pendiente" && r() > 0.5 ? undefined : quien,
      prioridad: motivo === "Asistencia" || (motivo === "Pagos" && r() > 0.6) ? "alta" : "normal",
    });
  }
  return lista.sort((a, b) => b.creado.localeCompare(a.creado));
}

const ALERTAS: { texto: string; tema: Alerta["tema"]; quien: "estudiante" | "familia"; estado: Alerta["estado"]; horas: number; nota?: string }[] = [
  { texto: "unos de 10.º me esperan a la salida y me quitan la plata", tema: "Seguridad", quien: "estudiante", estado: "nueva", horas: 2.5 },
  { texto: "mi hija llega llorando del colegio y no quiere decir por qué", tema: "Ánimo", quien: "familia", estado: "nueva", horas: 9 },
  { texto: "se burlan de mí en el grupo del curso por una foto", tema: "Convivencia", quien: "estudiante", estado: "en atención", horas: 20, nota: "Hablé con ella en el descanso. Citamos a las dos familias el lunes." },
  { texto: "mi hijo dice que en la ruta lo empujan todos los días", tema: "Convivencia", quien: "familia", estado: "en atención", horas: 31, nota: "Coordinación habló con la monitora de la ruta. Se cambió de puesto al estudiante." },
  { texto: "en mi casa hay muchos gritos y no puedo estudiar", tema: "Casa", quien: "estudiante", estado: "en atención", horas: 46, nota: "Primera conversación hecha. Seguimiento semanal los martes." },
  { texto: "me siento muy sola, nadie me habla en el descanso", tema: "Ánimo", quien: "estudiante", estado: "cerrada", horas: 70, nota: "Se integró al grupo de lectura. La familia está al tanto." },
  { texto: "no tengo ganas de nada desde hace semanas", tema: "Ánimo", quien: "estudiante", estado: "cerrada", horas: 98, nota: "Remitido con la familia a su EPS. Seguimiento desde orientación." },
  { texto: "una compañera me contó que se está haciendo daño", tema: "Seguridad", quien: "estudiante", estado: "cerrada", horas: 120, nota: "Se activó la ruta de atención el mismo día con la familia de la compañera." },
  { texto: "le dicen apodos a mi hijo por su forma de hablar", tema: "Convivencia", quien: "familia", estado: "cerrada", horas: 140, nota: "Taller de convivencia en el curso y acuerdo con los estudiantes." },
];

export function crearAlertas(ahora: number, familias: Estudiante[]): Alerta[] {
  const mayores = familias.filter((f) => f.grado >= 5 && f.id !== "e-tomas" && f.id !== "e-valentina");
  return ALERTAS.map((a, i) => {
    const est = mayores[(i * 5 + 2) % mayores.length];
    const creado = new Date(ahora - a.horas * 3600000).toISOString();
    const deEst = a.quien === "estudiante" && est.telefonoPropio;
    const acu = est.acudientes[0];
    return {
      id: `al-${200 + i}`,
      numero: 200 + i,
      creado,
      telefono: deEst ? est.telefonoPropio! : acu.telefono,
      remitente: deEst ? `${est.nombre} (estudiante)` : `${acu.nombre} (${acu.relacion.toLowerCase()})`,
      estudianteId: est.id,
      texto: a.texto,
      tema: a.tema,
      estado: a.estado,
      responsable: a.estado === "nueva" ? undefined : i % 3 === 1 ? "andres" : "lucia",
      notas: a.nota ? [{ autor: i % 3 === 1 ? "andres" : "lucia", texto: a.nota, fecha: new Date(ahora - (a.horas - 3) * 3600000).toISOString() }] : [],
    };
  });
}

export function crearRegistro(ahora: number, docs: Documento[], familias: Estudiante[]): Registro[] {
  const r = mulberry32(5150);
  const vigentes = docs.filter((d) => d.vigente);
  const pesoDoc = vigentes.map((d) => d.consultas);
  const totalDoc = pesoDoc.reduce((a, b) => a + b, 0);
  const tels = familias.flatMap((f) => f.acudientes.map((a) => a.telefono));
  const out: Registro[] = [];
  for (let i = 0; i < 668; i++) {
    const x = r();
    const tipo: TipoRegistro = x < 0.72 ? "general" : x < 0.81 ? "sin respuesta" : x < 0.94 ? "personal" : x < 0.99 ? "bloqueado" : "delicado";
    let docId: string | undefined;
    if (tipo === "general") {
      let y = r() * totalDoc;
      let k = 0;
      while (y > pesoDoc[k]) y -= pesoDoc[k++];
      docId = vigentes[Math.min(k, vigentes.length - 1)].id;
    }
    out.push({
      id: `r-${i}`,
      hora: new Date(momento(r, ahora, 7)).toISOString(),
      tipo,
      docId,
      telefono: tipo === "bloqueado" ? "31" + Math.floor(r() * 9) + "555" + String(1000 + Math.floor(r() * 8999)) : tels[Math.floor(r() * tels.length)],
    });
  }
  return out.sort((a, b) => b.hora.localeCompare(a.hora));
}
