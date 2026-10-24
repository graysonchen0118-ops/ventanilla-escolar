"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, CheckCheck, FileSearch, Fingerprint, GraduationCap, HeartHandshake, Inbox, ListChecks, Lock, MessageCircle, RotateCcw, Send, ShieldAlert, UserPlus, Zap } from "lucide-react";
import { useStore, type Resultado } from "@/lib/store";
import { identificar, type Decision } from "@/lib/bot";
import { Mostrador } from "@/components/three/Scenes";
import { Avatar, Badge, Skel } from "@/components/ui";
import { TEL_DESCONOCIDO, TEL_TOMAS, TEL_VALENTINA } from "@/lib/mock/familias";
import { COLEGIO } from "@/lib/mock/equipo";
import { retrato } from "@/lib/photos";
import { hora, tel } from "@/lib/format";

type PerfilId = "valentina" | "desconocido" | "tomas";

const PERFILES: { id: PerfilId; telefono: string; titulo: string; foto?: string; sugerencias: string[] }[] = [
  {
    id: "valentina",
    telefono: TEL_VALENTINA,
    titulo: "Paola Ríos",
    foto: retrato("mamaCelular", 96),
    sugerencias: [
      "Cuándo es la entrega de boletines?",
      "Mi hija dice que hoy no tiene tareas, es verdad?",
      "Cuánto vale la pensión de primaria?",
      "El colegio tiene clases de natación?",
      "Valentina dice que en la ruta le quitan las onces",
    ],
  },
  {
    id: "desconocido",
    telefono: TEL_DESCONOCIDO,
    titulo: "Número desconocido",
    sugerencias: ["Cómo va Valentina Ríos en matemáticas?", "Hasta cuándo hay inscripciones para estudiantes nuevos?", "Cuál es el uniforme de educación física?", "Hola"],
  },
  {
    id: "tomas",
    telefono: TEL_TOMAS,
    titulo: "Tomás Herrera",
    sugerencias: ["Cuándo son las evaluaciones finales?", "Cuáles son mis notas de sociales?", "En el salón no me dejan en paz y no quiero volver", "Se puede traer el celular?"],
  },
];

interface Burbuja {
  id: string;
  de: "yo" | "bot";
  texto: string;
  hora: string;
  fuente?: { texto: string; tono: "ok" | "alto" | "aviso" };
}

const ICONOS_PASO = [Fingerprint, ListChecks, FileSearch, Zap, Zap];

function fuenteDe(d: Decision, r: Resultado, numCaso?: number, numAlerta?: number): Burbuja["fuente"] {
  switch (d.tipo) {
    case "general":
      return { texto: `${d.doc!.codigo} · ${d.doc!.titulo}`, tono: "ok" };
    case "personal":
      return { texto: `Pasó a secretaría · caso #${numCaso ?? ""}`, tono: "aviso" };
    case "sin respuesta":
      return { texto: `Sin documento · caso #${numCaso ?? ""} en secretaría`, tono: "aviso" };
    case "bloqueado":
      return { texto: "Información protegida", tono: "alto" };
    case "delicado":
      return { texto: `Aviso a orientación · alerta #${numAlerta ?? ""}`, tono: "alto" };
    default:
      return r.casoId ? { texto: "Pasó a secretaría", tono: "aviso" } : undefined;
  }
}

function Conversar() {
  const { listo, familias, procesar } = useStore();
  const params = useSearchParams();
  const [perfil, setPerfil] = useState<PerfilId>("valentina");
  const [chats, setChats] = useState<Record<PerfilId, Burbuja[]>>({ valentina: [], desconocido: [], tomas: [] });
  const [trazas, setTrazas] = useState<Partial<Record<PerfilId, { d: Decision; r: Resultado }>>>({});
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const caja = useRef<HTMLDivElement | null>(null);
  const yaAuto = useRef(false);

  const p = PERFILES.find((x) => x.id === perfil)!;
  const quien = useMemo(() => (listo ? identificar(p.telefono, familias) : null), [listo, p.telefono, familias]);
  const chat = chats[perfil];
  const traza = trazas[perfil];

  const descripcion = (id: PerfilId) => {
    const pp = PERFILES.find((x) => x.id === id)!;
    const q = listo ? identificar(pp.telefono, familias) : null;
    if (!q) return "";
    if (q.tipo === "acudiente") return `${q.acudiente?.relacion} de ${q.vinculados[0].nombre.split(" ")[0]}, ${q.vinculados[0].curso} · registrado`;
    if (q.tipo === "estudiante") return `Estudiante de ${q.estudiante?.curso} · su propio número`;
    return `${tel(pp.telefono)} · no está en ninguna familia`;
  };

  useEffect(() => {
    const c = caja.current;
    if (c) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
  }, [chat.length, escribiendo, perfil]);

  const enviar = async (t: string, id: PerfilId = perfil) => {
    const limpio = t.trim();
    if (!limpio || escribiendo) return;
    const pp = PERFILES.find((x) => x.id === id)!;
    const ahora = new Date().toISOString();
    setChats((c) => ({ ...c, [id]: [...c[id], { id: "y" + Date.now(), de: "yo", texto: limpio, hora: ahora }] }));
    setTexto("");
    setEscribiendo(true);
    const r = await procesar(limpio, pp.telefono);
    const numCaso = r.casoId ? Number(r.casoId.split("-")[1]) : undefined;
    const numAlerta = r.alertaId ? Number(r.alertaId.split("-")[1]) : undefined;
    setChats((c) => ({ ...c, [id]: [...c[id], { id: "b" + Date.now(), de: "bot", texto: r.decision.respuesta, hora: new Date().toISOString(), fuente: fuenteDe(r.decision, r, numCaso, numAlerta) }] }));
    setTrazas((x) => ({ ...x, [id]: { d: r.decision, r } }));
    setEscribiendo(false);
  };

  useEffect(() => {
    if (!listo || yaAuto.current) return;
    const q = params.get("q");
    const quienParam = params.get("quien") as PerfilId | null;
    if (!q && !quienParam) return;
    yaAuto.current = true;
    const id = quienParam && PERFILES.some((x) => x.id === quienParam) ? quienParam : "valentina";
    setPerfil(id);
    if (q) void enviar(q, id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, params]);

  const reiniciar = () => {
    setChats((c) => ({ ...c, [perfil]: [] }));
    setTrazas((x) => ({ ...x, [perfil]: undefined }));
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Probar el asistente</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>Escriba como lo haría una familia</h1>
          <p className="muted" style={{ marginTop: 4, maxWidth: "70ch" }}>
            Elija quién escribe y pregunte lo que quiera. A la derecha se ve qué decidió el asistente y por qué, y el mostrador muestra a dónde fue el mensaje.
          </p>
        </div>
      </div>

      <div className="conv">
        <div className="form-col">
          <div className="identidades" role="radiogroup" aria-label="Quién escribe">
            {PERFILES.map((x) => {
              const q = listo ? identificar(x.telefono, familias) : null;
              const reg = q && q.tipo !== "desconocido";
              return (
                <button key={x.id} role="radio" aria-checked={perfil === x.id} className={`identidad ${perfil === x.id ? "on" : ""}`} onClick={() => setPerfil(x.id)}>
                  <span className="ident-top">
                    {x.foto ? (
                      <Avatar src={x.foto} alt={x.titulo} size={38} />
                    ) : (
                      <span className="ident-ic" style={{ background: x.id === "tomas" ? "var(--info-soft)" : "var(--err-soft)", color: x.id === "tomas" ? "var(--info)" : "var(--err)" }}>
                        {x.id === "tomas" ? <GraduationCap size={18} /> : <Lock size={17} />}
                      </span>
                    )}
                    {listo && <Badge tono={reg ? "ok" : "error"}>{reg ? "Registrado" : "Sin registro"}</Badge>}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <strong>{x.titulo}</strong>
                    <small>{listo ? descripcion(x.id) : "Cargando"}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="telefono">
            <div className="tel-pantalla">
              <div className="tel-head">
                <span className="tel-logo">
                  <MessageCircle size={19} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{COLEGIO.nombre}</strong>
                  <small>{escribiendo ? "escribiendo..." : "en línea"}</small>
                </div>
                <button className="icon-btn" style={{ background: "rgba(255,255,255,.14)", borderColor: "transparent", color: "#fff" }} onClick={reiniciar} aria-label="Reiniciar conversación" title="Reiniciar conversación">
                  <RotateCcw size={17} />
                </button>
              </div>
              <div className="chat" aria-live="polite" ref={caja}>
                {!listo && <Skel alto={60} ancho="70%" />}
                {listo && !chat.length && (
                  <div className="msg msg-bot">
                    {perfil === "tomas"
                      ? `Hola, ${quien?.estudiante?.nombre.split(" ")[0] ?? ""}. Escríbeme lo que necesites saber del colegio.`
                      : `Hola, este es el WhatsApp del ${COLEGIO.nombre}. Escriba su pregunta o toque una de las sugerencias de abajo.`}
                  </div>
                )}
                {chat.map((m) => (
                  <div key={m.id} className={`msg ${m.de === "yo" ? "msg-yo" : "msg-bot"}`}>
                    {m.texto}
                    {m.fuente && (
                      <div className={`msg-fuente tono-${m.fuente.tono}`}>
                        {m.fuente.tono === "ok" ? <BookOpen size={13} /> : m.fuente.tono === "alto" ? <ShieldAlert size={13} /> : <Inbox size={13} />}
                        {m.fuente.texto}
                      </div>
                    )}
                    <div className="msg-meta">
                      {hora(m.hora)}
                      {m.de === "yo" && <CheckCheck size={14} color="#3f8fd0" />}
                    </div>
                  </div>
                ))}
                {escribiendo && (
                  <div className="escribiendo" aria-label="El asistente está escribiendo">
                    <i />
                    <i />
                    <i />
                  </div>
                )}
              </div>
              <div className="sugerencias">
                {p.sugerencias.map((s) => (
                  <button key={s} onClick={() => enviar(s)} disabled={!listo || escribiendo}>
                    {s}
                  </button>
                ))}
              </div>
              <form
                className="tel-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  void enviar(texto);
                }}
              >
                <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escriba un mensaje" aria-label="Mensaje" disabled={!listo} />
                <button type="submit" disabled={!texto.trim() || escribiendo || !listo} aria-label="Enviar">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="form-col">
          <div className="card" style={{ padding: 14 }}>
            <Mostrador compacto />
            <div className="leyenda" style={{ padding: "4px 6px 2px" }}>
              <span><i style={{ background: "var(--accent)" }} /> Circulares</span>
              <span><i style={{ background: "var(--support)" }} /> Archivador y bandeja</span>
              <span><i style={{ background: "var(--err)" }} /> Candado</span>
              <span><i style={{ background: "#e9b44c" }} /> Orientación</span>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h2>Lo que pasó por dentro</h2>
                <p>{traza ? "Decisión sobre el último mensaje" : "Envíe un mensaje para ver la decisión"}</p>
              </div>
              {traza && (
                <Badge tono={traza.d.tipo === "general" || traza.d.tipo === "saludo" || traza.d.tipo === "gracias" ? "ok" : traza.d.tipo === "personal" || traza.d.tipo === "sin respuesta" ? "apoyo" : "error"}>
                  {traza.d.tipo === "general" ? "Respondido" : traza.d.tipo === "personal" ? "A secretaría" : traza.d.tipo === "sin respuesta" ? "Sin documento" : traza.d.tipo === "bloqueado" ? "Protegido" : traza.d.tipo === "delicado" ? "A orientación" : "Saludo"}
                </Badge>
              )}
            </div>
            {!traza ? (
              <div className="traza">
                {["Quién escribe", "Qué tipo de mensaje es", "De dónde sale la respuesta", "Qué hizo"].map((t, i) => {
                  const Ic = ICONOS_PASO[i];
                  return (
                    <div className="paso tono-info" key={t} style={{ opacity: 0.6 }}>
                      <span className="paso-ic">
                        <Ic size={16} />
                      </span>
                      <div>
                        <strong>{t}</strong>
                        <p>Esperando un mensaje.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="traza" key={traza.d.respuesta + (traza.r.casoId ?? "") + (traza.r.alertaId ?? "") + chat.length}>
                {traza.d.pasos.map((ps, i) => {
                  const Ic = ICONOS_PASO[i] ?? Zap;
                  return (
                    <div className={`paso tono-${ps.tono}`} key={ps.titulo + i}>
                      <span className="paso-ic">
                        <Ic size={16} />
                      </span>
                      <div>
                        <strong>{ps.titulo}</strong>
                        <p>{ps.detalle}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="acciones" style={{ marginTop: 4 }}>
                  {traza.r.casoId && (
                    <Link href={`/bandeja?caso=${traza.r.casoId}`} className="btn btn-secundario btn-sm">
                      <Inbox size={15} /> <span>Ver el caso en la bandeja</span>
                    </Link>
                  )}
                  {traza.r.alertaId && (
                    <Link href={`/orientacion?alerta=${traza.r.alertaId}`} className="btn btn-secundario btn-sm">
                      <HeartHandshake size={15} /> <span>Ver la alerta</span>
                    </Link>
                  )}
                  {traza.d.doc && (
                    <Link href={`/documentos?doc=${traza.d.doc.id}`} className="btn btn-secundario btn-sm">
                      <BookOpen size={15} /> <span>Abrir {traza.d.doc.codigo}</span>
                    </Link>
                  )}
                  {traza.d.tipo === "bloqueado" && traza.d.quien.tipo === "desconocido" && (
                    <Link href={`/familias?registrar=${traza.d.quien.telefono}`} className="btn btn-secundario btn-sm">
                      <UserPlus size={15} /> <span>Registrar este número</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="franja">
            <div className="franja-txt">
              <strong>Pruebe lo mismo con otro número</strong>
              <p>La pregunta sobre Valentina se responde distinto si la escribe su mamá o un número que nadie registró. Y si registra ese número en Familias, el asistente lo reconoce en el siguiente mensaje.</p>
            </div>
            <Link href="/familias" className="enlace">
              Familias <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skel alto={600} />}>
      <Conversar />
    </Suspense>
  );
}
