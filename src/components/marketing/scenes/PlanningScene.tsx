'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PostCardData {
  baseY: number;
  floatSpeed: number;
  floatPhase: number;
}

export default function PlanningScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 4, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // ===== CALENDAR GRID =====
    const cols = 7;
    const rows = 4;
    const cellW = 0.9;
    const cellH = 0.7;
    const gap = 0.12;
    const gridW = cols * (cellW + gap) - gap;
    const gridH = rows * (cellH + gap) - gap;
    const cells: THREE.Mesh[] = [];
    const highlightedIndices = [2, 5, 8, 10, 14, 17, 20, 23, 26];

    const cellMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.25,
      transparent: true,
      opacity: 0.08,
      transmission: 0.8,
      thickness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
    });

    const highlightMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFB4A2,
      metalness: 0.0,
      roughness: 0.2,
      transparent: true,
      opacity: 0.15,
      transmission: 0.7,
      thickness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const geo = new THREE.PlaneGeometry(cellW, cellH);
        const isHighlighted = highlightedIndices.includes(idx);
        const mat = isHighlighted ? highlightMat.clone() : cellMat.clone();
        const cell = new THREE.Mesh(geo, mat);

        const x = c * (cellW + gap) - gridW / 2 + cellW / 2;
        const y = -(r * (cellH + gap) - gridH / 2 + cellH / 2);
        cell.position.set(x, y, 0);

        // Add subtle border
        const edgeGeo = new THREE.EdgesGeometry(geo);
        const edgeMat = new THREE.LineBasicMaterial({
          color: isHighlighted ? 0xFFB4A2 : 0xcccccc,
          transparent: true,
          opacity: isHighlighted ? 0.2 : 0.08,
        });
        cell.add(new THREE.LineSegments(edgeGeo, edgeMat));

        cells.push(cell);
        worldGroup.add(cell);
      }
    }

    // ===== FLOATING POST CARDS =====
    const postCards: THREE.Mesh[] = [];
    const postDataMap = new Map<THREE.Mesh, PostCardData>();
    const postIndices = [2, 8, 14, 20, 26]; // cells that have posts

    postIndices.forEach((idx) => {
      const cell = cells[idx];
      if (!cell) return;

      const cardW = cellW * 0.7;
      const cardH = cellH * 0.5;
      const cardGeo = new THREE.PlaneGeometry(cardW, cardH);

      // Canvas texture with content lines
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 80;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(255,255,255,0.0)';
      ctx.fillRect(0, 0, 128, 80);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(10, 10, 40, 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      for (let j = 0; j < 3; j++) {
        const y = 22 + j * 10;
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(10 + 50 + Math.random() * 50, y);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      const cardMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        map: tex,
        side: THREE.DoubleSide,
        roughness: 0.3,
      });

      const card = new THREE.Mesh(cardGeo, cardMat);
      const baseY = cell.position.y + 0.6;
      card.position.set(cell.position.x, baseY, 0.3);

      // Border
      card.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(cardGeo),
        new THREE.LineBasicMaterial({ color: 0xFFD4B0, transparent: true, opacity: 0.2 })
      ));

      postDataMap.set(card, {
        baseY,
        floatSpeed: 0.4 + Math.random() * 0.3,
        floatPhase: Math.random() * Math.PI * 2,
      });

      postCards.push(card);
      worldGroup.add(card);
    });

    // ===== DATA STREAMS (post cards to cells) =====
    const streamCount = 150;
    const streamPositions = new Float32Array(streamCount * 3);
    const streamProgress = new Float32Array(streamCount);
    const streamSources = new Float32Array(streamCount);

    for (let i = 0; i < streamCount; i++) {
      streamProgress[i] = Math.random();
      streamSources[i] = Math.floor(Math.random() * postCards.length);
    }

    const streamGeo = new THREE.BufferGeometry();
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    const streamMat = new THREE.PointsMaterial({
      color: 0xFFD4B0,
      size: 0.03,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const streamPts = new THREE.Points(streamGeo, streamMat);
    worldGroup.add(streamPts);

    // ===== AMBIENT PARTICLES =====
    const ambientCount = 140;
    const ambientPositions = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambientPositions[i * 3] = (Math.random() - 0.5) * 16;
      ambientPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      ambientPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    const ambientMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.25,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(ambientGeo, ambientMat));

    // ===== CENTER GLOW =====
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 512;
    glowCanvas.height = 512;
    const glowCtx = glowCanvas.getContext('2d')!;
    const grad = glowCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, 'rgba(255, 180, 162, 0.2)');
    grad.addColorStop(0.4, 'rgba(255, 160, 128, 0.08)');
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
    glowSprite.scale.set(10, 10, 1);
    worldGroup.add(glowSprite);

    // ===== LIGHTING =====
    scene.add(new THREE.PointLight(0xFFA080, 1.5, 20));
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const fill = new THREE.PointLight(0xFFB4A2, 0.5, 15);
    fill.position.set(-3, 3, 5);
    scene.add(fill);

    // ===== MOUSE =====
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ===== ANIMATE =====
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Grid slow rotation
      worldGroup.rotation.y = Math.sin(t * 0.08) * 0.15;
      worldGroup.rotation.x = Math.sin(t * 0.05) * 0.05;

      // Highlighted cell pulse
      highlightedIndices.forEach((idx) => {
        const cell = cells[idx];
        if (!cell) return;
        const mat = cell.material as THREE.MeshPhysicalMaterial;
        mat.opacity = 0.12 + Math.sin(t * 0.8 + idx) * 0.05;
      });

      // Post card float
      postCards.forEach((card) => {
        const data = postDataMap.get(card);
        if (!data) return;
        card.position.y = data.baseY + Math.sin(t * data.floatSpeed + data.floatPhase) * 0.08;
      });

      // Stream particles
      const sPos = streamGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < streamCount; i++) {
        streamProgress[i] += 0.006;
        if (streamProgress[i] > 1) {
          streamProgress[i] = 0;
          streamSources[i] = Math.floor(Math.random() * postCards.length);
        }
        const cardIdx = Math.floor(streamSources[i]);
        const card = postCards[cardIdx];
        const cellIdx = postIndices[cardIdx];
        const cell = cells[cellIdx];
        if (!card || !cell) continue;

        const prog = streamProgress[i];
        const sx = card.position.x;
        const sy = card.position.y;
        const ex = cell.position.x;
        const ey = cell.position.y;
        const mx = (sx + ex) / 2 + Math.sin(i * 0.2) * 0.15;
        const my = (sy + ey) / 2 + Math.sin(prog * Math.PI) * 0.2;

        const inv = 1 - prog;
        sPos.setXYZ(i,
          inv * inv * sx + 2 * inv * prog * mx + prog * prog * ex,
          inv * inv * sy + 2 * inv * prog * my + prog * prog * ey,
          0.15 + Math.sin(i + t) * 0.05
        );
      }
      sPos.needsUpdate = true;

      // Ambient drift
      const aPos = ambientGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < ambientCount; i++) {
        aPos.setY(i, aPos.getY(i) + Math.sin(t * 0.3 + i * 0.5) * 0.0006);
      }
      aPos.needsUpdate = true;

      // Mouse parallax
      const tx = mouseRef.current.x * 0.45;
      const ty = mouseRef.current.y * 0.45;
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
        width: '80vw',
        height: '55vh',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}
