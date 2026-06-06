'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getBadgeForScore, getChallengeConfig, isWindowOpen } from '@/lib/game-logic'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [challengeDay, setChallengeDay] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const windowOpen = isWindowOpen()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: p }, { data: s }, { data: cd }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('scores').select('*').eq('user_id', user.id),
        supabase.from('challenge_days')
          .select('*')
          .in('status', ['active', 'results'])
          .order('day_number', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setProfile(p)
      setScores(s || [])
      setChallengeDay(cd)
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-float">⚡</div>
      </div>
    )
  }

  const totalScore = profile?.total_score || 0
  const badge = getBadgeForScore(totalScore)
  const challengeInfo = challengeDay
    ? getChallengeConfig(challengeDay.challenge_type)
    : null

  return (
    <div className="min-h-screen px-4 pt-8 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/40 text-sm">Bonjour 👋</p>
          <h1 className="font-display text-2xl font-bold">
            {profile?.username || 'Joueur'}
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-white/20 text-sm hover:text-white/40"
        >
          Déco
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 mb-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider">
                Score Total
              </p>
              <p className="font-display text-5xl font-extrabold gradient-text">
                {totalScore}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-1">{badge.icon}</div>
              <p
                className="font-display font-bold text-sm"
                style={{ color: badge.color }}
              >
                {badge.label}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rang', value: rank ? `#${rank}` : '—', icon: '🏆' },
              { label: 'Victoires', value: profile?.wins || 0, icon: '⚡' },
              { label: 'Jours joués', value: scores.length, icon: '🎮' },
            ].map(stat => (
              <div
                key={stat.label}
                className="bg-white/5 rounded-2xl p-3 text-center"
              >
                <div className="text-lg mb-1">{stat.icon}</div>
                <p className="font-display font-bold text-lg text-white">
                  {stat.value}
                </p>
                <p className="text-white/30 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {(profile?.streak || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-2xl p-4 mb-4 flex items-center gap-3"
        >
          <div className="text-2xl">🔥</div>
          <div>
            <p className="font-display font-bold">
              {profile?.streak} jours de suite !
            </p>
            <p className="text-white/40 text-xs">Continue ta série</p>
          </div>
        </motion.div>
      )}

      <h2 className="font-display font-bold text-sm text-white/40 uppercase tracking-wider mb-3">
        Défi du jour
      </h2>

      {challengeDay && challengeInfo ? (
        <Link href="/challenge">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-3xl p-5 relative overflow-hidden border ${
              windowOpen ? 'border-purple-500/30' : 'border-white/5'
            }`}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(135deg, ${challengeInfo.color}, transparent)`,
              }}
            />
            <div className="relative flex items-center gap-4">
              <div className="text-4xl">{challengeInfo.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-white/30">
                    Jour {challengeDay.day_number}
                  </span>
                  {windowOpen ? (
                    <span className="text-xs text-green-400 bg-green-500/10 rounded-full px-2 py-0.5">
                      EN COURS
                    </span>
                  ) : (
                    <span className="text-xs text-white/30 bg-white/5 rounded-full px-2 py-0.5">
                      FERMÉ
                    </span>
                  )}
                </div>
                <p className="font-display font-bold text-white">
                  {challengeInfo.title}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {challengeInfo.description}
                </p>
              </div>
              <div className="text-white/20 text-xl">→</div>
            </div>
          </motion.div>
        </Link>
      ) : (
        <div className="glass rounded-3xl p-5 text-center text-white/30">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-sm">Aucun défi actif pour le moment</p>
          <p className="text-xs mt-1">Reviens à 20h00 !</p>
        </div>
      )}
    </div>
  )
}
