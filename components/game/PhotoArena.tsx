'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameWrapper from './GameWrapper'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/utils'

export default function PhotoArena({
  challengeDay, profile, mySubmission: initialMy,
  submissions: initialSubs, windowOpen,
}: any) {
  const [submissions, setSubmissions] = useState(initialSubs)
  const [mySubmission, setMySubmission] = useState(initialMy)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const isHidden = ['photo_hidden', 'blind_challenge'].includes(
    challengeDay.challenge_type
  )

  useEffect(() => {
    const stored = localStorage.getItem(`votes_${challengeDay.id}`)
    if (stored) setVotedIds(new Set(JSON.parse(stored)))

    const channel = supabase
      .channel(`subs-${challengeDay.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'submissions',
        filter: `challenge_day_id=eq.${challengeDay.id}`,
      }, async () => {
        const { data } = await supabase
          .from('submissions')
          .select('*, profiles(username, avatar_url)')
          .eq('challenge_day_id', challengeDay.id)
          .eq('is_moderated', false)
          .order('vote_count', { ascending: false })
          .limit(50)
        if (data) setSubmissions(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [challengeDay.id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file || !profile) return
    setUploading(true)
    setError('')
    try {
      const compressed = await compressImage(file, 2)
      const path = `submissions/${challengeDay.id}/${profile.id}_${Date.now()}.jpg`
      await supabase.storage.from('submissions').upload(path, compressed)
      const { data: { publicUrl } } = supabase.storage
        .from('submissions').getPublicUrl(path)
      const { data: sub } = await supabase.from('submissions').upsert({
        user_id: profile.id,
        challenge_day_id: challengeDay.id,
        file_url: publicUrl,
        vote_count: 0, is_winner: false, is_moderated: false,
        tap_count: 0, hold_duration_ms: 0, points_earned: 0,
        team: null, content: null, rank: null,
      }).select().single()
      setMySubmission(sub)
      setSuccess('Photo envoyée ! 🎉')
    } catch {
      setError('Erreur lors de l\'upload')
    }
    setUploading(false)
  }

  const handleVote = async (submissionId: string) => {
    if (!windowOpen || !profile) return
    if (votedIds.has(submissionId)) return
    if (votedIds.size >= (challengeDay.max_votes_per_user || 6)) {
      setError(`Maximum ${challengeDay.max_votes_per_user} votes atteint`)
      return
    }
    if (submissionId === mySubmission?.id) {
      setError('Tu ne peux pas voter pour ta propre photo')
      return
    }
    const next = new Set(votedIds)
    next.add(submissionId)
    setVotedIds(next)
    localStorage.setItem(`votes_${challengeDay.id}`, JSON.stringify([...next]))
    setSubmissions((prev: any[]) =>
      prev.map(s => s.id === submissionId
        ? { ...s, vote_count: s.vote_count + 1 } : s
      ).sort((a: any, b: any) => b.vote_count - a.vote_count)
    )
    await supabase.from('votes').insert({
      voter_id: profile.id,
      submission_id: submissionId,
      challenge_day_id: challengeDay.id,
    })
  }

  return (
    <GameWrapper
      type={challengeDay.challenge_type}
      dayNumber={challengeDay.day_number}
      windowOpen={windowOpen}
    >
      {windowOpen && !mySubmission && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-5 mb-6"
        >
          <h2 className="font-display font-bold mb-4">📸 Envoie ta photo</h2>
          {preview ? (
            <div className="relative mb-4">
              <img
                src={preview}
                className="w-full h-48 object-cover rounded-2xl"
              />
              <button
                onClick={() => { setPreview(null); setFile(null) }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white text-sm flex items-center justify-center"
              >✕</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/40 mb-4"
            >
              <span className="text-3xl">📷</span>
              <span className="text-sm">Touche pour choisir</span>
            </button>
          )}
          <input
            ref={fileRef} type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden" onChange={handleFileChange}
          />
          {file && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-4 rounded-2xl font-display font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
            >
              {uploading ? '⏳ Envoi...' : '🚀 Envoyer ma photo'}
            </motion.button>
          )}
          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center mt-2">{success}</p>}
        </motion.div>
      )}

      {mySubmission && (
        <div className="glass rounded-3xl p-4 mb-6 border border-purple-500/20">
          <p className="text-green-400 text-sm mb-3">✓ Ta photo est dans l'arène</p>
          {mySubmission.file_url && (
            <img
              src={mySubmission.file_url}
              className="w-full h-40 object-cover rounded-2xl"
            />
          )}
          <p className="text-white/40 text-sm mt-3">
            ❤️ {mySubmission.vote_count} votes •{' '}
            {votedIds.size}/{challengeDay.max_votes_per_user} votes utilisés
          </p>
        </div>
      )}

      <h2 className="font-display font-bold text-sm text-white/40 uppercase tracking-wider mb-3">
        Arena — {submissions.length} photos 🔥
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {submissions.map((sub: any, i: number) => {
            const isVoted = votedIds.has(sub.id)
            const isMe = sub.user_id === profile?.id
            return (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`relative rounded-2xl overflow-hidden ${isVoted ? 'ring-2 ring-purple-500' : ''}`}
              >
                {sub.file_url && (
                  <img
                    src={sub.file_url}
                    className={`w-full h-40 object-cover ${isHidden ? 'blur-md' : ''}`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs truncate">
                    {sub.profiles?.username}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">
                      ❤️ {sub.vote_count}
                    </span>
                    {windowOpen && !isMe && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleVote(sub.id)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          isVoted
                            ? 'bg-purple-500/30 text-purple-300'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {isVoted ? '✓' : '♥'}
                      </motion.button>
                    )}
                  </div>
                </div>
                {i < 3 && (
                  <div className="absolute top-2 right-2 text-lg">
                    {['🥇', '🥈', '🥉'][i]}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {submissions.length === 0 && (
        <div className="text-center py-12 text-white/30">
          <div className="text-4xl mb-2">📸</div>
          <p className="text-sm">Aucune photo pour l&apos;instant</p>
        </div>
      )}
    </GameWrapper>
  )
}
