'use client'

import { motion } from 'framer-motion'
import { getChallengeConfig } from '@/lib/game-logic'

interface Props {
  type: string
  dayNumber: number
  windowOpen: boolean
  children: React.ReactNode
}

export default function GameWrapper({
  type,
  dayNumber,
  windowOpen,
  children,
}: Props) {
  const config = getChallengeConfig(type)

  return (
    <div className="min-h-screen px-4 pt-8 pb-4 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-mono text-white/30">
            JOUR {dayNumber} / 14
          </span>
          {windowOpen ? (
            <span className="text-xs text-green-400 bg-green-500/10 rounded-full px-2 py-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              EN COURS
            </span>
          ) : (
            <span className="text-xs text-white/30 bg-white/5 rounded-full px-2 py-0.5">
              FERMÉ
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.emoji}</span>
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              {config.title}
            </h1>
            <p className="text-white/40 text-xs">{config.description}</p>
          </div>
        </div>

        <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(dayNumber / 14) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${config.color}, ${config.color}88)`,
            }}
          />
        </div>
      </motion.div>

      {children}

      {!windowOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center"
        >
          <p className="text-orange-400 text-sm">
            ⏰ Défi fermé — Résultats disponibles
          </p>
        </motion.div>
      )}
    </div>
  )
}
