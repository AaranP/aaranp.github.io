import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  MathUtils,
  MeshLambertMaterial,
  Object3D,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from "three";

type Part = "head" | "ear" | "body" | "arm" | "foot" | "tail";
type Voxel = { ix: number; iy: number; iz: number; part: Part };

const SIZE = 0.078;
const INK = "#63372b";
const CREAM = "#ffe7af";
const WARM_CREAM = "#f7d59a";
const PINK = "#f9a197";

function ellipse(x: number, y: number, z: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1;
}

function ear(x: number, y: number, z: number, side: number) {
  const dx = x - side * 0.42;
  const dy = y - 1.62;
  const angle = side * 0.075;
  const u = dx * Math.cos(angle) + dy * Math.sin(angle);
  const v = -dx * Math.sin(angle) + dy * Math.cos(angle);
  return (u / 0.185) ** 2 + (v / 0.62) ** 2 + ((z + 0.13) / 0.175) ** 2 <= 1;
}

function partAt(x: number, y: number, z: number): Part | null {
  if (ellipse(x, y, z, 0, 0.35, 0.18, 1.035, 0.87, 0.62)) return "head";
  if (ear(x, y, z, -1) || ear(x, y, z, 1)) return "ear";
  if (ellipse(x, y, z, 0, -0.79, -0.13, 0.54, 0.61, 0.46)) return "body";
  if (ellipse(x, y, z, -0.65, -0.83, 0.2, 0.165, 0.245, 0.22)
    || ellipse(x, y, z, 0.65, -0.83, 0.2, 0.165, 0.245, 0.22)) return "arm";
  if (ellipse(x, y, z, -0.31, -1.43, 0.16, 0.195, 0.205, 0.25)
    || ellipse(x, y, z, 0.31, -1.43, 0.16, 0.195, 0.205, 0.25)) return "foot";
  if (ellipse(x, y, z, 0, -0.92, -0.54, 0.19, 0.19, 0.19)) return "tail";
  return null;
}

function between(value: number, low: number, high: number) {
  return value >= low && value <= high;
}

function faceColor(x: number, y: number): string | null {
  const eyeX = Math.abs(x);
  if (ellipse(eyeX, y, 0, 0.36, 0.25, 0, 0.14, 0.16, 1)) {
    if (between(eyeX, 0.28, 0.365) && between(y, 0.28, 0.375)) return "#fffaf1";
    return "#302421";
  }

  if (between(eyeX, 0.22, 0.54) && between(y, 0.58, 0.73)) {
    const arch = 0.7 - Math.abs(eyeX - 0.38) * 0.45;
    if (Math.abs(y - arch) < 0.042) return INK;
  }

  if (ellipse(eyeX, y, 0, 0.66, -0.045, 0, 0.19, 0.13, 1)) {
    const cheekLocal = eyeX - 0.66;
    const stripe = Math.abs(cheekLocal + 0.11) < 0.03
      || Math.abs(cheekLocal - 0.015) < 0.03
      || Math.abs(cheekLocal - 0.095) < 0.03;
    if (stripe && between(y, -0.105, -0.04)) return "#a85149";
    return PINK;
  }

  if (Math.abs(x) < 0.047 && between(y, -0.07, 0.01)) return INK;
  if (ellipse(x, y, 0, 0, -0.24, 0, 0.12, 0.16, 1)) {
    if (y < -0.265 && Math.abs(x) < 0.08) return "#f4989a";
    return "#532c27";
  }
  if (Math.abs(x) < 0.16 && between(y, -0.13, -0.07)) return INK;
  if (between(Math.abs(x), 0.13, 0.22) && between(y, -0.14, -0.035)) return INK;
  return null;
}

function voxelColor(voxel: Voxel, isFront: boolean, isBack: boolean, isSilhouetteEdge: boolean): string {
  const x = voxel.ix * SIZE;
  const y = voxel.iy * SIZE;
  const z = voxel.iz * SIZE;
  if (isSilhouetteEdge) return INK;

  if (voxel.part === "head") {
    const radial = (x / 1.035) ** 2 + ((y - 0.35) / 0.87) ** 2;
    if (isFront && z > 0.16) {
      const feature = faceColor(x, y);
      if (feature) return feature;
      if (radial > 0.91) return INK;
    }
    if (isBack && radial > 0.91) return INK;
    if (y < -0.23 && (voxel.ix + voxel.iy * 3) % 5 === 0) return "#f5d194";
    return y < -0.18 ? WARM_CREAM : CREAM;
  }

  if (voxel.part === "ear") {
    if (isFront && z > -0.1) {
      const localX = Math.abs(x) - 0.42;
      const localY = y - 1.64;
      if ((localX / 0.095) ** 2 + (localY / 0.48) ** 2 < 1) return "#ffa69a";
      if ((localX / 0.185) ** 2 + (localY / 0.62) ** 2 > 0.83) return INK;
    }
    if (isBack && ((Math.abs(x) - 0.42) / 0.185) ** 2 + ((y - 1.64) / 0.62) ** 2 > 0.84) return INK;
    return "#ffecc0";
  }

  if (voxel.part === "tail") return "#fffaf0";
  if (voxel.part === "foot") {
    const radial = ((Math.abs(x) - 0.31) / 0.195) ** 2 + ((y + 1.43) / 0.205) ** 2;
    return (isFront || isBack) && radial > 0.83 ? INK : "#f6d397";
  }
  if (voxel.part === "arm") {
    const radial = ((Math.abs(x) - 0.65) / 0.165) ** 2 + ((y + 0.83) / 0.245) ** 2;
    return (isFront || isBack) && radial > 0.77 ? INK : "#f9daa0";
  }
  const bodyRadial = (x / 0.54) ** 2 + ((y + 0.79) / 0.61) ** 2;
  if ((isFront || isBack) && bodyRadial > 0.91) return INK;
  return y < -1.05 ? "#f2cf93" : "#ffe2a7";
}

function createCharacter() {
  const occupied = new Map<string, Voxel>();
  const key = (ix: number, iy: number, iz: number) => `${ix},${iy},${iz}`;
  const key2 = (a: number, b: number) => `${a},${b}`;

  for (let iy = -22; iy <= 29; iy++) {
    for (let ix = -15; ix <= 15; ix++) {
      for (let iz = -12; iz <= 12; iz++) {
        const part = partAt(ix * SIZE, iy * SIZE, iz * SIZE);
        if (part) occupied.set(key(ix, iy, iz), { ix, iy, iz, part });
      }
    }
  }

  const exposed = [...occupied.values()].filter(({ ix, iy, iz }) =>
    !occupied.has(key(ix - 1, iy, iz)) || !occupied.has(key(ix + 1, iy, iz))
    || !occupied.has(key(ix, iy - 1, iz)) || !occupied.has(key(ix, iy + 1, iz))
    || !occupied.has(key(ix, iy, iz - 1)) || !occupied.has(key(ix, iy, iz + 1)));
  const frontProjection = new Set<string>();
  for (const { ix, iy } of occupied.values()) {
    frontProjection.add(key2(ix, iy));
  }

  const geometry = new BoxGeometry(SIZE * 1.015, SIZE * 1.015, SIZE * 1.015);
  const material = new MeshLambertMaterial({ color: 0xffffff });
  const mesh = new InstancedMesh(geometry, material, exposed.length);
  const cube = new Object3D();
  const color = new Color();

  exposed.forEach((voxel, index) => {
    cube.position.set(voxel.ix * SIZE, voxel.iy * SIZE, voxel.iz * SIZE);
    cube.updateMatrix();
    mesh.setMatrixAt(index, cube.matrix);
    const isFront = !occupied.has(key(voxel.ix, voxel.iy, voxel.iz + 1));
    const isBack = !occupied.has(key(voxel.ix, voxel.iy, voxel.iz - 1));
    const frontEdge = !frontProjection.has(key2(voxel.ix - 1, voxel.iy))
      || !frontProjection.has(key2(voxel.ix + 1, voxel.iy))
      || !frontProjection.has(key2(voxel.ix, voxel.iy - 1))
      || !frontProjection.has(key2(voxel.ix, voxel.iy + 1));
    const silhouetteEdge = (isFront || isBack) && frontEdge;
    mesh.setColorAt(index, color.set(voxelColor(voxel, isFront, isBack, silhouetteEdge)));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;

  const group = new Group();
  group.add(mesh);
  return group;
}

export function mountPixelUsagi(host: HTMLElement) {
  const renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  scene.add(new AmbientLight(0xffffff, 0.6));
  const light = new DirectionalLight(0xffffff, 0.45);
  light.position.set(-2, 4, 6);
  scene.add(light);
  const character = createCharacter();
  scene.add(character);

  const camera = new OrthographicCamera(-1, 1, 2.25, -2.25, 0.1, 20);
  camera.position.set(0, 0.25, 7);
  camera.lookAt(0, 0.25, 0);

  const render = () => renderer.render(scene, camera);
  const resize = () => {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(Math.max(1, Math.round(width / 3)), Math.max(1, Math.round(height / 3)), false);
    const halfHeight = 2.25;
    const halfWidth = halfHeight * width / height;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.updateProjectionMatrix();
    render();
  };

  host.append(renderer.domElement);
  host.dataset.ready = "";
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  let activePointer: number | null = null;
  let lastX = 0;
  let tilt = 0;
  let settleFrame = 0;
  const settle = () => {
    tilt *= 0.78;
    if (Math.abs(tilt) < 0.002) {
      character.rotation.z = 0;
      settleFrame = 0;
      render();
      return;
    }
    character.rotation.z = tilt;
    render();
    settleFrame = requestAnimationFrame(settle);
  };
  const startSettle = () => {
    if (!settleFrame) settleFrame = requestAnimationFrame(settle);
  };

  host.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || activePointer !== null) return;
    activePointer = event.pointerId;
    lastX = event.clientX;
    host.setPointerCapture(event.pointerId);
    host.dataset.dragging = "";
    host.focus({ preventScroll: true });
    if (settleFrame) cancelAnimationFrame(settleFrame);
    settleFrame = 0;
  });
  host.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointer) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    character.rotation.y += dx * 0.012;
    tilt = MathUtils.clamp(-dx * 0.0025, -0.085, 0.085);
    character.rotation.z = tilt;
    render();
  });
  const endDrag = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    delete host.dataset.dragging;
    startSettle();
  };
  host.addEventListener("pointerup", endDrag);
  host.addEventListener("pointercancel", endDrag);
  host.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    character.rotation.y += event.key === "ArrowLeft" ? -Math.PI / 12 : Math.PI / 12;
    render();
  });
}
