import { apiRequest } from './api'
import {
  buildUserSummary,
  getAuthSession,
  refreshAuthSession,
  updateAuthSessionUser,
} from './auth'

/**
 * Mengambil profil pengguna aktif dari backend (/auth/me) dengan fallback sesi lokal saat jaringan bermasalah.
 */
export async function fetchMyProfile() {
  try {
    const refreshed = await refreshAuthSession()
    if (refreshed) {
      return buildUserSummary(refreshed)
    }
  } catch {
    // Fallback ke data sesi lokal saat koneksi sementara terganggu
  }

  return buildUserSummary(getAuthSession())
}

/**
 * Memperbarui informasi profil pengguna (nama, email, no. telepon, serta opsional foto avatar).
 */
export async function updateMyProfile(payload) {
  const response = await apiRequest('/api/auth/profile', {
    method: 'POST',
    body: payload,
  })

  if (response?.user) {
    updateAuthSessionUser(response.user)
  } else {
    await refreshAuthSession()
  }

  return response
}

/**
 * Mengubah kata sandi pengguna aktif via modal ubah kata sandi.
 */
export async function changeMyPassword({ current_password, new_password, confirm_password }) {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: {
      current_password,
      new_password,
      confirm_password,
    },
  })
}
