"use client";

import { useEffect, useRef } from "react";

import type { SkySnapshot } from "@/lib/astronomy/types";

const backgrounds = {
  daylight: [32, 54, 88],
  "civil-twilight": [25, 42, 73],
  "nautical-twilight": [17, 28, 52],
  "astronomical-twilight": [10, 16, 34],
  night: [6, 9, 22],
} as const;

function starColor(colorIndex: number | null) {
  if (colorIndex === null) return "rgb(235 241 255)";
  if (colorIndex < 0) return "rgb(203 225 255)";
  if (colorIndex > 1.25) return "rgb(255 220 176)";
  return "rgb(240 238 224)";
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const amount = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return amount * amount * (3 - 2 * amount);
}

function moonTexture(illuminatedFraction: number, angle: number | null) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const image = context.createImageData(size, size);
  const phaseZ = 2 * illuminatedFraction - 1;
  const phaseXY = Math.sqrt(Math.max(0, 1 - phaseZ * phaseZ));
  const direction = angle ?? 0;
  const lightX = phaseXY * Math.cos(direction);
  const lightY = phaseXY * Math.sin(direction);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const nx = (x + 0.5 - size / 2) / (size / 2 - 1);
    const ny = (y + 0.5 - size / 2) / (size / 2 - 1);
    const radiusSquared = nx * nx + ny * ny;
    const offset = (y * size + x) * 4;
    if (radiusSquared > 1) { image.data[offset + 3] = 0; continue; }
    const radius = Math.sqrt(radiusSquared);
    const nz = Math.sqrt(1 - radiusSquared);
    const lightDot = nx * lightX + ny * lightY + nz * phaseZ;
    const terminator = smoothstep(-0.008, 0.008, lightDot);
    const edge = smoothstep(0, 0.009, 1 - radius);
    const shadow = [28, 34, 54];
    const light = [244, 235, 207];
    image.data[offset] = Math.round(shadow[0] + (light[0] - shadow[0]) * terminator);
    image.data[offset + 1] = Math.round(shadow[1] + (light[1] - shadow[1]) * terminator);
    image.data[offset + 2] = Math.round(shadow[2] + (light[2] - shadow[2]) * terminator);
    image.data[offset + 3] = Math.round(255 * edge);
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export function SkyCanvas({ snapshot, variant }: { snapshot: SkySnapshot; variant: "homepage" | "destination" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const startedAt = performance.now();
      const bounds = canvas.getBoundingClientRect();
      const size = Math.max(1, Math.min(bounds.width, bounds.height));
      if (size <= 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, size, size);
      const center = size / 2;
      const radius = center - (variant === "homepage" ? 7 : 22);
      const [red, green, blue] = backgrounds[snapshot.skyCondition];
      const gradient = context.createRadialGradient(center, center * 0.82, 0, center, center, radius);
      gradient.addColorStop(0, `rgb(${red + 9} ${green + 12} ${blue + 18})`);
      gradient.addColorStop(1, `rgb(${red} ${green} ${blue})`);
      context.beginPath(); context.arc(center, center, radius, 0, Math.PI * 2); context.fillStyle = gradient; context.fill();
      context.save(); context.beginPath(); context.arc(center, center, radius, 0, Math.PI * 2); context.clip();
      for (const star of snapshot.stars) {
        const x = center + star.xNormalized * radius;
        const y = center + star.yNormalized * radius;
        const pointRadius = (variant === "homepage" ? 0.75 : 0.95) * star.radiusFactor;
        context.beginPath(); context.arc(x, y, pointRadius, 0, Math.PI * 2);
        context.globalAlpha = star.opacity; context.fillStyle = starColor(star.colorIndex); context.fill();
      }
      context.globalAlpha = 1;
      if (snapshot.moon.aboveHorizon && snapshot.moon.xNormalized !== null && snapshot.moon.yNormalized !== null) {
        const x = center + snapshot.moon.xNormalized * radius;
        const y = center + snapshot.moon.yNormalized * radius;
        const diameter = variant === "homepage" ? Math.max(34, size * 0.085) : Math.max(38, Math.min(58, size * 0.09));
        context.save(); context.shadowColor = "rgb(233 196 106 / 32%)"; context.shadowBlur = diameter * 0.48;
        context.fillStyle = "rgb(244 235 207 / 24%)"; context.beginPath(); context.arc(x, y, diameter * 0.43, 0, Math.PI * 2); context.fill(); context.restore();
        const texture = moonTexture(snapshot.moon.illuminatedFraction, snapshot.moon.brightLimbScreenAngleRad);
        context.save(); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
        context.drawImage(texture, x - diameter / 2, y - diameter / 2, diameter, diameter); context.restore();
      }
      context.restore();
      context.strokeStyle = "rgb(142 197 255 / 32%)"; context.lineWidth = 1; context.beginPath(); context.arc(center, center, radius, 0, Math.PI * 2); context.stroke();
      if (variant === "destination") {
        context.fillStyle = "rgb(170 184 212)"; context.font = "11px ui-monospace, monospace"; context.textAlign = "center";
        context.fillText("N", center, 13); context.fillText("S", center, size - 5); context.textAlign = "left"; context.fillText("E", 5, center + 4); context.textAlign = "right"; context.fillText("W", size - 5, center + 4);
      }
      canvas.dataset.redrawMs = (performance.now() - startedAt).toFixed(2);
    };
    draw();
    const observer = new ResizeObserver(() => requestAnimationFrame(draw));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [snapshot, variant]);
  return <canvas className="sky-canvas" ref={ref} aria-hidden="true" />;
}
