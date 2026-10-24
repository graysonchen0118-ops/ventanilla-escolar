"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Ban, Pencil, Phone, Plus, Search, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import { useStore, ErrorValidacion } from "@/lib/store";
import { Badge, Boton, Campo, Confirmar, Modal, Paginacion, Skel, Vacio } from "@/components/ui";
import { GRADOS, esPrimaria, nombreGrado } from "@/lib/mock/familias";
import type { Acudiente, Estudiante, Relacion } from "@/lib/types";
import { haceCuanto, norm, soloDigitos, tel } from "@/lib/format";

const RELACIONES: Relacion[] = ["Mamá", "Papá", "Abuela", "Abuelo", "Tía", "Tío", "Acudiente"];
const POR_PAGINA = 12;

function Familias() {
  const { listo, familias, registro, ahora } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [nivel, setNivel] = useState<"" | "primaria" | "bachillerato">("");
  const [grado, setGrado] = useState<number | "">("");
  const [orden, setOrden] = useState<"az" | "grado">("az");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<Estudiante | "nuevo" | null>(null);
  const [borrar, setBorrar] = useState<Estudiante | null>(null);
  const [registrar, setRegistrar] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const { eliminarEstudiante } = useStore();

  useEffect(() => {
    const r = params.get("registrar");
    if (listo && r) setRegistrar(r);
  }, [listo, params]);

  const registrados = useMemo(() => new Set(familias.flatMap((f) => [...f.acudientes.map((a) => a.telefono), f.telefonoPropio ?? ""])), [familias]);
  const bloqueados = useMemo(() => {
    const vistos = new Map<string, { telefono: string; hora: string; veces: number }>();
    registro.filter((r) => r.tipo === "bloqueado").forEach((r) => {
      const v = vistos.get(r.telefono);
      if (v) v.veces++;
      else vistos.set(r.telefono, { telefono: r.telefono, hora: r.hora, veces: 1 });
    });
    return [...vistos.values()].filter((b) => !registrados.has(b.telefono)).slice(0, 5);
  }, [registro, registrados]);

  const lista = useMemo(() => {
    const t = norm(q);
    const td = soloDigitos(q);
    let l = familias.filter((f) => (!nivel || (nivel === "primaria" ? esPrimaria(f.grado) : !esPrimaria(f.grado))) && (grado === "" || f.grado === grado));
    if (t) l = l.filter((f) => norm(`${f.nombre} ${f.curso} ${f.acudientes.map((a) => a.nombre).join(" ")}`).includes(t) || (td.length >= 3 && [...f.acudientes.map((a) => a.telefono), f.telefonoPropio ?? ""].some((x) => x.includes(td))));
    return [...l].sort((a, b) => (orden === "grado" ? a.grado - b.grado || a.nombre.localeCompare(b.nombre) : a.nombre.localeCompare(b.nombre)));
  }, [familias, q, nivel, grado, orden]);
  useEffect(() => setPagina(1), [q, nivel, grado, orden]);
  const visibles = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const totalNumeros = familias.reduce((s, f) => s + f.acudientes.length + (f.telefonoPropio ? 1 : 0), 0);

  return (
    <>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Familias registradas</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>Quién puede preguntar por quién</h1>
          <p className="muted" style={{ marginTop: 4, maxWidth: "72ch" }}>
            Un número que no está aquí puede preguntar fechas y costos, pero nada de un estudiante. Es la misma regla de la salida de clases: la hora se la dicen a cualquiera, el niño solo se le entrega a quien está en la lista.
          </p>
        </div>
        <Boton icono={<Plus size={17} />} onClick={() => setEditando("nuevo")}>
          Registrar familia
        </Boton>
      </div>

      <section className="kpis">
        {!listo
          ? Array.from({ length: 3 }, (_, i) => <Skel key={i} alto={110} />)
          : [
              { t: "Estudiantes", v: familias.filter((f) => f.activo).length, d: (() => { const n = familias.filter((f) => !f.activo).length; return n === 1 ? "1 retirado este año" : `${n} retirados este año`; })(), ic: Users, c: "var(--accent)", bg: "var(--accent-soft)" },
              { t: "Números registrados", v: totalNumeros, d: "de acudientes y estudiantes de bachillerato", ic: ShieldCheck, c: "var(--ok)", bg: "var(--ok-soft)" },
              { t: "Preguntas frenadas", v: registro.filter((r) => r.tipo === "bloqueado").length, d: "personales desde números sin registro, 7 días", ic: Ban, c: "var(--err)", bg: "var(--err-soft)" },
            ].map((k) => (
              <div key={k.t} className="kpi entra">
                <div className="kpi-top">
                  {k.t}
                  <span className="kpi-ic" style={{ color: k.c, background: k.bg }}>
                    <k.ic size={18} />
                  </span>
                </div>
                <strong>{k.v}</strong>
                <small>{k.d}</small>
              </div>
            ))}
      </section>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Números que preguntaron por un estudiante sin estar registrados</h2>
            <p>Si alguno es de un acudiente que cambió de celular, regístrelo y la próxima vez el asistente lo reconoce.</p>
          </div>
        </div>
        <div className="bloqueados">
          {!listo && <Skel alto={46} />}
          {listo && !bloqueados.length && <p className="muted">No hay números pendientes por revisar.</p>}
          {listo &&
            bloqueados.map((b) => (
              <div className="bloq" key={b.telefono}>
                <Ban size={17} color="var(--err)" />
                <span className="mono">{tel(b.telefono)}</span>
                <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
                  {b.veces > 1 ? `${b.veces} intentos` : "1 intento"} · {haceCuanto(b.hora, Math.max(ahora, Date.now() - 1))}
                </span>
                <Boton className="btn-sm" tono="secundario" icono={<UserPlus size={15} />} onClick={() => setRegistrar(b.telefono)}>
                  Registrar
                </Boton>
              </div>
            ))}
        </div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 14 }}>
          <div className="buscar">
            <Search size={17} />
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por estudiante, acudiente o teléfono" aria-label="Buscar familias" />
          </div>
          <select className="select" value={nivel} onChange={(e) => { setNivel(e.target.value as typeof nivel); setGrado(""); }} aria-label="Nivel">
            <option value="">Todos los niveles</option>
            <option value="primaria">Transición y primaria</option>
            <option value="bachillerato">Bachillerato</option>
          </select>
          <select className="select" value={grado} onChange={(e) => setGrado(e.target.value === "" ? "" : Number(e.target.value))} aria-label="Grado">
            <option value="">Todos los grados</option>
            {GRADOS.map((g, i) => (
              <option key={g} value={i} disabled={nivel === "primaria" ? i > 5 : nivel === "bachillerato" ? i <= 5 : false}>{g}</option>
            ))}
          </select>
          <select className="select" value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar">
            <option value="az">Por nombre</option>
            <option value="grado">Por grado</option>
          </select>
        </div>
        {!listo ? (
          <Skel alto={420} />
        ) : lista.length ? (
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Acudientes registrados</th>
                  <th>Número propio</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.nombre}</strong>
                      {!f.activo && (
                        <div>
                          <Badge tono="neutro">Retirado</Badge>
                        </div>
                      )}
                    </td>
                    <td>{f.curso}</td>
                    <td>
                      <div className="acu">
                        {f.acudientes.map((a) => (
                          <span key={a.id}>
                            {a.nombre} <small>{a.relacion}</small> <span className="mono">{tel(a.telefono)}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="mono">{f.telefonoPropio ? tel(f.telefonoPropio) : <span className="muted">No</span>}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="icon-btn" onClick={() => setEditando(f)} aria-label={`Editar ${f.nombre}`}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-btn" onClick={() => setBorrar(f)} aria-label={`Eliminar ${f.nombre}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vacio icono={<Users size={24} />} titulo="Nadie coincide con la búsqueda" texto="Busque por nombre, curso o los últimos dígitos del teléfono." />
        )}
        <Paginacion pagina={pagina} total={lista.length} porPagina={POR_PAGINA} onCambio={setPagina} />
      </div>

      {editando && <EditorFamilia est={editando === "nuevo" ? null : editando} onCerrar={() => setEditando(null)} />}
      {registrar && (
        <RegistrarNumero
          telefono={registrar}
          onCerrar={() => {
            setRegistrar(null);
            if (params.get("registrar")) router.replace("/familias", { scroll: false });
          }}
        />
      )}
      <Confirmar
        abierto={!!borrar}
        titulo={`Eliminar a ${borrar?.nombre ?? ""}`}
        texto="Sus números dejan de estar registrados: el asistente ya no les dará información de este estudiante."
        accion="Eliminar"
        cargando={cargando}
        onCerrar={() => setBorrar(null)}
        onConfirmar={async () => {
          if (!borrar) return;
          setCargando(true);
          await eliminarEstudiante(borrar.id);
          setCargando(false);
          setBorrar(null);
        }}
      />
    </>
  );
}

function EditorFamilia({ est, onCerrar }: { est: Estudiante | null; onCerrar: () => void }) {
  const { guardarEstudiante } = useStore();
  const [nombre, setNombre] = useState(est?.nombre ?? "");
  const [grado, setGrado] = useState(est?.grado ?? 1);
  const [grupo, setGrupo] = useState(est?.curso.slice(-1) ?? "A");
  const [acus, setAcus] = useState<Acudiente[]>(est?.acudientes.map((a) => ({ ...a, telefono: tel(a.telefono) })) ?? [{ id: "nuevo-0", nombre: "", relacion: "Mamá", telefono: "" }]);
  const [propio, setPropio] = useState(est?.telefonoPropio ? tel(est.telefonoPropio) : "");
  const [activo, setActivo] = useState(est?.activo ?? true);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cambiar = (i: number, k: keyof Acudiente, v: string) => setAcus((l) => l.map((a, j) => (j === i ? { ...a, [k]: v } : a)));

  const guardar = async () => {
    setCargando(true);
    setError("");
    try {
      const curso = grado === 0 ? `Transición ${grupo}` : `${nombreGrado(grado)}${grupo}`;
      await guardarEstudiante({ id: est?.id ?? "", nombre: nombre.trim(), grado, curso, acudientes: acus.map((a) => ({ ...a, nombre: a.nombre.trim() })), telefonoPropio: propio.trim() ? propio : undefined, activo }, !est);
      onCerrar();
    } catch (e) {
      setError(e instanceof ErrorValidacion ? e.message : "No se pudo guardar.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      abierto
      titulo={est ? `Editar a ${est.nombre}` : "Registrar familia"}
      onCerrar={onCerrar}
      ancho={680}
      pie={
        <>
          <button className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
          <Boton cargando={cargando} onClick={guardar}>Guardar</Boton>
        </>
      }
    >
      <div className="form-col">
        {error && (
          <div className="error-caja">
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        <div className="form-grid">
          <Campo etiqueta="Nombre del estudiante">
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" />
          </Campo>
          <Campo etiqueta="Grado">
            <select className="select" style={{ width: "100%" }} value={grado} onChange={(e) => setGrado(Number(e.target.value))}>
              {GRADOS.map((g, i) => (
                <option key={g} value={i}>{g}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Grupo">
            <select className="select" style={{ width: "100%" }} value={grupo} onChange={(e) => setGrupo(e.target.value)}>
              <option>A</option>
              <option>B</option>
            </select>
          </Campo>
        </div>
        <div className="sec-tit" style={{ marginBottom: 0 }}>Acudientes con número registrado</div>
        {acus.map((a, i) => (
          <div className="fila-acu" key={a.id}>
            <Campo etiqueta="Nombre">
              <input className="input" value={a.nombre} onChange={(e) => cambiar(i, "nombre", e.target.value)} />
            </Campo>
            <Campo etiqueta="Parentesco">
              <select className="select" style={{ width: "100%", minWidth: 0 }} value={a.relacion} onChange={(e) => cambiar(i, "relacion", e.target.value)}>
                {RELACIONES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Teléfono">
              <input className="input" value={a.telefono} onChange={(e) => cambiar(i, "telefono", e.target.value)} inputMode="numeric" placeholder="300 555 0000" />
            </Campo>
            <button className="icon-btn" style={{ marginBottom: 2 }} onClick={() => setAcus((l) => l.filter((_, j) => j !== i))} aria-label="Quitar acudiente" disabled={acus.length === 1}>
              <X size={16} />
            </button>
          </div>
        ))}
        <button className="btn btn-secundario btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setAcus((l) => [...l, { id: `nuevo-${Date.now()}`, nombre: "", relacion: "Papá", telefono: "" }])}>
          <Plus size={15} /> <span>Otro acudiente</span>
        </button>
        <Campo etiqueta="Número propio del estudiante" ayuda="Solo si el estudiante escribe desde su celular. Puede preguntar lo suyo, no lo de otros.">
          <input className="input" value={propio} onChange={(e) => setPropio(e.target.value)} inputMode="numeric" placeholder="Opcional" />
        </Campo>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 700, fontSize: 14 }}>
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
          Estudiante activo
        </label>
      </div>
    </Modal>
  );
}

function RegistrarNumero({ telefono, onCerrar }: { telefono: string; onCerrar: () => void }) {
  const { familias, registrarNumero } = useStore();
  const [estId, setEstId] = useState("");
  const [nombre, setNombre] = useState("");
  const [relacion, setRelacion] = useState<Relacion>("Mamá");
  const [numero, setNumero] = useState(tel(telefono));
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const ordenados = useMemo(() => [...familias].filter((f) => f.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)), [familias]);
  return (
    <Modal
      abierto
      titulo="Registrar un número"
      onCerrar={onCerrar}
      ancho={520}
      pie={
        <>
          <button className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
          <Boton
            icono={<Phone size={16} />}
            cargando={cargando}
            onClick={async () => {
              setCargando(true);
              setError("");
              try {
                await registrarNumero(estId, { nombre, relacion, telefono: numero });
                onCerrar();
              } catch (e) {
                setError(e instanceof ErrorValidacion ? e.message : "No se pudo registrar.");
              } finally {
                setCargando(false);
              }
            }}
          >
            Registrar número
          </Boton>
        </>
      }
    >
      <div className="form-col">
        <p className="muted" style={{ fontSize: 14 }}>Hágalo solo después de confirmar la identidad del acudiente en secretaría, con su documento.</p>
        {error && (
          <div className="error-caja">
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        <Campo etiqueta="Teléfono">
          <input className="input mono" value={numero} onChange={(e) => setNumero(e.target.value)} inputMode="numeric" />
        </Campo>
        <Campo etiqueta="Estudiante">
          <select className="select" style={{ width: "100%" }} value={estId} onChange={(e) => setEstId(e.target.value)}>
            <option value="">Elija el estudiante</option>
            {ordenados.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre} · {f.curso}</option>
            ))}
          </select>
        </Campo>
        <div className="form-grid">
          <Campo etiqueta="Nombre del acudiente">
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Campo>
          <Campo etiqueta="Parentesco">
            <select className="select" style={{ width: "100%" }} value={relacion} onChange={(e) => setRelacion(e.target.value as Relacion)}>
              {RELACIONES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Campo>
        </div>
      </div>
    </Modal>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skel alto={500} />}>
      <Familias />
    </Suspense>
  );
}
