/**
 * Standalone off-screen renderer that creates a PNG snapshot of a GLB model.
 * Completely decoupled from the visible <Canvas> — owns its own WebGLRenderer,
 * Scene, Camera, and lights.  Returns a validated { blob, width, height }.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface SnapshotResult {
  blob: Blob;
  url: string;        // objectURL – caller must revoke
  width: number;
  height: number;
}

const WIDTH = 1600;
const HEIGHT = 1200;

export async function captureModelSnapshot(modelUrl: string): Promise<SnapshotResult> {
  // 1. Create off-screen renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: false,
  });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(1);
  renderer.setClearColor(new THREE.Color('#f5f5f5'), 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // 2. Scene + lights
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5f5f5');

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dir1 = new THREE.DirectionalLight(0xffffff, 1);
  dir1.position.set(10, 10, 5);
  scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dir2.position.set(-10, 10, -5);
  scene.add(dir2);
  const dir3 = new THREE.DirectionalLight(0xffffff, 0.3);
  dir3.position.set(0, -8, 0);
  scene.add(dir3);
  const dir4 = new THREE.DirectionalLight(0xffffff, 0.4);
  dir4.position.set(0, 2, 10);
  scene.add(dir4);

  // 3. Camera
  const camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 1000);

  // 4. Load model
  const gltf = await new Promise<any>((resolve, reject) => {
    new GLTFLoader().load(modelUrl, resolve, undefined, reject);
  });

  const model = gltf.scene.clone();
  scene.add(model);

  // 5. Center & fit
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 4 / maxDim;
  model.scale.setScalar(scale);
  model.position.copy(center).multiplyScalar(-scale);

  // Recalculate bounding box after scale
  const box2 = new THREE.Box3().setFromObject(model);
  const center2 = box2.getCenter(new THREE.Vector3());
  const size2 = box2.getSize(new THREE.Vector3());
  const maxDim2 = Math.max(size2.x, size2.y, size2.z);
  const dist = maxDim2 / (2 * Math.tan((camera.fov * Math.PI) / 360)) * 1.3;
  camera.position.set(
    center2.x + dist * 0.6,
    center2.y + dist * 0.5,
    center2.z + dist * 0.6,
  );
  camera.lookAt(center2);

  // 6. Render multiple frames to ensure stable output
  renderer.render(scene, camera);
  renderer.render(scene, camera);
  renderer.render(scene, camera);

  // 7. Export blob
  const canvas = renderer.domElement;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/png',
    );
  });

  // 8. Validate: decode the blob as an image
  const url = URL.createObjectURL(blob);
  const valid = await validateImage(url);
  if (!valid) {
    URL.revokeObjectURL(url);
    renderer.dispose();
    throw new Error('Captured image failed validation (black or empty)');
  }

  // 9. Cleanup renderer (but keep the objectURL alive for consumer)
  renderer.dispose();

  return { blob, url, width: WIDTH, height: HEIGHT };
}

/** Capture a plain image URL as a snapshot (for non-model assets). */
export async function captureImageSnapshot(imageUrl: string): Promise<SnapshotResult> {
  const resp = await fetch(imageUrl);
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const { width, height } = await getImageDimensions(url);
  return { blob, url, width, height };
}

function validateImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}
