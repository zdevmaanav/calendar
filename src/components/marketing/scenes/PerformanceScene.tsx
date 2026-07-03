'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BarData {
  baseHeight: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface MetricCardData {
  angle: number;
  radius: number;
  speed: number;
  yOffset: number;
  wobblePhase: number;
}

interface IconOrbitData {
  angle: number;
  radius: number;
  speed: number;
  yBase: number;
  bobPhase: number;
}

export default function PerformanceScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 4.5, 16);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // ===== CENTRAL HEXAGONAL GLASS PLATFORM =====
    const platformGeo = new THREE.CylinderGeometry(2.8, 2.8, 0.18, 6);
    const platformMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.15,
      transmission: 0.9,
      thickness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.rotation.y = Math.PI / 6;
    worldGroup.add(platform);

    // Platform edge glow
    platform.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(platformGeo),
      new THREE.LineBasicMaterial({ color: 0xFFB4A2, transparent: true, opacity: 0.2 })
    ));

    // Under-platform glow
    const underGlowGeo = new THREE.CircleGeometry(3.2, 32);
    const underGlowMat = new THREE.MeshBasicMaterial({
      color: 0xFFA080,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const underGlow = new THREE.Mesh(underGlowGeo, underGlowMat);
    underGlow.rotation.x = -Math.PI / 2;
    underGlow.position.y = -0.12;
    worldGroup.add(underGlow);

    // Inner ring decoration on platform
    const innerRingGeo = new THREE.RingGeometry(1.8, 1.9, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xFFB4A2,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.1;
    worldGroup.add(innerRing);

    // ===== 3D BAR CHARTS ON PLATFORM =====
    const barCharts: THREE.Mesh[] = [];
    const barDataMap = new Map<THREE.Mesh, BarData>();
    const barTips: THREE.Mesh[] = [];

    const barPositions = [
      { x: -1.5, z: -0.6 }, { x: -1.0, z: -0.3 }, { x: -0.5, z: 0 },
      { x: 0.0, z: 0.2 }, { x: 0.5, z: 0 }, { x: 1.0, z: -0.3 },
      { x: 1.5, z: -0.6 }, { x: -0.8, z: 0.8 }, { x: 0.3, z: 0.7 },
      { x: 1.2, z: 0.5 },
    ];

    for (let i = 0; i < barPositions.length; i++) {
      const bw = 0.18;
      const bh = 0.5 + Math.random() * 1.8;
      const barGeo = new THREE.BoxGeometry(bw, bh, bw);

      // Warm gradient color from bottom to top
      const hue = 0.04 + (i / barPositions.length) * 0.05;
      const barMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(hue, 0.6, 0.78),
        metalness: 0.0,
        roughness: 0.2,
        transparent: true,
        opacity: 0.35,
        transmission: 0.5,
        clearcoat: 0.8,
        side: THREE.DoubleSide,
      });

      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(
        barPositions[i].x,
        bh / 2 + 0.1,
        barPositions[i].z
      );

      barDataMap.set(bar, {
        baseHeight: bh,
        pulseSpeed: 0.4 + Math.random() * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
      });

      barCharts.push(bar);
      worldGroup.add(bar);

      // Glowing sphere tip on each bar
      const tipGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const tipMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.7, 0.85),
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(barPositions[i].x, bh + 0.15, barPositions[i].z);
      barTips.push(tip);
      worldGroup.add(tip);
    }

    // ===== FLOATING METRIC CARDS =====
    const metricCards: THREE.Mesh[] = [];
    const metricDataMap = new Map<THREE.Mesh, MetricCardData>();
    const metricLabels = ['1.2M', '8.4%', '324K', '91.7', '56K'];

    for (let i = 0; i < 5; i++) {
      const w = 1.0;
      const h = 0.6;
      const cardGeo = new THREE.PlaneGeometry(w, h);

      // Canvas texture for metric display
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 120;
      const ctx = canvas.getContext('2d')!;

      // Frosted glass background
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, 0, 200, 120);

      // Metric number
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = 'bold 32px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(metricLabels[i], 100, 55);

      // Small label below
      const labels = ['REACH', 'GROWTH', 'VIEWS', 'SCORE', 'CLICKS'];
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Helvetica, Arial, sans-serif';
      ctx.fillText(labels[i], 100, 80);

      // Thin line accent
      ctx.strokeStyle = 'rgba(255,180,162,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 90);
      ctx.lineTo(160, 90);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      const cardMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        map: tex,
        side: THREE.DoubleSide,
        roughness: 0.3,
      });

      const card = new THREE.Mesh(cardGeo, cardMat);
      const angle = (i / 5) * Math.PI * 2;
      const radius = 4.5 + Math.random() * 0.8;
      const yOff = -0.5 + Math.random() * 2.5;

      card.position.set(
        Math.cos(angle) * radius,
        yOff,
        Math.sin(angle) * radius
      );
      card.lookAt(0, yOff * 0.3, 0);

      // Card edge highlight
      card.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(cardGeo),
        new THREE.LineBasicMaterial({ color: 0xFFD4B0, transparent: true, opacity: 0.15 })
      ));

      metricDataMap.set(card, {
        angle,
        radius,
        speed: 0.0008 + Math.random() * 0.0006,
        yOffset: yOff,
        wobblePhase: Math.random() * Math.PI * 2,
      });

      metricCards.push(card);
      worldGroup.add(card);
    }

    // ===== CONNECTING LINES (bars to metric cards) =====
    const connectorLines: THREE.Line[] = [];
    for (let i = 0; i < 5; i++) {
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xFFB4A2,
        transparent: true,
        opacity: 0.06,
      });
      const lineGeo = new THREE.BufferGeometry();
      const linePositions = new Float32Array(6);
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      const line = new THREE.Line(lineGeo, lineMat);
      connectorLines.push(line);
      worldGroup.add(line);
    }

    // ===== SOCIAL PLATFORM ICON ORBS =====
    const iconOrbs: THREE.Mesh[] = [];
    const iconDataMap = new Map<THREE.Mesh, IconOrbitData>();
    const iconColors = [0xC13584, 0x1877F2, 0xFF0000]; // IG, FB, YT (muted)

    for (let i = 0; i < 3; i++) {
      const orbGeo = new THREE.IcosahedronGeometry(0.22, 1);
      const orbMat = new THREE.MeshPhysicalMaterial({
        color: iconColors[i],
        metalness: 0.1,
        roughness: 0.3,
        transparent: true,
        opacity: 0.35,
        clearcoat: 1,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      const angle = (i / 3) * Math.PI * 2 + Math.PI / 3;
      const radius = 3.2;

      orb.position.set(
        Math.cos(angle) * radius,
        1.5 + i * 0.4,
        Math.sin(angle) * radius
      );

      // Glow ring around orb
      const orbRingGeo = new THREE.RingGeometry(0.28, 0.34, 16);
      const orbRingMat = new THREE.MeshBasicMaterial({
        color: iconColors[i],
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const orbRing = new THREE.Mesh(orbRingGeo, orbRingMat);
      orbRing.lookAt(camera.position);
      orb.add(orbRing);

      iconDataMap.set(orb, {
        angle,
        radius,
        speed: 0.003 + i * 0.001,
        yBase: 1.5 + i * 0.4,
        bobPhase: Math.random() * Math.PI * 2,
      });

      iconOrbs.push(orb);
      worldGroup.add(orb);
    }

    // ===== DATA STREAM PARTICLES =====
    const streamCount = 300;
    const streamPositions = new Float32Array(streamCount * 3);
    const streamProgress = new Float32Array(streamCount);
    const streamSources = new Float32Array(streamCount);

    for (let i = 0; i < streamCount; i++) {
      streamProgress[i] = Math.random();
      streamSources[i] = Math.floor(Math.random() * metricCards.length);
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
    worldGroup.add(new THREE.Points(streamGeo, streamMat));

    // ===== AMBIENT GLOW RINGS (concentric) =====
    const glowRings: THREE.Line[] = [];
    for (let i = 0; i < 4; i++) {
      const rr = 3.0 + i * 1.2;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr));
      }
      const rGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const rMat = new THREE.LineBasicMaterial({
        color: 0xFFB496,
        transparent: true,
        opacity: 0.05 + (4 - i) * 0.01,
      });
      const ring = new THREE.Line(rGeo, rMat);
      ring.rotation.x = Math.PI * 0.5;
      glowRings.push(ring);
      worldGroup.add(ring);
    }

    // ===== AMBIENT FLOATING PARTICLES =====
    const ambientCount = 200;
    const ambientPositions = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambientPositions[i * 3] = (Math.random() - 0.5) * 22;
      ambientPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      ambientPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    scene.add(new THREE.Points(ambientGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.03, transparent: true, opacity: 0.2,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    // ===== CENTER GLOW SPRITE =====
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 512;
    glowCanvas.height = 512;
    const glowCtx = glowCanvas.getContext('2d')!;
    const grad = glowCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, 'rgba(255, 180, 140, 0.3)');
    grad.addColorStop(0.25, 'rgba(255, 160, 128, 0.15)');
    grad.addColorStop(0.5, 'rgba(255, 140, 100, 0.05)');
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
    glowSprite.scale.set(14, 14, 1);
    worldGroup.add(glowSprite);

    // ===== LIGHTING =====
    const centerLight = new THREE.PointLight(0xFFA080, 3, 25);
    centerLight.position.set(0, 1.5, 0);
    worldGroup.add(centerLight);

    const topLight = new THREE.PointLight(0xFFFFFF, 1.5, 20);
    topLight.position.set(0, 8, 0);
    scene.add(topLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const fillLight = new THREE.PointLight(0xFFB4A2, 0.6, 20);
    fillLight.position.set(-5, 3, 6);
    scene.add(fillLight);

    // ===== MOUSE TRACKING =====
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

      // Platform slow rotation
      platform.rotation.y += 0.002;
      innerRing.rotation.z += 0.003;

      // Bar chart pulsing
      barCharts.forEach((bar, idx) => {
        const data = barDataMap.get(bar);
        if (!data) return;
        const scale = 1 + Math.sin(t * data.pulseSpeed + data.pulsePhase) * 0.2;
        bar.scale.y = scale;
        bar.position.y = (data.baseHeight * scale) / 2 + 0.1;

        // Update tip position
        if (barTips[idx]) {
          barTips[idx].position.y = data.baseHeight * scale + 0.15;
          // Tip glow pulse
          const tipMat = barTips[idx].material as THREE.MeshBasicMaterial;
          tipMat.opacity = 0.5 + Math.sin(t * 2 + idx) * 0.3;
        }
      });

      // Metric cards orbit
      metricCards.forEach((card) => {
        const data = metricDataMap.get(card);
        if (!data) return;
        data.angle += data.speed;
        const wobble = Math.sin(t * 0.5 + data.wobblePhase) * 0.15;
        card.position.set(
          Math.cos(data.angle) * data.radius,
          data.yOffset + wobble,
          Math.sin(data.angle) * data.radius
        );
        card.lookAt(0, data.yOffset * 0.3, 0);
      });

      // Update connector lines
      connectorLines.forEach((line, i) => {
        if (!metricCards[i]) return;
        const barIdx = i * 2;
        const bar = barCharts[barIdx];
        if (!bar) return;
        const pos = line.geometry.getAttribute('position') as THREE.BufferAttribute;
        pos.setXYZ(0, bar.position.x, bar.position.y + 0.3, bar.position.z);
        pos.setXYZ(1, metricCards[i].position.x, metricCards[i].position.y, metricCards[i].position.z);
        pos.needsUpdate = true;
      });

      // Social icon orbs
      iconOrbs.forEach((orb) => {
        const data = iconDataMap.get(orb);
        if (!data) return;
        data.angle += data.speed;
        const bob = Math.sin(t * 0.6 + data.bobPhase) * 0.2;
        orb.position.set(
          Math.cos(data.angle) * data.radius,
          data.yBase + bob,
          Math.sin(data.angle) * data.radius
        );
        orb.rotation.y += 0.01;
        // Update the ring to face camera
        if (orb.children[0]) {
          orb.children[0].lookAt(camera.position);
        }
      });

      // Data stream particles (metric cards → platform center)
      const sPos = streamGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < streamCount; i++) {
        streamProgress[i] += 0.004 + Math.random() * 0.002;
        if (streamProgress[i] > 1) {
          streamProgress[i] = 0;
          streamSources[i] = Math.floor(Math.random() * metricCards.length);
        }
        const cardIdx = Math.floor(streamSources[i]);
        const card = metricCards[cardIdx];
        if (!card) continue;

        const prog = streamProgress[i];
        const pw = card.position;
        const mid = new THREE.Vector3(
          pw.x * 0.5 + Math.sin(i * 0.06 + t) * 0.3,
          pw.y * 0.5 + Math.sin(prog * Math.PI) * 1.2,
          pw.z * 0.5 + Math.cos(i * 0.06 + t) * 0.3
        );

        const inv = 1 - prog;
        sPos.setXYZ(i,
          inv * inv * pw.x + 2 * inv * prog * mid.x + prog * prog * 0,
          inv * inv * pw.y + 2 * inv * prog * mid.y + prog * prog * 0.2,
          inv * inv * pw.z + 2 * inv * prog * mid.z + prog * prog * 0
        );
      }
      sPos.needsUpdate = true;

      // Glow rings pulse
      glowRings.forEach((ring, i) => {
        const pulse = 1 + Math.sin(t * 0.5 + i * 0.8) * 0.08;
        ring.scale.setScalar(pulse);
        (ring.material as THREE.LineBasicMaterial).opacity =
          (0.05 + (4 - i) * 0.01) * (0.5 + Math.sin(t * 0.3 + i) * 0.5);
      });

      // Center glow breathing
      const glowBreath = 1 + Math.sin(t * 0.35) * 0.08;
      glowSprite.scale.set(14 * glowBreath, 14 * glowBreath, 1);

      // Under-platform glow pulse
      underGlowMat.opacity = 0.04 + Math.sin(t * 0.4) * 0.02;

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
        height: '65vh',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}
