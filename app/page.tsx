"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Ban, BookOpenCheck, Clock3, HeartHandshake, Inbox, MessageCircle, MessagesSquare, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { Horas, Mostrador } from "@/components/three/Scenes";
import { Avatar, Badge, Skel, Tilt } from "@/components/ui";
import { FOTO_CATEGORIA } from "@/lib/mock/documentos";
import { persona } from "@/lib/mock/equipo";
import { foto } from "@/lib/photos";
import { fechaCorta, haceCuanto } from "@/lib/format";
import { ICONO_MOTIVO, TONO_ESTADO } from "@/lib/vista";

const DESDE = 19;
const HASTA = 22;

export default function Inicio() {
  const { listo, registro, casos, alertas, docs, familias, ahora } = useStore();
  const [foco, setFoco] = useState<number | null>(null);

  const s = useMemo(() => {
    const porHora = Array(24).fill(0) as number[];
    let general = 0;
    let bloqueado = 0;
    registro.forEach((r) => {
      porHora[new Date(r.hora).getHours()]++;
      if (r.tipo === "general") general++;
      if (r.tipo === "bloqueado") bloqueado++;
    });
    const total = registro.length;
    const noche = porHora.slice(DESDE, HASTA + 1).reduce((a, b) => a + b, 0);
    return {
      porHora,
      total,
      general,
      bloqueado,
      pctGeneral: total ? Math.round((general / total) * 100) : 0,
      pctNoche: total ? Math.round((noche / total) * 100) : 0,
    };
  }, [registro]);

  const pendientes = casos.filter((c) => c.estado === "pendiente");
  const enCurso = casos.filter((c) => c.estado === "en curso").length;
  const abiertas = alertas.filter((a) => a.estado !== "cerrada");
  const nuevas = alertas.filter((a) => a.estado === "nueva").length;
  const top = [...docs].filter((d) => d.vigente).sort((a, b) => b.consultas - a.consultas).slice(0, 6);
  const maxTop = top[0]?.consultas ?? 1;
  const recientes = [...docs].filter((d) => d.vigente).sort((a, b) => b.actualizado.localeCompare(a.actualizado)).slice(0, 4);
  const nombre = (id?: string) => familias.find((f) => f.id === id);

  return (
    <>
      <section className="hero entra">
        <div className="hero-txt">
          <span className="eyebrow">Secretaría · Línea de WhatsApp</span>
          <h1>
            Las familias preguntan a cualquier hora. <em>Lo privado se queda en su casa.</em>
          </h1>
          <p>El asistente responde lo general con las circulares del colegio. Lo de cada estudiante pasa a la secretaría con un resumen, y un mensaje delicado llega a orientación en el momento.</p>
          <div className="hero-acc">
            <Link href="/conversar" className="btn btn-primario">
              <MessageCircle size={18} /> <span>Probar el asistente</span>
            </Link>
            <Link href="/bandeja" className="btn btn-secundario">
              <Inbox size={18} /> <span>Ver la bandeja</span>
            </Link>
          </div>
        </div>
        <div className="hero-escena">
          <Mostrador conScroll />
          <div className="leyenda">
            <span><i style={{ background: "var(--accent)" }} /> Circulares: lo general</span>
            <span><i style={{ background: "var(--support)" }} /> Archivador: lo de cada estudiante</span>
            <span><i style={{ background: "var(--err)" }} /> Número no registrado</span>
            <span><i style={{ background: "#e9b44c" }} /> Orientación</span>
          </div>
        </div>
      </section>

      <section className="kpis">
        {!listo
          ? Array.from({ length: 5 }, (_, i) => <Skel key={i} alto={124} />)
          : [
              { t: "Mensajes en 7 días", v: s.total, d: `unos ${Math.round(s.total / 7)} por día`, ic: MessagesSquare, c: "var(--info)", bg: "var(--info-soft)" },
              { t: "Respondidos al instante", v: s.general, d: `${s.pctGeneral}% sin pasar por una persona`, ic: BookOpenCheck, c: "var(--accent)", bg: "var(--accent-soft)" },
              { t: "Esperando a secretaría", v: pendientes.length, d: `${enCurso} más en curso`, ic: Inbox, c: "var(--support-2)", bg: "var(--support-soft)" },
              { t: "Alertas abiertas", v: abiertas.length, d: nuevas ? `${nuevas} sin tomar todavía` : "todas tienen responsable", ic: HeartHandshake, c: "var(--err)", bg: "var(--err-soft)" },
              { t: "Consultas frenadas", v: s.bloqueado, d: "personales desde números no registrados", ic: Ban, c: "#8f5f0c", bg: "var(--warn-soft)" },
            ].map((k) => (
              <Tilt key={k.t} className="kpi entra">
                <div className="kpi-top">
                  {k.t}
                  <span className="kpi-ic" style={{ color: k.c, background: k.bg }}>
                    <k.ic size={18} />
                  </span>
                </div>
                <strong>{k.v.toLocaleString("es-CO")}</strong>
                <small>{k.d}</small>
              </Tilt>
            ))}
      </section>

      <section className="dos">
        <div className="card ancha">
          <div className="card-head">
            <div>
              <h2>A qué hora escriben las familias</h2>
              <p>Mensajes por hora en los últimos 7 días. Pase el puntero por una columna.</p>
            </div>
            <Badge tono="apoyo">
              <Clock3 size={13} /> De 7 a 11 de la noche
            </Badge>
          </div>
          <div className="horas-wrap">
            {listo ? <Horas valores={s.porHora} desde={DESDE} hasta={HASTA} onHover={setFoco} /> : <Skel alto={280} />}
            {foco !== null && (
              <div className="horas-tip">
                {foco}:00 a {foco + 1}:00 · {s.porHora[foco]} mensajes
              </div>
            )}
          </div>
          {listo && (
            <div className="dato-grande">
              <strong>{s.pctNoche}%</strong>
              <p>de los mensajes llega entre las 7 y las 11 de la noche, cuando la secretaría ya cerró. Esa es la hora en que una respuesta correcta vale más.</p>
            </div>
          )}
        </div>

      </section>

      <section className="tres">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Lo que más preguntan</h2>
              <p>Documentos que el asistente usó para responder</p>
            </div>
            <Link href="/documentos" className="enlace">
              Documentos <ArrowRight size={15} />
            </Link>
          </div>
          <div className="barras">
            {!listo
              ? Array.from({ length: 6 }, (_, i) => <Skel key={i} alto={30} />)
              : top.map((d) => (
                  <div className="barra" key={d.id}>
                    <span className="barra-tit">{d.titulo}</span>
                    <span className="barra-n">{d.consultas}</span>
                    <span className="barra-pista">
                      <i style={{ width: `${(d.consultas / maxTop) * 100}%` }} />
                    </span>
                  </div>
                ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Esperando a la secretaría</h2>
              <p>Consultas de un estudiante, ya resumidas</p>
            </div>
            <Link href="/bandeja" className="enlace">
              Bandeja <ArrowRight size={15} />
            </Link>
          </div>
          <div className="lista">
            {!listo
              ? Array.from({ length: 4 }, (_, i) => <Skel key={i} alto={52} className="fila" />)
              : pendientes.slice(0, 4).map((c) => {
                  const Ic = ICONO_MOTIVO[c.motivo];
                  const e = nombre(c.estudianteId);
                  return (
                    <Link href={`/bandeja?caso=${c.id}`} className="fila" key={c.id}>
                      <span className="fila-ic" style={{ background: "var(--support-soft)", color: "var(--support-2)" }}>
                        <Ic size={18} />
                      </span>
                      <span className="fila-txt">
                        <strong>{e ? `${e.nombre} · ${e.curso}` : c.remitente}</strong>
                        <p>{c.resumen}</p>
                        <span className="fila-meta">
                          <Badge tono={TONO_ESTADO[c.estado]}>{c.motivo}</Badge>
                          {haceCuanto(c.creado, ahora)}
                        </span>
                      </span>
                    </Link>
                  );
                })}
            {listo && !pendientes.length && <p className="muted">No hay consultas esperando.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Orientación</h2>
              <p>Mensajes que el asistente no responde</p>
            </div>
            <Link href="/orientacion" className="enlace">
              Ver alertas <ArrowRight size={15} />
            </Link>
          </div>
          <div className="lista">
            {!listo
              ? Array.from({ length: 3 }, (_, i) => <Skel key={i} alto={52} className="fila" />)
              : abiertas.slice(0, 3).map((a) => {
                  const r = persona(a.responsable);
                  return (
                    <Link href="/orientacion" className="fila" key={a.id}>
                      <span className="fila-ic" style={{ background: a.estado === "nueva" ? "var(--err-soft)" : "var(--support-soft)", color: a.estado === "nueva" ? "var(--err)" : "var(--support-2)" }}>
                        <HeartHandshake size={18} />
                      </span>
                      <span className="fila-txt">
                        <strong>{nombre(a.estudianteId)?.curso ?? ""} · {a.tema}</strong>
                        <p>&ldquo;{a.texto}&rdquo;</p>
                        <span className="fila-meta">
                          {r ? <Avatar src={r.foto} alt={r.nombre} size={22} /> : <Badge tono="error">Nueva</Badge>}
                          {r ? `${r.nombre.split(" ")[0]} · ` : ""}
                          {haceCuanto(a.creado, ahora)}
                        </span>
                      </span>
                    </Link>
                  );
                })}
          </div>
        </div>

      </section>

      <section className="dos">
        <div className="card ancha">
          <div className="card-head">
            <div>
              <h2>Circulares recién actualizadas</h2>
              <p>El asistente responde con la versión más reciente desde el momento en que se publica</p>
            </div>
            <Badge tono="acento">
              <ShieldCheck size={13} /> Solo documentos vigentes
            </Badge>
          </div>
          <div className="fotos-doc">
            {!listo
              ? Array.from({ length: 4 }, (_, i) => <Skel key={i} alto={230} />)
              : recientes.map((d) => (
                  <Link href={`/documentos?doc=${d.id}`} key={d.id}>
                    <Tilt className="doc-card entra">
                      <div className="doc-foto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={foto(d.foto ?? FOTO_CATEGORIA[d.categoria], 480, 260)} alt={d.categoria} width={480} height={260} loading="lazy" />
                        <Badge tono="acento">{d.categoria}</Badge>
                      </div>
                      <div className="doc-cuerpo">
                        <span className="doc-cod">{d.codigo}</span>
                        <h3>{d.titulo}</h3>
                        <div className="doc-pie">
                          <span>Versión {d.version}</span>
                          <span>{fechaCorta(d.actualizado)}</span>
                        </div>
                      </div>
                    </Tilt>
                  </Link>
                ))}
          </div>
        </div>
      </section>
    </>
  );
}
