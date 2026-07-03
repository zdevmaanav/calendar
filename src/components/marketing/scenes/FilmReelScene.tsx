'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FilmReelScene() {
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

    // Film reel ring
    const reelGeo = new THREE.TorusGeometry(2.5, 0.15, 16, 64);
    const reelMat = new THREE.MeshPhysicalMaterial({ color: 0x4F46E5, metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.5, emissive: 0x4F46E5, emissiveIntensity: 0.1 });
    group.add(new THREE.Mesh(reelGeo, reelMat));

    // Inner ring
    const innerGeo = new THREE.TorusGeometry(1.2, 0.1, 12, 48);
    group.add(new THREE.Mesh(innerGeo, reelMat.clone()));

    // Spokes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const pts = [
        new THREE.Vector3(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0),
        new THREE.Vector3(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x4F46E5, transparent: true, opacity: 0.2 });
      group.add(new THREE.Line(lineGeo, lineMat));
    }

    // Film strip frames floating off reel
    const frames: (THREE.Mesh & { basePos?: THREE.Vector3; speed?: number })[] = [];
    for (let i = 0; i < 5; i++) {
      const fGeo = new THREE.BoxGeometry(1, 0.7, 0.04);
      const fMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.5 });
      const frame = new THREE.Mesh(fGeo, fMat) as typeof frames[number];
      const angle = (i / 5) * Math.PI * 2;
      frame.position.set(Math.cos(angle) * 4, Math.sin(angle) * 2, (Math.random() - 0.5) * 3);
      frame.rotation.z = (Math.random() - 0.5) * 0.3;
      frame.basePos = frame.position.clone();
      frame.speed = 0.3 + Math.random() * 0.4;
      frames.push(frame);
      group.add(frame);
    }

    // Timeline scrubber
    const scrubberGeo = new THREE.BoxGeometry(6, 0.06, 0.06);
    const scrubberMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0.3 });
    const scrubber = new THREE.Mesh(scrubberGeo, scrubberMat);
    scrubber.position.set(0, -3.5, 0);
    group.add(scrubber);

    const handleGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const handleMat = new THREE.MeshPhysicalMaterial({ color: 0x06B6D4, emissive: 0x06B6D4, emissiveIntensity: 0.3 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -3.5, 0);
    group.add(handle);

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pl = new THREE.PointLight(0x4F46E5, 1.2, 20); pl.position.set(4, 3, 5); scene.add(pl);
    const pl2 = new THREE.PointLight(0x06B6D4, 0.8, 15); pl2.position.set(-3, -2, 3); scene.add(pl2);

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
      group.children[0].rotation.z += 0.005;
      group.children[1].rotation.z -= 0.008;
      handle.position.x = Math.sin(t * 0.5) * 2.5;
      frames.forEach((f) => {
        if (f.basePos && f.speed) {
          f.position.y = f.basePos.y + Math.sin(t * f.speed) * 0.3;
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
      cancelAnimationFrame(animationId); container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="three-scene-interactive" style={{ minHeight: '350px' }} />;
}
