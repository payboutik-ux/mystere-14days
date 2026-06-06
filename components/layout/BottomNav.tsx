'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const tabs = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/challenge', icon: '⚡', label: 'Défi' },
  { href: '/leaderboard', icon: '🏆', label: 'Classement' },
  { href: '/profile', icon: '👤', label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-1">
      <div className="max-w-lg mx-auto">
        <div className="glass-strong rounded-2xl border border-white/8 flex items-center justify-around py-2">
          {tabs.map(tab => {
            const active = pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href} className="flex-1">
                <div className="flex flex-col items-center gap-1 py-1 relative">
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 -mx-1 rounded-xl bg-purple-500/15"
                      transition={{
                        type: 'spring',
                        bounce: 0.2,
                        duration: 0.5,
                      }}
                    />
                  )}
                  <span className="text-xl relative z-10">{tab.icon}</span>
                  <span
                    className={`text-[10px] font-medium relative z-10 ${
                      active ? 'text-purple-400' : 'text-white/30'
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
