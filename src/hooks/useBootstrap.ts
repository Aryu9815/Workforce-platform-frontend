import { useEffect } from 'react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export const useBootstrap = () => {
  const {
    accessToken,
    setAuth,
    setAuthenticated,
    clearAuth,
    refreshToken,
    tenant,
  } = useAuthStore()

  useEffect(() => {
    const bootstrap = async () => {
      if (!accessToken) return

      try {
        const user = await authApi.getCurrentUser()

        setAuth({
          user,
          tenant: tenant || undefined,
          accessToken,
          refreshToken: refreshToken!,
        })

        setAuthenticated()
      } catch (error) {
        clearAuth()
      }
    }

    bootstrap()
  }, [])
}
