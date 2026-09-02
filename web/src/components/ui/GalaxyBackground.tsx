'use client';

import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with easing
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Generate stars with depth and soft colors
    const STAR_COUNT = Math.min(Math.floor((width * height) / 8000), 180);
    const colors = ['#93c5fd', '#c084fc', '#67e8f9', '#f1f5f9', '#e0e7ff'];
    const stars: Star[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2, // Depth factor for parallax
        size: Math.random() * 1.6 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Parallax offset based on mouse deviation from center
      const offsetX = (mouse.x - width / 2) * 0.025;
      const offsetY = (mouse.y - height / 2) * 0.025;

      // Deep Black Canvas Clear
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Draw faint reactive galactic nebula glow centered near mouse
      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        Math.max(width, height) * 0.45
      );
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.07)');
      gradient.addColorStop(0.3, 'rgba(147, 51, 234, 0.04)');
      gradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.015)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw stars with subtle parallax and twinkling
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Shift star based on its depth
        let sx = star.x + offsetX * star.z * 1.5;
        let sy = star.y + offsetY * star.z * 1.5;

        // Wrap around screen boundaries
        if (sx < 0) sx += width;
        if (sx > width) sx -= width;
        if (sy < 0) sy += height;
        if (sy > height) sy -= height;

        // Calculate twinkling alpha
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase);
        const alpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle * 0.25));

        ctx.beginPath();
        ctx.arc(sx, sy, star.size * star.z, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.size > 1.2 ? 6 : 0;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90 transition-opacity duration-1000"
      style={{ background: '#000000' }}
    />
  );
}
