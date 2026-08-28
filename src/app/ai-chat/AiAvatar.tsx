"use client";

import React from "react";
import { useRef, useCallback } from "react";

interface AiAvatarProps {
  size?: number;       // px, defaults to 28 — small enough for a chat top-bar
  interactive?: boolean; // set false to disable tilt/click burst (e.g. in lists)
}

export default function AiAvatar({ size = 28, interactive = true }: AiAvatarProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<SVGGElement>(null);
  const figureRef = useRef<SVGGElement>(null);
  const burstLayerRef = useRef<SVGGElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ticking = useRef(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive || ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect && tiltRef.current) {
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        const rotate = nx * 10;
        const skew = ny * 6;
        tiltRef.current.setAttribute("transform", `rotate(${rotate} 100 100) skewX(${-skew})`);
      }
      ticking.current = false;
    });
  }, [interactive]);

  const handleMouseLeave = useCallback(() => {
    if (tiltRef.current) tiltRef.current.setAttribute("transform", "rotate(0 100 100) skewX(0)");
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    const figure = figureRef.current;
    const svg = svgRef.current;
    const burstLayer = burstLayerRef.current;
    if (!figure || !svg || !burstLayer) return;

    figure.classList.remove("jump");
    void figure.getBoundingClientRect(); // restart animation
    figure.classList.add("jump");

    const rect = svg.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 200;
    const cy = ((e.clientY - rect.top) / rect.height) * 200;

    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const dist = 30 + Math.random() * 20;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      const p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      p.setAttribute("cx", String(cx));
      p.setAttribute("cy", String(cy));
      p.setAttribute("r", String(3 + Math.random() * 2));
      p.classList.add("burst");
      p.style.setProperty("--dx", `${dx}px`);
      p.style.setProperty("--dy", `${dy}px`);
      burstLayer.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }, [interactive]);

  return (
    <div
      ref={wrapRef}
      className="logo-wrap"
      style={{ width: size, height: size, display: "inline-block", flexShrink: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <svg ref={svgRef} className="logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g ref={tiltRef} id="tiltGroup">
          <g ref={figureRef} className="logo-figure">
            <circle className="logo-glow" cx="100" cy="60" r="30" />
            <circle className="logo-head" cx="100" cy="60" r="24" fill="#14b8b0" />
            <path
              d="M 96 100 C 68 98, 44 112, 46 145 C 47 165, 62 180, 78 182 C 84 183, 86 177, 82 172 C 70 158, 66 140, 78 126 C 86 117, 98 114, 110 112 Z"
              fill="#14b8b0"
            />
            <path
              className="logo-arm"
              d="M 110 112 C 98 114, 86 117, 78 126 C 90 122, 104 118, 118 108 C 132 98, 144 88, 156 78 C 160 75, 165 79, 162 84 C 150 100, 134 112, 118 120 C 112 123, 104 121, 100 116 C 98 113, 102 109, 110 112 Z"
              fill="#14b8b0"
            />
          </g>
        </g>
        <g ref={burstLayerRef} id="burstLayer" />
      </svg>
    </div>
  );
}