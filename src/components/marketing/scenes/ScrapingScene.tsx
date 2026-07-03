'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ---- Typed animation data ----
interface PanelData {
  baseAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  yOffset: number;
  wobblePhase: number;
}

export default function ScrapingScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // ===== 1. CENTRAL GLASS ORB =====
    const orbGeo = new THREE.SphereGeometry(2.2, 64, 64);
    const orbMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFD4C0,
      metalness: 0.0,
      roughness: 0.2,
      transparent: true,
      opacity: 0.18,
      transmission: 0.8,
      thickness: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      ior: 1.5,
      side: THREE.FrontSide,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    worldGroup.add(orb);

    // Inner glow orb
    const innerGlowGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xFFA080,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    worldGroup.add(innerGlow);

    // Wireframe shell for depth
    const wireGeo = new THREE.IcosahedronGeometry(2.4, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xFFB4A2,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const wireShell = new THREE.Mesh(wireGeo, wireMat);
    worldGroup.add(wireShell);

    // ===== 2. FLOATING WEBSITE PANELS =====
    const panelGroup = new THREE.Group();
    const panelCount = 7;
    const panels: THREE.Mesh[] = [];
    const panelDataMap = new Map<THREE.Mesh, PanelData>();

    for (let i = 0; i < panelCount; i++) {
      const w = 0.8 + Math.random() * 0.6;
      const h = 0.5 + Math.random() * 0.4;
      const panelGeo = new THREE.PlaneGeometry(w, h);

      // Create canvas texture for "website content" lines
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(255,255,255,0.0)';
      ctx.fillRect(0, 0, 256, 160);

      // Draw subtle text lines
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      const lineCount = 5 + Math.floor(Math.random() * 4);
      for (let j = 0; j < lineCount; j++) {
        const y = 20 + j * 16;
        const lineWidth = 60 + Math.random() * 160;
        ctx.beginPath();
        ctx.moveTo(16, y);
        ctx.lineTo(16 + lineWidth, y);
        ctx.stroke();
      }
      // Title block
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(16, 10, 80 + Math.random() * 60, 4);

      const tex = new THREE.CanvasTexture(canvas);

      const panelMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        map: tex,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.0,
      });

      const panel = new THREE.Mesh(panelGeo, panelMat);
      const angle = (i / panelCount) * Math.PI * 2;
      const radius = 3.8 + Math.random() * 1.2;
      const yPos = (Math.random() - 0.5) * 2.5;

      panel.position.set(
        Math.cos(angle) * radius,
        yPos,
        Math.sin(angle) * radius
      );
      panel.lookAt(0, yPos * 0.3, 0);

      panelDataMap.set(panel, {
        baseAngle: angle,
        orbitRadius: radius,
        orbitSpeed: 0.001 + Math.random() * 0.0005,
        yOffset: yPos,
        wobblePhase: Math.random() * Math.PI * 2,
      });

      panels.push(panel);
      panelGroup.add(panel);

      // Border glow edge on each panel
      const edgeGeo = new THREE.EdgesGeometry(panelGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xFFD4B0,
        transparent: true,
        opacity: 0.15,
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(panel.position);
      edges.rotation.copy(panel.rotation);
      // We'll parent edges to panel so they rotate together
      panel.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(panelGeo),
        new THREE.LineBasicMaterial({ color: 0xFFD4B0, transparent: true, opacity: 0.15 })
      ));
    }
    worldGroup.add(panelGroup);

    // ===== 3. STREAMING DATA PARTICLES (panel → orb) =====
    const streamParticleCount = 300;
    const streamPositions = new Float32Array(streamParticleCount * 3);
    const streamProgress = new Float32Array(streamParticleCount); // 0→1 progress along path
    const streamSources = new Float32Array(streamParticleCount); // which panel index

    for (let i = 0; i < streamParticleCount; i++) {
      streamProgress[i] = Math.random();
      streamSources[i] = Math.floor(Math.random() * panelCount);
      streamPositions[i * 3] = 0;
      streamPositions[i * 3 + 1] = 0;
      streamPositions[i * 3 + 2] = 0;
    }

    const streamGeo = new THREE.BufferGeometry();
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));

    const streamMat = new THREE.PointsMaterial({
      color: 0xFFD4B0,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const streamParticles = new THREE.Points(streamGeo, streamMat);
    worldGroup.add(streamParticles);

    // ===== 4. AMBIENT GLOW RINGS =====
    const ringCount = 4;
    const rings: THREE.Line[] = [];
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = 2.8 + i * 0.8;
      const ringSegments = 96;
      const ringPoints: THREE.Vector3[] = [];
      for (let j = 0; j <= ringSegments; j++) {
        const angle = (j / ringSegments) * Math.PI * 2;
        ringPoints.push(new THREE.Vector3(
          Math.cos(angle) * ringRadius,
          0,
          Math.sin(angle) * ringRadius
        ));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringMat = new THREE.LineBasicMaterial({
        color: 0xFFB4A2,
        transparent: true,
        opacity: 0.04 + (ringCount - i) * 0.015,
      });
      const ring = new THREE.Line(ringGeo, ringMat);
      ring.rotation.x = Math.PI * 0.5 + (Math.random() - 0.5) * 0.3;
      worldGroup.add(ring);
      rings.push(ring);
    }

    // ===== 5. FLOATING AMBIENT PARTICLES =====
    const ambientCount = 180;
    const ambientPositions = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambientPositions[i * 3] = (Math.random() - 0.5) * 18;
      ambientPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      ambientPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    const ambientMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ambientPts = new THREE.Points(ambientGeo, ambientMat);
    scene.add(ambientPts);

    // ===== 6. CENTER GLOW SPRITE =====
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 512;
    glowCanvas.height = 512;
    const glowCtx = glowCanvas.getContext('2d')!;
    const grad = glowCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, 'rgba(255, 180, 140, 0.35)');
    grad.addColorStop(0.3, 'rgba(255, 160, 128, 0.15)');
    grad.addColorStop(0.6, 'rgba(255, 140, 100, 0.05)');
    grad.addColorStop(1, 'rgba(255, 140, 100, 0)');
    glowCtx.fillStyle = grad;
    glowCtx.fillRect(0, 0, 512, 512);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glowSprite.scale.set(12, 12, 1);
    worldGroup.add(glowSprite);

    // ===== LIGHTING =====
    const centerLight = new THREE.PointLight(0xFFA080, 2, 25);
    centerLight.position.set(0, 0, 0);
    worldGroup.add(centerLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 8, 5);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const fillLight = new THREE.PointLight(0xFFB4A2, 0.6, 20);
    fillLight.position.set(-5, 3, 5);
    scene.add(fillLight);

    // ===== MOUSE TRACKING =====
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ===== ANIMATION =====
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Central orb rotation
      orb.rotation.y += 0.003;
      orb.rotation.x = Math.sin(t * 0.15) * 0.08;
      wireShell.rotation.y -= 0.001;
      wireShell.rotation.z += 0.0005;

      // Inner glow pulse
      const glowPulse = 0.04 + Math.sin(t * 0.8) * 0.02;
      innerGlowMat.opacity = glowPulse;
      innerGlow.scale.setScalar(1 + Math.sin(t * 0.5) * 0.05);

      // Panel group counter-rotation
      panelGroup.rotation.y -= 0.001;

      // Individual panel wobble
      panels.forEach((panel) => {
        const data = panelDataMap.get(panel);
        if (!data) return;
        const wobble = Math.sin(t * 0.5 + data.wobblePhase) * 0.15;
        const currentAngle = data.baseAngle + panelGroup.rotation.y;
        panel.position.set(
          Math.cos(currentAngle) * data.orbitRadius,
          data.yOffset + wobble,
          Math.sin(currentAngle) * data.orbitRadius
        );
        panel.lookAt(0, data.yOffset * 0.3 + wobble * 0.5, 0);
      });

      // Stream particles: flow from panels to center
      const sPos = streamGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < streamParticleCount; i++) {
        streamProgress[i] += 0.004 + Math.random() * 0.002;
        if (streamProgress[i] > 1) {
          streamProgress[i] = 0;
          streamSources[i] = Math.floor(Math.random() * panelCount);
        }

        const panelIdx = Math.floor(streamSources[i]);
        const panel = panels[panelIdx];
        if (!panel) continue;

        // World position of panel
        const pw = new THREE.Vector3();
        panel.getWorldPosition(pw);

        // Bezier-like curve from panel to center
        const prog = streamProgress[i];
        const mid = new THREE.Vector3(
          pw.x * 0.5 + (Math.sin(i * 0.1 + t) * 0.3),
          pw.y * 0.5 + Math.sin(prog * Math.PI) * 1.2,
          pw.z * 0.5 + (Math.cos(i * 0.1 + t) * 0.3)
        );

        // Quadratic bezier: P = (1-t)²·start + 2(1-t)t·mid + t²·end
        const inv = 1 - prog;
        const x = inv * inv * pw.x + 2 * inv * prog * mid.x + prog * prog * 0;
        const y = inv * inv * pw.y + 2 * inv * prog * mid.y + prog * prog * 0;
        const z = inv * inv * pw.z + 2 * inv * prog * mid.z + prog * prog * 0;

        sPos.setXYZ(i, x, y, z);
      }
      sPos.needsUpdate = true;

      // Ring pulse
      rings.forEach((ring, i) => {
        const pulse = 1 + Math.sin(t * 0.7 + i * 0.8) * 0.08;
        ring.scale.setScalar(pulse);
        const mat = ring.material as THREE.LineBasicMaterial;
        mat.opacity = (0.04 + (ringCount - i) * 0.015) * (0.6 + Math.sin(t * 0.5 + i) * 0.4);
      });

      // Glow sprite breathing
      const glowBreath = 1 + Math.sin(t * 0.4) * 0.08;
      glowSprite.scale.set(12 * glowBreath, 12 * glowBreath, 1);

      // Ambient particles drift
      const aPos = ambientGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < ambientCount; i++) {
        const py = aPos.getY(i);
        aPos.setY(i, py + Math.sin(t * 0.3 + i * 0.5) * 0.0008);
        const px = aPos.getX(i);
        aPos.setX(i, px + Math.cos(t * 0.2 + i * 0.3) * 0.0004);
      }
      aPos.needsUpdate = true;

      // Mouse parallax — 15px max
      const targetX = mouseRef.current.x * 0.45;
      const targetY = mouseRef.current.y * 0.45;
      worldGroup.position.x += (targetX - worldGroup.position.x) * 0.03;
      worldGroup.position.y += (targetY - worldGroup.position.y) * 0.03;

      renderer.render(scene, camera);
    };
    animate();

    // ===== RESIZE =====
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

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80vw',
        height: '55vh',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}
