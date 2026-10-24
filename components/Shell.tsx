"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, HeartHandshake, Inbox, LayoutDashboard, Menu, MessageCircle, Phone, Users, X } from "lucide-react";
import { Backdrop } from "./three/Scenes";
import { Avatar, Toasts } from "./ui";
import { useStore } from "@/lib/store";
import { COLEGIO, EQUIPO } from "@/lib/mock/equipo";
import { tel } from "@/lib/format";

const NAV = [
  { href: "/", texto: "Inicio", icono: LayoutDashboard },
  { href: "/conversar", texto: "Probar el asistente", icono: MessageCircle },
  { href: "/bandeja", texto: "Secretaría", icono: Inbox, cuenta: "casos" as const },
  { href: "/orientacion", texto: "Orientación", icono: HeartHandshake, cuenta: "alertas" as const },
  { href: "/documentos", texto: "Documentos", icono: FileText },
  { href: "/familias", texto: "Familias registradas", icono: Users },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const { casos, alertas, listo } = useStore();
  const pendientes = casos.filter((c) => c.estado === "pendiente").length;
  const nuevas = alertas.filter((a) => a.estado === "nueva").length;
  const actual = NAV.find((n) => (n.href === "/" ? ruta === "/" : ruta.startsWith(n.href)));
  const marta = EQUIPO[0];

  useEffect(() => setAbierto(false), [ruta]);

  return (
    <div className="app">
      <Backdrop />
      <aside className={`sidebar ${abierto ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <MessageCircle size={20} strokeWidth={2.4} />
          </span>
          <span className="brand-txt">
            <strong>Ventanilla</strong>
            <small>{COLEGIO.nombre}</small>
          </span>
          <button className="icon-btn cerrar-menu" onClick={() => setAbierto(false)} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>
        <nav className="nav">
          {NAV.map((n) => {
            const on = actual?.href === n.href;
            const cuenta = n.cuenta === "casos" ? pendientes : n.cuenta === "alertas" ? nuevas : 0;
            const Ic = n.icono;
            return (
              <Link key={n.href} href={n.href} className={`nav-item ${on ? "on" : ""}`}>
                <Ic size={19} />
                <span>{n.texto}</span>
                {listo && cuenta > 0 && <em className={n.cuenta === "alertas" ? "cuenta naranja" : "cuenta"}>{cuenta}</em>}
              </Link>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="linea">
            <span className="linea-ic">
              <Phone size={16} />
            </span>
            <div>
              <small>Línea de WhatsApp</small>
              <strong>{tel(COLEGIO.linea.replace(/\s/g, ""))}</strong>
            </div>
            <span className="punto-vivo" aria-label="En línea" />
          </div>
          <div className="quien">
            <Avatar src={marta.foto} alt={marta.nombre} size={38} />
            <div>
              <strong>{marta.nombre}</strong>
              <small>{marta.cargo}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className={`scrim ${abierto ? "show" : ""}`} onClick={() => setAbierto(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setAbierto(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="top-tit">
            <small>{COLEGIO.nombre}</small>
            <strong>{actual?.texto ?? "Ventanilla"}</strong>
          </div>
          <div className="top-der">
            <span className="estado-asistente">
              <span className="punto-vivo" /> Asistente en línea
            </span>
          </div>
        </header>
        <main className="content">{children}</main>
        <footer className="footer">
          <span>© 2026 {COLEGIO.nombre} · Ventanilla</span>
          <span>Fotos: Unsplash</span>
        </footer>
      </div>
      <Toasts />
    </div>
  );
}
