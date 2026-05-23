import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

// Helpers
const secondsToTime = (s) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const timeToSeconds = (h, m, s) => h * 3600 + m * 60 + s

export const useAppStore = create((set, get) => ({
  // --- WORKOUT LOGS ---
  logs: [],
  logsLoading: false,

  fetchMyLogs: async (userId) => {
    set({ logsLoading: true })
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (!error) set({ logs: data || [] })
    set({ logsLoading: false })
  },

  saveLog: async (userId, logData) => {
    const { hours, minutes, seconds, ...rest } = logData
    const time_seconds = timeToSeconds(hours || 0, minutes || 0, seconds || 0)

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: userId, time_seconds, ...rest })
      .select()
      .single()

    if (!error && data) {
      set(state => ({ logs: [data, ...state.logs] }))
    }
    return { data, error }
  },

  deleteLog: async (logId) => {
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', logId)

    if (!error) {
      set(state => ({ logs: state.logs.filter(l => l.id !== logId) }))
    }
    return { error }
  },

  // --- ACTIVITY FEED ---
  feed: [],
  feedLoading: false,
  feedPage: 0,

  fetchFeed: async (reset = false) => {
    const page = reset ? 0 : get().feedPage
    set({ feedLoading: true })

    const { data } = await supabase
      .from('activity_feed')
      .select('*')
      .range(page * 20, page * 20 + 19)

    if (reset) {
      set({ feed: data || [], feedPage: 1, feedLoading: false })
    } else {
      set(state => ({
        feed: [...state.feed, ...(data || [])],
        feedPage: state.feedPage + 1,
        feedLoading: false
      }))
    }
  },

  // --- RANKINGS ---
  rankings: [],
  rankingsLoading: false,

  fetchRankings: async (country = null) => {
    set({ rankingsLoading: true })
    try {
      let query = supabase
        .from('global_rankings')
        .select('*')
        .limit(50)

      if (country) query = query.eq('country', country)

      const { data } = await query
      set({ rankings: data || [] })
    } finally {
      set({ rankingsLoading: false })
    }
  },

  // --- KUDOS ---
  giveKudo: async (userId, logId) => {
    const { error } = await supabase
      .from('kudos')
      .insert({ user_id: userId, log_id: logId })

    if (!error) {
      set(state => ({
        feed: state.feed.map(item =>
          item.id === logId
            ? { ...item, kudos_count: (item.kudos_count || 0) + 1 }
            : item
        )
      }))
    }
  },

  // --- WORKOUT PLANS ---
  plans: [],

  fetchMyPlans: async (userId) => {
    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (data) set({ plans: data })
  },

  savePlan: async (userId, name, exercises) => {
    const { data, error } = await supabase
      .from('workout_plans')
      .upsert({
        user_id: userId,
        name,
        exercises,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,name' })
      .select()
      .single()

    if (!error && data) {
      set(state => {
        const exists = state.plans.find(p => p.id === data.id)
        return {
          plans: exists
            ? state.plans.map(p => p.id === data.id ? data : p)
            : [data, ...state.plans]
        }
      })
    }
    return { data, error }
  },

  deletePlan: async (planId) => {
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', planId)

    if (!error) {
      set(state => ({ plans: state.plans.filter(p => p.id !== planId) }))
    }
  },

  // --- CHALLENGES ---
  activeChallenges: [],

  fetchChallenges: async () => {
    const { data } = await supabase
      .from('challenges')
      .select(`*, challenge_entries(count)`)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().substring(0, 10))
    if (data) set({ activeChallenges: data })
  },

  // Utilidad
  secondsToTime,
  timeToSeconds,
}))
