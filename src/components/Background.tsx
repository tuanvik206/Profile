import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

const initParticles = async (engine: Engine) => {
  await loadSlim(engine);
};

export default function Background() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed inset-0 overflow-hidden -z-10 bg-[#08080a]">
      {/* Custom GPU-accelerated CSS for ambient blurs */}
      <style>{`
        @keyframes floatLeft {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(25px, 35px, 0); }
        }
        @keyframes floatRight {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-35px, -25px, 0); }
        }
        .animate-float-left {
          animation: floatLeft 16s ease-in-out infinite;
          will-change: transform;
        }
        .animate-float-right {
          animation: floatRight 20s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      {/* Background gradients using CSS animations */}
      <div className="absolute -top-[100px] -left-[100px] w-[500px] h-[500px] bg-indigo-600/10 rounded-full filter blur-[120px] animate-float-left" />
      <div className="absolute -bottom-[150px] -right-[50px] w-[600px] h-[600px] bg-sky-500/10 rounded-full filter blur-[150px] animate-float-right" />
      
      {/* tsParticles Optimized for Performance */}
      <ParticlesProvider init={initParticles}>
        <Particles
          id="tsparticles"
          options={{
            fullScreen: { enable: false, zIndex: 0 },
            fpsLimit: 60,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: "push",
                },
                onHover: {
                  enable: true,
                  mode: "grab",
                },
              },
              modes: {
                push: { quantity: 2 },
                grab: {
                  distance: 140,
                  links: { opacity: 0.15, color: "#f59e0b" }
                },
              },
            },
            particles: {
              color: { value: "#f59e0b" },
              links: {
                color: "#f59e0b",
                distance: 130,
                enable: true,
                opacity: 0.08,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 0.8,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  width: 800,
                  height: 800
                },
                value: isMobile ? 50 : 120,
              },
              opacity: { value: 0.12 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 2 } },
            },
            detectRetina: false, // Turned off to prevent lag on retina and mobile screens
          }}
          className="absolute inset-0"
        />
      </ParticlesProvider>
    </div>
  );
}
