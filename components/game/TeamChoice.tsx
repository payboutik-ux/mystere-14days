'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import GameWrapper from './GameWrapper'
import { createClient } from '@/lib/supabase/client'

export default function TeamChoice({
  challengeDay, profile, mySubmission: initialMy,
  submissions: initialSubs, windowOpen,
}: any) {
  const [myTeam, setMyTeam] = useState(initialMy?.team || null)
  const [counts, setCounts] = useState({ messi: 0, ronaldo: 0 })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const calc = (subs: any[]) => setCounts({
      messi: subs.filter(s => s.team === 'messi').length,
      ronaldo: subs.filter(s => s.team === 'ronaldo').length,
    })
    calc(initialSubs)

    const channel = supabase
      .channel(`team-${challengeDay.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'submissions',
        filter: `challenge_day_id=eq.${challengeDay.id}`,
      }, async () => {
        const { data } = await supabase
          .from('submissions')
          .select('team')
          .eq('challenge_day_id', challengeDay.id)
        if (data) calc(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [challengeDay.id, initialSubs])

  const pickTeam = async (team: string) => {
    if (!windowOpen || myTeam || !profile || loading) return
    setLoading(true)
    setMyTeam(team)
    await supabase.from('submissions').upsert({
      user_id: profile.id,
      challenge_day_id: challengeDay.id,
      team,
      vote_count: 0, is_winner: false, is_moderated: false,
      tap_count: 0, hold_duration_ms: 0, points_earned: 0,
      content: null, file_url: null, rank: null,
    })
    setCounts(prev => ({ ...prev, [team]: prev[team as keyof typeof prev] + 1 }))
    setLoading(false)
  }

  const total = counts.messi + counts.ronaldo
  const messiPct = total > 0 ? Math.round((counts.messi / total) * 100) : 50
  const ronaldoPct = 100 - messiPct

  return (
    <GameWrapper
      type={challengeDay.challenge_type}
      dayNumber={challengeDay.day_number}
      windowOpen={windowOpen}
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-4xl font-extrabold gradient-text-gold mb-1">
            MESSI vs RONALDO
          </h2>
          <p className="text-white/40 text-sm">
            Choisis ton camp — les gagnants empochent les points
          </p>
        </motion.div>

        {!myTeam && windowOpen ? (
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
            <motion.button
              onClick={() => pickTeam('messi')}
              whileTap={{ scale: 0.95 }}
              className="aspect-square rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 flex flex-col items-center justify-center gap-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
            >
              <span className="text-5xl">🔵</span>
              <span className="font-display font-extrabold text-xl text-white">
                MESSI
              </span>
              <span className="text-white/50 text-xs">
                {counts.messi} joueurs
              </span>
            </motion.button>

            <motion.button
              onClick={() => pickTeam('ronaldo')}
              whileTap={{ scale: 0.95 }}
              className="aspect-square rounded-3xl bg-gradient-to-br from-red-600 to-rose-500 flex flex-col items-center justify-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            >
              <span className="text-5xl">🔴</span>
              <span className="font-display font-extrabold text-xl text-white">
                RONALDO
              </span>
              <span className="text-white/50 text-xs">
                {counts.ronaldo} joueurs
              </span>
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-3xl p-6 text-center mb-8 w-full max-w-xs"
          >
            <div className="text-5xl mb-2">
              {myTeam === 'messi' ? '🔵' : '🔴'}
            </div>
            <p className="font-display font-bold text-xl text-white">
              Team {myTeam === 'messi' ? 'Messi' : 'Ronaldo'} !
            </p>
            <p className="text-white/40 text-sm mt-1">
              Tu es dans le camp {myTeam === 'messi' ? 'bleu' : 'rouge'}
            </p>
          </motion.div>
        )}

        <div className="w-full max-w-sm mb-4">
          <div className="flex justify-between text-xs text-white/40 mb-2">
            <span className="text-blue-400 font-bold">
              {counts.messi} 🔵 Messi
            </span>
            <span className="text-red-400 font-bold">
              Ronaldo 🔴 {counts.ronaldo}
            </span>
          </div>
          <div className="h-4 rounded-full overflow-hidden flex">
            <motion.div
              animate={{ width: `${messiPct}%` }}
              transition={{ type: 'spring', damping: 20 }}
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500"
            />
            <motion.div
              animate={{ width: `${ronaldoPct}%` }}
              transition={{ type: 'spring', damping: 20 }}
              className="h-full bg-gradient-to-r from-rose-500 to-red-600"
            />
          </div>
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>{messiPct}%</span>
            <span className="font-mono font-bold text-white">
              {total} joueurs
            </span>
            <span>{ronaldoPct}%</span>
          </div>
        </div>

        <p className="text-white/30 text-xs text-center">
          Le camp avec le plus de membres gagne 🏆
        </p>
      </div>
    </GameWrapper>
  )
}
