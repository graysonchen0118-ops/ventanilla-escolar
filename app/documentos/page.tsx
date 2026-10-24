"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Archive, ArchiveRestore, FilePlus2, FileText, MessageCircle, Pencil, Search, Trash2, X } from "lucide-react";
import { useStore, ErrorValidacion } from "@/lib/store";
import { Badge, Boton, Campo, Confirmar, Drawer, Modal, Paginacion, Skel, Tilt, Vacio } from "@/components/ui";
import { CATEGORIAS, FOTO_CATEGORIA } from "@/lib/mock/documentos";
import type { Categoria, Documento } from "@/lib/types";
import { foto } from "@/lib/photos";
import { fechaCorta, norm } from "@/lib/format";

const POR_PAGINA = 12;

function Documentos() {
  const { listo, docs } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Categoria | "">("");
  const [estado, setEstado] = useState<"vigentes" | "archivados" | "todos">("vigentes");
  const [orden, setOrden] = useState<"recientes" | "consultados" | "az">("recientes");
  const [pagina, setPagina] = useState(1);
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const [editando, setEditando] = useState<Documento | "nuevo" | null>(null);

  useEffect(() => {
    const d = params.get("doc");
    if (listo && d && docs.some((x) => x.id === d)) setAbiertoId(d);
  }, [listo, params, docs]);

  const lista = useMemo(() => {
    const t = norm(q);
    let l = docs.filter((d) => (estado === "todos" || (estado === "vigentes" ? d.vigente : !d.vigente)) && (!cat || d.categoria === cat));
    if (t) l = l.filter((d) => norm(`${d.codigo} ${d.titulo} ${d.respuesta} ${d.claves.join(" ")}`).includes(t));
    if (orden === "recientes") l = [...l].sort((a, b) => b.actualizado.localeCompare(a.actualizado));
    if (orden === "consultados") l = [...l].sort((a, b) => b.consultas - a.consultas);
    if (orden === "az") l = [...l].sort((a, b) => a.titulo.localeCompare(b.titulo));
    return l;
  }, [docs, q, cat, estado, orden]);
  useEffect(() => setPagina(1), [q, cat, estado, orden]);
  const visibles = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const abierto = docs.find((d) => d.id === abiertoId) ?? null;

  return (
    <>
      <div className="card-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Documentos</span>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>Lo único que el asistente puede decir</h1>
          <p className="muted" style={{ marginTop: 4, maxWidth: "72ch" }}>
            Circulares, calendario, reglamento y costos. El asistente responde con este texto y con nada más. Si la secretaría cambia una fecha aquí, la próxima familia que pregunte ya recibe la nueva.
          </p>
        </div>
        <Boton icono={<FilePlus2 size={17} />} onClick={() => setEditando("nuevo")}>
          Nuevo documento
        </Boton>
      </div>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {(["vigentes", "archivados", "todos"] as const).map((e) => (
            <button key={e} role="tab" aria-selected={estado === e} className={`tab ${estado === e ? "on" : ""}`} onClick={() => setEstado(e)}>
              {e === "vigentes" ? "Vigentes" : e === "archivados" ? "Archivados" : "Todos"}
              <em>{listo ? (e === "todos" ? docs.length : docs.filter((d) => (e === "vigentes" ? d.vigente : !d.vigente)).length) : ""}</em>
            </button>
          ))}
        </div>
        <div className="buscar">
          <Search size={17} />
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en títulos, textos y palabras clave" aria-label="Buscar documentos" />
        </div>
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value as Categoria | "")} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="select" value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar">
          <option value="recientes">Actualizados hace poco</option>
          <option value="consultados">Más consultados</option>
          <option value="az">De la A a la Z</option>
        </select>
      </div>

      <div className="docs-grid">
        {!listo && Array.from({ length: 8 }, (_, i) => <Skel key={i} alto={270} />)}
        {listo &&
          visibles.map((d) => (
            <Tilt key={d.id} className={`doc-card entra ${d.vigente ? "" : "archivado"}`} onClick={() => setAbiertoId(d.id)}>
              <div className="doc-foto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto(d.foto ?? FOTO_CATEGORIA[d.categoria], 520, 280)} alt={d.categoria} width={520} height={280} loading="lazy" />
                <Badge tono={d.vigente ? "acento" : "neutro"}>{d.vigente ? d.categoria : "Archivado"}</Badge>
              </div>
              <div className="doc-cuerpo">
                <span className="doc-cod">{d.codigo}</span>
                <h3>{d.titulo}</h3>
                <p>{d.respuesta}</p>
                <div className="doc-pie">
                  <span>Versión {d.version} · {fechaCorta(d.actualizado)}</span>
                  <span>{d.consultas} consultas</span>
                </div>
              </div>
            </Tilt>
          ))}
      </div>
      {listo && !lista.length && (
        <Vacio
          icono={<FileText size={24} />}
          titulo="Ningún documento con esos filtros"
          texto={estado === "archivados" ? "No hay documentos archivados en esta categoría." : "Pruebe con otra palabra o categoría."}
          accion={<button className="btn btn-secundario btn-sm" onClick={() => { setQ(""); setCat(""); }}>Limpiar filtros</button>}
        />
      )}
      <Paginacion pagina={pagina} total={lista.length} porPagina={POR_PAGINA} onCambio={setPagina} />

      {abierto && (
        <DetalleDoc
          doc={abierto}
          onCerrar={() => {
            setAbiertoId(null);
            if (params.get("doc")) router.replace("/documentos", { scroll: false });
          }}
          onEditar={() => setEditando(abierto)}
        />
      )}
      {editando && <Editor doc={editando === "nuevo" ? null : editando} onCerrar={() => setEditando(null)} />}
    </>
  );
}

function DetalleDoc({ doc, onCerrar, onEditar }: { doc: Documento; onCerrar: () => void; onEditar: () => void }) {
  const { archivarDoc, eliminarDoc } = useStore();
  const [cargando, setCargando] = useState<string | null>(null);
  const [borrar, setBorrar] = useState(false);
  const pregunta = `Me puede contar sobre ${doc.titulo.toLowerCase()}?`;
  return (
    <Drawer
      abierto
      titulo={doc.titulo}
      sub={
        <>
          <Badge tono="acento">{doc.codigo}</Badge>
          <Badge tono="neutro">{doc.categoria}</Badge>
          <Badge tono={doc.vigente ? "ok" : "neutro"}>{doc.vigente ? "Vigente" : "Archivado"}</Badge>
        </>
      }
      onCerrar={onCerrar}
      pie={
        <>
          <button className="btn btn-ghost" onClick={() => setBorrar(true)}>
            <Trash2 size={16} /> <span>Eliminar</span>
          </button>
          <Boton
            tono="secundario"
            icono={doc.vigente ? <Archive size={16} /> : <ArchiveRestore size={16} />}
            cargando={cargando === "archivar"}
            onClick={async () => {
              setCargando("archivar");
              await archivarDoc(doc.id, !doc.vigente);
              setCargando(null);
            }}
          >
            {doc.vigente ? "Archivar" : "Restaurar"}
          </Boton>
          <Boton icono={<Pencil size={16} />} onClick={onEditar}>
            Cambiar texto
          </Boton>
        </>
      }
    >
      <div className="doc-foto" style={{ height: 170, borderRadius: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto(doc.foto ?? FOTO_CATEGORIA[doc.categoria], 760, 340)} alt={doc.categoria} width={760} height={340} />
      </div>
      <div>
        <div className="sec-tit">Lo que responde el asistente</div>
        <div className="cita">{doc.respuesta}</div>
      </div>
      <div>
        <div className="sec-tit">Palabras con las que lo preguntan</div>
        <div className="chips">
          {doc.claves.map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
      </div>
      <div className="datos">
        <div className="dato">
          <small>Versión</small>
          <strong>{doc.version}</strong>
        </div>
        <div className="dato">
          <small>Actualizado</small>
          <strong>{fechaCorta(doc.actualizado)}</strong>
        </div>
        <div className="dato">
          <small>Consultas respondidas</small>
          <strong>{doc.consultas}</strong>
        </div>
      </div>
      {!doc.vigente && (
        <div className="error-caja" style={{ background: "var(--warn-soft)", color: "#7a520c" }}>
          <AlertTriangle size={18} /> Archivado: el asistente no lo usa, aunque una familia pregunte justo por esto.
        </div>
      )}
      <Link href={`/conversar?quien=valentina&q=${encodeURIComponent(pregunta)}`} className="btn btn-secundario">
        <MessageCircle size={16} /> <span>Preguntarle esto al asistente</span>
      </Link>
      <div>
        <div className="sec-tit">Historial</div>
        <div className="historial">
          {doc.historial.map((h) => (
            <div key={h.version}>
              <strong>Versión {h.version}</strong> <span>· {fechaCorta(h.fecha)} · {h.autor}</span>
              <br />
              <span>{h.nota}</span>
            </div>
          ))}
        </div>
      </div>
      <Confirmar
        abierto={borrar}
        titulo="Eliminar el documento"
        texto={`"${doc.titulo}" deja de existir para el asistente y para la secretaría. Si solo dejó de valer, mejor archívelo.`}
        accion="Eliminar"
        cargando={cargando === "borrar"}
        onCerrar={() => setBorrar(false)}
        onConfirmar={async () => {
          setCargando("borrar");
          await eliminarDoc(doc.id);
          setCargando(null);
          setBorrar(false);
          onCerrar();
        }}
      />
    </Drawer>
  );
}

function Editor({ doc, onCerrar }: { doc: Documento | null; onCerrar: () => void }) {
  const { guardarDoc } = useStore();
  const [codigo, setCodigo] = useState(doc?.codigo ?? "");
  const [titulo, setTitulo] = useState(doc?.titulo ?? "");
  const [categoria, setCategoria] = useState<Categoria>(doc?.categoria ?? "Calendario");
  const [respuesta, setRespuesta] = useState(doc?.respuesta ?? "");
  const [claves, setClaves] = useState<string[]>(doc?.claves ?? []);
  const [clave, setClave] = useState("");
  const [vigente, setVigente] = useState(doc?.vigente ?? true);
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const sumar = () => {
    const partes = clave.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (!partes.length) return;
    setClaves((c) => Array.from(new Set([...c, ...partes])));
    setClave("");
  };

  const guardar = async () => {
    setCargando(true);
    setError("");
    try {
      const base: Documento = doc ?? { id: "", codigo: "", titulo: "", categoria, respuesta: "", claves: [], vigente: true, actualizado: "", version: 0, historial: [], consultas: 0 };
      await guardarDoc({ ...base, codigo: codigo.trim(), titulo: titulo.trim(), categoria, respuesta: respuesta.trim(), claves, vigente }, !doc, nota.trim());
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
      titulo={doc ? `Cambiar ${doc.codigo}` : "Nuevo documento"}
      onCerrar={onCerrar}
      ancho={640}
      pie={
        <>
          <button className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
          <Boton cargando={cargando} onClick={guardar}>
            {doc ? `Publicar versión ${doc.version + 1}` : "Publicar"}
          </Boton>
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
          <Campo etiqueta="Código">
            <input className="input" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Circular 23" />
          </Campo>
          <Campo etiqueta="Categoría">
            <select className="select" style={{ width: "100%" }} value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo etiqueta="Título">
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Entrega de boletines del cuarto periodo" />
        </Campo>
        <Campo etiqueta="Lo que responde el asistente" ayuda={`${respuesta.length} caracteres. Escríbalo como se lo diría a una familia en la ventanilla.`}>
          <textarea className="textarea" style={{ minHeight: 120 }} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} />
        </Campo>
        <Campo etiqueta="Palabras con las que lo preguntan" ayuda="Separe varias con comas y presione Agregar">
          <div className="toolbar">
            <input
              className="input"
              style={{ flex: "1 1 200px" }}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sumar();
                }
              }}
              placeholder="boletín, entrega de notas"
            />
            <button type="button" className="btn btn-secundario" onClick={sumar}>Agregar</button>
          </div>
        </Campo>
        {claves.length > 0 && (
          <div className="chips">
            {claves.map((c) => (
              <span className="chip" key={c}>
                {c}
                <button type="button" className="x" onClick={() => setClaves((x) => x.filter((y) => y !== c))} aria-label={`Quitar ${c}`}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
        {doc && (
          <Campo etiqueta="Qué cambió" ayuda="Queda en el historial">
            <input className="input" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Se movió la fecha al lunes 9" />
          </Campo>
        )}
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 700, fontSize: 14 }}>
          <input type="checkbox" checked={vigente} onChange={(e) => setVigente(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
          Vigente: el asistente lo usa para responder
        </label>
      </div>
    </Modal>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skel alto={500} />}>
      <Documentos />
    </Suspense>
  );
}
