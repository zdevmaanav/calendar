'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BrandHelixScene() {
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

    const helixGroup = new THREE.Group();
    const strands = 2;
    const pointsPerStrand = 40;
    const radius = 1.8;
    const height = 8;
    const spheres: THREE.Mesh[] = [];

    for (let s = 0; s < strands; s++) {
      const offset = s * Math.PI;
      for (let i = 0; i < pointsPerStrand; i++) {
        const t = i / pointsPerStrand;
        const angle = t * Math.PI * 4 + offset;
        const y = t * height - height / 2;
        const size = 0.08 + Math.random() * 0.08;
        const geo = new THREE.SphereGeometry(size, 12, 12);
        const color = s === 0 ? new THREE.Color(0x4F46E5) : new THREE.Color(0x06B6D4);
        const mat = new THREE.MeshPhysicalMaterial({
          color, metalness: 0.4, roughness: 0.1, transparent: true, opacity: 0.7,
          emissive: color, emissiveIntensity: 0.15,
        });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        spheres.push(sphere);
        helixGroup.add(sphere);
      }
    }

    // Connecting rungs
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const y = t * height - height / 2;
      const a1 = t * Math.PI * 4;
      const a2 = a1 + Math.PI;
      const pts = [
        new THREE.Vector3(Math.cos(a1) * radius, y, Math.sin(a1) * radius),
        new THREE.Vector3(Math.cos(a2) * radius, y, Math.sin(a2) * radius),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x4F46E5, transparent: true, opacity: 0.08 });
      helixGroup.add(new THREE.Line(lineGeo, lineMat));
    }

    // Orbiting icons (small shapes)
    const orbiters: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const geo = i % 2 === 0 ? new THREE.OctahedronGeometry(0.12) : new THREE.TetrahedronGeometry(0.12);
      const mat = new THREE.MeshPhysicalMaterial({
        color: i % 3 === 0 ? 0xE8722A : 0x6366F1, metalness: 0.3, roughness: 0.2,
        transparent: true, opacity: 0.6,
      });
      const m = new THREE.Mesh(geo, mat);
      orbiters.push(m);
      helixGroup.add(m);
    }

    scene.add(helixGroup);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pl1 = new THREE.PointLight(0x4F46E5, 1.2, 20); pl1.position.set(4, 3, 4); scene.add(pl1);
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
      helixGroup.rotation.y += 0.003;

      orbiters.forEach((orb, i) => {
        const angle = t * 0.5 + (i / orbiters.length) * Math.PI * 2;
        const r = 2.5 + Math.sin(t + i) * 0.3;
        const y = Math.sin(t * 0.3 + i) * 3;
        orb.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        orb.rotation.x += 0.02;
        orb.rotation.y += 0.03;
      });

      helixGroup.rotation.x += (mouseRef.current.y * 0.2 - helixGroup.rotation.x) * 0.02;
      const targetRY = helixGroup.rotation.y + mouseRef.current.x * 0.1;
      helixGroup.rotation.y += (targetRY - helixGroup.rotation.y) * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
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
