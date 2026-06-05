'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (username.length < 3) {
      setError('Pseudo trop court (3 caractères minimum)')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Mot de passe trop court (8 caractères minimum)')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-7xl mb-4">🎉</div>
          <h2 className="font-display text-2xl font-bold mb-2">
            Bienvenue {username} !
          </h2>
          <p className="text-white/40">Redirection...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="text-white/30 text-sm">← Retour</Link>
          <h1 className="font-display text-3xl font-bold mt-4 mb-2">
            Crée ton compte
          </h1>
          <p className="text-white/40 text-sm">
            14 jours. 14 défis. Commence maintenant.
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          className="glass rounded-3xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Pseudo
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              maxLength={20}
              placeholder="ton_pseudo"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="ton@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center py-2 bg-red-500/10 rounded-lg">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Rejoindre le défi 🚀'}
          </motion.button>

          <p className="text-white/30 text-sm text-center">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-purple-400 font-medium">
              Se connecter
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
