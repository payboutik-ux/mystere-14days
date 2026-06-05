'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
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
            Connexion
          </h1>
          <p className="text-white/40 text-sm">
            Retrouve ta place dans le classement
          </p>
        </div>

        <form onSubmit={handleLogin} className="glass rounded-3xl p-6 space-y-4">
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
            className="w-full py-4 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter 🔐'}
          </motion.button>

          <div className="text-center space-y-2">
            <Link
              href="/reset-password"
              className="block text-sm text-white/30 hover:text-purple-400"
            >
              Mot de passe oublié ?
            </Link>
            <p className="text-white/30 text-sm">
              Pas encore inscrit ?{' '}
              <Link href="/register" className="text-purple-400 font-medium">
                Créer un compte
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
