"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { STUDENT_LEVELS } from "@/lib/utils"

interface Institution {
  id: string
  name: string
  shortName: string | null
  campuses: { id: string; name: string }[]
}

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    institutionId: "",
    campusId: "",
    studentId: "",
    level: "",
    programme: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/institutions")
      .then(r => r.json())
      .then(d => { if (d.success) setInstitutions(d.data) })
  }, [])

  const selectedInstitution = institutions.find(i => i.id === form.institutionId)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value, ...(name === "institutionId" ? { campusId: "" } : {}) }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }))
  }

  function validateStep1() {
    const errs: Record<string, string> = {}
    if (!form.fullName.trim() || form.fullName.length < 2) errs.fullName = "Full name must be at least 2 characters."
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Please enter a valid email address."
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters."
    if (!/[A-Z]/.test(form.password)) errs.password = "Password must contain at least one uppercase letter."
    if (!/[0-9]/.test(form.password)) errs.password = "Password must contain at least one number."
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match."
    return errs
  }

  function nextStep() {
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          phone: form.phone.trim() || undefined,
          institutionId: form.institutionId || undefined,
          campusId: form.campusId || undefined,
          studentId: form.studentId.trim() || undefined,
          level: form.level || undefined,
          programme: form.programme.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || "Registration failed. Please try again.")
        if (data.errors) {
          const fieldErrors: Record<string, string> = {}
          Object.entries(data.errors).forEach(([key, val]) => {
            if (Array.isArray(val)) fieldErrors[key] = val[0]
          })
          setErrors(fieldErrors)
          if (Object.keys(fieldErrors).some(k => ["fullName", "email", "password", "confirmPassword"].includes(k))) {
            setStep(1)
          }
        }
      } else {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 2000)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created! 🎉</h2>
          <p className="text-gray-500 mb-4">
            Welcome to Student Marketplace! You can now sign in.
          </p>
          <p className="text-sm text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-800 flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">
              Student<span className="text-green-800">Market</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 mb-6">Join thousands of students buying and selling on campus.</p>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    s < step ? "bg-green-800 text-white" :
                    s === step ? "bg-green-800 text-white ring-4 ring-green-200" :
                    "bg-gray-100 text-gray-400"
                  )}
                >
                  {s < step ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                <span className={cn("text-sm font-medium hidden sm:block", s === step ? "text-green-800" : "text-gray-400")}>
                  {s === 1 ? "Account" : "Profile"}
                </span>
                {s < 2 && <div className={cn("flex-1 h-0.5 w-8", s < step ? "bg-green-800" : "bg-gray-200")} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1 — Account Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label htmlFor="fullName" className="label">Full name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Kwame Mensah"
                    className={cn("input", errors.fullName && "input-error")}
                    required
                    autoFocus
                  />
                  {errors.fullName && <p className="error-text">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="label">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@university.edu.gh"
                    className={cn("input", errors.email && "input-error")}
                    required
                  />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="label">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="At least 8 characters"
                      className={cn("input pr-10", errors.password && "input-error")}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="error-text">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">Confirm password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      className={cn("input pr-10", errors.confirmPassword && "input-error")}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary btn-lg w-full"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2 — Profile Info */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label htmlFor="phone" className="label">Phone number <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0244 123 456"
                    className="input"
                  />
                  <p className="text-xs text-gray-400 mt-1">Ghana number: 024X or +233 24X</p>
                </div>

                <div>
                  <label htmlFor="institutionId" className="label">Institution <span className="text-gray-400 font-normal">(optional)</span></label>
                  <select
                    id="institutionId"
                    name="institutionId"
                    value={form.institutionId}
                    onChange={handleChange}
                    className="select"
                  >
                    <option value="">Select your institution</option>
                    {institutions.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>

                {selectedInstitution && selectedInstitution.campuses.length > 0 && (
                  <div>
                    <label htmlFor="campusId" className="label">Campus</label>
                    <select
                      id="campusId"
                      name="campusId"
                      value={form.campusId}
                      onChange={handleChange}
                      className="select"
                    >
                      <option value="">Select campus</option>
                      {selectedInstitution.campuses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="level" className="label">Year/Level</label>
                    <select
                      id="level"
                      name="level"
                      value={form.level}
                      onChange={handleChange}
                      className="select"
                    >
                      <option value="">Select level</option>
                      {STUDENT_LEVELS.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="studentId" className="label">Student ID</label>
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      value={form.studentId}
                      onChange={handleChange}
                      placeholder="e.g. 20XXXXXX"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="programme" className="label">Programme / Course</label>
                  <input
                    id="programme"
                    name="programme"
                    type="text"
                    value={form.programme}
                    onChange={handleChange}
                    placeholder="e.g. BSc Computer Science"
                    className="input"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-ghost btn-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary btn-lg flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-green-800 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Illustration */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-12">
        <div className="text-white max-w-md text-center">
          <div className="text-7xl mb-6">🎓</div>
          <h2 className="text-3xl font-bold mb-4">Join the Community</h2>
          <p className="text-white/70 text-lg mb-8">
            Thousands of students at KNUST, UG, UCC and more are already trading on campus.
          </p>
          <div className="space-y-3 text-left">
            {[
              "✅ Free to join — always",
              "✅ Verified student community",
              "✅ Safe campus trading",
              "✅ Messaging & notifications",
              "✅ Ratings & reviews system",
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-white/80 text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
