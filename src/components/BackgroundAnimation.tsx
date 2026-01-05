import { useEffect, useRef } from 'react';

const BackgroundAnimation = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const particles: Particle[] = [];
        const particleCount = Math.min(Math.floor(width * height / 15000), 100); // Responsive count
        const connectionDistance = 150;
        const mouseDistance = 200;

        const mouse = { x: 0, y: 0 };
        let isMouseMoving = false;
        let mouseTimeout: NodeJS.Timeout;

        // Handle Resize
        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // Handle Mouse Move
        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            isMouseMoving = true;

            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => {
                isMouseMoving = false;
            }, 2000);
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Particle Class
        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
                // Use the primary theme color (warm coral/rose) roughly hsl(8, 76%, 65%) -> rgb(233, 114, 96)
                // We'll use a dynamic rgba for fading
                this.color = `233, 114, 96`;
            }

            update() {
                // Move
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse interaction
                if (isMouseMoving) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouseDistance - distance) / mouseDistance;

                        // Gently push away
                        const directionX = forceDirectionX * force * 2;
                        const directionY = forceDirectionY * force * 2;

                        this.x -= directionX;
                        this.y -= directionY;
                    }
                }
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, 0.5)`;
                ctx.fill();
            }
        }

        // Initialize Particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Animation Loop
        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            // Update and Draw Particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw Connections
            connectParticles();

            requestAnimationFrame(animate);
        };

        const connectParticles = () => {
            if (!ctx) return;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y; // Fix: was using b both times
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        const opacity = 1 - (distance / connectionDistance);
                        ctx.strokeStyle = `rgba(233, 114, 96, ${opacity * 0.2})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(mouseTimeout);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                background: 'transparent' // Let the CSS background show through
            }}
        />
    );
};

export default BackgroundAnimation;
