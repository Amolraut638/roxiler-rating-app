import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserRound, Mail, MapPin } from 'lucide-react'
import AuthCard from '../../components/auth/AuthCard'
import AuthInput from '../../components/auth/AuthInput'
import PasswordInput from '../../components/auth/PasswordInput'
import { register as registerApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

// Mirrors the backend PASSWORD_RE exactly (same as ChangePassword.jsx)
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/

export default function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', address: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Name is required.'
    else if (form.name.length < 20) e.name = 'Name must be at least 20 characters.'
    else if (form.name.length > 60) e.name = 'Name must be at most 60 characters.'

    if (!form.email) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'

    if (!form.address) e.address = 'Address is required.'
    else if (form.address.length > 400) e.address = 'Address must be at most 400 characters.'

    if (!form.password) e.password = 'Password is required.'
    else if (!PASSWORD_REGEX.test(form.password))
      e.password = '8–16 chars, at least one uppercase letter and one special character.'

    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.'

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
      const res = await registerApi({
        name: form.name,
        email: form.email,
        address: form.address,
        password: form.password,
      })
      const { token, user } = res.data.data
      login(token, user)
      navigate('/stores')
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">Sign up to get started</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput
          id="signup-name"
          label="Name"
          type="text"
          placeholder="Your full name (20–60 chars)"
          icon={UserRound}
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          autoComplete="name"
        />

        <AuthInput
          id="signup-email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={Mail}
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          autoComplete="email"
        />

        <AuthInput
          id="signup-address"
          label="Address"
          type="text"
          placeholder="Your address"
          icon={MapPin}
          value={form.address}
          onChange={set('address')}
          error={errors.address}
          autoComplete="street-address"
        />

        <PasswordInput
          id="signup-password"
          label="Password"
          placeholder="8–16 chars, uppercase + special char"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="new-password"
        />

        <PasswordInput
          id="signup-confirm-password"
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <button
          id="signup-submit"
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60 disabled:cursor-not-allowed mt-1"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 transition">
          Login
        </Link>
      </p>
    </AuthCard>
  )
}
