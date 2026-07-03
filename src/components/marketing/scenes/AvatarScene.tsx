'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AvatarScene() {
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

    // Abstract human silhouette — torso + head
    const bodyGeo = new THREE.CylinderGeometry(0.8, 1.2, 3.5, 32);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x4F46E5, metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.25,
      emissive: 0x4F46E5, emissiveIntensity: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = -0.5;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const head = new THREE.Mesh(headGeo, bodyMat.clone());
    head.position.y = 2.3;
    group.add(head);

    // Glowing outline wireframe
    const outlineBody = new THREE.Mesh(bodyGeo, new THREE.MeshBasicMaterial({ color: 0x4F46E5, wireframe: true, transparent: true, opacity: 0.15 }));
    outlineBody.position.copy(body.position);
    outlineBody.scale.setScalar(1.05);
    group.add(outlineBody);

    const outlineHead = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color: 0x06B6D4, wireframe: true, transparent: true, opacity: 0.15 }));
    outlineHead.position.copy(head.position);
    outlineHead.scale.setScalar(1.08);
    group.add(outlineHead);

    // Particle field
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x6366F1, size: 0.04, transparent: true, opacity: 0.4 });
    group.add(new THREE.Points(particleGeo, particleMat));

    // Video frame borders
    for (let i = 0; i < 3; i++) {
      const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 1.2, 0.01));
      const frameMat = new THREE.LineBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0.2 });
      const frame = new THREE.LineSegments(frameGeo, frameMat);
      frame.position.set((i - 1) * 3, Math.random() * 2 - 1, -1 + i * 0.5);
      frame.rotation.y = (i - 1) * 0.3;
      group.add(frame);
    }

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pl = new THREE.PointLight(0x4F46E5, 1.5, 20); pl.position.set(4, 4, 5); scene.add(pl);
    const pl2 = new THREE.PointLight(0x06B6D4, 0.8, 15); pl2.position.set(-3, -3, 3); scene.add(pl2);

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
      group.rotation.y += 0.003;
      body.position.y = -0.5 + Math.sin(t * 0.5) * 0.15;
      head.position.y = 2.3 + Math.sin(t * 0.5) * 0.15;
      outlineBody.position.y = body.position.y;
      outlineHead.position.y = head.position.y;
      group.rotation.y += (mouseRef.current.x * 0.15 - group.rotation.y) * 0.02;
      group.rotation.x += (mouseRef.current.y * 0.1 - group.rotation.x) * 0.02;
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
