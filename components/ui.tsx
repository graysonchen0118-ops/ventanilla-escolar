"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, X } from "lucide-react";
import { useStore } from "@/lib/store";

function useBloqueo(abierto: boolean, onCerrar: () => void) {
  useEffect(() => {
    if (!abierto) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", f);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", f);
      document.body.style.overflow = antes;
    };
  }, [abierto, onCerrar]);
}

export function Modal({ abierto, titulo, onCerrar, children, pie, ancho = 560 }: { abierto: boolean; titulo: string; onCerrar: () => void; children: ReactNode; pie?: ReactNode; ancho?: number }) {
  useBloqueo(abierto, onCerrar);
  if (!abierto) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} style={{ maxWidth: ancho }}>
        <header className="modal-head">
          <h2>{titulo}</h2>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {pie && <footer className="modal-pie">{pie}</footer>}
      </div>
    </div>
  );
}

export function Drawer({ abierto, titulo, sub, onCerrar, children, pie }: { abierto: boolean; titulo: string; sub?: ReactNode; onCerrar: () => void; children: ReactNode; pie?: ReactNode }) {
  useBloqueo(abierto, onCerrar);
  if (!abierto) return null;
  return (
    <div className="overlay overlay-drawer" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="drawer-head">
          <div>
            <h2>{titulo}</h2>
            {sub && <div className="drawer-sub">{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {pie && <footer className="drawer-pie">{pie}</footer>}
      </aside>
    </div>
  );
}

export function Confirmar({ abierto, titulo, texto, accion, onCerrar, onConfirmar, cargando }: { abierto: boolean; titulo: string; texto: string; accion: string; onCerrar: () => void; onConfirmar: () => void; cargando?: boolean }) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={onCerrar}
      ancho={440}
      pie={
        <>
          <button className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
          <Boton tono="peligro" cargando={cargando} onClick={onConfirmar}>{accion}</Boton>
        </>
      }
    >
      <p className="muted">{texto}</p>
    </Modal>
  );
}

export function Boton({ children, tono = "primario", cargando, icono, className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tono?: "primario" | "secundario" | "ghost" | "peligro" | "apoyo"; cargando?: boolean; icono?: ReactNode }) {
  return (
    <button {...p} className={`btn btn-${tono} ${className}`} disabled={cargando || p.disabled}>
      {cargando ? <Loader2 size={16} className="spin" /> : icono}
      <span>{children}</span>
    </button>
  );
}

export function Badge({ tono = "neutro", children }: { tono?: "ok" | "aviso" | "error" | "info" | "neutro" | "acento" | "apoyo"; children: ReactNode }) {
  return <span className={`badge b-${tono}`}>{children}</span>;
}

export function Skel({ alto = 16, ancho, className = "" }: { alto?: number; ancho?: number | string; className?: string }) {
  return <div className={`skel ${className}`} style={{ height: alto, width: ancho }} />;
}

export function Vacio({ icono, titulo, texto, accion }: { icono: ReactNode; titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <div className="vacio">
      <div className="vacio-ic">{icono}</div>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {accion}
    </div>
  );
}

export function Tilt({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mover = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
    el.style.setProperty("--lx", `${x * 100}%`);
    el.style.setProperty("--ly", `${y * 100}%`);
  };
  const salir = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={mover} onPointerLeave={salir} onClick={onClick}>
      {children}
    </div>
  );
}

export function Paginacion({ pagina, total, porPagina, onCambio }: { pagina: number; total: number; porPagina: number; onCambio: (p: number) => void }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;
  return (
    <nav className="paginacion" aria-label="Páginas">
      <button className="icon-btn" disabled={pagina <= 1} onClick={() => onCambio(pagina - 1)} aria-label="Página anterior">
        <ChevronLeft size={18} />
      </button>
      {Array.from({ length: paginas }, (_, i) => (
        <button key={i} className={`pag ${pagina === i + 1 ? "on" : ""}`} onClick={() => onCambio(i + 1)}>
          {i + 1}
        </button>
      ))}
      <button className="icon-btn" disabled={pagina >= paginas} onClick={() => onCambio(pagina + 1)} aria-label="Página siguiente">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast t-${t.tono}`}>
          {t.tono === "ok" ? <CheckCircle2 size={18} /> : t.tono === "error" ? <AlertTriangle size={18} /> : <Info size={18} />}
          <span>{t.texto}</span>
        </div>
      ))}
    </div>
  );
}

export function Avatar({ src, alt, size = 36 }: { src: string; alt: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="avatar" src={src} alt={alt} width={size} height={size} style={{ width: size, height: size }} loading="lazy" />;
}

export function Campo({ etiqueta, ayuda, children, error }: { etiqueta: string; ayuda?: string; children: ReactNode; error?: string }) {
  return (
    <label className={`campo ${error ? "con-error" : ""}`}>
      <span className="campo-et">{etiqueta}</span>
      {children}
      {ayuda && !error && <span className="campo-ayuda">{ayuda}</span>}
      {error && <span className="campo-error">{error}</span>}
    </label>
  );
}
