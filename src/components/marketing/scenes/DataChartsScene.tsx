'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DataChartsScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const barColors = [0x4F46E5, 0x06B6D4, 0x6366F1, 0xE8722A, 0x14B8A6, 0x4F46E5, 0x06B6D4];
    const bars: (THREE.Mesh & { targetH?: number; currentH?: number })[] = [];

    for (let i = 0; i < 7; i++) {
      const h = 1 + Math.random() * 3;
      const geo = new THREE.BoxGeometry(0.5, h, 0.5);
      const mat = new THREE.MeshPhysicalMaterial({
        color: barColors[i], metalness: 0.3, roughness: 0.1, transparent: true, opacity: 0.6,
        emissive: barColors[i], emissiveIntensity: 0.1,
      });
      const bar = new THREE.Mesh(geo, mat) as typeof bars[number];
      bar.position.set((i - 3) * 1, h / 2 - 2, 0);
      bar.targetH = h;
      bar.currentH = 0;
      bars.push(bar);
      group.add(bar);

      // Glowing data point on top
      const dotGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(0, h / 2 + 0.1, 0);
      bar.add(dot);
    }

    // Line graph curve floating nearby
    const curvePoints = [];
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * 8 - 4;
      const y = Math.sin(i * 0.5) * 1 + 2 + Math.random() * 0.3;
      curvePoints.push(new THREE.Vector3(x, y, -2));
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0.4 });
    group.add(new THREE.Line(lineGeo, lineMat));

    group.rotation.x = -0.2;
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pl = new THREE.PointLight(0x4F46E5, 1.2, 20); pl.position.set(4, 5, 5); scene.add(pl);
    const pl2 = new THREE.PointLight(0x06B6D4, 0.8, 15); pl2.position.set(-3, 3, 3); scene.add(pl2);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const startTime = Date.now();
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      const elapsed = (Date.now() - startTime) * 0.001;

      // Bars grow animation
      bars.forEach((bar) => {
        if (bar.targetH !== undefined && bar.currentH !== undefined && bar.currentH < bar.targetH) {
          bar.currentH = Math.min(bar.currentH + 0.03, bar.targetH);
          bar.scale.y = bar.currentH / bar.targetH;
        }
        // Subtle pulse
        const pulse = 1 + Math.sin(t * 2 + (bar.position.x || 0)) * 0.02;
        bar.scale.x = pulse;
        bar.scale.z = pulse;
      });

      group.rotation.y += 0.002;
      group.rotation.y += (mouseRef.current.x * 0.2 - group.rotation.y) * 0.02;
      if (elapsed > 0.5) group.rotation.x += (mouseRef.current.y * 0.1 + -0.2 - group.rotation.x) * 0.02;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId); container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="three-scene-interactive" style={{ minHeight: '350px' }} />;
}
