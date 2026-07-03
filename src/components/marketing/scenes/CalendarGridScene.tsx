'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CalendarGridScene() {
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
    const cells: (THREE.Mesh & { baseY?: number; glowSpeed?: number })[] = [];
    const gridSize = 7;
    const highlights = [2, 5, 8, 11, 15, 19, 22, 27];

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < gridSize; c++) {
        const idx = r * gridSize + c;
        const isHighlighted = highlights.includes(idx);
        const geo = new THREE.BoxGeometry(0.9, 0.12, 0.9);
        const mat = new THREE.MeshPhysicalMaterial({
          color: isHighlighted ? 0x4F46E5 : 0xffffff,
          metalness: 0.2, roughness: 0.1, transparent: true,
          opacity: isHighlighted ? 0.7 : 0.3,
          emissive: isHighlighted ? 0x4F46E5 : 0x000000,
          emissiveIntensity: isHighlighted ? 0.2 : 0,
        });
        const cell = new THREE.Mesh(geo, mat) as typeof cells[number];
        cell.position.set((c - 3) * 1.1, 0, (r - 2) * 1.1);
        cell.baseY = 0;
        cell.glowSpeed = 0.3 + Math.random() * 0.4;
        cells.push(cell);
        group.add(cell);

        if (isHighlighted) {
          const cardGeo = new THREE.BoxGeometry(0.6, 0.4, 0.04);
          const cardMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, metalness: 0.1, roughness: 0.05,
            transparent: true, opacity: 0.6,
          });
          const card = new THREE.Mesh(cardGeo, cardMat);
          card.position.set(0, 0.4 + Math.random() * 0.3, 0);
          card.rotation.x = -0.3;
          cell.add(card);
        }
      }
    }

    group.rotation.x = -0.5;
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pl = new THREE.PointLight(0x4F46E5, 1.5, 20); pl.position.set(3, 5, 5); scene.add(pl);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      group.rotation.y += 0.002;
      cells.forEach((cell, i) => {
        if (cell.baseY !== undefined && cell.glowSpeed) {
          cell.position.y = cell.baseY + Math.sin(t * cell.glowSpeed + i * 0.2) * 0.05;
        }
      });
      group.rotation.y += (mouseRef.current.x * 0.2 - group.rotation.y) * 0.02;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="three-scene-interactive" style={{ minHeight: '350px' }} />;
}
