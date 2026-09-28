import * as THREE from "three";
import { advanceInertia, DragMotion, type AngularVelocity } from "./glass-motion";

export function mountGlass(host: HTMLElement) {
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) {
    console.warn("Glass pane has no size; using static glass.");
    return;
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    console.warn("WebGL is unavailable; using static glass.");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Transmission samples the already drawn background. Keeping both paths
  // untone-mapped prevents the pane face from tinting the same cream twice.
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f8f7f3");
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 20);
  function fitCamera() {
    // Fit the bounding sphere so a freely spun portrait pane cannot clip.
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
    const radius = Math.hypot(1.9 / 2, 2.65 / 2, 0.15);
    camera.position.z = (radius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov))) * 1.08;
  }
  fitCamera();

  // Neutral HDR studio cards create a face glint and bright beveled edges.
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#596066");
  function panel(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    color: string,
    strength: number,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(strength),
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
  }
  panel(-4, -1, 2, 0.75, 3.2, "#ffffff", 4.5); // initial face highlight
  panel(-3.4, 1.8, 3.2, 1.5, 2.5, "#fffdf9", 2.8);
  panel(3.2, 0.5, 2.5, 0.34, 4, "#d9e9f4", 5);
  panel(3.7, 2.4, 3, 0.9, 2.1, "#fff2d7", 5); // warm upper-right glint
  panel(0.4, 3.6, 1, 3.4, 0.28, "#ffffff", 4);
  panel(3.7, -0.7, -1.8, 1.3, 3.6, "#1d2930", 0.25);
  panel(-2.4, -2.2, -2, 1.2, 2.6, "#23343d", 0.3);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envTarget: THREE.WebGLRenderTarget;
  try {
    envTarget = pmrem.fromScene(envScene, 0, 0.1, 20);
  } catch {
    console.warn("Glass pane studio environment could not render; using static glass.");
    pmrem.dispose();
    renderer.dispose();
    return;
  }
  pmrem.dispose();
  scene.environment = envTarget.texture;

  // Localized light behind the slab gives the clear face spatial color to
  // refract. The opaque cream base enters Three's transmission pass.
  const backdropCanvas = document.createElement("canvas");
  backdropCanvas.width = backdropCanvas.height = 512;
  const context = backdropCanvas.getContext("2d");
  if (context) {
    // Transmission only samples opaque objects; bake the cream into the map.
    context.fillStyle = "#f8f7f3";
    context.fillRect(0, 0, 512, 512);
    function lightLobe(x: number, y: number, radius: number, color: string) {
      const wash = context!.createRadialGradient(x, y, 0, x, y, radius);
      wash.addColorStop(0, color);
      wash.addColorStop(1, "rgba(248,247,243,0)");
      context!.fillStyle = wash;
      context!.fillRect(0, 0, 512, 512);
    }
    lightLobe(374, 116, 175, "rgba(255,237,196,0.28)");
    lightLobe(336, 368, 152, "rgba(243,182,102,0.20)");
    lightLobe(165, 371, 155, "rgba(141,211,224,0.20)");
  }
  const backdropTexture = new THREE.CanvasTexture(backdropCanvas);
  backdropTexture.colorSpace = THREE.SRGBColorSpace;
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: backdropTexture,
      transparent: false,
      depthWrite: true,
      toneMapped: false,
    }),
  );
  backdrop.position.z = -2;
  scene.add(backdrop);
  function fitBackdrop() {
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z + 2);
    backdrop.scale.set(viewHeight * camera.aspect, viewHeight, 1);
  }
  fitBackdrop();

  const group = new THREE.Group();
  scene.add(group);
  const shape = new THREE.Shape();
  const x = -0.95,
    y = -1.325,
    w = 1.9,
    h = 2.65,
    r = 0.08;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.038,
    bevelSegments: 6,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -0.05);
  const faceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.008,
    transmission: 1,
    thickness: 0.3,
    ior: 1.52,
    envMapIntensity: 0.6,
    clearcoat: 0,
    iridescence: 0,
    dispersion: 0.2,
    side: THREE.FrontSide,
  });
  const edgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe8f2f6,
    metalness: 0,
    roughness: 0.025,
    transmission: 0.92,
    thickness: 0.45,
    ior: 1.53,
    attenuationColor: new THREE.Color("#9cb3c0"),
    attenuationDistance: 0.8,
    envMapIntensity: 1.35,
    dispersion: 0.7,
    side: THREE.FrontSide,
  });
  // ExtrudeGeometry's first material group is the caps; the second is the rim.
  group.add(new THREE.Mesh(geometry, [faceMaterial, edgeMaterial]));
  group.rotation.set(0.15, -0.55, 0.08);
  host.insertBefore(renderer.domElement, host.firstChild);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const toggle = host.querySelector<HTMLButtonElement>(".motion-toggle");
  let inView = true,
    paused = false,
    raf = 0,
    last = performance.now();
  let activePointer: number | null = null,
    pointerX = 0,
    pointerY = 0;
  const dragMotion = new DragMotion();
  let inertia: AngularVelocity = { x: 0, y: 0 };
  const stopInertia = () => {
    inertia = { x: 0, y: 0 };
    dragMotion.cancel();
  };
  let ready = false,
    lost = false;
  function showFallback() {
    if (lost) return;
    console.warn("Glass pane rendering stopped; using static glass.");
    lost = true;
    ready = false;
    stopInertia();
    if (activePointer !== null) {
      const pointerId = activePointer;
      activePointer = null;
      if (host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId);
    }
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    delete host.dataset.ready;
    host.removeAttribute("tabindex");
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", "Glass pane illustration");
    if (toggle) toggle.hidden = true;
    renderer.domElement.remove();
    renderer.dispose();
    envTarget.dispose();
    backdropTexture.dispose();
    observer.disconnect();
    resize.disconnect();
  }

  function render(t: number) {
    raf = 0;
    if (lost) return;
    const delta = Math.max(0, (t - last) / 1000);
    last = t;
    if (activePointer === null && !reduced.matches && !paused) {
      if (inertia.x || inertia.y) {
        const step = advanceInertia(inertia, delta);
        group.rotation.x += step.rotation.x;
        group.rotation.y += step.rotation.y;
        inertia = step.velocity;
      } else {
        group.rotation.x += delta * 0.035;
        group.rotation.y += delta * 0.07;
        group.rotation.z += delta * 0.008;
      }
    }
    try {
      renderer.render(scene, camera);
      if (!ready) {
        ready = true;
        host.dataset.ready = "true";
        host.setAttribute("role", "group");
        host.setAttribute(
          "aria-label",
          "Interactive glass pane. Drag or use arrow keys to rotate it.",
        );
        host.tabIndex = 0;
        if (toggle && !reduced.matches) toggle.hidden = false;
      }
    } catch {
      showFallback();
      return;
    }
    if (inView && !document.hidden && !reduced.matches && !paused)
      raf = requestAnimationFrame(render);
  }
  function request() {
    if (!raf && inView && !document.hidden && !lost)
      raf = requestAnimationFrame(render);
  }
  const observer = new IntersectionObserver((entries) => {
    inView = !!entries[0]?.isIntersecting;
    if (inView) {
      last = performance.now();
      request();
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      stopInertia();
    } else if (!inView) {
      stopInertia();
    }
  });
  observer.observe(host);
  const resize = new ResizeObserver(() => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitCamera();
    fitBackdrop();
    renderer.setSize(w, h);
    request();
  });
  resize.observe(host);
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    showFallback();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopInertia();
    last = performance.now();
    request();
  });
  reduced.addEventListener("change", () => {
    stopInertia();
    last = performance.now();
    if (toggle) toggle.hidden = reduced.matches || !ready;
    request();
  });
  toggle?.addEventListener("click", () => {
    paused = !paused;
    if (paused) stopInertia();
    toggle.dataset.paused = String(paused);
    toggle.setAttribute("aria-label", paused ? "Resume motion" : "Pause motion");
    toggle.title = paused ? "Resume motion" : "Pause motion";
    toggle.setAttribute("aria-pressed", String(paused));
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    request();
  });
  host.addEventListener("pointerdown", (event) => {
    if (
      !ready ||
      activePointer !== null ||
      event.button !== 0 ||
      (event.target instanceof Node && !!toggle?.contains(event.target))
    )
      return;
    stopInertia();
    activePointer = event.pointerId;
    pointerX = event.clientX;
    pointerY = event.clientY;
    dragMotion.begin(pointerX, pointerY, performance.now());
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointer) return;
    const rotation = dragMotion.move(event.clientX, event.clientY, performance.now());
    group.rotation.y += rotation.y;
    group.rotation.x += rotation.x;
    pointerX = event.clientX;
    pointerY = event.clientY;
    request();
  });
  function end(event: PointerEvent, allowThrow: boolean) {
    if (event.pointerId !== activePointer) return;
    inertia = allowThrow && !paused && !reduced.matches && inView && !document.hidden
      ? dragMotion.release(performance.now())
      : { x: 0, y: 0 };
    dragMotion.cancel();
    activePointer = null;
    if (host.hasPointerCapture(event.pointerId))
      host.releasePointerCapture(event.pointerId);
    last = performance.now();
    request();
  }
  host.addEventListener("pointerup", (event) => end(event, true));
  host.addEventListener("pointercancel", (event) => end(event, false));
  host.addEventListener("lostpointercapture", (event) => end(event, false));
  host.addEventListener("keydown", (event) => {
    if (!ready || lost) return;
    stopInertia();
    const step = 0.12;
    if (event.key === "ArrowLeft") group.rotation.y -= step;
    else if (event.key === "ArrowRight") group.rotation.y += step;
    else if (event.key === "ArrowUp") group.rotation.x -= step;
    else if (event.key === "ArrowDown") group.rotation.x += step;
    else return;
    event.preventDefault();
    request();
  });
  request();
}
