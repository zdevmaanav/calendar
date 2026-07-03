'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function FusionScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 5 AI model nodes in a pentagon formation
    const nodeGroup = new THREE.Group();
    const nodeColors = [0x4F46E5, 0x06B6D4, 0xE8722A, 0x6366F1, 0x14B8A6];

    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const radius = 2.5;
      const nodeGeo = new THREE.OctahedronGeometry(0.3, 0);
      const nodeMat = new THREE.MeshPhysicalMaterial({
        color: nodeColors[i],
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.7,
        emissive: nodeColors[i],
        emissiveIntensity: 0.2,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
      (node as unknown as { basePos: THREE.Vector3 }).basePos = node.position.clone();
      (node as unknown as { floatOffset: number }).floatOffset = Math.random() * Math.PI * 2;
      nodes.push(node);
      nodeGroup.add(node);
    }

    // Central fusion point
    const centerGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const centerMat = new THREE.MeshPhysicalMaterial({
      color: 0x4F46E5,
      metalness: 0.5,
      roughness: 0.05,
      transparent: true,
      opacity: 0.6,
      emissive: 0x4F46E5,
      emissiveIntensity: 0.3,
    });
    const center = new THREE.Mesh(centerGeo, centerMat);
    nodeGroup.add(center);

    // Beam lines from nodes to center
    nodes.forEach((node) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        node.position,
        new THREE.Vector3(0, 0, 0),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x4F46E5,
        transparent: true,
        opacity: 0.12,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      nodeGroup.add(line);
    });

    scene.add(nodeGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x4F46E5, 1.2, 20);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06B6D4, 0.8, 15);
    pointLight2.position.set(-3, -2, 2);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xE8722A, 0.5, 12);
    pointLight3.position.set(0, 3, -3);
    scene.add(pointLight3);

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

      // Rotate group
      nodeGroup.rotation.z += 0.002;

      // Float nodes
      nodes.forEach((node: THREE.Mesh & { basePos?: THREE.Vector3; floatOffset?: number }) => {
        node.rotation.x += 0.01;
        node.rotation.y += 0.015;
        const offset = Math.sin(t + (node.floatOffset || 0)) * 0.15;
        node.position.x = (node.basePos?.x || 0) + offset;
        node.position.y = (node.basePos?.y || 0) + offset * 0.5;
      });

      // Pulse center
      const pulse = 1 + Math.sin(t * 2) * 0.1;
      center.scale.setScalar(pulse);

      // Mouse parallax
      const targetRotY = mouseRef.current.x * 0.3;
      const targetRotX = mouseRef.current.y * 0.3;
      nodeGroup.rotation.y += (targetRotY - nodeGroup.rotation.y) * 0.03;
      nodeGroup.rotation.x += (targetRotX - nodeGroup.rotation.x) * 0.03;

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

  return <div ref={containerRef} className="three-scene-interactive" style={{ minHeight: '350px' }} />;
}
