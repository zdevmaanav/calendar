'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ApprovalScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();

    // Large 3D checkmark — two cylinders forming a ✓
    const checkMat = new THREE.MeshPhysicalMaterial({
      color: 0x10B981, metalness: 0.4, roughness: 0.1, transparent: true, opacity: 0.7,
      emissive: 0x10B981, emissiveIntensity: 0.2,
    });
    const seg1Geo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 16);
    const seg1 = new THREE.Mesh(seg1Geo, checkMat);
    seg1.position.set(-0.3, 0, 0);
    seg1.rotation.z = -Math.PI / 6;
    group.add(seg1);

    const seg2Geo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16);
    const seg2 = new THREE.Mesh(seg2Geo, checkMat);
    seg2.position.set(-1.3, -0.5, 0);
    seg2.rotation.z = Math.PI / 4;
    group.add(seg2);

    // Green glow sphere behind checkmark
    const glowGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x10B981, transparent: true, opacity: 0.06 });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    // Orbiting post cards
    const cards: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const cardGeo = new THREE.BoxGeometry(0.8, 1, 0.04);
      const approved = i < 4;
      const cardMat = new THREE.MeshPhysicalMaterial({
        color: approved ? 0xffffff : 0xfafafa, metalness: 0.1, roughness: 0.05,
        transparent: true, opacity: 0.6,
        emissive: approved ? 0x10B981 : 0x000000, emissiveIntensity: approved ? 0.05 : 0,
      });
      const card = new THREE.Mesh(cardGeo, cardMat);
      cards.push(card);
      group.add(card);

      if (approved) {
        const dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x10B981 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(0.25, 0.35, 0.03);
        card.add(dot);
      }
    }

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pl = new THREE.PointLight(0x10B981, 1.2, 20); pl.position.set(3, 4, 5); scene.add(pl);
    const pl2 = new THREE.PointLight(0x4F46E5, 0.6, 15); pl2.position.set(-3, -2, 3); scene.add(pl2);

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
      cards.forEach((card, i) => {
        const angle = t * 0.3 + (i / cards.length) * Math.PI * 2;
        const r = 3 + Math.sin(t * 0.2 + i) * 0.3;
        card.position.set(Math.cos(angle) * r, Math.sin(t * 0.4 + i) * 0.8, Math.sin(angle) * r);
        card.lookAt(0, 0, 0);
      });
      group.rotation.y += (mouseRef.current.x * 0.15 - group.rotation.y) * 0.03;
      group.rotation.x += (mouseRef.current.y * 0.1 - group.rotation.x) * 0.03;
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
