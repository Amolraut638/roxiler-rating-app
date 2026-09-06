import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AuthCard from '../../components/auth/AuthCard'
import PasswordInput from '../../components/auth/PasswordInput'
import { updatePassword } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

// Mirrors the backend PASSWORD_RE exactly
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  USER: '/stores',
  STORE_OWNER: '/owner/dashboard',
}

export default function ChangePassword() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => {
    setSuccess(false)
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const validate = () => {
    const e = {}

    if (!form.currentPassword)
      e.currentPassword = 'Current password is required.'

    if (!form.newPassword)
      e.newPassword = 'New password is required.'
    else if (!PASSWORD_RE.test(form.newPassword))
      e.newPassword = '8–16 chars, at least one uppercase letter and one special character.'
    else if (form.currentPassword && form.newPassword === form.currentPassword)
      e.newPassword = 'New password must be different from your current password.'

    if (!form.confirmNewPassword)
      e.confirmNewPassword = 'Please confirm your new password.'
    else if (form.newPassword !== form.confirmNewPassword)
      e.confirmNewPassword = 'Passwords do not match.'

    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) return setErrors(e2)
    setErrors({})
    setServerError('')
    setSuccess(false)
    setLoading(true)
    try {
      await updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setSuccess(true)
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (err) {
      const msg = err.response?.data?.message
      const detail = err.response?.data?.errors?.[0]
      setServerError(detail ?? msg ?? 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const backPath = ROLE_HOME[user?.role] ?? '/login'

  return (
    <AuthCard>
      <button
        id="change-password-back"
        type="button"
        onClick={() => navigate(backPath)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Change password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your password to keep your account secure
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          ✓ Password updated successfully!
        </div>
      )}

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordInput
          id="cp-current"
          label="Current Password"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={set('currentPassword')}
          error={errors.currentPassword}
          autoComplete="current-password"
        />

        <PasswordInput
          id="cp-new"
          label="New Password"
          placeholder="8–16 chars, uppercase + special char"
          value={form.newPassword}
          onChange={set('newPassword')}
          error={errors.newPassword}
          autoComplete="new-password"
        />

        <PasswordInput
          id="cp-confirm"
          label="Confirm New Password"
          placeholder="Re-enter new password"
          value={form.confirmNewPassword}
          onChange={set('confirmNewPassword')}
          error={errors.confirmNewPassword}
          autoComplete="new-password"
        />

        <button
          id="change-password-submit"
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  )
}
