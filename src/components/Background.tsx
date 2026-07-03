import { useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";
import { getDeviceTier, PARTICLE_CONFIG } from "../lib/performance";

const initParticles = async (engine: Engine) => {
  await loadSlim(engine);
};

export default function Background() {
  const tier = getDeviceTier();
  const cfg = PARTICLE_CONFIG[tier];

  const particleOptions = useMemo(() => ({
    fullScreen: { enable: false, zIndex: 0 },
    fpsLimit: cfg.fpsLimit,
    interactivity: {
      events: {
        onClick: { enable: cfg.hover, mode: "push" },
        onHover: { enable: cfg.hover, mode: "grab" },
      },
      modes: {
        push: { quantity: 1 },
        grab: { distance: 140, links: { opacity: 0.15, color: "#f59e0b" } },
      },
    },
    particles: {
      color: { value: "#f59e0b" },
      links: {
        color: "#f59e0b",
        distance: 130,
        enable: cfg.links,
        opacity: 0.07,
        width: 1,
      },
      move: {
        direction: "none" as const,
        enable: cfg.count > 0,
        outModes: { default: "bounce" as const },
        random: false,
        speed: tier === 3 ? 0.8 : 0.5,
        straight: false,
      },
      number: {
        density: { enable: true, width: 800, height: 800 },
        value: cfg.count,
      },
      opacity: { value: tier === 3 ? 0.12 : 0.08 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: tier === 3 ? 2 : 1.5 } },
    },
    detectRetina: false,
  }), [tier, cfg]);

  return (
    <div className="fixed inset-0 overflow-hidden -z-10 bg-[#08080a]">
      {/* CSS ambient blurs — always show but simpler on weak devices */}
      {tier >= 2 && (
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
            animation: floatLeft ${tier === 3 ? '16s' : '24s'} ease-in-out infinite;
            will-change: transform;
          }
          .animate-float-right {
            animation: floatRight ${tier === 3 ? '20s' : '30s'} ease-in-out infinite;
            will-change: transform;
          }
        `}</style>
      )}

      {/* Gradient blobs — tier 1 gets static (no animation), tier 2+ animated */}
      <div
        className={`absolute -top-[100px] -left-[100px] w-[500px] h-[500px] bg-indigo-600/10 rounded-full filter blur-[120px] ${tier >= 2 ? 'animate-float-left' : ''}`}
      />
      <div
        className={`absolute -bottom-[150px] -right-[50px] w-[600px] h-[600px] bg-sky-500/10 rounded-full filter blur-[150px] ${tier >= 2 ? 'animate-float-right' : ''}`}
      />

      {/* Particles — only on tier 2+ (tier 1 = no particles = best perf) */}
      {cfg.count > 0 && (
        <ParticlesProvider init={initParticles}>
          <Particles
            id="tsparticles"
            options={particleOptions}
            className="absolute inset-0"
          />
        </ParticlesProvider>
      )}
    </div>
  );
}
