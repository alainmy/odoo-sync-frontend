import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  is_superuser: boolean | false
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
}

const API_URL = import.meta.env.VITE_API_URL
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      is_superuser: false,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        try {
          // OAuth2PasswordRequestForm expects form-data
          const formData = new URLSearchParams()
          formData.append('username', username)
          formData.append('password', password)

          const response = await fetch(`${API_URL || ''}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          })
          debugger

          if (!response.ok) {
            throw new Error('Invalid credentials')
          }

          const data = await response.json()
          set({
            user: { id: 0, email: username, name: username }, // Placeholder until we get user info
            token: data.access_token,
            is_superuser: data.is_superuser,
            isAuthenticated: true,
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('is_superuser', data.is_superuser.toString())
        } catch (error) {
          throw error
        }
      },
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('is_superuser')
        set({ user: null, token: null, is_superuser: false, isAuthenticated: false })
      },
      setUser: (user: User, token: string) => {
        set({ user, token, is_superuser:true, isAuthenticated: true })
        localStorage.setItem('access_token', token)
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
