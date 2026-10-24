"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { damp, formaBurbuja, montar, sombraSuave, texturaTexto } from "./kit";

const C = {
  acento: 0x1d6b5f,
  acentoClaro: 0xd4ebe4,
  apoyo: 0xe2874b,
  apoyoClaro: 0xfbe1cf,
  madera: 0xd9b48c,
  maderaOscura: 0xb48a62,
  papel: 0xfdfcf8,
  gris: 0xe5dfd2,
  tinta: 0x1c2a30,
  ok: 0x2f9e6d,
  error: 0xd14d5c,
  errorClaro: 0xf6d3d8,
  oro: 0xc9a227,
  ambar: 0xf8e0b3,
};

type Evento = "general" | "personal" | "bloqueado" | "delicado" | "sin respuesta" | "saludo" | "gracias" | "ambiente";

// El mostrador de la secretaría: el celular de la familia a la izquierda, las carpetas con las
// circulares, la bandeja de la secretaría, el archivador con lo de cada estudiante y el timbre
// de orientación. Cada mensaje que entra vuela al lugar que le corresponde.
export default function Mostrador({ compacto = false, conScroll = false }: { compacto?: boolean; conScroll?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dpr: 1.35 });
    if (!k) return;
    const { scene, renderer, track, small, reduce } = k;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.1 : 1.35));

    const camera = new THREE.PerspectiveCamera(compacto ? 40 : 33, k.size().w / k.size().h, 0.1, 60);
    const base = new THREE.Vector3(-0.15, 3.6, 11);
    const mira = new THREE.Vector3(-0.15, 1.9, 0);
    // la distancia sale del tamaño de la escena: entra entera a lo ancho y a lo alto
    const encuadre = (w: number, h: number) => {
      camera.aspect = w / h;
      const t = Math.tan((camera.fov * Math.PI) / 360);
      const zAncho = (compacto ? 8.0 : 8.7) / 2 / (t * camera.aspect);
      const zAlto = (compacto ? 4.2 : 5.0) / 2 / t;
      base.z = Math.max(zAncho, zAlto) + 1.4;
      camera.updateProjectionMatrix();
    };
    encuadre(k.size().w, k.size().h);
    k.onResize(encuadre);

    scene.add(new THREE.HemisphereLight(0xfff6e8, 0xc4d4cf, 1.2));
    const sol = new THREE.DirectionalLight(0xffffff, 1.05);
    sol.position.set(-4, 8, 7);
    scene.add(sol);

    const mundo = new THREE.Group();
    scene.add(mundo);
    const L = (c: number) => track(new THREE.MeshLambertMaterial({ color: c }));
    const Ph = (c: number, brillo = 50) => track(new THREE.MeshPhongMaterial({ color: c, shininess: brillo }));
    const caja = (w: number, h: number, d: number) => track(new THREE.BoxGeometry(w, h, d));
    const poner = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, padre: THREE.Object3D = mundo) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      padre.add(m);
      return m;
    };

    // el mostrador
    poner(caja(6.4, 1.15, 1.5), L(C.acento), 0, 0.575, 0);
    poner(caja(6.8, 0.14, 1.8), L(C.madera), 0, 1.22, 0);
    poner(caja(6.42, 0.07, 0.02), L(C.apoyo), 0, 0.92, 0.76);
    const sombra = sombraSuave(8.4, 3.2, 0.26);
    sombra.position.y = 0.005;
    mundo.add(sombra);
    const TOP = 1.29;

    // carpetas con las circulares
    const colores = [C.acento, C.apoyo, 0x3f6fb5, C.oro, C.error, C.ok, 0x7b62a8, C.gris, 0x2c8a7d];
    const lomo = caja(0.15, 0.3, 0.01);
    const matLomo = L(0xffffff);
    const carpetas = colores.map((c, i) => {
      const m = poner(caja(0.24, 0.95, 0.72), L(c), -2.78 + i * 0.27, TOP + 0.475, -0.25);
      const et = new THREE.Mesh(lomo, matLomo);
      et.position.set(0, 0.18, 0.365);
      m.add(et);
      return { m, y0: m.position.y, obj: 0, sacude: 0 };
    });
    const ultima = carpetas[carpetas.length - 1].m;
    ultima.rotation.z = -0.24;
    ultima.position.x += 0.08;
    ultima.position.y -= 0.03;
    const sombraCarpetas = sombraSuave(2.9, 1.1, 0.22);
    sombraCarpetas.position.set(-1.7, TOP + 0.004, -0.2);
    mundo.add(sombraCarpetas);
    const hoja = poner(caja(0.9, 0.012, 1.2), L(C.papel), -0.6, TOP + 0.007, 0.3);
    hoja.rotation.y = 0.2;
    const renglon = caja(0.62, 0.002, 0.04);
    const matRenglon = L(0xc9d3d0);
    for (let i = 0; i < 6; i++) {
      const r = new THREE.Mesh(renglon, matRenglon);
      r.position.set(-0.06, 0.008, -0.4 + i * 0.15);
      hoja.add(r);
    }

    // bandeja de la secretaría
    poner(caja(1.15, 0.1, 0.85), L(C.maderaOscura), 0.85, TOP + 0.05, 0.18);
    const geoPapel = caja(0.95, 0.018, 0.68);
    const matPapel = L(C.papel);
    const papeles = Array.from({ length: 7 }, (_, i) => {
      const p = poner(geoPapel, matPapel, 0.85, TOP + 0.11 + i * 0.024, 0.18);
      p.rotation.y = (i % 3) * 0.05 - 0.05;
      p.visible = i < 2;
      return p;
    });
    let pila = 2;

    // archivador: lo de cada estudiante
    const arch = new THREE.Group();
    arch.position.set(2.35, TOP, -0.2);
    mundo.add(arch);
    poner(caja(1.15, 1.62, 1.0), Ph(0xdcd6c8, 40), 0, 0.81, 0, arch);
    const sombraArch = sombraSuave(1.8, 1.5, 0.3);
    sombraArch.position.set(2.35, TOP + 0.004, -0.1);
    mundo.add(sombraArch);
    const frente = caja(1.02, 0.42, 0.06);
    const matFrente = Ph(0xeee9dd, 45);
    const asa = caja(0.36, 0.05, 0.06);
    const matAsa = Ph(C.tinta, 80);
    const etiqueta = caja(0.24, 0.09, 0.01);
    const cuerpoCajon = caja(0.98, 0.34, 0.9);
    const matCuerpo = L(0xcfc7b6);
    const carpetita = caja(0.82, 0.24, 0.02);
    const cajones = [0, 1, 2].map((i) => {
      const g = new THREE.Group();
      g.position.set(0, 0.32 + i * 0.5, 0.47);
      arch.add(g);
      poner(frente, matFrente, 0, 0, 0.03, g);
      poner(asa, matAsa, 0, 0.06, 0.08, g);
      poner(etiqueta, matLomo, 0, -0.1, 0.065, g);
      poner(cuerpoCajon, matCuerpo, 0, -0.02, -0.45, g);
      [C.apoyo, C.acento, 0x3f6fb5, C.oro].forEach((c, j) => poner(carpetita, L(c), 0, 0.1, -0.15 - j * 0.16, g));
      return { g, z0: 0.47, obj: 0 };
    });

    // el candado que aparece cuando el número no está registrado
    const candado = new THREE.Group();
    candado.position.set(2.35, TOP + 1.2, 0.95);
    candado.scale.setScalar(0.001);
    mundo.add(candado);
    poner(caja(0.46, 0.38, 0.16), Ph(C.oro, 90), 0, 0, 0, candado);
    const arco = new THREE.Mesh(track(new THREE.TorusGeometry(0.15, 0.045, 8, 20, Math.PI)), Ph(0x9aa3a6, 100));
    arco.position.y = 0.19;
    candado.add(arco);
    poner(caja(0.06, 0.13, 0.02), L(C.tinta), 0, -0.02, 0.085, candado);
    let candadoObj = 0;
    let sacudir = 0;

    // timbre de orientación
    poner(track(new THREE.CylinderGeometry(0.27, 0.31, 0.08, 24)), L(C.tinta), 3.32, TOP + 0.04, 0.4);
    const matCupula = track(new THREE.MeshLambertMaterial({ color: C.apoyo, emissive: 0x000000 }));
    poner(track(new THREE.SphereGeometry(0.25, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), matCupula, 3.32, TOP + 0.08, 0.4);
    poner(track(new THREE.SphereGeometry(0.05, 10, 8)), L(C.tinta), 3.32, TOP + 0.36, 0.4);
    const luz = new THREE.PointLight(0xffa25c, 0, 3.2);
    luz.position.set(3.32, TOP + 0.7, 0.8);
    mundo.add(luz);
    const colorBrillo = new THREE.Color(0xff8a3d);
    let brillo = 0;

    // el celular de la familia
    const cel = new THREE.Group();
    cel.position.set(-3.7, 2.8, 0.7);
    cel.rotation.set(-0.08, 0.42, 0.05);
    mundo.add(cel);
    poner(caja(0.98, 1.86, 0.11), Ph(C.tinta, 70), 0, 0, 0, cel);
    const matPantalla = track(new THREE.MeshBasicMaterial({ color: 0xeaf4f0 }));
    poner(track(new THREE.PlaneGeometry(0.86, 1.68)), matPantalla, 0, 0, 0.058, cel);
    poner(track(new THREE.PlaneGeometry(0.86, 0.2)), track(new THREE.MeshBasicMaterial({ color: C.acento })), 0, 0.74, 0.059, cel);
    const mini = track(new THREE.PlaneGeometry(0.5, 0.16));
    [
      [0.14, 0.42, 0xffffff],
      [-0.12, 0.16, C.acentoClaro],
      [0.12, -0.1, 0xffffff],
      [-0.14, -0.36, C.acentoClaro],
    ].forEach(([x, y, c]) => poner(mini, track(new THREE.MeshBasicMaterial({ color: c })), x, y, 0.06, cel));
    let destello = 0;

    // letreros
    const letreros: THREE.Texture[] = [];
    const letrero = (texto: string, w: number, h: number, x: number, y: number, z: number, fondo: string, color: string) => {
      const t = texturaTexto(texto, { fondo, color });
      letreros.push(t);
      const m = poner(track(new THREE.PlaneGeometry(w, h)), track(new THREE.MeshBasicMaterial({ map: t, transparent: true })), x, y, z);
      return m;
    };
    letrero("Secretaría", 1.9, 0.48, 0.25, 3.9, -0.5, "#1d6b5f", "#ffffff");
    const cuerda = track(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 4));
    poner(cuerda, L(C.tinta), -0.5, 4.48, -0.5);
    poner(cuerda, L(C.tinta), 1.0, 4.48, -0.5);
    if (!compacto) {
      letrero("Circulares", 1.3, 0.33, -1.68, TOP + 1.32, -0.2, "#1d6b5f", "#ffffff");
      letrero("Archivador", 1.3, 0.33, 2.35, TOP + 2.0, -0.2, "#e2874b", "#ffffff");
      letrero("Orientación", 1.3, 0.33, 3.4, TOP + 0.92, 0.3, "#e9b44c", "#1c2a30");
    }

    // burbujas que viajan
    const geoB = track(new THREE.ExtrudeGeometry(formaBurbuja(0.82, 0.46, 0.15), { depth: 0.05, bevelEnabled: false }));
    geoB.center();
    const l1 = track(new THREE.PlaneGeometry(0.5, 0.045));
    const l2 = track(new THREE.PlaneGeometry(0.32, 0.045));
    const matLinea = track(new THREE.MeshBasicMaterial({ color: 0xaab7b4 }));
    type Burbuja = { g: THREE.Group; mat: THREE.MeshLambertMaterial; activo: boolean; t: number; dur: number; p0: THREE.Vector3; p1: THREE.Vector3; p2: THREE.Vector3; s0: number; s1: number; fin?: () => void };
    const burbujas: Burbuja[] = Array.from({ length: 10 }, () => {
      const g = new THREE.Group();
      const mat = track(new THREE.MeshLambertMaterial({ color: 0xffffff }));
      g.add(new THREE.Mesh(geoB, mat));
      const a = new THREE.Mesh(l1, matLinea);
      a.position.set(-0.04, 0.07, 0.03);
      const b = new THREE.Mesh(l2, matLinea);
      b.position.set(-0.13, -0.07, 0.03);
      g.add(a, b);
      g.visible = false;
      mundo.add(g);
      return { g, mat, activo: false, t: 0, dur: 1, p0: new THREE.Vector3(), p1: new THREE.Vector3(), p2: new THREE.Vector3(), s0: 1, s1: 1 };
    });
    const P_CEL = new THREE.Vector3(-3.2, 3.1, 1.05);
    const P_CARP = new THREE.Vector3(-1.68, TOP + 1.25, 0.4);
    const P_ARCH = new THREE.Vector3(2.35, TOP + 1.2, 0.95);
    const P_BAND = new THREE.Vector3(0.85, TOP + 0.35, 0.35);
    const P_LAMP = new THREE.Vector3(3.32, TOP + 0.45, 0.55);
    const volar = (desde: THREE.Vector3, hasta: THREE.Vector3, color: number, dur: number, fin?: () => void, o: { alto?: number; s0?: number; s1?: number } = {}) => {
      const b = burbujas.find((x) => !x.activo);
      if (!b) return;
      b.activo = true;
      b.t = 0;
      b.dur = dur;
      b.p0.copy(desde);
      b.p2.copy(hasta);
      b.p1.copy(desde).lerp(hasta, 0.5).add(new THREE.Vector3(0, o.alto ?? 1.6, 0.7));
      b.s0 = o.s0 ?? 1;
      b.s1 = o.s1 ?? 0.85;
      b.mat.color.setHex(color);
      b.fin = fin;
      b.g.visible = true;
    };

    let reloj = 0;
    const tareas: { en: number; fn: () => void }[] = [];
    const luego = (s: number, fn: () => void) => tareas.push({ en: reloj + s, fn });
    let ultimoReal = -99;

    const lanzar = (e: Evento) => {
      destello = 1;
      switch (e) {
        case "personal":
          volar(P_CEL, P_ARCH, C.apoyoClaro, 1.2, () => {
            cajones[2].obj = 0.55;
            luego(0.45, () =>
              volar(P_ARCH, P_BAND, C.apoyoClaro, 0.85, () => {
                pila = pila >= papeles.length ? 2 : pila + 1;
              }, { alto: 0.7, s1: 0.45 }),
            );
            luego(1.8, () => (cajones[2].obj = 0));
          });
          break;
        case "bloqueado":
          volar(P_CEL, P_ARCH.clone().add(new THREE.Vector3(-0.2, 0, 0.6)), C.errorClaro, 1.2, () => {
            candadoObj = 1;
            sacudir = 1;
            luego(0.25, () => volar(P_ARCH.clone().add(new THREE.Vector3(-0.2, 0, 0.6)), new THREE.Vector3(1.9, 0.5, 1.6), C.error, 0.8, undefined, { alto: 0.3, s0: 0.85, s1: 0.15 }));
            luego(2.6, () => (candadoObj = 0));
          });
          break;
        case "delicado":
          volar(P_CEL, P_LAMP, C.ambar, 1.35, () => {
            brillo = 1;
          }, { alto: 2.3, s1: 0.3 });
          break;
        case "sin respuesta":
          volar(P_CEL, P_CARP, C.papel, 1.0, () => {
            carpetas.forEach((c) => (c.sacude = 0.7));
            luego(0.6, () =>
              volar(P_CARP, P_BAND, C.papel, 1.0, () => {
                pila = pila >= papeles.length ? 2 : pila + 1;
              }, { alto: 0.9, s1: 0.45 }),
            );
          });
          break;
        default: {
          const c = carpetas[Math.floor(Math.random() * (carpetas.length - 1))];
          volar(P_CEL, P_CARP, C.papel, 1.0, () => {
            c.obj = 0.4;
            luego(0.5, () => {
              c.obj = 0;
              volar(P_CARP, P_CEL, C.acentoClaro, 1.0, undefined, { alto: 1.3 });
            });
          });
        }
      }
    };

    const onEvento = (ev: Event) => {
      const d = (ev as CustomEvent).detail as Evento;
      ultimoReal = reloj;
      lanzar(d);
    };
    window.addEventListener("ventanilla:evento", onEvento);

    const ptr = { x: 0, y: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let proximo = 1.2;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const tmp = new THREE.Vector3();

    k.loop((dt, t) => {
      reloj += dt;
      for (let i = tareas.length - 1; i >= 0; i--) {
        if (tareas[i].en <= reloj) {
          const f = tareas[i].fn;
          tareas.splice(i, 1);
          f();
        }
      }
      if (!reduce && reloj > proximo) {
        proximo = reloj + 4.6;
        if (reloj - ultimoReal > 7) lanzar(Math.random() < 0.72 ? "ambiente" : "personal");
      }

      cur.x = damp(cur.x, ptr.x, 2.2, dt);
      cur.y = damp(cur.y, ptr.y, 2.2, dt);
      cur.s = damp(cur.s, conScroll ? window.scrollY : 0, 5, dt);
      camera.position.set(base.x + cur.x * 0.9, base.y - cur.y * 0.35 + cur.s * 0.0016, base.z + cur.s * 0.002);
      camera.lookAt(mira);
      mundo.rotation.y = damp(mundo.rotation.y, cur.x * 0.08 + (reduce ? 0 : Math.sin(t * 0.25) * 0.04), 3, dt);

      carpetas.forEach((c) => {
        c.m.position.y = damp(c.m.position.y, c.y0 + c.obj, 8, dt);
        c.sacude = Math.max(0, c.sacude - dt * 0.9);
        c.m.rotation.x = Math.sin(t * 38 + c.y0) * 0.05 * c.sacude;
      });
      cajones.forEach((c) => (c.g.position.z = damp(c.g.position.z, c.z0 + c.obj, 6, dt)));
      const sc = damp(candado.scale.x, Math.max(0.001, candadoObj), 9, dt);
      candado.scale.setScalar(sc);
      sacudir = Math.max(0, sacudir - dt * 0.8);
      candado.rotation.z = Math.sin(t * 30) * 0.28 * sacudir;
      brillo = Math.max(0, brillo - dt * 0.3);
      const pul = brillo * (0.75 + 0.25 * Math.sin(t * 9));
      matCupula.emissive.copy(colorBrillo).multiplyScalar(pul * 0.85);
      luz.intensity = pul * 2.6;
      papeles.forEach((p, i) => (p.visible = i < pila));
      destello = Math.max(0, destello - dt * 2);
      matPantalla.color.setRGB(0.92 + destello * 0.08, 0.957 + destello * 0.04, 0.94 + destello * 0.06);
      cel.position.y = 2.8 + (reduce ? 0 : Math.sin(t * 1.3) * 0.06);

      burbujas.forEach((b) => {
        if (!b.activo) return;
        b.t += dt / b.dur;
        const e = ease(Math.min(1, b.t));
        const u = 1 - e;
        tmp.copy(b.p0).multiplyScalar(u * u).addScaledVector(b.p1, 2 * u * e).addScaledVector(b.p2, e * e);
        b.g.position.copy(tmp);
        b.g.scale.setScalar(b.s0 + (b.s1 - b.s0) * e);
        b.g.quaternion.copy(camera.quaternion);
        if (b.t >= 1) {
          b.activo = false;
          b.g.visible = false;
          const f = b.fin;
          b.fin = undefined;
          f?.();
        }
      });

      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("ventanilla:evento", onEvento);
      window.removeEventListener("pointermove", onMove);
      letreros.forEach((t) => t.dispose());
      k.dispose();
    };
  }, [compacto, conScroll]);

  return (
    <div
      ref={ref}
      className={compacto ? "mostrador compacto" : "mostrador"}
      role="img"
      aria-label="Mostrador de la secretaría: los mensajes llegan del celular y van a las circulares, al archivador o a orientación"
    />
  );
}
