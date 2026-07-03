'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function PlatformHubScene() {
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

    // Central sphere
    const centerGeo = new THREE.SphereGeometry(1, 32, 32);
    const centerMat = new THREE.MeshPhysicalMaterial({
      color: 0x4F46E5, metalness: 0.4, roughness: 0.1, transparent: true, opacity: 0.4,
      emissive: 0x4F46E5, emissiveIntensity: 0.15,
    });
    const center = new THREE.Mesh(centerGeo, centerMat);
    group.add(center);

    // Wireframe overlay
    group.add(new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0x4F46E5, wireframe: true, transparent: true, opacity: 0.1 })));

    // Platform orbs
    const platforms = [
      { color: 0xE1306C, name: 'instagram' },
      { color: 0x1877F2, name: 'facebook' },
      { color: 0xFF0000, name: 'youtube' },
      { color: 0x0A66C2, name: 'linkedin' },
      { color: 0x1DA1F2, name: 'twitter' },
    ];
    const orbs: THREE.Mesh[] = [];
    platforms.forEach((p, i) => {
      const orbGeo = new THREE.SphereGeometry(0.35, 24, 24);
      const orbMat = new THREE.MeshPhysicalMaterial({
        color: p.color, metalness: 0.3, roughness: 0.2, transparent: true, opacity: 0.7,
        emissive: p.color, emissiveIntensity: 0.15,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      const angle = (i / platforms.length) * Math.PI * 2;
      orb.position.set(Math.cos(angle) * 3.5, Math.sin(angle) * 3.5, 0);
      orbs.push(orb);
      group.add(orb);

      // Data line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([orb.position, new THREE.Vector3(0, 0, 0)]);
      const lineMat = new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.1 });
      group.add(new THREE.Line(lineGeo, lineMat));
    });

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pl = new THREE.PointLight(0x4F46E5, 1, 20); pl.position.set(4, 3, 5); scene.add(pl);

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
      orbs.forEach((orb, i) => {
        const angle = t * 0.2 + (i / orbs.length) * Math.PI * 2;
        const r = 3.5 + Math.sin(t * 0.3 + i) * 0.3;
        orb.position.set(Math.cos(angle) * r, Math.sin(angle) * r, Math.sin(t + i) * 0.5);
      });
      center.rotation.y += 0.005;
      const pulse = 1 + Math.sin(t * 1.5) * 0.05;
      center.scale.setScalar(pulse);
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
