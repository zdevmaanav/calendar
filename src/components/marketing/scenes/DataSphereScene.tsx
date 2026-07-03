'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DataSphereScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Central glass sphere
    const sphereGeometry = new THREE.IcosahedronGeometry(1.5, 2);
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4F46E5,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.15,
      transmission: 0.8,
      thickness: 0.5,
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      wireframe: true,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // Inner sphere
    const innerGeometry = new THREE.IcosahedronGeometry(0.8, 1);
    const innerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x06B6D4,
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerSphere);

    // Orbiting nodes
    const nodeGroup = new THREE.Group();

    const nodeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4F46E5,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < 8; i++) {
      const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const node = new THREE.Mesh(nodeGeo, nodeMaterial.clone());
      const angle = (i / 8) * Math.PI * 2;
      const radius = 2.2 + Math.random() * 0.5;
      node.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 1.5,
        Math.sin(angle) * radius
      );
      (node as unknown as { orbitAngle: number }).orbitAngle = angle;
      (node as unknown as { orbitRadius: number }).orbitRadius = radius;
      (node as unknown as { orbitSpeed: number }).orbitSpeed = 0.003 + Math.random() * 0.002;
      (node as unknown as { verticalOffset: number }).verticalOffset = node.position.y;
      nodeGroup.add(node);
    }
    scene.add(nodeGroup);

    // Connection lines from nodes to center

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x4F46E5, 1, 15);
    pointLight1.position.set(3, 2, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06B6D4, 0.8, 15);
    pointLight2.position.set(-3, -1, 2);
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
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow rotation
      sphere.rotation.y += 0.002;
      sphere.rotation.x += 0.001;
      innerSphere.rotation.y -= 0.003;
      innerSphere.rotation.z += 0.001;

      // Breathing
      const breathe = 1 + Math.sin(t * 0.8) * 0.03;
      sphere.scale.setScalar(breathe);

      // Orbit nodes
      nodeGroup.children.forEach((node: THREE.Object3D) => {
        const n = node as unknown as { orbitAngle: number; orbitSpeed: number; orbitRadius: number; verticalOffset: number; position: THREE.Vector3 };
        n.orbitAngle += n.orbitSpeed;
        n.position.x = Math.cos(n.orbitAngle) * n.orbitRadius;
        n.position.z = Math.sin(n.orbitAngle) * n.orbitRadius;
        n.position.y = n.verticalOffset + Math.sin(t + n.orbitAngle) * 0.2;
      });

      // Mouse parallax
      const targetRotY = mouseRef.current.x * 0.3;
      const targetRotX = mouseRef.current.y * 0.3;
      scene.rotation.y += (targetRotY - scene.rotation.y) * 0.05;
      scene.rotation.x += (targetRotX - scene.rotation.x) * 0.05;

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
