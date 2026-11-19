"use client"

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from "react"
import type { User, AuthState } from "@/types"
import { authApi } from "@/lib/api"

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: () => {},
    logout: () => {},
    updateUser: () => {},
    fetchProfile: async () => {},
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        setState((prev) => ({ ...prev, user, token, isAuthenticated: true, isLoading: false }))
      } catch {
        setState((prev) => ({ ...prev, user: null, token: null, isAuthenticated: false, isLoading: false }))
      }
    } else {
      setState((prev) => ({ ...prev, user: null, token: null, isAuthenticated: false, isLoading: false }))
    }
  }, [])

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    setState((prev) => ({ ...prev, user, token, isAuthenticated: true, isLoading: false }))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setState((prev) => ({ ...prev, user: null, token: null, isAuthenticated: false, isLoading: false }))
  }, [])

  const updateUser = useCallback((user: User) => {
    localStorage.setItem("user", JSON.stringify(user))
    setState((prev) => ({ ...prev, user }))
  }, [])

  const fetchProfile = useCallback(async () => {
    if (!state.token) return
    try {
      const res = await authApi.getProfile()
      if (res.user) {
        updateUser(res.user)
      }
    } catch {
      logout()
    }
  }, [state.token, updateUser, logout])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
