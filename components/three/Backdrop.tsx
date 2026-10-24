"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { damp, formaBurbuja, montar } from "./kit";
import { mulberry32 } from "@/lib/format";

// Fondo de todo el sitio: circulares, lápices y burbujas de chat que flotan en capas,
// cada capa a su velocidad con el scroll y el puntero.
export default function Backdrop() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dpr: 1, suavizado: false });
    if (!k) return;
    const { scene, renderer, track, small, reduce } = k;
    renderer.setPixelRatio(small ? 0.9 : 0.85);
    scene.fog = new THREE.Fog(0xf4f2ec, 8, 30);
    const camera = new THREE.PerspectiveCamera(50, k.size().w / k.size().h, 0.1, 80);
    camera.position.set(0, 0, 16);
    k.onResize((w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb9cdc7, 1.25));
    const sol = new THREE.DirectionalLight(0xffffff, 0.9);
    sol.position.set(-4, 7, 8);
    scene.add(sol);

    const burbuja = track(new THREE.ExtrudeGeometry(formaBurbuja(0.9, 0.52, 0.16), { depth: 0.06, bevelEnabled: false }));
    const rnd = mulberry32(31);
    type Pieza = { base: THREE.Vector3; rot: THREE.Euler; giro: THREE.Vector3 };
    const capas = [
      { n: small ? 9 : 16, geo: track(new THREE.PlaneGeometry(0.78, 1.02)), mat: track(new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide })) },
      { n: small ? 7 : 12, geo: track(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 6)), mat: track(new THREE.MeshLambertMaterial({ color: 0xe8a33d, transparent: true, opacity: 0.55 })) },
      { n: small ? 8 : 14, geo: burbuja, mat: track(new THREE.MeshLambertMaterial({ color: 0x5fa596, transparent: true, opacity: 0.32 })) },
    ];
    const grupos = capas.map((c, ci) => {
      const mesh = new THREE.InstancedMesh(c.geo, c.mat, c.n);
      const piezas: Pieza[] = [];
      for (let i = 0; i < c.n; i++) {
        piezas.push({
          base: new THREE.Vector3((rnd() - 0.5) * 40, (rnd() - 0.5) * 30, -3 - rnd() * 18 - ci * 2),
          rot: new THREE.Euler(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI),
          giro: new THREE.Vector3((rnd() - 0.5) * 0.16, (rnd() - 0.5) * 0.16, (rnd() - 0.5) * 0.12),
        });
      }
      scene.add(mesh);
      return { mesh, piezas };
    });

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    const ptr = { x: 0, y: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    let empujon = 0;
    const onPulso = () => (empujon = 1);
    window.addEventListener("ventanilla:pulso", onPulso);
    window.addEventListener("ventanilla:evento", onPulso);

    k.loop((dt, t) => {
      cur.x = damp(cur.x, ptr.x, 2, dt);
      cur.y = damp(cur.y, ptr.y, 2, dt);
      cur.s = damp(cur.s, window.scrollY, 5, dt);
      empujon = Math.max(0, empujon - dt * 0.9);
      camera.position.x = cur.x * 1.3;
      camera.position.y = -cur.y * 0.8 - cur.s * 0.004;
      camera.position.z = 16 - empujon * 2.4;
      camera.lookAt(0, camera.position.y * 0.7, 0);
      grupos.forEach(({ mesh, piezas }) => {
        piezas.forEach((p, i) => {
          const vel = 0.003 * (1 + (p.base.z + 26) / 16);
          const flota = reduce ? 0 : Math.sin(t * 0.22 + i) * 0.45;
          v.set(p.base.x, p.base.y + flota + cur.s * vel, p.base.z);
          if (!reduce) {
            p.rot.x += p.giro.x * dt * (1 + empujon * 4);
            p.rot.y += p.giro.y * dt * (1 + empujon * 4);
            p.rot.z += p.giro.z * dt;
          }
          q.setFromEuler(p.rot);
          m4.compose(v, q, s);
          mesh.setMatrixAt(i, m4);
        });
        mesh.instanceMatrix.needsUpdate = true;
      });
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("ventanilla:pulso", onPulso);
      window.removeEventListener("ventanilla:evento", onPulso);
      k.dispose();
    };
  }, []);

  return <div ref={ref} className="bg-canvas" aria-hidden="true" />;
}
