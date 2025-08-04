import React, { useRef, useEffect } from 'react';

// Constants for the animation
const PARTICLE_COLOR = 'rgba(79, 70, 229, 0.7)'; // brand-primary with opacity
const LINE_RGB = '150, 150, 150'; // light gray
const PARTICLE_COUNT = 80; // Reduced for performance on lower-end devices
const MAX_LINE_DISTANCE = 130;

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 1; // Slower velocity
    this.vy = (Math.random() - 0.5) * 1;
    this.radius = Math.random() * 1.5 + 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > this.canvasWidth) this.vx *= -1;
    if (this.y < 0 || this.y > this.canvasHeight) this.vy *= -1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = PARTICLE_COLOR;
    ctx.fill();
  }
}

export const PlexusAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        ctx.scale(dpr, dpr);

        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
        
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(new Particle(parent.clientWidth, parent.clientHeight));
        }
      }
    };

    const animate = () => {
      if(!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Animate particles and draw lines between them
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw(ctx);

        // Draw lines to other particles
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
            if (dist < MAX_LINE_DISTANCE) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                const opacity = 1 - dist / MAX_LINE_DISTANCE;
                ctx.strokeStyle = `rgba(${LINE_RGB}, ${opacity * 0.5})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    resizeCanvas();
    animate();
    
    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };

  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 z-0"
    />
  );
};