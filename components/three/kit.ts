import * as THREE from "three";

// Lo que comparten todas las escenas: tamaño que sigue al contenedor, densidad de píxeles
// limitada, pausa cuando la escena sale de la pantalla o la pestaña se oculta, y limpieza al salir.
export interface Cena {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  small: boolean;
  reduce: boolean;
  size: () => { w: number; h: number };
  onResize: (fn: (w: number, h: number) => void) => void;
  loop: (fn: (dt: number, t: number) => void) => void;
  track: <T extends { dispose: () => void }>(x: T) => T;
  dispose: () => void;
}

export function montar(mount: HTMLElement, opts: { dpr?: number; suavizado?: boolean } = {}): Cena | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: opts.suavizado ?? true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const small = window.innerWidth < 768;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : opts.dpr ?? 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  let w = Math.max(1, mount.clientWidth);
  let h = Math.max(1, mount.clientHeight);
  renderer.setSize(w, h, false);
  const resizers: ((w: number, h: number) => void)[] = [];
  const ro = new ResizeObserver(() => {
    const nw = Math.max(1, mount.clientWidth);
    const nh = Math.max(1, mount.clientHeight);
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    renderer.setSize(w, h, false);
    resizers.forEach((f) => f(w, h));
  });
  ro.observe(mount);

  let enPantalla = true;
  const io = new IntersectionObserver((e) => (enPantalla = e[0]?.isIntersecting ?? true), { rootMargin: "120px" });
  io.observe(mount);

  let raf = 0;
  let previo = performance.now();
  const arranque = previo;
  let fn: ((dt: number, t: number) => void) | null = null;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const actual = performance.now();
    const dt = Math.min((actual - previo) / 1000, 0.25);
    previo = actual;
    if (!enPantalla || document.visibilityState === "hidden") return;
    fn?.(dt, (actual - arranque) / 1000);
  };
  raf = requestAnimationFrame(tick);

  return {
    renderer,
    scene,
    small,
    reduce,
    size: () => ({ w, h }),
    onResize: (f) => resizers.push(f),
    loop: (f) => (fn = f),
    track,
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
  };
}

export const css = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

let texSombra: THREE.CanvasTexture | null = null;
/** sombra de contacto: plano con degradado radial, mucho más barato que un mapa de sombras */
export function sombraSuave(w: number, d: number, opacidade = 0.4) {
  if (!texSombra) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    r.addColorStop(0, "rgba(0,0,0,1)");
    r.addColorStop(0.55, "rgba(0,0,0,0.45)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    texSombra = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, opacity: opacidade, depthWrite: false }));
  m.renderOrder = 1;
  return m;
}

/** forma de burbuja de chat, con su colita, centrada en el origen */
export function formaBurbuja(w: number, h: number, r: number, colaIzq = true) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  if (colaIzq) {
    s.lineTo(x + r, y);
  }
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  if (colaIzq) {
    s.lineTo(x - 0.14, y - 0.1);
    s.lineTo(x + r, y);
  } else {
    s.quadraticCurveTo(x, y, x + r, y);
  }
  return s;
}

/** textura de texto nítida para letreros dentro de la escena */
export function texturaTexto(texto: string, opts: { fondo: string; color: string; ancho?: number; alto?: number; tam?: number }) {
  const W = opts.ancho ?? 512;
  const H = opts.alto ?? 128;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = opts.fondo;
  const r = H * 0.28;
  g.beginPath();
  g.moveTo(r, 0);
  g.arcTo(W, 0, W, H, r);
  g.arcTo(W, H, 0, H, r);
  g.arcTo(0, H, 0, 0, r);
  g.arcTo(0, 0, W, 0, r);
  g.fill();
  const familia = getComputedStyle(document.body).fontFamily || "sans-serif";
  g.font = `800 ${opts.tam ?? 58}px ${familia}`;
  g.fillStyle = opts.color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(texto, W / 2, H / 2 + 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
