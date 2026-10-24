"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Bot, CheckCircle2, Inbox, Phone, Plus, RotateCcw, Search, Send, Trash2, UserRound } from "lucide-react";
import { useStore, ErrorValidacion } from "@/lib/store";
import { Avatar, Badge, Boton, Campo, Confirmar, Drawer, Modal, Paginacion, Skel, Vacio } from "@/components/ui";
import { EQUIPO, persona } from "@/lib/mock/equipo";
import type { Caso, EstadoCaso, Motivo } from "@/lib/types";
import { fechaLarga, haceCuanto, hora, norm, tel } from "@/lib/format";
import { ICONO_MOTIVO, TONO_ESTADO, capital } from "@/lib/vista";

const MOTIVOS: Motivo[] = ["Notas", "Pagos", "Tareas", "Asistencia", "Permisos", "Certificados", "Sin respuesta"];
const POR_PAGINA = 8;

function Bandeja() {
  const st = useStore();
  const { listo, casos, familias, ahora } = st;
  const params = useSearchParams();
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoCaso | "todos">("todos");
  const [motivo, setMotivo] = useState<Motivo | "">("");
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState<"recientes" | "antiguos" | "prioridad">("recientes");
  const [pagina, setPagina] = useState(1);
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);

  useEffect(() => {
    const c = params.get("caso");
    if (listo && c && casos.some((x) => x.id === c)) setAbiertoId(c);
  }, [listo, params, casos]);

  const est = (id?: string) => familias.find((f) => f.id === id);

  const filtrados = useMemo(() => {
    const t = norm(q);
    let l = casos.filter((c) => (estado === "todos" || c.estado === estado) && (!motivo || c.motivo === motivo));
    if (t) {
      l = l.filter((c) => {
        const e = est(c.estudianteId);
        return norm(`${c.remitente} ${c.resumen} ${c.telefono} ${e?.nombre ?? ""} ${e?.curso ?? ""} ${c.numero}`).includes(t);
      });
    }
    if (orden === "antiguos") l = [...l].sort((a, b) => a.creado.localeCompare(b.creado));
    else if (orden === "prioridad") l = [...l].sort((a, b) => (a.prioridad === b.prioridad ? b.creado.localeCompare(a.creado) : a.prioridad === "alta" ? -1 : 1));
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casos, estado, motivo, q, orden, familias]);

  useEffect(() => setPagina(1), [estado, motivo, q, orden]);
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const cuenta = (e: EstadoCaso) => casos.filter((c) => c.estado === e).length;
  const abierto = casos.find((c) => c.id === abiertoId) ?? null;

  const cerrarDrawer = () => {
    setAbiertoId(null);
    if (params.get("caso")) router.replace("/bandeja", { scroll: false });
  };

  return (
    <>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Bandeja de secretaría</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>Lo de cada estudiante, ya resumido</h1>
          <p className="muted" style={{ marginTop: 4, maxWidth: "72ch" }}>
            Aquí llega lo que el asistente no debe responder solo: notas, pagos, tareas y permisos de un estudiante, y las preguntas que ningún documento contesta. Cada caso trae la conversación y un resumen.
          </p>
        </div>
        <Boton icono={<Plus size={17} />} onClick={() => setNuevo(true)}>
          Caso por llamada
        </Boton>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 14 }}>
          <div className="tabs" role="tablist">
            {(["todos", "pendiente", "en curso", "resuelto"] as const).map((e) => (
              <button key={e} role="tab" aria-selected={estado === e} className={`tab ${estado === e ? "on" : ""}`} onClick={() => setEstado(e)}>
                {e === "todos" ? "Todos" : capital(e === "pendiente" ? "pendientes" : e === "resuelto" ? "resueltos" : e)}
                <em>{listo ? (e === "todos" ? casos.length : cuenta(e)) : ""}</em>
              </button>
            ))}
          </div>
          <div className="buscar">
            <Search size={17} />
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por estudiante, acudiente, número o texto" aria-label="Buscar casos" />
          </div>
          <select className="select" value={motivo} onChange={(e) => setMotivo(e.target.value as Motivo | "")} aria-label="Filtrar por motivo">
            <option value="">Todos los motivos</option>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select className="select" value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar">
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="prioridad">Prioridad primero</option>
          </select>
        </div>

        <div className="casos">
          {!listo && Array.from({ length: 6 }, (_, i) => <Skel key={i} alto={74} />)}
          {listo &&
            visibles.map((c, i) => {
              const Ic = ICONO_MOTIVO[c.motivo];
              const e = est(c.estudianteId);
              const r = persona(c.asignado);
              const reciente = ahora - new Date(c.creado).getTime() < 120000 || Date.now() - new Date(c.creado).getTime() < 120000;
              return (
                <button key={c.id} className={`caso ${reciente ? "nuevo" : ""}`} style={{ animationDelay: `${i * 0.03}s` }} onClick={() => setAbiertoId(c.id)}>
                  <span className="caso-ic" style={{ background: c.motivo === "Sin respuesta" ? "var(--info-soft)" : "var(--support-soft)", color: c.motivo === "Sin respuesta" ? "var(--info)" : "var(--support-2)" }}>
                    <Ic size={19} />
                  </span>
                  <span className="caso-txt">
                    <span className="caso-top">
                      <strong>{e ? `${e.nombre} · ${e.curso}` : c.remitente}</strong>
                      <Badge tono="neutro">#{c.numero}</Badge>
                      {c.prioridad === "alta" && <Badge tono="error">Prioridad</Badge>}
                      {reciente && <Badge tono="acento">Nuevo</Badge>}
                    </span>
                    <p>{c.resumen}</p>
                  </span>
                  <span className="caso-der">
                    <span>{haceCuanto(c.creado, Math.max(ahora, Date.now() - 1))}</span>
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Badge tono={TONO_ESTADO[c.estado]}>{capital(c.estado)}</Badge>
                      {r && <Avatar src={r.foto} alt={r.nombre} size={24} />}
                    </span>
                  </span>
                </button>
              );
            })}
          {listo && !filtrados.length && (
            <Vacio
              icono={<Inbox size={24} />}
              titulo="Ningún caso con esos filtros"
              texto="Pruebe con otro estado o borre la búsqueda."
              accion={
                <button className="btn btn-secundario btn-sm" onClick={() => { setQ(""); setMotivo(""); setEstado("todos"); }}>
                  Limpiar filtros
                </button>
              }
            />
          )}
        </div>
        <Paginacion pagina={pagina} total={filtrados.length} porPagina={POR_PAGINA} onCambio={setPagina} />
      </div>

      {abierto && <DetalleCaso caso={abierto} onCerrar={cerrarDrawer} />}
      <NuevoCaso abierto={nuevo} onCerrar={() => setNuevo(false)} onCreado={(id) => { setNuevo(false); setAbiertoId(id); }} />
    </>
  );
}

function DetalleCaso({ caso, onCerrar }: { caso: Caso; onCerrar: () => void }) {
  const { familias, responderCaso, estadoCaso, asignarCaso, eliminarCaso, toast } = useStore();
  const [texto, setTexto] = useState("");
  const [autor, setAutor] = useState(caso.asignado ?? "marta");
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [borrar, setBorrar] = useState(false);
  const e = familias.find((f) => f.id === caso.estudianteId);
  const r = persona(caso.asignado);

  const correr = async (clave: string, f: () => Promise<void>) => {
    setCargando(clave);
    setError("");
    try {
      await f();
    } catch (err) {
      if (err instanceof ErrorValidacion) setError(err.message);
      else toast("No se pudo guardar. Intente de nuevo.", "error");
    } finally {
      setCargando(null);
    }
  };

  return (
    <Drawer
      abierto
      titulo={e ? `${e.nombre} · ${e.curso}` : caso.remitente}
      sub={
        <>
          <Badge tono="neutro">Caso #{caso.numero}</Badge>
          <Badge tono={TONO_ESTADO[caso.estado]}>{capital(caso.estado)}</Badge>
          <Badge tono="apoyo">{caso.motivo}</Badge>
        </>
      }
      onCerrar={onCerrar}
      pie={
        <>
          <button className="btn btn-ghost" onClick={() => setBorrar(true)}>
            <Trash2 size={16} /> <span>Eliminar</span>
          </button>
          {caso.estado === "resuelto" ? (
            <Boton tono="secundario" icono={<RotateCcw size={16} />} cargando={cargando === "estado"} onClick={() => correr("estado", () => estadoCaso(caso.id, "en curso"))}>
              Reabrir
            </Boton>
          ) : (
            <Boton icono={<CheckCircle2 size={16} />} cargando={cargando === "estado"} onClick={() => correr("estado", () => estadoCaso(caso.id, "resuelto"))}>
              Marcar resuelto
            </Boton>
          )}
        </>
      }
    >
      <div className="resumen">
        <Bot size={20} style={{ flex: "none" }} />
        <span>{caso.resumen}</span>
      </div>
      <div className="datos">
        <div className="dato">
          <small>Escribió</small>
          <strong>{caso.remitente}</strong>
        </div>
        <div className="dato">
          <small>Teléfono</small>
          <strong className="mono">{tel(caso.telefono)}</strong>
        </div>
        <div className="dato">
          <small>Recibido</small>
          <strong>{capital(fechaLarga(caso.creado))}, {hora(caso.creado)}</strong>
        </div>
        <div className="dato">
          <small>Responsable</small>
          <select
            className="select"
            style={{ minHeight: 34, padding: "4px 8px", width: "100%", minWidth: 0 }}
            value={caso.asignado ?? ""}
            onChange={(ev) => correr("asignar", () => asignarCaso(caso.id, ev.target.value || undefined))}
            aria-label="Responsable"
          >
            <option value="">Sin asignar</option>
            {EQUIPO.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="sec-tit">Conversación por WhatsApp</div>
        <div className="hilo">
          {caso.mensajes.map((m, i) => {
            const pe = persona(m.autor);
            return (
              <div key={i} className={`msg msg-${m.de}`}>
                {m.de !== "familia" && <div className="msg-autor">{m.de === "asistente" ? "Asistente" : pe?.nombre ?? "Equipo"}</div>}
                {m.texto}
                <div className="msg-meta">{hora(m.hora)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-col">
        <div className="sec-tit" style={{ marginBottom: 0 }}>Responder</div>
        {error && (
          <div className="error-caja">
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        <textarea className="textarea" value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder="La respuesta llega por el mismo WhatsApp de la familia" aria-label="Respuesta" />
        <div className="toolbar">
          <select className="select" value={autor} onChange={(ev) => setAutor(ev.target.value)} aria-label="Responder como">
            {EQUIPO.map((p) => (
              <option key={p.id} value={p.id}>Como {p.nombre}</option>
            ))}
          </select>
          <Boton
            icono={<Send size={16} />}
            cargando={cargando === "responder"}
            onClick={() =>
              correr("responder", async () => {
                await responderCaso(caso.id, texto, autor);
                setTexto("");
              })
            }
          >
            Enviar respuesta
          </Boton>
        </div>
        {r && (
          <p className="muted" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <UserRound size={14} /> Lo lleva {r.nombre}, {r.cargo.toLowerCase()}.
          </p>
        )}
      </div>
      <Confirmar
        abierto={borrar}
        titulo={`Eliminar el caso #${caso.numero}`}
        texto="La conversación sigue en el WhatsApp de la familia, pero el caso desaparece de la bandeja."
        accion="Eliminar"
        cargando={cargando === "borrar"}
        onCerrar={() => setBorrar(false)}
        onConfirmar={() =>
          correr("borrar", async () => {
            await eliminarCaso(caso.id);
            setBorrar(false);
            onCerrar();
          })
        }
      />
    </Drawer>
  );
}

function NuevoCaso({ abierto, onCerrar, onCreado }: { abierto: boolean; onCerrar: () => void; onCreado: (id: string) => void }) {
  const { familias, crearCaso } = useStore();
  const [estId, setEstId] = useState("");
  const [remitente, setRemitente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState<Motivo>("Notas");
  const [resumen, setResumen] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const ordenados = useMemo(() => [...familias].sort((a, b) => a.nombre.localeCompare(b.nombre)), [familias]);

  const elegir = (id: string) => {
    setEstId(id);
    const e = familias.find((f) => f.id === id);
    if (e?.acudientes[0]) {
      setRemitente(`${e.acudientes[0].nombre} (${e.acudientes[0].relacion.toLowerCase()})`);
      setTelefono(tel(e.acudientes[0].telefono));
    }
  };

  const guardar = async () => {
    setCargando(true);
    setError("");
    try {
      const id = await crearCaso({ remitente, telefono, estudianteId: estId || undefined, motivo, resumen });
      setEstId("");
      setRemitente("");
      setTelefono("");
      setResumen("");
      onCreado(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      titulo="Caso que llegó por llamada"
      onCerrar={onCerrar}
      pie={
        <>
          <button className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
          <Boton icono={<Phone size={16} />} cargando={cargando} onClick={guardar}>
            Crear caso
          </Boton>
        </>
      }
    >
      <div className="form-col">
        <p className="muted" style={{ fontSize: 14 }}>Para que lo que entra por teléfono quede en la misma bandeja que lo de WhatsApp.</p>
        {error && (
          <div className="error-caja">
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        <Campo etiqueta="Estudiante">
          <select className="select" style={{ width: "100%" }} value={estId} onChange={(e) => elegir(e.target.value)}>
            <option value="">Sin estudiante (pregunta general)</option>
            {ordenados.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre} · {f.curso}</option>
            ))}
          </select>
        </Campo>
        <div className="form-grid">
          <Campo etiqueta="Quién llamó">
            <input className="input" value={remitente} onChange={(e) => setRemitente(e.target.value)} placeholder="Nombre y parentesco" />
          </Campo>
          <Campo etiqueta="Teléfono" ayuda="10 dígitos">
            <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="numeric" placeholder="300 555 0000" />
          </Campo>
        </div>
        <Campo etiqueta="Motivo">
          <select className="select" style={{ width: "100%" }} value={motivo} onChange={(e) => setMotivo(e.target.value as Motivo)}>
            {MOTIVOS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Resumen">
          <textarea className="textarea" value={resumen} onChange={(e) => setResumen(e.target.value)} placeholder="Qué pidió, con el dato que haga falta para responder" />
        </Campo>
      </div>
    </Modal>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skel alto={500} />}>
      <Bandeja />
    </Suspense>
  );
}
