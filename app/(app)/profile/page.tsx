'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getBadgeForScore } from '@/lib/game-logic'
import { compressImage } from '@/lib/utils'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setUsername(data.username || '')
        setBio(data.bio || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('profiles')
      .update({ username, bio })
      .eq('id', user.id)
    setSuccess('Profil mis à jour ✓')
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const compressed = await compressImage(file, 0.5)
    const path = `avatars/${user.id}_${Date.now()}.jpg`
    await supabase.storage.from('avatars').upload(path, compressed)
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)
    setProfile((p: any) => ({ ...p, avatar_url: publicUrl }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-float">👤</div>
      </div>
    )
  }

  const badge = getBadgeForScore(profile?.total_score || 0)

  return (
    <div className="min-h-screen px-4 pt-8 pb-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6">Mon Profil</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 mb-4"
      >
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl font-bold overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile?.username?.[0]?.toUpperCase() || '?'}</span>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-sm">✏️</span>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
          <div>
            <p className="font-display font-bold text-xl">
              {profile?.username}
            </p>
            <p
              className="text-sm font-bold"
              style={{ color: badge.color }}
            >
              {badge.icon} {badge.label}
            </p>
            <p className="text-white/40 text-xs">
              {profile?.total_score || 0} points
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Pseudo
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={20}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={100}
              rows={3}
              placeholder="Dis quelque chose sur toi..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
            />
          </div>

          {success && (
            <p className="text-green-400 text-sm text-center">{success}</p>
          )}

          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-display font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder ✓'}
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Score', value: profile?.total_score || 0, icon: '⭐' },
          { label: 'Victoires', value: profile?.wins || 0, icon: '🏆' },
          { label: 'Série', value: `${profile?.streak || 0}🔥`, icon: '⚡' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="font-display font-bold text-lg text-white">
              {stat.value}
            </p>
            <p className="text-white/30 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
