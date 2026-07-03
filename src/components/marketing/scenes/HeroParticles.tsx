'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Particles — soft dots floating on white
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color('#4F46E5'), // indigo
      new THREE.Color('#06B6D4'), // cyan
      new THREE.Color('#E8722A'), // orange
      new THREE.Color('#9CA3AF'), // grey
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Connection lines between nearby particles
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.15,
    });

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 12) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Slow rotation
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;
      lines.rotation.y += 0.0003;
      lines.rotation.x += 0.0001;

      // Mouse parallax
      const targetX = mouseRef.current.x * 2;
      const targetY = mouseRef.current.y * 2;
      particles.position.x += (targetX - particles.position.x) * 0.02;
      particles.position.y += (targetY - particles.position.y) * 0.02;
      lines.position.x = particles.position.x;
      lines.position.y = particles.position.y;

      // Breathing scale
      const breathe = 1 + Math.sin(Date.now() * 0.001) * 0.02;
      particles.scale.setScalar(breathe);
      lines.scale.setScalar(breathe);

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="three-canvas-container" />;
}
