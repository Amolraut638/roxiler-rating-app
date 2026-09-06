import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthCard from '../../components/auth/AuthCard'
import AuthInput from '../../components/auth/AuthInput'
import PasswordInput from '../../components/auth/PasswordInput'
import { login as loginApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  USER: '/stores',
  STORE_OWNER: '/owner/dashboard',
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    if (!form.password) e.password = 'Password is required.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) return setErrors(e2)
    setErrors({})
    setServerError('')
    setLoading(true)
    try {
      const res = await loginApi(form)
      const { token, user } = res.data.data
      login(token, user)
      navigate(ROLE_HOME[user.role] ?? '/')
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Login</h1>
        <p className="mt-1 text-sm text-gray-500">Please sign in to continue</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput
          id="login-email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          autoComplete="email"
        />

        <PasswordInput
          id="login-password"
          label="Password"
          placeholder="Password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="current-password"
        />

        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 transition">
          Sign up
        </Link>
      </p>
    </AuthCard>
  )
}
