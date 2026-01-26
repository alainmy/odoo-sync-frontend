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
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        try {
          // OAuth2PasswordRequestForm expects form-data
          const formData = new URLSearchParams()
          formData.append('username', username)
          formData.append('password', password)

          const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          })

          if (!response.ok) {
            throw new Error('Invalid credentials')
          }

          const data = await response.json()
          set({
            user: { id: 0, email: username, name: username }, // Placeholder until we get user info
            token: data.access_token,
            isAuthenticated: true,
          })
          localStorage.setItem('access_token', data.access_token)
        } catch (error) {
          throw error
        }
      },
      logout: () => {
        localStorage.removeItem('access_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      setUser: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true })
        localStorage.setItem('access_token', token)
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
