'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CalendarScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Calendar grid — 7x5 cells
    const gridGroup = new THREE.Group();
    const cellSize = 0.6;
    const gap = 0.08;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        const cellGeo = new THREE.BoxGeometry(cellSize, 0.05, cellSize);
        const isHighlighted = Math.random() > 0.6;
        const cellMat = new THREE.MeshPhysicalMaterial({
          color: isHighlighted ? 0x4F46E5 : 0xE8E8E8,
          metalness: 0.1,
          roughness: 0.3,
          transparent: true,
          opacity: isHighlighted ? 0.6 : 0.3,
        });
        const cell = new THREE.Mesh(cellGeo, cellMat);
        cell.position.set(
          (col - 3) * (cellSize + gap),
          0,
          (row - 2) * (cellSize + gap)
        );
        gridGroup.add(cell);

        // Post cards floating above highlighted cells
        if (isHighlighted && Math.random() > 0.3) {
          const cardGeo = new THREE.BoxGeometry(cellSize * 0.8, 0.02, cellSize * 0.5);
          const cardMat = new THREE.MeshPhysicalMaterial({
            color: 0x4F46E5,
            metalness: 0.2,
            roughness: 0.1,
            transparent: true,
            opacity: 0.5,
            emissive: 0x4F46E5,
            emissiveIntensity: 0.1,
          });
          const card = new THREE.Mesh(cardGeo, cardMat);
          card.position.copy(cell.position);
          card.position.y = 0.3 + Math.random() * 0.3;
          (card as unknown as { baseY: number }).baseY = card.position.y;
          (card as unknown as { floatOffset: number }).floatOffset = Math.random() * Math.PI * 2;
          gridGroup.add(card);
        }
      }
    }

    gridGroup.rotation.x = -0.3;
    scene.add(gridGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x4F46E5, 1, 20);
    pointLight1.position.set(3, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06B6D4, 0.6, 15);
    pointLight2.position.set(-2, 3, -2);
    scene.add(pointLight2);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;

      // Slow rotation
      gridGroup.rotation.y += 0.001;

      // Float post cards
      gridGroup.children.forEach((child: THREE.Object3D) => {
        const c = child as unknown as { baseY?: number; floatOffset?: number; position: THREE.Vector3 };
        if (c.baseY !== undefined) {
          c.position.y = c.baseY + Math.sin(t + (c.floatOffset || 0)) * 0.08;
        }
      });

      // Mouse parallax
      const targetRotY = mouseRef.current.x * 0.15;
      gridGroup.rotation.y += (targetRotY - gridGroup.rotation.y) * 0.03;

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
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="three-scene-interactive" style={{ minHeight: '400px' }} />;
}
