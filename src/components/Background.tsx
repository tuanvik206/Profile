import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { motion } from "motion/react";
import type { Engine } from "@tsparticles/engine";

const initParticles = async (engine: Engine) => {
  await loadSlim(engine);
};

export default function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden -z-10 bg-[#08080a]">
      {/* Background gradients */}
      <motion.div
        className="absolute -top-[100px] -left-[100px] w-[500px] h-[500px] bg-indigo-600/10 rounded-full filter blur-[120px]"
        animate={{
          x: [0, 20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-[150px] -right-[50px] w-[600px] h-[600px] bg-sky-500/10 rounded-full filter blur-[150px]"
        animate={{
          x: [0, -30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* tsParticles */}
      <ParticlesProvider init={initParticles}>
        <Particles
          id="tsparticles"
          options={{
            fullScreen: { enable: false, zIndex: 0 },
            fpsLimit: 120,
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
                push: { quantity: 4 },
                grab: {
                  distance: 180,
                  links: { opacity: 0.2, color: "#f59e0b" }
                },
              },
            },
            particles: {
              color: { value: "#f59e0b" },
              links: {
                color: "#f59e0b",
                distance: 150,
                enable: true,
                opacity: 0.1,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 1,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  width: 800,
                  height: 800
                },
                value: 100,
              },
              opacity: { value: 0.15 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 2 } },
            },
            detectRetina: true,
          }}
          className="absolute inset-0"
        />
      </ParticlesProvider>
    </div>
  );
}
