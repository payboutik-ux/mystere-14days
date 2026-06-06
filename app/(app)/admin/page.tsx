'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getChallengeConfig } from '@/lib/game-logic'

const DAY_TYPES = [
  'photo_arena', 'photo_duel', 'photo_hidden',
  'mystery_choice', 'profile_battle', 'hold_battle',
  'mission_flash', 'tap_war', 'duel_express',
  'team_choice', 'vote_surprise', 'blind_challenge',
  'red_vs_blue', 'grand_finale',
]

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [days, setDays] = useState<any[]>([])
  const [tab, setTab] = useState<'campaign'|'days'|'users'>('campaign')
  const [creating, setCreating] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [profiles, setProfiles] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      if (!p?.is_admin) {
        setLoading(false)
        return
      }
      setIsAdmin(true)
      const [{ data: c }, { data: d }, { data: u }] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('challenge_days').select('*').order('day_number'),
        supabase.from('profiles').select('*').order('total_score', { ascending: false }).limit(50),
      ])
      setCampaigns(c || [])
      setDays(d || [])
      setProfiles(u || [])
      setLoading(false)
    }
    load()
  }, [])

  const createCampaign = async () => {
    if (!startDate) return
    setCreating(true)
    const start = new Date(startDate)
    const end = new Date(startDate)
    end.setDate(end.getDate() + 13)

    const { data: camp } = await supabase
      .from('campaigns')
      .insert({
        name: 'Mystère — Saison 1',
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        is_active: true,
        is_locked: false,
        timezone: 'Africa/Conakry',
        open_hour: 20,
        close_hour: 2,
      })
      .select()
      .single()

    if (camp) {
      const defaultTypes = [
        'photo_arena','photo_duel','photo_hidden','mystery_choice',
        'profile_battle','hold_battle','mission_flash','tap_war',
        'duel_express','team_choice','vote_surprise','blind_challenge',
        'red_vs_blue','grand_finale',
      ]
      for (let i = 0; i < 14; i++) {
        const cfg = getChallengeConfig(defaultTypes[i])
        await supabase.from('challenge_days').insert({
          campaign_id: camp.id,
          day_number: i + 1,
          challenge_type: defaultTypes[i],
          title: cfg.title,
          description: cfg.description,
          max_votes_per_user: 6,
          points_winner: 100,
          points_participant: 20,
          points_voter: 5,
          status: 'pending',
          is_locked: false,
        })
      }
      const { data: d } = await supabase
        .from('challenge_days').select('*').order('day_number')
      setDays(d || [])
      setCampaigns(prev => [camp, ...prev])
    }
    setCreating(false)
  }

  const activateDay = async (dayId: string) => {
    await supabase
      .from('challenge_days')
      .update({ status: 'pending' })
      .neq('id', dayId)
    await supabase
      .from('challenge_days')
      .update({ status: 'active' })
      .eq('id', dayId)
    const { data: d } = await supabase
      .from('challenge_days').select('*').order('day_number')
    setDays(d || [])
  }

  const closeDay = async (dayId: string) => {
    await supabase
      .from('challenge_days')
      .update({ status: 'results' })
      .eq('id', dayId)
    const { data: d } = await supabase
      .from('challenge_days').select('*').order('day_number')
    setDays(d || [])
  }

  const toggleSuspend = async (userId: string, current: boolean) => {
    await supabase
      .from('profiles')
      .update({ is_suspended: !current })
      .eq('id', userId)
    setProfiles(prev =>
      prev.map(p => p.id === userId ? { ...p, is_suspended: !current } : p)
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-float">⚙️</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 text-center">
        <div>
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="font-display text-2xl font-bold mb-2">Accès refusé</h2>
          <p className="text-white/40 text-sm">
            Tu n&apos;as pas les droits admin
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pt-8 pb-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-2">
        Panel Admin ⚙️
      </h1>
      <p className="text-white/40 text-sm mb-6">Gestion de la campagne</p>

      <div className="flex gap-2 mb-6">
        {(['campaign', 'days', 'users'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t
                ? 'bg-purple-600 text-white'
                : 'glass text-white/40'
            }`}
          >
            {t === 'campaign' ? '🎯 Campagne' : t === 'days' ? '📅 Jours' : '👥 Joueurs'}
          </button>
        ))}
      </div>

      {tab === 'campaign' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="glass rounded-3xl p-6">
              <h2 className="font-display font-bold mb-4">
                Créer la campagne
              </h2>
              <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-purple-500/50"
              />
              <motion.button
                onClick={createCampaign}
                disabled={creating || !startDate}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-display font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
              >
                {creating ? 'Création...' : '🚀 Lancer la campagne 14 jours'}
              </motion.button>
            </div>
          ) : (
            campaigns.map(c => (
              <div key={c.id} className="glass rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold">{c.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    c.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-white/40 text-sm">
                  Du {c.start_date} au {c.end_date}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'days' && (
        <div className="space-y-2">
          {days.map(day => {
            const cfg = getChallengeConfig(day.challenge_type)
            return (
              <div key={day.id} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{cfg.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Jour {day.day_number} — {cfg.title}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      day.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : day.status === 'results'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-white/10 text-white/40'
                    }`}>
                      {day.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {day.status === 'pending' && (
                    <button
                      onClick={() => activateDay(day.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-600/30 text-green-400 border border-green-500/20"
                    >
                      ▶ Activer
                    </button>
                  )}
                  {day.status === 'active' && (
                    <button
                      onClick={() => closeDay(day.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-orange-600/30 text-orange-400 border border-orange-500/20"
                    >
                      ⏹ Fermer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {days.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">
              Crée d&apos;abord une campagne
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-2">
          {profiles.map((p, i) => (
            <div
              key={p.id}
              className="glass rounded-2xl p-3 flex items-center gap-3"
            >
              <span className="text-sm text-white/30 w-6">#{i + 1}</span>
              <div className="flex-1">
                <p className="font-medium text-sm text-white">
                  {p.username}
                  {p.is_admin && (
                    <span className="text-purple-400 text-xs ml-1">Admin</span>
                  )}
                </p>
                <p className="text-xs text-white/30">
                  {p.total_score}pts • {p.wins}V
                </p>
              </div>
              <button
                onClick={() => toggleSuspend(p.id, p.is_suspended)}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  p.is_suspended
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {p.is_suspended ? 'Réactiver' : 'Suspendre'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
