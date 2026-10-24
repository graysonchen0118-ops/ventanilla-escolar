import type { Categoria, Documento } from "../types";
import type { Foto } from "../photos";

export const CATEGORIAS: Categoria[] = [
  "Calendario",
  "Costos y pagos",
  "Matrículas",
  "Uniformes",
  "Transporte",
  "Alimentación",
  "Reglamento",
  "Salidas",
  "Horarios",
  "Certificados",
  "Útiles",
  "Orientación",
  "Salud",
];

export const FOTO_CATEGORIA: Record<Categoria, Foto> = {
  Calendario: "cartelera",
  "Costos y pagos": "archivador",
  Matrículas: "campus",
  Uniformes: "uniformes",
  Transporte: "ruta",
  Alimentación: "restaurante",
  Reglamento: "salon",
  Salidas: "arcos",
  Horarios: "aula",
  Certificados: "biblioteca",
  Útiles: "utiles",
  Orientación: "aulaMesas",
  Salud: "patio",
};

type Semilla = Omit<Documento, "historial" | "version"> & { versiones?: number };

const D = (s: Semilla): Documento => {
  const n = s.versiones ?? 1;
  const base = new Date(s.actualizado).getTime();
  const autores = ["Marta Cifuentes", "Diana Rojas", "Carolina Méndez"];
  const historial = Array.from({ length: n }, (_, i) => ({
    version: n - i,
    fecha: new Date(base - i * 9 * 86400000).toISOString(),
    autor: autores[(i + s.codigo.length) % autores.length],
    nota: i === 0 ? (n > 1 ? "Se actualizó la fecha y el texto" : "Primera versión") : i === n - 1 ? "Primera versión" : "Ajuste de redacción",
  }));
  return { ...s, version: n, historial, foto: FOTO_DOC[s.id] };
};

const FOTO_DOC: Record<string, Foto> = { d01: "aula", d02: "camino", d03: "campus", d04: "salon", d05: "archivador", d06: "mamaCelular", d07: "uniformes", d08: "ruta", d09: "restaurante", d10: "arcos", d11: "cartelera", d12: "chicasUniforme", d13: "biblioteca", d14: "mochila", d15: "celularesAula", d16: "libros", d17: "utiles", d18: "tareas", d19: "aulaMesas", d20: "acto", d21: "colores", d22: "baile", d23: "vacuna", d24: "escenario", d25: "patio", d26: "arcos" };

export const DOCUMENTOS: Documento[] = [
  D({ id: "d01", codigo: "Circular 18", titulo: "Entrega de boletines del tercer periodo", categoria: "Calendario", respuesta: "La entrega de boletines del tercer periodo es el viernes 6 de noviembre, de 7:00 a 11:00 a. m., en el salón de cada curso. Ese día los estudiantes no tienen clase.", claves: ["boletin", "boletines", "entrega de notas", "reunion de padres", "tercer periodo", "entrega de informes"], vigente: true, actualizado: "2026-10-20T10:12:00-05:00", consultas: 148, versiones: 2 }),
  D({ id: "d02", codigo: "Calendario 2026", titulo: "Fin de año y regreso a clases", categoria: "Calendario", respuesta: "El año escolar termina el viernes 27 de noviembre. Las vacaciones van del 28 de noviembre al 18 de enero, y el regreso a clases es el martes 19 de enero de 2027.", claves: ["vacaciones", "receso", "terminan las clases", "fin de ano", "regreso a clases", "calendario", "ultimo dia"], vigente: true, actualizado: "2026-09-30T09:00:00-05:00", consultas: 97, versiones: 3 }),
  D({ id: "d03", codigo: "Circular 21", titulo: "Matrículas 2027 para estudiantes antiguos", categoria: "Matrículas", respuesta: "La matrícula 2027 de estudiantes antiguos se hace del 9 al 20 de noviembre en la plataforma del colegio. Necesita el paz y salvo de 2026 y la hoja de matrícula firmada por el acudiente.", claves: ["matricula", "matriculas", "renovar", "2027", "ano que viene", "proximo ano", "matricular"], vigente: true, actualizado: "2026-10-22T08:40:00-05:00", consultas: 131 }),
  D({ id: "d04", codigo: "Admisiones 2027", titulo: "Inscripciones para estudiantes nuevos", categoria: "Matrículas", respuesta: "Las inscripciones para estudiantes nuevos están abiertas hasta el 14 de noviembre. El proceso tiene una entrevista con la familia y una mañana de integración para el niño o la niña, y los resultados se avisan por esta línea.", claves: ["inscripcion", "inscripciones", "admision", "admisiones", "cupo", "cupos", "estudiante nuevo", "nuevo ingreso"], vigente: true, actualizado: "2026-10-05T11:20:00-05:00", consultas: 64, versiones: 2 }),
  D({ id: "d05", codigo: "Costos 2026", titulo: "Valor de la pensión mensual", categoria: "Costos y pagos", respuesta: "La pensión mensual de 2026 es de $ 465.000 en primaria y de $ 512.000 en bachillerato. Se paga dentro de los primeros 10 días de cada mes.", claves: ["pension", "mensualidad", "cuanto vale", "cuanto cuesta", "costo", "costos", "valor del mes", "precio"], vigente: true, actualizado: "2026-01-12T08:00:00-05:00", consultas: 88 }),
  D({ id: "d06", codigo: "Tesorería", titulo: "Cómo y dónde pagar", categoria: "Costos y pagos", respuesta: "Puede pagar en el banco con el recibo del mes, por transferencia a la cuenta corriente del colegio o en tesorería, de lunes a viernes de 7:00 a 12:00. Después de pagar por transferencia, envíe el comprobante por esta línea.", claves: ["pagar", "pago", "transferencia", "banco", "recibo", "consignacion", "consignar", "cuenta", "comprobante"], vigente: true, actualizado: "2026-08-03T09:30:00-05:00", consultas: 76, versiones: 2 }),
  D({ id: "d07", codigo: "Reglamento, cap. 4", titulo: "Uniforme de diario y de educación física", categoria: "Uniformes", respuesta: "El uniforme de diario es la camiseta blanca tipo polo con el escudo, falda o pantalón azul oscuro y zapatos negros. Lunes y jueves se usa la sudadera de educación física con tenis blancos. Se compra en Confecciones La Sabana, frente a la portería.", claves: ["uniforme", "uniformes", "sudadera", "educacion fisica", "zapatos", "falda", "camiseta", "tenis", "chaqueta"], vigente: true, actualizado: "2026-02-02T10:00:00-05:00", consultas: 59 }),
  D({ id: "d08", codigo: "Circular 15", titulo: "Ruta escolar: horarios y cambios", categoria: "Transporte", respuesta: "La ruta escolar sale del colegio a las 3:40 p. m. Los cambios de dirección o de paradero se piden en secretaría con dos días hábiles de anticipación. Si el estudiante no va a tomar la ruta, avise antes de las 12:00 del mismo día.", claves: ["ruta", "bus", "buseta", "transporte", "paradero", "recoger", "monitora"], vigente: true, actualizado: "2026-09-14T07:50:00-05:00", consultas: 71 }),
  D({ id: "d09", codigo: "Restaurante escolar", titulo: "Almuerzo y menú de la semana", categoria: "Alimentación", respuesta: "El almuerzo cuesta $ 14.000 el día o $ 260.000 el mes. El menú de la semana se publica cada viernes en la cartelera de la entrada y por esta línea. Si su hijo o hija tiene una alergia, avísela por escrito a secretaría.", claves: ["almuerzo", "restaurante", "menu", "comida", "refrigerio", "onces", "lonchera", "alergia", "almorzar"], vigente: true, actualizado: "2026-10-16T12:00:00-05:00", consultas: 66, versiones: 4 }),
  D({ id: "d10", codigo: "Circular 19", titulo: "Salida pedagógica al Museo de Ciencias", categoria: "Salidas", respuesta: "La salida al Museo de Ciencias de 7.º y 8.º es el jueves 29 de octubre. Salen a las 7:30 a. m. y regresan a la 1:00 p. m. La autorización firmada se entrega hasta el martes 27, y deben llevar el uniforme de diario y un refrigerio.", claves: ["salida", "museo", "excursion", "paseo", "autorizacion", "salida pedagogica", "permiso de salida"], vigente: true, actualizado: "2026-10-19T09:15:00-05:00", consultas: 52 }),
  D({ id: "d11", codigo: "Secretaría", titulo: "Horario de atención", categoria: "Horarios", respuesta: "La secretaría atiende de lunes a viernes de 7:00 a. m. a 3:30 p. m., en jornada continua. La rectoría y la coordinación reciben con cita previa, que se puede pedir por esta línea.", claves: ["horario de atencion", "atienden", "atencion", "abierto", "rectoria", "cita", "a que hora abren"], vigente: true, actualizado: "2026-01-12T08:00:00-05:00", consultas: 44 }),
  D({ id: "d12", codigo: "Manual de convivencia", titulo: "Jornada escolar", categoria: "Horarios", respuesta: "La jornada empieza a las 6:50 a. m. Primaria sale a las 2:30 p. m. y bachillerato a las 3:20 p. m. Los viernes la salida es una hora más temprano para todos los cursos.", claves: ["jornada", "a que hora entran", "a que hora salen", "hora de salida", "hora de entrada", "salen", "entrada"], vigente: true, actualizado: "2026-01-20T08:00:00-05:00", consultas: 83, versiones: 2 }),
  D({ id: "d13", codigo: "Secretaría", titulo: "Certificados y constancias", categoria: "Certificados", respuesta: "Los certificados de estudio y las constancias se piden en secretaría o por esta línea y se entregan en tres días hábiles. Cada uno cuesta $ 12.000 y se paga en tesorería.", claves: ["certificado", "certificados", "constancia", "constancias", "certificado de estudio"], vigente: true, actualizado: "2026-03-10T10:00:00-05:00", consultas: 38 }),
  D({ id: "d14", codigo: "Manual, art. 31", titulo: "Llegadas tarde", categoria: "Reglamento", respuesta: "Después de las 7:00 a. m. el estudiante entra con registro de llegada tarde en coordinación. Tres llegadas tarde en un mismo periodo generan una citación al acudiente.", claves: ["tarde", "llegada tarde", "llegadas tarde", "retraso", "puntualidad", "llegar tarde"], vigente: true, actualizado: "2026-01-20T08:00:00-05:00", consultas: 27 }),
  D({ id: "d15", codigo: "Manual, art. 44", titulo: "Uso del celular en el colegio", categoria: "Reglamento", respuesta: "Los estudiantes pueden traer el celular, pero debe estar apagado durante las clases. Si se usa sin permiso, se guarda en coordinación y se entrega al final de la jornada.", claves: ["celular", "telefono", "movil", "celulares"], vigente: true, actualizado: "2026-01-20T08:00:00-05:00", consultas: 31 }),
  D({ id: "d16", codigo: "Manual, art. 28", titulo: "Excusas e inasistencias", categoria: "Reglamento", respuesta: "Cuando un estudiante falta, la excusa se envía el mismo día por esta línea o por escrito al regresar. Si son más de tres días seguidos, se necesita la incapacidad médica.", claves: ["excusa", "excusas", "faltar", "enfermo", "enferma", "incapacidad", "inasistencia", "no va a ir"], vigente: true, actualizado: "2026-01-20T08:00:00-05:00", consultas: 57 }),
  D({ id: "d17", codigo: "Útiles 2027", titulo: "Lista de útiles escolares", categoria: "Útiles", respuesta: "La lista de útiles de 2027 se publica el 1 de diciembre, por curso, en la página del colegio y por esta línea. Este año no se piden resmas de papel.", claves: ["utiles", "lista de utiles", "cuadernos", "materiales", "textos", "libros"], vigente: true, actualizado: "2026-10-01T09:00:00-05:00", consultas: 22 }),
  D({ id: "d18", codigo: "Circular 20", titulo: "Escuela de padres de noviembre", categoria: "Calendario", respuesta: "La próxima escuela de padres es el sábado 7 de noviembre a las 8:00 a. m. en el auditorio. El tema es el uso de pantallas en la casa, y dura una hora y media.", claves: ["escuela de padres", "taller de padres", "taller", "auditorio"], vigente: true, actualizado: "2026-10-21T15:30:00-05:00", consultas: 35 }),
  D({ id: "d19", codigo: "Orientación", titulo: "Citas con orientación escolar", categoria: "Orientación", respuesta: "La orientadora atiende a estudiantes y familias de lunes a viernes. Para una cita, escriba por aquí el nombre del estudiante y el curso, y secretaría se la agenda. Lo que se habla en orientación es reservado.", claves: ["orientacion", "orientadora", "psicologa", "psicologo", "psicologia", "cita con orientacion"], vigente: true, actualizado: "2026-02-09T08:00:00-05:00", consultas: 19 }),
  D({ id: "d20", codigo: "Circular 17", titulo: "Izada de bandera de noviembre", categoria: "Calendario", respuesta: "La izada de bandera de noviembre es el martes 10 a las 7:00 a. m. en el patio central. Están invitadas las familias de 4.º, que esta vez organiza el acto.", claves: ["izada", "izada de bandera", "acto civico", "bandera"], vigente: true, actualizado: "2026-10-09T10:00:00-05:00", consultas: 14 }),
  D({ id: "d21", codigo: "Costos 2026", titulo: "Descuentos por hermanos", categoria: "Costos y pagos", respuesta: "Hay un descuento del 10 % en la pensión del segundo hermano y del 15 % desde el tercero. Se aplica solo en el recibo y no hay que pedirlo.", claves: ["descuento", "descuentos", "hermano", "hermanos", "beca", "becas"], vigente: true, actualizado: "2026-01-12T08:00:00-05:00", consultas: 26 }),
  D({ id: "d22", codigo: "Circular 22", titulo: "Semana cultural", categoria: "Calendario", respuesta: "La semana cultural va del 17 al 20 de noviembre. Cada curso presenta un país, y el viernes 20 hay feria de comidas abierta a las familias desde las 9:00 a. m.", claves: ["semana cultural", "feria", "festival", "presentacion", "disfraz", "vestuario"], vigente: true, actualizado: "2026-10-23T08:10:00-05:00", consultas: 18 }),
  D({ id: "d23", codigo: "Circular 16", titulo: "Jornada de vacunación", categoria: "Salud", respuesta: "El jueves 5 de noviembre habrá jornada de vacunación para transición a 5.º, con el centro de salud del barrio. Solo se vacuna a quien entregue la autorización firmada y el carné.", claves: ["vacuna", "vacunas", "vacunacion", "carne de vacunas"], vigente: true, actualizado: "2026-10-14T09:00:00-05:00", consultas: 23 }),
  D({ id: "d24", codigo: "Evaluaciones", titulo: "Semana de evaluaciones finales", categoria: "Calendario", respuesta: "Las evaluaciones finales son del 9 al 13 de noviembre, dos por día. Los temarios ya están en la plataforma, en la carpeta de cada materia.", claves: ["evaluaciones", "examenes", "examen", "finales", "previas", "temario", "temarios"], vigente: true, actualizado: "2026-10-18T13:00:00-05:00", consultas: 61 }),
  D({ id: "d25", codigo: "Circular 12", titulo: "Vacaciones de mitad de año", categoria: "Calendario", respuesta: "Las vacaciones de mitad de año van del 15 de junio al 6 de julio.", claves: ["vacaciones", "mitad de ano", "junio"], vigente: false, actualizado: "2026-05-20T09:00:00-05:00", consultas: 112 }),
  D({ id: "d26", codigo: "Circular 09", titulo: "Salida al parque ecológico", categoria: "Salidas", respuesta: "La salida al parque ecológico de 3.º es el 22 de mayo.", claves: ["salida", "parque", "excursion"], vigente: false, actualizado: "2026-05-02T09:00:00-05:00", consultas: 40 }),
];
