export const TIMEZONE = 'Africa/Conakry'
export const OPEN_HOUR = 20
export const CLOSE_HOUR = 2

export function getNowInConakry(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: TIMEZONE })
  )
}

export function isWindowOpen(): boolean {
  const h = getNowInConakry().getHours()
  return h >= OPEN_HOUR || h < CLOSE_HOUR
}

export function getTimeUntilNextOpen() {
  const now = new Date()
  const local = getNowInConakry()
  const h = local.getHours()
  const next = new Date(now)

  if (h >= CLOSE_HOUR && h < OPEN_HOUR) {
    next.setHours(next.getHours() + (OPEN_HOUR - h))
    next.setMinutes(0); next.setSeconds(0)
  } else {
    next.setHours(next.getHours() + (CLOSE_HOUR + 24 - h) % 24)
    next.setMinutes(0); next.setSeconds(0)
  }

  const diff = next.getTime() - now.getTime()
  const s = Math.max(0, Math.floor(diff / 1000))
  return {
    hours: Math.floor(s / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

export function padZero(n: number): string {
  return n.toString().padStart(2, '0')
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function getBadgeForScore(score: number) {
  if (score >= 500) return { label: 'Légende', icon: '👑', color: '#EAB308' }
  if (score >= 300) return { label: 'Champion', icon: '🏆', color: '#F97316' }
  if (score >= 200) return { label: 'Elite', icon: '💎', color: '#06B6D4' }
  if (score >= 100) return { label: 'Pro', icon: '⚡', color: '#8B5CF6' }
  if (score >= 50) return { label: 'Challenger', icon: '🔥', color: '#EC4899' }
  return { label: 'Rookie', icon: '🌟', color: '#22C55E' }
}

export function getChallengeConfig(type: string) {
  const configs: Record<string, {
    title: string; emoji: string
    description: string; color: string
  }> = {
    photo_arena: {
      title: 'Photo Arena', emoji: '📸',
      description: 'Envoie ta photo et récolte les votes !',
      color: '#8B5CF6',
    },
    photo_duel: {
      title: 'Duel de Photos', emoji: '⚔️',
      description: 'Les photos s\'affrontent en duel !',
      color: '#F97316',
    },
    photo_hidden: {
      title: 'Photo Cachée', emoji: '🌫️',
      description: 'Vote sans tout voir.',
      color: '#06B6D4',
    },
    mystery_choice: {
      title: 'Choix Mystère', emoji: '🎭',
      description: 'Deux options mystérieuses.',
      color: '#EC4899',
    },
    profile_battle: {
      title: 'Battle de Profil', emoji: '👑',
      description: 'Qui a le meilleur profil ?',
      color: '#EAB308',
    },
    hold_battle: {
      title: 'Hold Battle', emoji: '🔥',
      description: 'Tiens le plus longtemps possible !',
      color: '#EF4444',
    },
    mission_flash: {
      title: 'Mission Flash', emoji: '⚡',
      description: 'Mission surprise ! Agis vite.',
      color: '#22C55E',
    },
    tap_war: {
      title: 'Tap War', emoji: '💥',
      description: 'Tape le plus vite possible !',
      color: '#F97316',
    },
    duel_express: {
      title: 'Duel Express', emoji: '🚀',
      description: 'Choix rapide, résultat immédiat.',
      color: '#3B82F6',
    },
    team_choice: {
      title: 'Messi ou Ronaldo', emoji: '⚽',
      description: 'Choisis ton camp !',
      color: '#22C55E',
    },
    vote_surprise: {
      title: 'Vote Surprise', emoji: '🎲',
      description: 'Un duel surprise t\'attend.',
      color: '#8B5CF6',
    },
    blind_challenge: {
      title: 'Blind Challenge', emoji: '🙈',
      description: 'Tu votes sans tout voir.',
      color: '#64748B',
    },
    red_vs_blue: {
      title: 'Rouge vs Bleu', emoji: '🔴🔵',
      description: 'Deux camps, un seul vainqueur.',
      color: '#EF4444',
    },
    grand_finale: {
      title: 'Grande Finale', emoji: '🏆',
      description: 'La finale absolue des 14 jours !',
      color: '#EAB308',
    },
  }
  return configs[type] || configs['photo_arena']
}
