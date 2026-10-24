"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { damp, montar, sombraSuave, texturaTexto } from "./kit";

// 24 columnas, una por hora del día, sobre una tabla de madera. Las horas de la noche,
// cuando las familias por fin se sientan a escribir, van en el color de apoyo.
export default function Horas({ valores, desde, hasta, onHover }: { valores: number[]; desde: number; hasta: number; onHover: (i: number | null) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const datos = useRef({ valores, desde, hasta, onHover });
  datos.current = { valores, desde, hasta, onHover };

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dpr: 1.35 });
    if (!k) return;
    const { scene, renderer, track, small, reduce } = k;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.1 : 1.35));
    const camera = new THREE.PerspectiveCamera(34, k.size().w / k.size().h, 0.1, 60);
    const base = new THREE.Vector3(0, 3.9, 11.5);
    // la mesa entra entera a lo ancho; en pantallas angostas la cámara se aleja
    const ajustar = (w: number, h: number) => {
      camera.aspect = w / h;
      const t = Math.tan((camera.fov * Math.PI) / 360);
      base.z = Math.max(13.6 / 2 / (t * camera.aspect), 4.6 / 2 / t) + 0.6;
      base.y = 2.6 + base.z * 0.12;
      camera.updateProjectionMatrix();
    };
    ajustar(k.size().w, k.size().h);
    k.onResize(ajustar);

    scene.add(new THREE.HemisphereLight(0xfff6e8, 0xc4d4cf, 1.25));
    const sol = new THREE.DirectionalLight(0xffffff, 1.0);
    sol.position.set(-5, 9, 7);
    scene.add(sol);

    const grupo = new THREE.Group();
    scene.add(grupo);
    const mesa = new THREE.Mesh(track(new THREE.BoxGeometry(13.2, 0.18, 1.7)), track(new THREE.MeshLambertMaterial({ color: 0xd9b48c })));
    mesa.position.y = -0.09;
    grupo.add(mesa);
    const sombra = sombraSuave(15, 3, 0.25);
    sombra.position.y = -0.2;
    grupo.add(sombra);

    const geo = track(new THREE.BoxGeometry(0.38, 1, 0.38));
    geo.translate(0, 0.5, 0);
    const matDia = track(new THREE.MeshLambertMaterial({ color: 0x8fc2b6 }));
    const matNoche = track(new THREE.MeshLambertMaterial({ color: 0xe2874b }));
    const matFoco = track(new THREE.MeshLambertMaterial({ color: 0x1d6b5f }));
    const columnas = Array.from({ length: 24 }, (_, i) => {
      const m = new THREE.Mesh(geo, matDia);
      const x = -5.98 + i * 0.52;
      m.position.set(x, 0, -Math.pow(x / 6.2, 2) * 0.5);
      m.scale.y = 0.02;
      grupo.add(m);
      return m;
    });

    // horas escritas sobre el canto de la mesa, debajo de su columna
    const etiquetas: THREE.Texture[] = [];
    [0, 3, 6, 9, 12, 15, 18, 21].forEach((hh) => {
      const tx = texturaTexto(`${hh}:00`, { fondo: "rgba(0,0,0,0)", color: hh >= 19 ? "#8a3d12" : "#3f4f53", ancho: 256, alto: 96, tam: 60 });
      etiquetas.push(tx);
      const m = new THREE.Mesh(track(new THREE.PlaneGeometry(0.95, 0.36)), track(new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })));
      const x = -5.98 + hh * 0.52;
      m.position.set(x, 0.12, 0.64 - Math.pow(x / 6.2, 2) * 0.5);
      m.rotation.x = -0.55;
      m.renderOrder = 2;
      grupo.add(m);
    });

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2(9, 9);
    let foco: number | null = null;
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const onLeave = () => ndc.set(9, 9);
    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerleave", onLeave);
    const ptr = { x: 0 };
    const onWin = (e: PointerEvent) => (ptr.x = (e.clientX / window.innerWidth - 0.5) * 2);
    window.addEventListener("pointermove", onWin, { passive: true });
    let cx = 0;

    k.loop((dt, t) => {
      const { valores, desde, hasta } = datos.current;
      const max = Math.max(1, ...valores);
      columnas.forEach((c, i) => {
        const alto = 0.08 + (valores[i] / max) * 3.4 * (foco === i ? 1.04 : 1);
        c.scale.y = damp(c.scale.y, alto, 4, dt);
        c.material = foco === i ? matFoco : i >= desde && i <= hasta ? matNoche : matDia;
      });
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(columnas, false)[0];
      const n = hit ? (columnas as THREE.Object3D[]).indexOf(hit.object) : null;
      if (n !== foco) {
        foco = n;
        datos.current.onHover(n);
        mount.style.cursor = n === null ? "default" : "pointer";
      }
      cx = damp(cx, ptr.x, 2, dt);
      grupo.rotation.y = cx * 0.12 + (reduce ? 0 : Math.sin(t * 0.3) * 0.03);
      camera.position.set(base.x, base.y, base.z);
      camera.lookAt(0, 1.15, 0);
      renderer.render(scene, camera);
    });

    return () => {
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointermove", onWin);
      etiquetas.forEach((t) => t.dispose());
      k.dispose();
    };
  }, []);

  return <div ref={ref} className="horas-canvas" role="img" aria-label="Mensajes por hora del día" />;
}
