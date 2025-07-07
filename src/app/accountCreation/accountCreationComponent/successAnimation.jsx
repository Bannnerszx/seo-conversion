"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useAnimationControls } from "framer-motion";

export default function SuccessAnimation() {
  const circleStrokeControls = useAnimationControls();
  const fillCircleControls = useAnimationControls();
  const checkmarkControls = useAnimationControls();
  const rippleControls = useAnimationControls();
  const bounceControls = useAnimationControls();

  const [showParticles, setShowParticles] = useState(false);

  const particles = useMemo(() => generateParticles(30), []);

  function generateParticles(count) {
    return Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 250;

      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 8 + Math.random() * 12,
        rotation: Math.random() * 360,
        duration: 0.8 + Math.random() * 1.2,
        delay: Math.random() * 0.2,
        shape: Math.random() > 0.6 ? "circle" : Math.random() > 0.5 ? "square" : "triangle",
      };
    });
  }

  useEffect(() => {
    runAnimationSequence();
  }, []);

  const runAnimationSequence = async () => {
    await Promise.all([
      circleStrokeControls.set({ strokeDashoffset: 2 * Math.PI * 40 }),
      fillCircleControls.set({ scale: 0 }),
      checkmarkControls.set({ pathLength: 0 }),
      rippleControls.set({ scale: 1, opacity: 1 }),
      bounceControls.set({ scale: 1 }),
    ]);

    await circleStrokeControls.start({
      strokeDashoffset: 0,
      transition: { duration: 0.5, ease: "easeInOut" },
    });

    await fillCircleControls.start({
      scale: 1,
      transition: { duration: 0.3 },
    });

    await bounceControls.start({
      scale: [1, 1.1, 1],
      transition: { duration: 0.18, times: [0, 0.55, 1] },
    });

    await checkmarkControls.start({
      pathLength: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    });

    setShowParticles(true);

    await rippleControls.start({
      scale: 2,
      opacity: 0,
      transition: { duration: 0.8 },
    });
  };

  const renderParticleShape = (particle) => {
    switch (particle.shape) {
      case "square":
        return (
          <rect
            width={particle.size}
            height={particle.size}
            x={-particle.size / 2}
            y={-particle.size / 2}
            fill="#16a34a"
          />
        );
      case "triangle": {
        const size = particle.size * 1.2;
        return (
          <polygon
            points={`0,${-size / 2} ${size / 2},${size / 2} ${-size / 2},${size / 2}`}
            fill="#16a34a"
          />
        );
      }
      case "circle":
      default:
        return <circle r={particle.size / 2} fill="#16a34a" />;
    }
  };

  return (
    <div className="relative w-24 h-24 mx-auto mb-6">
      <motion.div animate={rippleControls} className="absolute inset-0 rounded-full border-2 border-green-600" />

      <div className="relative w-full h-full rounded-full bg-white shadow-md shadow-green-500/30 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute">
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke="#16a34a"
            strokeWidth="3"
            strokeDasharray={2 * Math.PI * 40}
            animate={circleStrokeControls}
            fill="none"
          />
        </svg>

        <motion.div
          className="absolute inset-0 rounded-full bg-green-600 flex items-center justify-center"
          animate={fillCircleControls}
          style={{ scale: 0 }}
        >
          <motion.div animate={bounceControls} className="w-full h-full flex items-center justify-center">
            <svg width="70%" height="70%" viewBox="0 0 100 100">
              <motion.path
                d="M25 50 L45 70 L75 35"
                stroke="#ffffff"
                strokeWidth="8"
                fill="none"
                animate={checkmarkControls}
                initial={{ pathLength: 0 }}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {showParticles && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width="500%"
          height="500%"
          style={{ left: "-200%", top: "-200%" }}
          viewBox="-400 -400 800 800"
        >
          {particles.map((particle) => (
            <motion.g
              key={particle.id}
              initial={{ x: 0, y: 0, opacity: 0.9, scale: 0 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
                scale: 1,
                rotate: particle.rotation,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeOut",
              }}
            >
              {renderParticleShape(particle)}
            </motion.g>
          ))}
        </svg>
      )}
    </div>
  );
}
