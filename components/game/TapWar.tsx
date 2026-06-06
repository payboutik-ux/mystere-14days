'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameWrapper from './GameWrapper'
import { createClient } from '@/lib/supabase/client'

const ROUND = 30

export default function TapWar({
  challengeDay, profile, mySubmission: initialMy,
  submissions: initialSubs, windowOpen,
}: any) {
  const [tapCount, setTapCount] = useState(initialMy?.tap_count || 0)
  const [phase, setPhase] = useState(initialMy ? 'done' : 'ready')
  const [timeLeft, setTimeLeft] = useState(ROUND)
  const [leaderboard, setLeaderboard] = useState(initialSubs)
  const [burst, setBurst] = useState(false)
  const countRef = useRef(0)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`tap-${challengeDay.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'submissions',
        filter: `challenge_day_id=eq.${challengeDay.id}`,
      }, async () => {
        const { data } = await supabase
          .from('submissions')
          .select('*, profiles(username, avatar_url)')
          .eq('challenge_day_id', challengeDay.id)
          .order('tap_count', { ascending: false })
          .limit(20)
        if (data) setLeaderboard(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [challengeDay.id])

  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          setPhase('done')
          setTapCount(countRef.current)
          if (profile) {
            supabase.from('submissions').upsert({
              user_id: profile.id,
              challenge_day_id: challengeDay.id,
              tap_count: countRef.current,
              vote_count: 0, is_winner: false, is_moderated: false,
              hold_duration_ms: 0, points_earned: 0,
              team: null, content: null, file_url: null, rank: null,
            })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const startGame = () => {
    if (!windowOpen || initialMy) return
    countRef.current = 0
    setTapCount(0)
    setTimeLeft(ROUND)
    setPhase('playing')
  }

  const handleTap = (e: React.PointerEvent) => {
    e.preventDefault()
    if (phase !== 'playing') return
    countRef.current += 1
    setTapCount(countRef.current)
    setBurst(true)
    setTimeout(() => setBurst(false), 80)
  }

  return (
    <GameWrapper
      type={challengeDay.challenge_type}
      dayNumber={challengeDay.day_number}
      windowOpen={windowOpen}
    >
      {windowOpen && phase !== 'done' && !initialMy && (
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 text-center">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-2">
              Taps
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={tapCount}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-mono text-7xl font-extrabold text-orange-400"
              >
                {tapCount}
              </motion.div>
            </AnimatePresence>
          </div>

          {phase === 'playing' && (
            <div className="w-full max-w-xs mb-6">
              <div className="flex justify-between text-xs text-white/30 mb-1">
                <span>⏱</span>
                <span className="font-mono font-bold text-white">
                  {timeLeft}s
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  style={{ width: `${((ROUND - timeLeft) / ROUND) * 100}%` }}
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                />
              </div>
            </div>
          )}

          {phase === 'ready' ? (
            <motion.button
              onClick={startGame}
              whileTap={{ scale: 0.95 }}
              className="w-44 h-44 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-display font-extrabold text-2xl flex flex-col items-center justify-center gap-1 shadow-[0_0_40px_rgba(249,115,22,0.4)]"
            >
              <span>💥</span>
              <span>DÉMARRE</span>
            </motion.button>
          ) : (
            <div className="relative">
              {burst && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  className="absolute inset-0 rounded-full bg-orange-400/40 pointer-events-none"
                />
              )}
              <motion.button
                onPointerDown={handleTap}
                className="w-52 h-52 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-display font-extrabold text-3xl flex flex-col items-center justify-center gap-1 select-none touch-none active:scale-90 transition-transform shadow-[0_0_40px_rgba(249,115,22,0.4)]"
              >
                <span>💥</span>
                <span>TAP !</span>
              </motion.button>
            </div>
          )}
        </div>
      )}

      {(phase === 'done' || initialMy) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-6 text-center mb-6"
        >
          <div className="text-4xl mb-2">💥</div>
          <p className="font-display font-bold text-2xl text-orange-400">
            {initialMy?.tap_count || tapCount} taps !
          </p>
        </motion.div>
      )}

      <h2 className="font-display font-bold text-sm text-white/40 uppercase tracking-wider mb-3">
        Classement Tap War 💥
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
                {entry.tap_count} taps
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">
            <div className="text-3xl mb-2">💥</div>
            Aucun participant encore
          </div>
        )}
      </div>
    </GameWrapper>
  )
}
