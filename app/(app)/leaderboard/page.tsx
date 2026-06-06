'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getBadgeForScore } from '@/lib/game-logic'

export default function LeaderboardPage() {
  const [board, setBoard] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, total_score, wins, streak')
        .order('total_score', { ascending: false })
        .limit(50)

      setBoard(data || [])
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
      }, async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, total_score, wins, streak')
          .order('total_score', { ascending: false })
          .limit(50)
        if (data) setBoard(data)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-float">🏆</div>
      </div>
    )
  }

  const top3 = board.slice(0, 3)
  const rest = board.slice(3)

  return (
    <div className="min-h-screen px-4 pt-8 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Classement 🏆</h1>
          <p className="text-white/40 text-sm">Scores en direct</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Live</span>
        </div>
      </div>

      {top3.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-center gap-3 mb-8"
        >
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            const pos = [2, 1, 3][i]
            const heights = ['h-16', 'h-24', 'h-10']
            const colors = [
              'from-gray-400 to-gray-600',
              'from-yellow-400 to-orange-500',
              'from-orange-700 to-amber-800',
            ]
            return (
              <div key={entry.id} className="flex flex-col items-center flex-1">
                {pos === 1 && (
                  <div className="text-2xl mb-1 animate-float">👑</div>
                )}
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[i]} flex items-center justify-center font-bold text-white border-2 border-white/20 mb-2`}
                >
                  {entry.username[0].toUpperCase()}
                </div>
                <p className="text-xs font-medium text-white/70 truncate w-full text-center">
                  {entry.username}
                </p>
                <p
                  className={`text-xs font-mono font-bold ${
                    pos === 1 ? 'text-yellow-400' : 'text-white/40'
                  }`}
                >
                  {entry.total_score}pts
                </p>
                <div
                  className={`w-full ${heights[i]} bg-white/10 rounded-t-xl mt-2 flex items-center justify-center`}
                >
                  <span className="font-display font-bold text-white/40">
                    {pos}
                  </span>
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {rest.map((entry, i) => {
            const isMe = entry.id === currentUserId
            const badge = getBadgeForScore(entry.total_score)
            const rank = i + 4
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass rounded-2xl p-3 flex items-center gap-3 ${
                  isMe ? 'border border-purple-500/30' : ''
                }`}
              >
                <div className="w-8 text-center font-mono text-sm text-white/30">
                  #{rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/50 to-pink-600/50 flex items-center justify-center font-bold">
                  {entry.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">
                    {entry.username}
                    {isMe && (
                      <span className="text-purple-400 text-xs ml-1">
                        ← Toi
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.streak > 0 && (
                      <span className="text-xs text-orange-400">
                        🔥{entry.streak}
                      </span>
                    )}
                    <span className="text-xs text-white/30">
                      {entry.wins}V
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm text-white">
                    {entry.total_score}
                  </p>
                  <p className="text-xs" style={{ color: badge.color }}>
                    {badge.icon}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {board.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <div className="text-4xl mb-3">🏆</div>
          
