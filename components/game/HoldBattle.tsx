'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameWrapper from './GameWrapper'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/game-logic'

export default function HoldBattle({
  challengeDay, profile, mySubmission: initialMy,
  submissions: initialSubs, windowOpen,
}: any) {
  const [isHolding, setIsHolding] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [best, setBest] = useState(initialMy?.hold_duration_ms || 0)
  const [phase, setPhase] = useState(initialMy ? 'done' : 'ready')
  const [leaderboard, setLeaderboard] = useState(initialSubs)
  const startRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`hold-${challengeDay.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'submissions',
        filter: `challenge_day_id=eq.${challengeDay.id}`,
      }, async () => {
        const { data } = await supabase
          .from('submissions')
          .select('*, profiles(username, avatar_url)')
          .eq('challenge_day_id', challengeDay.id)
          .order('hold_duration_ms', { ascending: false })
          .limit(20)
        if (data) setLeaderboard(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [challengeDay.id])

  const tick = useCallback(() => {
    setElapsed(Date.now() - startRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const startHold = () => {
    if (!windowOpen || phase === 'done') return
    setIsHolding(true)
    setPhase('holding')
    startRef.current = Date.now()
    rafRef.current = requestAnimationFrame(tick)
  }

  const stopHold = async () => {
    if (!isHolding) return
    cancelAnimationFrame(rafRef.current)
    const duration = Date.now() - startRef.current
    setIsHolding(false)
    setPhase('done')
    if (duration > best) {
      setBest(duration)
      if (profile) {
        await supabase.from('submissions').upsert({
          user_id: profile.id,
          challenge_day_id: challengeDay.id,
          hold_duration_ms: duration,
          vote_count: 0, is_winner: false, is_moderated: false,
          tap_count: 0, points_earned: 0,
          team: null, content: null, file_url: null, rank: null,
        })
      }
    }
  }

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <GameWrapper
      type={challengeDay.challenge_type}
      dayNumber={challengeDay.day_number}
      windowOpen={windowOpen}
    >
      {windowOpen && (
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6 text-center">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
              Temps tenu
            </p>
            <div className="font-mono text-6xl font-extrabold">
              {isHolding ? (
                <span className="text-red-400">
                  {(elapsed / 1000).toFixed(2)}s
                </span>
              ) : (
                <span className={phase === 'done' ? 'text-orange-400' : 'text-white/20'}>
                  {phase === 'done'
                    ? `${(best / 1000).toFixed(2)}s`
                    : '0.00s'}
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            {isHolding && (
              <div className="absolute inset-0 rounded-full animate-ping bg-red-500/30 scale-150" />
            )}
            <motion.button
              onPointerDown={e => { e.preventDefault(); startHold() }}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              disabled={phase === 'done' || !windowOpen}
              whileTap={{ scale: 0.95 }}
              className={`w-48 h-48 rounded-full font-display font-extrabold text-xl select-none touch-none flex flex-col items-center justify-center gap-2 transition-all ${
                isHolding
                  ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-[0_0_60px_rgba(239,68,68,0.6)]'
                  : phase === 'done'
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white/50'
                    : 'bg-gradient-to-br from-red-500 to-orange-500 text-white'
              }`}
            >
              <span className="text-3xl">🔥</span>
              <span>
                {phase === 'ready' && 'APPUIE !'}
                {phase === 'holding' && 'TIENS !'}
                {phase === 'done' && 'Envoyé ✓'}
              </span>
            </motion.button>
          </div>

          {phase === 'done' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-white/60 text-sm text-center"
            >
              Ton meilleur :{' '}
              <strong className="text-orange-400">
                {formatDuration(best)}
              </strong>
            </motion.p>
          )}
        </div>
      )}

      <h2 className="font-display font-bold text-sm text-white/40 uppercase tracking-wider mb-3">
        Classement live 🔥
      </h2>
      <div className="space-y-2">
        <AnimatePresence>
          {leaderboard.map((entry: any, i: number) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`glass rounded-2xl p-3 flex items-center gap-3 ${
                entry.user_id === profile?.id
                  ? 'border border-orange-500/30'
                  : ''
              }`}
            >
              <span className="text-lg w-8 text-center">
                {['🥇', '🥈', '🥉'][i] || `#${i + 1}`}
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm text-white">
                  {entry.profiles?.username}
                  {entry.user_id === profile?.id && (
                    <span className="text-orange-400 text-xs ml-1">← Toi</span>
                  )}
                </p>
              </div>
              <span className="font-mono font-bold text-orange-400">
                {formatDuration(entry.hold_duration_ms)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">
            <div className="text-3xl mb-2">👆</div>
            Sois le premier à tenir !
          </div>
        )}
      </div>
    </GameWrapper>
  )
}
