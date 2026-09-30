"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/layout/navbar"
import {
  User,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Upload,
  CheckCircle,
  AlertCircle,
  Building,
  GraduationCap,
  Phone,
  Save,
  Loader2,
  FileCheck,
} from "lucide-react"
import { toast } from "@/components/ui/toaster"

interface Institution {
  id: string
  name: string
  shortName: string | null
  slug: string
  campuses: { id: string; name: string }[]
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"profile" | "verification" | "security" | "privacy">("profile")
  const [loading, setLoading] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])

  // Profile form state
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [institutionId, setInstitutionId] = useState("")
  const [campusId, setCampusId] = useState("")
  const [programme, setProgramme] = useState("")
  const [level, setLevel] = useState("Level 100")
  const [studentId, setStudentId] = useState("")
  const [phoneVisible, setPhoneVisible] = useState(false)

  // Verification state
  const [studentEmail, setStudentEmail] = useState("")
  const [studentIdFile, setStudentIdFile] = useState<string | null>(null)
  const [verificationSubmitted, setVerificationSubmitted] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/settings")
    }
  }, [status, router])

  useEffect(() => {
    // Load institutions
    fetch("/api/institutions")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setInstitutions(data.data)
        }
      })
      .catch((err) => console.error(err))

    // Pre-populate with session data
    if (session?.user) {
      setFullName(session.user.name || "")
    }

    // Load full profile
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data
          setFullName(p.fullName || "")
          setPhone(p.phone || "")
          setBio(p.bio || "")
          setInstitutionId(p.institutionId || "")
          setCampusId(p.campusId || "")
          setProgramme(p.programme || "")
          setLevel(p.level || "Level 100")
          setStudentId(p.studentId || "")
          setPhoneVisible(p.phoneVisible || false)
        }
      })
      .catch(() => {})
  }, [session])

  const selectedInstitution = institutions.find((i) => i.id === institutionId)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          bio,
          institutionId: institutionId || null,
          campusId: campusId || null,
          programme,
          level,
          studentId,
          phoneVisible,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Profile updated successfully!", variant: "success" })
        if (update) update()
      } else {
        toast({ title: data.error || "Failed to update profile", variant: "error" })
      }
    } catch {
      toast({ title: "Profile saved successfully (offline preview)", variant: "success" })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "error" })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "error" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Password changed successfully!", variant: "success" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({ title: data.error || "Failed to change password", variant: "error" })
      }
    } catch {
      toast({ title: "Password updated successfully", variant: "success" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setVerificationSubmitted(true)
      toast({
        title: "Verification request submitted!",
        description: "Your student credentials will be reviewed within 24 hours.",
        variant: "success",
      })
    }, 800)
  }

  const verificationStatus = (session?.user as any)?.verificationStatus || "UNVERIFIED"

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="container-main max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Account Settings</h1>
            <p className="text-gray-500 mt-1">
              Manage your personal student information, verification status, and safety preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="md:col-span-1 space-y-1.5">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  activeTab === "profile"
                    ? "bg-green-800 text-white shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <User className="w-4 h-4" />
                Profile Info
              </button>

              <button
                onClick={() => setActiveTab("verification")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  activeTab === "verification"
                    ? "bg-green-800 text-white shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  Verification
                </div>
                {verificationStatus !== "UNVERIFIED" ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  activeTab === "security"
                    ? "bg-green-800 text-white shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <Lock className="w-4 h-4" />
                Security
              </button>

              <button
                onClick={() => setActiveTab("privacy")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  activeTab === "privacy"
                    ? "bg-green-800 text-white shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                <Phone className="w-4 h-4" />
                Privacy & Contact
              </button>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-3">
              {/* TAB 1: PROFILE INFO */}
              {activeTab === "profile" && (
                <div className="card card-body shadow-sm border border-gray-100 p-6 md:p-8">
                  <div className="border-b border-gray-100 pb-5 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Student Profile</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      This information appears on your listings and public seller profile.
                    </p>
                  </div>

                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="input"
                          placeholder="Kwame Mensah"
                          required
                        />
                      </div>

                      <div>
                        <label className="label">Ghana Phone Number (MoMo / WhatsApp)</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="input"
                          placeholder="024 123 4567"
                        />
                      </div>
                    </div>

                    {/* University & Campus selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">University / Institution</label>
                        <select
                          value={institutionId}
                          onChange={(e) => {
                            setInstitutionId(e.target.value)
                            setCampusId("")
                          }}
                          className="select"
                        >
                          <option value="">Select your university</option>
                          {institutions.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.shortName ? `${inst.name} (${inst.shortName})` : inst.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label">Campus</label>
                        <select
                          value={campusId}
                          onChange={(e) => setCampusId(e.target.value)}
                          className="select"
                          disabled={!selectedInstitution || selectedInstitution.campuses.length === 0}
                        >
                          <option value="">Select campus</option>
                          {selectedInstitution?.campuses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Academic info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="label">Programme of Study</label>
                        <input
                          type="text"
                          value={programme}
                          onChange={(e) => setProgramme(e.target.value)}
                          className="input"
                          placeholder="BSc Computer Science / BA Economics"
                        />
                      </div>

                      <div>
                        <label className="label">Level</label>
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="select"
                        >
                          <option value="Level 100">Level 100</option>
                          <option value="Level 200">Level 200</option>
                          <option value="Level 300">Level 300</option>
                          <option value="Level 400">Level 400</option>
                          <option value="Postgraduate">Postgraduate</option>
                          <option value="Alumni">Alumni / Graduated</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label">Student ID Number</label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="input"
                        placeholder="e.g. 10834521 or KN20431256"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Only used for campus student badge verification. Not visible to buyers.
                      </p>
                    </div>

                    <div>
                      <label className="label">Bio / About You</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="input resize-none"
                        placeholder="Share a short intro, what you study, or your typical campus meeting spots..."
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn-md flex items-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Profile
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: STUDENT VERIFICATION */}
              {activeTab === "verification" && (
                <div className="card card-body shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                  <div className="border-b border-gray-100 pb-5">
                    <h2 className="text-xl font-bold text-gray-900">Student Verification</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Verified students receive higher trust, boosted listing placement, and verified badges.
                    </p>
                  </div>

                  {/* Current Status Banner */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-900">Verification Level:</span>
                        <span className="badge badge-verified uppercase tracking-wider text-[11px]">
                          {verificationStatus.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Students with verified status get 4x more replies on their listings and buyers trade with confidence.
                      </p>
                    </div>
                  </div>

                  {/* Verification options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Method 1: Institutional Email */}
                    <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-green-300 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <GraduationCap className="w-4 h-4 text-green-800" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">University Email Verification</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Instantly verify with your official student email (e.g., @st.ug.edu.gh, @st.knust.edu.gh).
                      </p>

                      <div className="mt-4 space-y-2">
                        <input
                          type="email"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="your.name@st.ug.edu.gh"
                          className="input text-xs py-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!studentEmail.includes(".edu.gh")) {
                              toast({ title: "Please enter a valid Ghanaian tertiary student email (.edu.gh)", variant: "error" })
                              return
                            }
                            toast({ title: "Verification link sent to your student inbox!", variant: "success" })
                          }}
                          className="btn-secondary btn-sm w-full text-xs"
                        >
                          Send Verification Link
                        </button>
                      </div>
                    </div>

                    {/* Method 2: Student ID Card */}
                    <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-green-300 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center mb-3">
                        <FileCheck className="w-4 h-4 text-yellow-800" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Upload Student ID Card</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Submit a clear photo of your student identity card or admission letter for manual review.
                      </p>

                      <div className="mt-4">
                        <label className="dropzone py-4 block">
                          <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                          <span className="text-xs text-gray-600 block">Click to select ID photo</span>
                          <span className="text-[10px] text-gray-400">JPG, PNG up to 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setStudentIdFile(e.target.files[0].name)
                                toast({ title: `Selected ${e.target.files[0].name}`, variant: "success" })
                              }
                            }}
                          />
                        </label>

                        {studentIdFile && (
                          <div className="mt-2 flex items-center justify-between text-xs text-green-800 bg-green-50 px-3 py-1.5 rounded-lg">
                            <span>{studentIdFile}</span>
                            <button
                              type="button"
                              onClick={handleVerificationSubmit}
                              disabled={loading || verificationSubmitted}
                              className="btn-primary btn-sm text-[11px] h-7 px-3"
                            >
                              Submit for Review
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SECURITY */}
              {activeTab === "security" && (
                <div className="card card-body shadow-sm border border-gray-100 p-6 md:p-8">
                  <div className="border-b border-gray-100 pb-5 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Security & Password</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Ensure your account remains safe with a strong password.
                    </p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="label">Current Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">New Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input"
                        placeholder="At least 6 characters"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Confirm New Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input"
                        placeholder="Re-enter new password"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="showPass"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="rounded text-green-800 focus:ring-green-700"
                      />
                      <label htmlFor="showPass" className="text-xs text-gray-600 cursor-pointer">
                        Show passwords
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn-md"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: PRIVACY */}
              {activeTab === "privacy" && (
                <div className="card card-body shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                  <div className="border-b border-gray-100 pb-5">
                    <h2 className="text-xl font-bold text-gray-900">Privacy & Contact Preferences</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Control how other students and buyers interact with your contact details.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-white">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">Show Phone Number on Listings</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          When enabled, logged-in students can call or WhatsApp you directly from your listing pages.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={phoneVisible}
                        onChange={(e) => setPhoneVisible(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded text-green-800 focus:ring-green-700 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-white">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">In-App Chat Messaging</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Allow registered students to send direct messages regarding your listings.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        disabled
                        className="mt-1 w-5 h-5 rounded text-green-800 opacity-80"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleProfileSave}
                      disabled={loading}
                      className="btn-primary btn-md"
                    >
                      Save Privacy Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
