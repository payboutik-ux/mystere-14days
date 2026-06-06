'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  isWindowOpen,
  getTimeUntilNextOpen,
  padZero,
  getChallengeConfig,
} from '@/lib/game-logic'
import PhotoArena from '@/components/game/PhotoArena'
import HoldBattle from '@/components/game/HoldBattle'
import TapWar from '@/components/game/TapWar'
import TeamChoice from '@/components/game/TeamChoice'

function Countdown() {
  const [t, setT] = useState(getTimeUntilNextOpen())
  useEffect(() => {
    const id = setInterval(() => setT(getTimeUntilNextOpen()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="glass rounded-3xl px-8 py-6 inline-block text-center">
      <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
        Prochain défi dans
      </p>
      <div className="font-mono text-3xl font-bold flex items-center gap-1">
        <span className="text-purple-400">{padZero(t.hours)}</span>
        <span className="text-white/20">:</span>
        <span className="text-pink-400">{padZero(t.minutes)}</span>
        <span className="text-white/20">:</span>
        <span className="text-orange-400">{padZero(t.seconds)}</span>
      </div>
    </div>
  )
}

export default function ChallengePage() {
  const [challengeDay, setChallengeDay] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mySubmission, setMySubmission] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [windowOpen, setWindowOpen] = useState(isWindowOpen())
  const supabase = createClient()

  useEffect(() => {
    const id = setInterval(() => setWindowOpen(isWindowOpen()), 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: p }, { data: cd }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('challenge_days')
          .select('*')
          .in('status', ['active', 'results', 'pending'])
          .order('day_number', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setProfile(p)
      setChallengeDay(cd)

      if (cd) {
        const [{ data: my }, { data: subs }] = await Promise.all([
          supabase
            .from('submissions')
            .select('*')
            .eq('user_id', user.id)
            .eq('challenge_day_id', cd.id)
            .maybeSingle(),
          supabase
            .from('submissions')
            .select('*, profiles(username, avatar_url)')
            .eq('challenge_day_id', cd.id)
            .eq('is_moderated', false)
            .order('vote_count', { ascending: false })
            .limit(50),
        ])
        setMySubmission(my)
        setSubmissions(subs || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-float">⚡</div>
      </div>
    )
  }

  if (!challengeDay) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Aucun défi programmé
        </h2>
        <p className="text-white/40 text-sm mb-8">
          Reviens à 20h00 !
        </p>
        <Countdown />
      </div>
    )
  }

  const config = getChallengeConfig(challengeDay.challenge_type)

  if (!windowOpen && challengeDay.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <div className="text-7xl mb-4 animate-float">{config.emoji}</div>
        <div className="text-xl font-mono text-white/30 mb-2">
          JOUR {challengeDay.day_number}
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">
          <span className="blur-sm">{config.title}</span>
        </h2>
        <p className="text-white/40 text-sm mb-8">
          Reviens à 20h00 pour découvrir le défi !
        </p>
        <Countdown />
      </div>
    )
  }

  const props = {
    challengeDay,
    profile,
    mySubmission,
    submissions,
    windowOpen,
  }

  switch (challengeDay.challenge_type) {
    case 'photo_arena':
    case 'photo_hidden':
    case 'blind_challenge':
      return <PhotoArena {...props} />
    case 'hold_battle':
      return <HoldBattle {...props} />
    case 'tap_war':
      return <TapWar {...props} />
    case 'team_choice':
      return <TeamChoice {...props} />
    default:
      return <PhotoArena {...props} />
  }
}
