'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function getCountdown() {
  const now = new Date()
  const next = new Date()
  const h = now.getHours()
  if (h >= 20) {
    next.setDate(next.getDate() + 1)
  }
  next.setHours(h >= 20 || h < 2 ? 2 : 20, 0, 0, 0)
  const diff = next.getTime() - now.getTime()
  const s = Math.floor(diff / 1000)
  return {
    hours: Math.floor(s / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

export default function HomePage() {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const id = setInterval(() => setTime(getCountdown()), 1000)
    setTime(getCountdown())
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-5">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl blob" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-pink-600/8 rounded-full blur-3xl blob" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-purple-500/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-purple-300 tracking-wider uppercase">
            Saison 1 — En Cours
          </span>
        </div>

        <h1 className="font-display text-6xl font-extrabold leading-none mb-4">
          <span className="block text-white">14 JOURS</span>
          <span className="block gradient-text">MYSTÈRE</span>
        </h1>

        <p className="text-white/50 text-lg max-w-xs mx-auto mt-6 mb-10">
          Chaque soir à <strong className="text-purple-400">20h00</strong>, un
          nouveau défi t&apos;attend. Seul le plus fort survivra.
        </p>

        <div className="glass rounded-3xl px-8 py-6 inline-block mb-10">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
            Prochain défi dans
          </p>
          <div className="font-mono text-3xl font-bold flex items-center gap-1">
            <span className="text-purple-400">{pad(time.hours)}</span>
            <span className="text-white/20">:</span>
            <span className="text-pink-400">{pad(time.minutes)}</span>
            <span className="text-white/20">:</span>
            <span className="text-orange-400">{pad(time.seconds)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/register">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white"
            >
              🚀 Rejoindre le défi
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-display font-bold text-lg glass border border-white/10 text-white/80"
            >
              Connexion
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
