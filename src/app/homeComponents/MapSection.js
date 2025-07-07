'use client'

import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

// Dynamically load only motion.div when this component mounts
const MotionDiv = dynamic(
  () => import('framer-motion').then(mod => mod.motion.div),
  { ssr: false }
)

export default function WorldMapSection() {
  return (
    <section className="relative min-h-[600px] mx-auto max-w-7xl overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Background Map */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url('/world.webp')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          {/* Header */}
          <div className="flex items-center gap-3 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Local Introduction
            </h2>
            <MotionDiv
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            >
              <MapPin className="h-8 w-8 text-purple-500" />
            </MotionDiv>
          </div>

          {/* Description */}
          <p className="max-w-2xl text-center text-lg text-gray-600">
            Your trusted partner in the Japanese automotive market, providing global solutions with local expertise.
          </p>

          {/* Company Name */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <h1 className="text-5xl font-bold tracking-wider text-purple-900 sm:text-7xl">
              REAL MOTOR JAPAN
            </h1>
          </MotionDiv>

          {/* Optional Stats or Features */}
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { number: '50+', label: 'Countries Served' },
              { number: '1000+', label: 'Vehicles Exported' },
              { number: '24/7', label: 'Support Available' },
            ].map((stat, i) => (
              <MotionDiv
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <div className="text-3xl font-bold text-purple-600">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </MotionDiv>
            ))}
          </div>
        </MotionDiv>
      </div>
    </section>
  )
}
