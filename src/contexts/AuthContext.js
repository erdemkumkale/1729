import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set CSS color variables from hex code
  const applyUserColor = (hexCode) => {
    if (!hexCode) return
    const r = parseInt(hexCode.slice(1, 3), 16)
    const g = parseInt(hexCode.slice(3, 5), 16)
    const b = parseInt(hexCode.slice(5, 7), 16)
    document.documentElement.style.setProperty('--user-color', hexCode)
    document.documentElement.style.setProperty('--user-color-soft', `rgba(${r},${g},${b},0.10)`)
    document.documentElement.style.setProperty('--user-color-glow', `rgba(${r},${g},${b},0.25)`)
  }

  // Apply theme to <html> data-theme attribute
  const applyTheme = (theme) => {
    if (!theme || theme === 'system') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }

  // Load profile from public.profiles — creates one if missing
  const loadProfile = async (userId) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // If no row exists, create a minimal profile
      if (error?.code === 'PGRST116' || !data) {
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert({ id: userId, payment_status: 'pending', onboarding_completed: false })
          .select()
          .single()
        if (createError) console.error('[AuthContext] createProfile error:', createError.message)
        data = created ?? null
      } else if (error) {
        console.error('[AuthContext] loadProfile error:', error.message)
      }

      setProfile(data ?? null)
      if (data?.hex_code) applyUserColor(data.hex_code)
      if (data?.theme) applyTheme(data.theme)
    } catch (err) {
      console.error('[AuthContext] loadProfile unexpected error:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('[AuthContext] getSession error:', error.message)
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id).finally(() => { if (mounted) setLoading(false) })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id).finally(() => { if (mounted) setLoading(false) })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })

  const signInWithApple = () =>
    supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })

  const signInWithEmail = async (email, password) => {
    console.log('[AuthContext] signInWithEmail →', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('[AuthContext] signInWithEmail error:', error.message, error)
      throw error
    }
    console.log('[AuthContext] signInWithEmail success, user:', data.user?.id)
    return data
  }

  const signUpWithEmail = async (email, password) => {
    console.log('[AuthContext] signUpWithEmail →', email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      console.error('[AuthContext] signUpWithEmail error:', error.message, error)
      throw error
    }
    console.log('[AuthContext] signUpWithEmail success, session:', data.session ? 'present' : 'null (confirm email)')
    return data
  }

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id)
  }

  const updateProfile = async (updates) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    if (error) throw error
    await loadProfile(user.id)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signInWithGoogle, signInWithApple,
      signInWithEmail, signUpWithEmail,
      signOut, refreshProfile, updateProfile, applyTheme,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
