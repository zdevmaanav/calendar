'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CardData {
  baseAngle: number;
  distance: number;
  yOffset: number;
  rotSpeed: number;
  driftPhase: number;
}

interface OrbitShapeData {
  angle: number;
  radius: number;
  speed: number;
  yBase: number;
  bobPhase: number;
}

export default function ContentStudioScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // ===== 1. CENTRAL GLOWING ENERGY CORE =====
    const coreGeo = new THREE.SphereGeometry(1.6, 64, 64);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFA080,
      emissive: 0xFFA080,
      emissiveIntensity: 0.8,
      metalness: 0.0,
      roughness: 0.15,
      transparent: true,
      opacity: 0.2,
      transmission: 0.7,
      thickness: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.FrontSide,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    worldGroup.add(core);

    // Inner luminous sphere
    const innerGlowGeo = new THREE.SphereGeometry(1.1, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xFFA080,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    worldGroup.add(innerGlow);

    // Iridescent shell
    const shellGeo = new THREE.SphereGeometry(1.7, 32, 32);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFE4B5,
      metalness: 0.1,
      roughness: 0.0,
      transparent: true,
      opacity: 0.04,
      clearcoat: 1,
      side: THREE.FrontSide,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    worldGroup.add(shell);

    // ===== 2. RADIAL BURST OF CONTENT CARDS =====
    const cardCount = 14;
    const contentCards: THREE.Mesh[] = [];
    const cardDataMap = new Map<THREE.Mesh, CardData>();

    for (let i = 0; i < cardCount; i++) {
      const w = 1.1 + Math.random() * 0.5;
      const h = 0.75 + Math.random() * 0.35;
      const cardGeo = new THREE.PlaneGeometry(w, h);

      // Canvas texture with content representations
      const canvas = document.createElement('canvas');
      canvas.width = 220;
      canvas.height = 150;
      const ctx = canvas.getContext('2d')!;

      // Frosted glass base
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, 0, 220, 150);

      // Content type variations
      const contentType = i % 4;
      if (contentType === 0) {
        // "Image" — abstract rectangle + small caption
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(15, 15, 100, 70);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(15, 95, 140, 4);
        ctx.fillRect(15, 105, 100, 4);
      } else if (contentType === 1) {
        // "Caption" — text lines
        for (let l = 0; l < 5; l++) {
          ctx.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.08})`;
          ctx.fillRect(15, 18 + l * 18, 120 + Math.random() * 60, 4);
        }
      } else if (contentType === 2) {
        // "Video" — play symbol
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(15, 12, 190, 100);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(90, 40);
        ctx.lineTo(90, 80);
        ctx.lineTo(130, 60);
        ctx.closePath();
        ctx.fill();
      } else {
        // "Design" — geometric shapes
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 20, 60, 60);
        ctx.beginPath();
        ctx.arc(140, 50, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(80, 110);
        ctx.lineTo(110, 110);
        ctx.lineTo(95, 85);
        ctx.closePath();
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      const cardMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        map: tex,
        side: THREE.DoubleSide,
        roughness: 0.1,
      });

      const card = new THREE.Mesh(cardGeo, cardMat);

      const angle = (i / cardCount) * Math.PI * 2;
      const distance = 3.5 + Math.random() * 2.5;
      const yOff = (Math.random() - 0.5) * 3.0;

      card.position.set(
        Math.cos(angle) * distance,
        yOff,
        Math.sin(angle) * distance
      );
      card.lookAt(0, yOff * 0.2, 0);

      // Subtle edge highlight
      card.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(cardGeo),
        new THREE.LineBasicMaterial({ color: 0xFFD4B0, transparent: true, opacity: 0.12 })
      ));

      cardDataMap.set(card, {
        baseAngle: angle,
        distance,
        yOffset: yOff,
        rotSpeed: 0.001 + Math.random() * 0.001,
        driftPhase: Math.random() * Math.PI * 2,
      });

      contentCards.push(card);
      worldGroup.add(card);
    }

    // ===== 3. CONNECTION ENERGY STREAMS (core → cards) =====
    const streamCount = 350;
    const streamPositions = new Float32Array(streamCount * 3);
    const streamProgress = new Float32Array(streamCount);
    const streamTargets = new Float32Array(streamCount);

    for (let i = 0; i < streamCount; i++) {
      streamProgress[i] = Math.random();
      streamTargets[i] = Math.floor(Math.random() * cardCount);
    }

    const streamGeo = new THREE.BufferGeometry();
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    const streamMat = new THREE.PointsMaterial({
      color: 0xFFE4B5,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    worldGroup.add(new THREE.Points(streamGeo, streamMat));

    // ===== 4. ORBITING GEOMETRIC ELEMENTS =====
    const orbitShapes: THREE.Mesh[] = [];
    const orbitDataMap = new Map<THREE.Mesh, OrbitShapeData>();
    const shapeConfigs = [
      { geo: new THREE.BoxGeometry(0.2, 0.2, 0.2), color: 0xFFA080 },
      { geo: new THREE.SphereGeometry(0.12, 12, 12), color: 0xFFB4C0 },
      { geo: new THREE.TetrahedronGeometry(0.15), color: 0x80D0E8 },
      { geo: new THREE.TorusGeometry(0.1, 0.04, 8, 16), color: 0xB4A0E8 },
      { geo: new THREE.OctahedronGeometry(0.14), color: 0xFFA080 },
      { geo: new THREE.BoxGeometry(0.15, 0.25, 0.15), color: 0xFFB4C0 },
      { geo: new THREE.SphereGeometry(0.1, 8, 8), color: 0x80D0E8 },
      { geo: new THREE.TetrahedronGeometry(0.12), color: 0xB4A0E8 },
    ];

    for (let i = 0; i < shapeConfigs.length; i++) {
      const { geo, color } = shapeConfigs[i];
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.05,
        roughness: 0.2,
        transparent: true,
        opacity: 0.35,
        clearcoat: 1,
      });
      const shape = new THREE.Mesh(geo, mat);

      const angle = (i / shapeConfigs.length) * Math.PI * 2;
      const radius = 2.2 + Math.random() * 0.8;
      const yBase = (Math.random() - 0.5) * 2;

      shape.position.set(
        Math.cos(angle) * radius,
        yBase,
        Math.sin(angle) * radius
      );

      orbitDataMap.set(shape, {
        angle,
        radius,
        speed: 0.004 + Math.random() * 0.004,
        yBase,
        bobPhase: Math.random() * Math.PI * 2,
      });

      orbitShapes.push(shape);
      worldGroup.add(shape);
    }

    // ===== 5. AMBIENT PARTICLE FIELD =====
    const ambientCount = 200;
    const ambientPositions = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambientPositions[i * 3] = (Math.random() - 0.5) * 24;
      ambientPositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      ambientPositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    scene.add(new THREE.Points(ambientGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.03, transparent: true, opacity: 0.2,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    // ===== 6. CONCENTRIC GLOW RINGS =====
    const glowRings: THREE.Line[] = [];
    for (let i = 0; i < 4; i++) {
      const rr = 2.5 + i * 1.3;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr));
      }
      const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const rMat = new THREE.LineBasicMaterial({
        color: 0xFFB496,
        transparent: true,
        opacity: 0.05 + (4 - i) * 0.012,
      });
      const ring = new THREE.Line(rGeo, rMat);
      ring.rotation.x = Math.PI * 0.5;
      glowRings.push(ring);
      worldGroup.add(ring);
    }

    // ===== CENTER GLOW SPRITE =====
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 512;
    glowCanvas.height = 512;
    const glowCtx = glowCanvas.getContext('2d')!;
    const grad = glowCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, 'rgba(255, 180, 140, 0.35)');
    grad.addColorStop(0.2, 'rgba(255, 165, 120, 0.18)');
    grad.addColorStop(0.45, 'rgba(255, 140, 100, 0.06)');
    grad.addColorStop(1, 'rgba(255, 140, 100, 0)');
    glowCtx.fillStyle = grad;
    glowCtx.fillRect(0, 0, 512, 512);
    const glowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(glowCanvas),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glowSprite.scale.set(16, 16, 1);
    worldGroup.add(glowSprite);

    // ===== LIGHTING =====
    const centerLight = new THREE.PointLight(0xFFA080, 4, 28);
    centerLight.position.set(0, 0, 0);
    worldGroup.add(centerLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
    topLight.position.set(0, 8, 4);
    scene.add(topLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    const fillLight = new THREE.PointLight(0xFFB4A2, 0.6, 20);
    fillLight.position.set(-5, 3, 6);
    scene.add(fillLight);

    // ===== MOUSE =====
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ===== ANIMATION LOOP =====
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow world rotation
      worldGroup.rotation.y += 0.002;

      // Core pulse
      const pulse = 1 + Math.sin(t * 0.6) * 0.05;
      core.scale.setScalar(pulse);
      shell.scale.setScalar(pulse * 1.02);
      innerGlowMat.opacity = 0.06 + Math.sin(t * 0.8) * 0.04;

      // Content cards drift and rotate
      contentCards.forEach((card) => {
        const data = cardDataMap.get(card);
        if (!data) return;
        const drift = Math.sin(t * 0.3 + data.driftPhase) * 0.3;
        const yDrift = Math.sin(t * 0.4 + data.driftPhase * 1.3) * 0.15;
        card.position.set(
          Math.cos(data.baseAngle + t * data.rotSpeed) * (data.distance + drift),
          data.yOffset + yDrift,
          Math.sin(data.baseAngle + t * data.rotSpeed) * (data.distance + drift)
        );
        card.lookAt(0, data.yOffset * 0.2, 0);
      });

      // Orbiting geometric shapes
      orbitShapes.forEach((shape) => {
        const data = orbitDataMap.get(shape);
        if (!data) return;
        data.angle += data.speed;
        const bob = Math.sin(t * 0.7 + data.bobPhase) * 0.2;
        shape.position.set(
          Math.cos(data.angle) * data.radius,
          data.yBase + bob,
          Math.sin(data.angle) * data.radius
        );
        shape.rotation.x += 0.008;
        shape.rotation.y += 0.012;
      });

      // Energy streams (center → cards, Bezier curves)
      const sPos = streamGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < streamCount; i++) {
        streamProgress[i] += 0.005 + Math.random() * 0.003;
        if (streamProgress[i] > 1) {
          streamProgress[i] = 0;
          streamTargets[i] = Math.floor(Math.random() * cardCount);
        }
        const targetIdx = Math.floor(streamTargets[i]);
        const card = contentCards[targetIdx];
        if (!card) continue;

        const prog = streamProgress[i];
        const pw = card.position;
        const mid = new THREE.Vector3(
          pw.x * 0.4 + Math.sin(i * 0.08 + t) * 0.3,
          pw.y * 0.4 + Math.sin(prog * Math.PI) * 1.0,
          pw.z * 0.4 + Math.cos(i * 0.08 + t) * 0.3
        );

        const inv = 1 - prog;
        sPos.setXYZ(i,
          inv * inv * 0 + 2 * inv * prog * mid.x + prog * prog * pw.x,
          inv * inv * 0 + 2 * inv * prog * mid.y + prog * prog * pw.y,
          inv * inv * 0 + 2 * inv * prog * mid.z + prog * prog * pw.z
        );
      }
      sPos.needsUpdate = true;

      // Glow rings pulse (expand and fade every ~2s)
      glowRings.forEach((ring, i) => {
        const pulse = 1 + Math.sin(t * 0.5 + i * 0.9) * 0.1;
        ring.scale.setScalar(pulse);
        (ring.material as THREE.LineBasicMaterial).opacity =
          (0.05 + (4 - i) * 0.012) * (0.4 + Math.sin(t * 0.35 + i) * 0.6);
      });

      // Center glow breathing
      const glowBreath = 1 + Math.sin(t * 0.35) * 0.08;
      glowSprite.scale.set(16 * glowBreath, 16 * glowBreath, 1);

      // Mouse parallax (15px max)
      const tx = mouseRef.current.x * 0.55;
      const ty = mouseRef.current.y * 0.4;
      worldGroup.position.x += (tx - worldGroup.position.x) * 0.03;
      worldGroup.position.y += (ty - worldGroup.position.y) * 0.03;

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
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
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
        width: '90vw',
        height: '70vh',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}
