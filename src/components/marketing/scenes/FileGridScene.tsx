'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FileGridScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const cards: (THREE.Mesh & { basePos?: THREE.Vector3; floatSpeed?: number })[] = [];
    const cols = 4, rows = 3;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const geo = new THREE.BoxGeometry(1.2, 1.5, 0.08);
        const depth = (Math.random() - 0.5) * 3;
        const mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff, metalness: 0.1, roughness: 0.05, transparent: true,
          opacity: 0.5 + Math.random() * 0.3,
          side: THREE.DoubleSide,
        });
        const card = new THREE.Mesh(geo, mat) as typeof cards[number];
        const x = (c - (cols - 1) / 2) * 2;
        const y = (r - (rows - 1) / 2) * 2.2;
        card.position.set(x, y, depth);
        card.basePos = card.position.clone();
        card.floatSpeed = 0.3 + Math.random() * 0.5;
        cards.push(card);
        group.add(card);

        // Icon strip on card
        const stripGeo = new THREE.PlaneGeometry(0.8, 0.15);
        const stripMat = new THREE.MeshBasicMaterial({ color: [0x4F46E5, 0x06B6D4, 0xE8722A][Math.floor(Math.random() * 3)], transparent: true, opacity: 0.3 });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(0, -0.4, 0.05);
        card.add(strip);
      }
    }

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pl = new THREE.PointLight(0x4F46E5, 1, 20); pl.position.set(4, 4, 6); scene.add(pl);
    const pl2 = new THREE.PointLight(0x06B6D4, 0.6, 15); pl2.position.set(-3, -2, 4); scene.add(pl2);

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
      cards.forEach((card) => {
        if (card.basePos && card.floatSpeed) {
          card.position.y = card.basePos.y + Math.sin(t * card.floatSpeed) * 0.2;
          card.position.z = card.basePos.z + Math.cos(t * card.floatSpeed * 0.7) * 0.15;
        }
      });
      group.rotation.y += (mouseRef.current.x * 0.15 - group.rotation.y) * 0.03;
      group.rotation.x += (mouseRef.current.y * 0.1 - group.rotation.x) * 0.03;
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
