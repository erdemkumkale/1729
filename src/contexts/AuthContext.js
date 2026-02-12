import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * UTILITY: Generate Random Hex Code
 * Returns a random hex color code like #A4F2C8
 */
const generateHexCode = () => {
  const randomColor = Math.floor(Math.random() * 16777215) // 0 to 0xFFFFFF
  return '#' + randomColor.toString(16).padStart(6, '0').toUpperCase()
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 AuthContext: Starting initialization...')
    
    // Set timeout to 2 seconds
    const emergencyTimeout = setTimeout(() => {
      console.log('⚠️ AuthContext: Emergency timeout')
      setLoading(false)
    }, 2000)

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 AuthContext: Getting session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ AuthContext: Session error:', error)
          setUser(null)
          setProfile(null)
          setLoading(false)
          clearTimeout(emergencyTimeout)
          return
        }

        console.log('✅ AuthContext: Session retrieved:', session ? 'User found' : 'No user')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 AuthContext: Fetching profile for user:', session.user.id)
          await fetchOrCreateProfile(session.user.id, session.user.email)
        }
        
        setLoading(false)
        clearTimeout(emergencyTimeout)
      } catch (error) {
        console.error('❌ AuthContext: Critical error:', error)
        setUser(null)
        setProfile(null)
        setLoading(false)
        clearTimeout(emergencyTimeout)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 AuthContext: Auth state changed:', event)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchOrCreateProfile(session.user.id, session.user.email)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      clearTimeout(emergencyTimeout)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * ROBUST FAIL-SAFE PROFILE FETCHING
   * This function will NEVER get stuck - it will create a profile if needed
   */
  const fetchOrCreateProfile = async (userId, userEmail) => {
    console.log('🔍 Attempting to fetch profile for user:', userId)
    
    try {
      // Add timeout to profile fetch
      const profilePromise = supabase
        .from('profiles')
        .select('id, email, hex_code, onboarding_completed, payment_status, payment_tier, payment_amount, role')
        .eq('id', userId)
        .maybeSingle()
      
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ data: null, error: { message: 'Profile fetch timeout' } }), 2000)
      )
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise])

      // Step 2: Check if profile exists
      if (data && !error) {
        console.log('✅ Profile found:', data)
        setProfile(data)
        return
      }

      // Step 3: Profile doesn't exist - CREATE IT NOW (Fail-safe)
      console.log('⚠️ Profile not found or error occurred. Creating profile...')
      if (error) console.log('Error details:', error)
      
      await createProfileNow(userId, userEmail)
      
    } catch (error) {
      console.error('❌ Error in fetchOrCreateProfile:', error)
      // Even on error, try to create profile
      await createProfileNow(userId, userEmail)
    }
  }

  /**
   * FAIL-SAFE PROFILE CREATION WITH HEX GENERATION
   * Creates profile with auto-generated hex code
   */
  const createProfileNow = async (userId, userEmail) => {
    console.log('🔨 Creating profile NOW for user:', userId)
    
    try {
      // Generate hex code in frontend (robust fallback)
      const hexCode = generateHexCode()
      console.log('🎨 Generated hex code:', hexCode)
      
      // Insert profile WITH hex code - with timeout
      const insertPromise = supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: userEmail || '',
          hex_code: hexCode,
          onboarding_completed: false,
          payment_status: 'pending',
          role: 'user'
        }])
        .select()
        .single()
      
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ data: null, error: { message: 'Insert timeout' } }), 2000)
      )
      
      const { data, error } = await Promise.race([insertPromise, timeoutPromise])

      if (error) {
        console.error('❌ Error creating profile:', error)
        // Even if insert fails, set a minimal profile to unblock user
        setProfile({
          id: userId,
          email: userEmail,
          hex_code: hexCode,
          onboarding_completed: false,
          payment_status: 'pending',
          role: 'user'
        })
        return
      }
      
      console.log('✅ Profile created successfully:', data)
      setProfile(data)
      
    } catch (error) {
      console.error('❌ Critical error creating profile:', error)
      // LAST RESORT: Set profile in memory even if database fails
      const hexCode = generateHexCode()
      const fallbackProfile = {
        id: userId,
        email: userEmail,
        hex_code: hexCode,
        onboarding_completed: false,
        payment_status: 'pending',
        role: 'user'
      }
      console.log('🆘 Using fallback profile:', fallbackProfile)
      setProfile(fallbackProfile)
    }
  }

  /**
   * MAGIC LINK AUTHENTICATION (Passwordless)
   * Send magic link to email for passwordless login
   */
  const signInWithMagicLink = async (email, promoCode = null) => {
    console.log('✉️ AuthContext: Sending magic link to:', email)
    
    const options = {
      emailRedirectTo: window.location.origin,
    }

    // If promo code provided, add it to metadata
    if (promoCode && promoCode.trim()) {
      options.data = {
        promo_code: promoCode.trim().toUpperCase()
      }
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options
    })

    if (error) throw error

    console.log('✅ Magic link sent successfully')
    return data
  }

  // Legacy methods kept for backward compatibility but not used
  const signUp = async (email, password, promoCode = null) => {
    console.log('📝 AuthContext: Signing up user:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Immediately create profile (don't wait for trigger)
    if (data.user) {
      console.log('👤 User created, creating profile immediately...')
      await fetchOrCreateProfile(data.user.id, email)

      // If promo code provided, mark invitation as used
      if (promoCode && promoCode.trim()) {
        console.log('🎟️ Processing promo code:', promoCode)
        try {
          const { data: result, error: promoError } = await supabase
            .rpc('mark_invitation_used', {
              p_promo_code: promoCode.trim().toUpperCase(),
              p_user_id: data.user.id
            })

          if (promoError) {
            console.error('❌ Error processing promo code:', promoError)
          } else if (result) {
            console.log('✅ Promo code processed, mutual trust will be established')
          } else {
            console.log('⚠️ Promo code not found or already used')
          }
        } catch (err) {
          console.error('❌ Error in promo code processing:', err)
        }
      }
    }

    return data
  }

  const signIn = async (email, password) => {
    console.log('🔐 AuthContext: Signing in user:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Immediately fetch or create profile
    if (data.user) {
      console.log('👤 User logged in, fetching profile...')
      await fetchOrCreateProfile(data.user.id, data.user.email)
    }
    
    return data
  }

  const signOut = () => {
    console.log('🚪 AuthContext: Signing out')
    setProfile(null)
    setUser(null)
    localStorage.clear()
    sessionStorage.clear()
    
    // Use supabase signOut but don't wait for it
    supabase.auth.signOut().catch(err => {
      console.log('Ignoring signOut error:', err)
    })
    
    setTimeout(() => {
      window.location.href = '/login'
    }, 100)
  }

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing profile...')
      await fetchOrCreateProfile(user.id, user.email)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
