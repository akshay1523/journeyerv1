'use client';

import { useEffect, useRef } from 'react';
import type * as THREE from 'three';
import { Destination } from '@/types';
import { regionColors, REGION_EST_PRICE, priceToColor } from '@/data/destinations';

interface Props {
  destinations: Destination[];
  onDestinationSelect: (d: Destination) => void;
  colorMode: 'region' | 'price';
}

export default function GlobeScene({ destinations, onDestinationSelect, colorMode }: Props) {
  const mountRef    = useRef<HTMLDivElement>(null);
  const tooltipRef  = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onDestinationSelect);
  onSelectRef.current = onDestinationSelect;
  const colorModeRef    = useRef(colorMode);
  colorModeRef.current  = colorMode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeInstanceRef = useRef<any>(null);

  const getPointColor = (dest: Destination) =>
    colorModeRef.current === 'price'
      ? priceToColor(REGION_EST_PRICE[dest.region] ?? 800)
      : (regionColors[dest.region] ?? '#60a5fa');

  // Re-color pins whenever colorMode prop changes (after initial mount)
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    globeInstanceRef.current.pointColor((d: object) => getPointColor(d as Destination));
  }, [colorMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mountRef.current || !tooltipRef.current) return;
    const container = mountRef.current;
    const tooltip   = tooltipRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;

    let animFrameId: number;
    let autoRotateTimeout: ReturnType<typeof setTimeout>;
    let flying = false;

    Promise.all([
      import('three'),
      import('three-globe'),
      import('three/examples/jsm/controls/OrbitControls.js'),
    ]).then(([THREE, ThreeGlobeModule, { OrbitControls }]) => {
      const ThreeGlobe = ThreeGlobeModule.default;

      // ── Renderer ──────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x0a0a0f, 1);
      container.appendChild(renderer.domElement);

      // ── Scene / Camera ────────────────────────────────────────
      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 10000);
      camera.position.z = 280;

      scene.add(new THREE.AmbientLight(0xffffff, 1.2));
      const dir = new THREE.DirectionalLight(0xffffff, 0.8);
      dir.position.set(1, 1, 1);
      scene.add(dir);

      // ── OrbitControls ─────────────────────────────────────────
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping   = true;
      controls.dampingFactor   = 0.05;
      controls.rotateSpeed     = 0.5;
      controls.autoRotate      = true;
      controls.autoRotateSpeed = 0.5;
      controls.minDistance     = 150;
      controls.maxDistance     = 600;

      controls.addEventListener('start', () => {
        if (flying) return;
        controls.autoRotate = false;
        clearTimeout(autoRotateTimeout);
        autoRotateTimeout = setTimeout(() => { controls.autoRotate = true; }, 3000);
      });

      // ── Globe ─────────────────────────────────────────────────
      const globe = new ThreeGlobe({ animateIn: true })
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .atmosphereColor('#4488ff')
        .atmosphereAltitude(0.12)
        .pointsData(destinations)
        .pointLat((d: object) => (d as Destination).coords.lat)
        .pointLng((d: object) => (d as Destination).coords.lng)
        .pointColor((d: object) => getPointColor(d as Destination))
        .pointRadius(0.5)
        .pointAltitude(0.015)
        .pointResolution(12);

      globe.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.MeshPhongMaterial;
          if (mat.color) mat.color.set(0x1a2a4a);
        }
      });

      scene.add(globe);
      globeInstanceRef.current = globe;

      // ── Starfield ─────────────────────────────────────────────
      const starPos = new Float32Array(6000);
      for (let i = 0; i < 6000; i++) starPos[i] = (Math.random() - 0.5) * 4000;
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 })));

      // ── Helpers ───────────────────────────────────────────────
      const raycaster = new THREE.Raycaster();
      raycaster.params.Points = { threshold: 3 };
      const mouse = new THREE.Vector2();

      const globeRadius = globe.getGlobeRadius();
      const R = globeRadius * 1.015;

      const findNearest = (hit: THREE.Vector3): Destination | null => {
        let closest: Destination | null = null;
        let minDist = Infinity;
        for (const dest of destinations) {
          const lat = dest.coords.lat * (Math.PI / 180);
          const lng = dest.coords.lng * (Math.PI / 180);
          const pt  = new THREE.Vector3(R * Math.cos(lat) * Math.sin(lng), R * Math.sin(lat), R * Math.cos(lat) * Math.cos(lng));
          const d   = hit.distanceTo(pt);
          if (d < minDist) { minDist = d; closest = dest; }
        }
        return minDist < globeRadius * 0.12 ? closest : null;
      };

      // ── Fly-to ────────────────────────────────────────────────
      const flyTo = (dest: Destination, onComplete: () => void) => {
        flying = true;
        controls.enabled    = false;
        controls.autoRotate = false;
        clearTimeout(autoRotateTimeout);

        const dist  = camera.position.length();
        const lat   = dest.coords.lat * (Math.PI / 180);
        const lng   = dest.coords.lng * (Math.PI / 180);
        const tgt   = new THREE.Vector3(
          dist * Math.cos(lat) * Math.sin(lng),
          dist * Math.sin(lat),
          dist * Math.cos(lat) * Math.cos(lng),
        );
        const start    = camera.position.clone();
        const t0       = Date.now();
        const duration = 1200;
        const ease     = (t: number) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;

        const loop = () => {
          const t = Math.min((Date.now() - t0) / duration, 1);
          camera.position.lerpVectors(start, tgt, ease(t));
          camera.lookAt(0, 0, 0);
          renderer.render(scene, camera);
          if (t < 1) { requestAnimationFrame(loop); }
          else { flying = false; controls.enabled = true; onComplete(); }
        };
        loop();
      };

      // ── Events ────────────────────────────────────────────────
      const getMeshHit = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const meshes: THREE.Object3D[] = [];
        globe.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o); });
        const hits = raycaster.intersectObjects(meshes, false);
        return hits.length > 0 ? hits[0] : null;
      };

      const onMouseMove = (e: MouseEvent) => {
        if (flying) return;
        const hit = getMeshHit(e);
        if (hit) {
          const dest = findNearest(hit.point);
          if (dest) {
            tooltip.style.display = 'block';
            tooltip.style.left    = `${e.clientX + 14}px`;
            tooltip.style.top     = `${e.clientY - 10}px`;
            tooltip.innerHTML     = `<div style="font-weight:600;color:white;font-size:13px;">${dest.city}</div><div style="color:#9ca3af;font-size:11px;margin-top:2px;">${dest.country}</div>`;
            renderer.domElement.style.cursor = 'pointer';
            return;
          }
        }
        tooltip.style.display = 'none';
        renderer.domElement.style.cursor = 'grab';
      };

      const onClick = (e: MouseEvent) => {
        if (flying) return;
        const hit = getMeshHit(e);
        if (hit) {
          const dest = findNearest(hit.point);
          if (dest) {
            tooltip.style.display = 'none';
            flyTo(dest, () => onSelectRef.current(dest));
          }
        }
      };

      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('click', onClick);

      const onResize = () => {
        const nw = window.innerWidth, nh = window.innerHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize);

      // ── Render loop ───────────────────────────────────────────
      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        if (!flying) controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (container as any).__cleanup = () => {
        cancelAnimationFrame(animFrameId);
        clearTimeout(autoRotateTimeout);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('click', onClick);
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        globeInstanceRef.current = null;
      };
    });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (container as any).__cleanup?.();
      cancelAnimationFrame(animFrameId!);
      clearTimeout(autoRotateTimeout!);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={mountRef} style={{ position: 'absolute', inset: 0 }}>
      <div ref={tooltipRef} style={{
        display: 'none', position: 'fixed',
        background: 'rgba(10,10,20,0.92)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8, padding: '8px 12px',
        pointerEvents: 'none', zIndex: 50,
        fontFamily: 'system-ui, sans-serif',
      }} />
    </div>
  );
}
