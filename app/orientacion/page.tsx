"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, HandHeart, HeartHandshake, MessageSquarePlus, Plus, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import { useStore, ErrorValidacion } from "@/lib/store";
import { Avatar, Badge, Boton, Modal, Skel, Vacio } from "@/components/ui";
import { persona } from "@/lib/mock/equipo";
import type { Alerta, EstadoAlerta, Tema } from "@/lib/types";
import { foto } from "@/lib/photos";
import { haceCuanto, hora, norm, fechaCorta } from "@/lib/format";
import { TONO_ALERTA, TONO_TEMA, capital } from "@/lib/vista";

const TEMAS: Tema[] = ["Convivencia", "Ánimo", "Casa", "Seguridad"];

function Orientacion() {
  const { listo, alertas, familias, claves, agregarClave, quitarClave, ahora } = useStore();
  const params = useSearchParams();
  const [estado, setEstado] = useState<EstadoAlerta | "todas">("todas");
  const [tema, setTema] = useState<Tema | "">("");
  const [q, setQ] = useState("");
  const [nueva, setNueva] = useState("");
  const [cerrando, setCerrando] = useState<Alerta | null>(null);
  const foco = params.get("alerta");

  useEffect(() => {
    if (!listo || !foco) return;
    const t = setTimeout(() => document.getElementById(foco)?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
    return () => clearTimeout(t);
  }, [listo, foco]);

  const est = (id?: string) => familias.find((f) => f.id === id);
  const lista = useMemo(() => {
    const t = norm(q);
    const orden: Record<EstadoAlerta, number> = { nueva: 0, "en atención": 1, cerrada: 2 };
    return alertas
      .filter((a) => (estado === "todas" || a.estado === estado) && (!tema || a.tema === tema))
      .filter((a) => !t || norm(`${a.texto} ${a.remitente} ${est(a.estudianteId)?.nombre ?? ""} ${est(a.estudianteId)?.curso ?? ""}`).includes(t))
      .sort((a, b) => orden[a.estado] - orden[b.estado] || b.creado.localeCompare(a.creado));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertas, estado, tema, q, familias]);
  const cuenta = (e: EstadoAlerta) => alertas.filter((a) => a.estado === e).length;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Orientación</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>Lo que una máquina no debe contestar</h1>
        </div>
      </div>

      <div className="franja entra">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="franja-foto" src={foto("lucia", 160, 160)} alt="Lucía Rangel" width={64} height={64} />
        <div className="franja-txt">
          <strong>Cuando un estudiante cuenta algo delicado, el asistente no aconseja</strong>
          <p>Responde una sola frase de acompañamiento y avisa aquí en ese momento, con el mensaje completo. Así un &ldquo;no me dejan en paz&rdquo; escrito a las once de la noche no espera dormido en un historial hasta el lunes.</p>
        </div>
        <Badge tono="error">
          <ShieldAlert size={13} /> {listo ? cuenta("nueva") : 0} sin tomar
        </Badge>
      </div>

      <div className="dos" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
        <div className="form-col ancha" style={{ gridColumn: "auto" }}>
          <div className="toolbar">
            <div className="tabs" role="tablist">
              {(["todas", "nueva", "en atención", "cerrada"] as const).map((e) => (
                <button key={e} role="tab" aria-selected={estado === e} className={`tab ${estado === e ? "on" : ""}`} onClick={() => setEstado(e)}>
                  {e === "todas" ? "Todas" : e === "nueva" ? "Nuevas" : e === "cerrada" ? "Cerradas" : "En atención"}
                  <em>{listo ? (e === "todas" ? alertas.length : cuenta(e)) : ""}</em>
                </button>
              ))}
            </div>
            <div className="buscar">
              <Search size={17} />
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por curso, estudiante o texto" aria-label="Buscar alertas" />
            </div>
            <select className="select" value={tema} onChange={(e) => setTema(e.target.value as Tema | "")} aria-label="Filtrar por tema">
              <option value="">Todos los temas</option>
              {TEMAS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="alertas">
            {!listo && Array.from({ length: 4 }, (_, i) => <Skel key={i} alto={230} />)}
            {listo && lista.map((a, i) => <TarjetaAlerta key={a.id} alerta={a} foco={a.id === foco} retraso={i * 0.04} ahora={ahora} onCerrar={() => setCerrando(a)} />)}
          </div>
          {listo && !lista.length && <Vacio icono={<HeartHandshake size={24} />} titulo="No hay alertas con esos filtros" texto="Cuando llegue una, aparece aquí al instante y en el menú." />}
        </div>

        <div className="card" style={{ alignSelf: "start" }}>
          <div className="card-head">
            <div>
              <h2>Qué activa una alerta</h2>
              <p>Si un mensaje trae una de estas frases, no se responde con un documento.</p>
            </div>
            <Badge tono="apoyo">{claves.length}</Badge>
          </div>
          <form
            className="toolbar"
            style={{ marginBottom: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (nueva.trim().length < 3) return;
              agregarClave(nueva);
              setNueva("");
            }}
          >
            <input className="input" style={{ flex: "1 1 160px" }} value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder='Ejemplo: "me da miedo el recreo"' aria-label="Nueva frase" />
            <Boton tono="secundario" icono={<Plus size={16} />} type="submit" disabled={nueva.trim().length < 3}>
              Agregar
            </Boton>
          </form>
          <div className="chips">
            {claves.map((c) => (
              <span className="chip" key={c}>
                {c}
                <button className="x" onClick={() => quitarClave(c)} aria-label={`Quitar ${c}`}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Las frases se comparan sin tildes ni mayúsculas. Un cambio aquí se aplica al siguiente mensaje que llegue.</p>
        </div>
      </div>

      {cerrando && <CerrarAlerta alerta={cerrando} onCerrar={() => setCerrando(null)} />}
    </>
  );
}

function TarjetaAlerta({ alerta, foco, retraso, ahora, onCerrar }: { alerta: Alerta; foco: boolean; retraso: number; ahora: number; onCerrar: () => void }) {
  const { familias, tomarAlerta, notaAlerta, reabrirAlerta, toast } = useStore();
  const [nota, setNota] = useState("");
  const [escribir, setEscribir] = useState(false);
  const [cargando, setCargando] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const e = familias.find((f) => f.id === alerta.estudianteId);
  const r = persona(alerta.responsable);

  const correr = async (k: string, f: () => Promise<void>) => {
    setCargando(k);
    try {
      await f();
    } catch (err) {
      toast(err instanceof ErrorValidacion ? err.message : "No se pudo guardar.", "error");
    } finally {
      setCargando(null);
    }
  };

  return (
    <div id={alerta.id} ref={ref} className={`alerta e-${alerta.estado === "en atención" ? "atencion" : alerta.estado}`} style={{ animationDelay: `${retraso}s`, boxShadow: foco ? "0 0 0 4px rgba(207,74,90,.25), var(--shadow)" : undefined }}>
      <div className="alerta-top">
        <div style={{ minWidth: 0 }}>
          <strong>{e ? `${e.nombre} · ${e.curso}` : alerta.remitente}</strong>
          <small>
            {alerta.remitente} · {haceCuanto(alerta.creado, Math.max(ahora, Date.now() - 1))}, {hora(alerta.creado)}
          </small>
        </div>
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Badge tono={TONO_TEMA[alerta.tema]}>{alerta.tema}</Badge>
          <Badge tono={TONO_ALERTA[alerta.estado]}>{capital(alerta.estado)}</Badge>
        </span>
      </div>
      <div className="alerta-msg">{alerta.texto}</div>
      {alerta.notas.length > 0 && (
        <div className="notas">
          {alerta.notas.map((n, i) => {
            const p = persona(n.autor);
            return (
              <div className="nota" key={i}>
                {p && <Avatar src={p.foto} alt={p.nombre} size={26} />}
                <span>
                  <strong>{p?.nombre.split(" ")[0]}</strong> · {fechaCorta(n.fecha)}: {n.texto}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {escribir && (
        <div className="form-col">
          <textarea className="textarea" style={{ minHeight: 74 }} value={nota} onChange={(ev) => setNota(ev.target.value)} placeholder="Qué se hizo, con quién se habló, qué sigue" aria-label="Nota" />
          <div className="acciones">
            <button className="btn btn-ghost btn-sm" onClick={() => setEscribir(false)}>Cancelar</button>
            <Boton
              className="btn-sm"
              cargando={cargando === "nota"}
              onClick={() =>
                correr("nota", async () => {
                  await notaAlerta(alerta.id, nota, alerta.responsable ?? "lucia");
                  setNota("");
                  setEscribir(false);
                })
              }
            >
              Guardar nota
            </Boton>
          </div>
        </div>
      )}
      <div className="acciones" style={{ marginTop: "auto", alignItems: "center" }}>
        {alerta.estado === "nueva" && (
          <>
            <Boton className="btn-sm" tono="apoyo" icono={<HandHeart size={15} />} cargando={cargando === "lucia"} onClick={() => correr("lucia", () => tomarAlerta(alerta.id, "lucia"))}>
              La toma Lucía
            </Boton>
            <Boton className="btn-sm" tono="secundario" cargando={cargando === "andres"} onClick={() => correr("andres", () => tomarAlerta(alerta.id, "andres"))}>
              Coordinación
            </Boton>
          </>
        )}
        {alerta.estado === "en atención" && (
          <>
            {!escribir && (
              <Boton className="btn-sm" tono="secundario" icono={<MessageSquarePlus size={15} />} onClick={() => setEscribir(true)}>
                Nota
              </Boton>
            )}
            <Boton className="btn-sm" icono={<CheckCircle2 size={15} />} onClick={onCerrar}>
              Cerrar
            </Boton>
          </>
        )}
        {alerta.estado === "cerrada" && (
          <Boton className="btn-sm" tono="ghost" icono={<RotateCcw size={15} />} cargando={cargando === "reabrir"} onClick={() => correr("reabrir", () => reabrirAlerta(alerta.id))}>
            Reabrir
          </Boton>
        )}
        {r && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>
            <Avatar src={r.foto} alt={r.nombre} size={26} /> {r.nombre.split(" ")[0]}
          </span>
        )}
      </div>
    </div>
  );
}

function CerrarAlerta({ alerta, onCerrar }: { alerta: Alerta; onCerrar: () => void }) {
  const { cerrarAlerta } = useStore();
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  return (
    <Modal
      abierto
      titulo="Cerrar la alerta"
      onCerrar={onCerrar}
      ancho={480}
      pie={
        <>
          <button className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
          <Boton
            icono={<CheckCircle2 size={16} />}
            cargando={cargando}
            onClick={async () => {
              setCargando(true);
              setError("");
              try {
                await cerrarAlerta(alerta.id, nota, alerta.responsable ?? "lucia");
                onCerrar();
              } catch (e) {
                setError(e instanceof Error ? e.message : "No se pudo cerrar.");
              } finally {
                setCargando(false);
              }
            }}
          >
            Cerrar con nota
          </Boton>
        </>
      }
    >
      <div className="form-col">
        <div className="alerta-msg">{alerta.texto}</div>
        {error && (
          <div className="error-caja">
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        <textarea className="textarea" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Cómo quedó: con quién se habló y qué seguimiento hay" aria-label="Nota de cierre" />
      </div>
    </Modal>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skel alto={500} />}>
      <Orientacion />
    </Suspense>
  );
}
