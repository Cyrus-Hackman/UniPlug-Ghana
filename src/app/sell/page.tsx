"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/layout/navbar"
import {
  Upload,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toaster"
import { useEffect } from "react"
import Link from "next/link"

interface UploadedImage {
  id: string
  url: string
  path?: string
  isPrimary: boolean
  file?: File
  uploading?: boolean
}

interface FormData {
  title: string
  description: string
  categoryId: string
  subcategoryId: string
  type: string
  condition: string
  price: string
  priceType: string
  isNegotiable: boolean
  isFree: boolean
  dailyRate: string
  weeklyRate: string
  deposit: string
  maxLendingDays: string
  availableFrom: string
  availableTo: string
  lendingTerms: string
  exchangeFor: string
  exchangeExtra: string
  institutionId: string
  campusId: string
  area: string
  meetingLocation: string
  tags: string
}

export default function SellPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [publishedListingSlug, setPublishedListingSlug] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [institutions, setInstitutions] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    type: "SELL",
    condition: "GOOD",
    price: "",
    priceType: "FIXED",
    isNegotiable: false,
    isFree: false,
    dailyRate: "",
    weeklyRate: "",
    deposit: "",
    maxLendingDays: "",
    availableFrom: "",
    availableTo: "",
    lendingTerms: "",
    exchangeFor: "",
    exchangeExtra: "",
    institutionId: "",
    campusId: "",
    area: "",
    meetingLocation: "",
    tags: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/sell")
    fetch("/api/categories").then(r => r.json()).then(d => { if (d.success) setCategories(d.data) })
    fetch("/api/institutions").then(r => r.json()).then(d => { if (d.success) setInstitutions(d.data) })
  }, [status])

  const selectedCategory = categories.find(c => c.id === form.categoryId)
  const selectedInstitution = institutions.find(i => i.id === form.institutionId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "institutionId" ? { campusId: "" } : {}),
      ...(name === "categoryId" ? { subcategoryId: "" } : {}),
      ...(name === "type" && value === "GIVEAWAY" ? { isFree: true, priceType: "FREE", price: "" } : {}),
    }))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 8) {
      toast({ title: "Too many images", description: "You can upload up to 8 images.", variant: "error" })
      return
    }

    for (const file of files) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        toast({ title: "Invalid file", description: "Only JPEG, PNG, and WebP images are allowed.", variant: "error" })
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Images must be smaller than 5MB.", variant: "error" })
        continue
      }

      const tempId = Math.random().toString(36).slice(2)
      const tempUrl = URL.createObjectURL(file)

      setImages(prev => [
        ...prev,
        { id: tempId, url: tempUrl, isPrimary: prev.length === 0, file, uploading: true },
      ])

      // In a real implementation, upload here; for dev, we'll store the local URL
      // and attach it to the listing creation
      setTimeout(() => {
        setImages(prev => prev.map(img => img.id === tempId ? { ...img, uploading: false } : img))
      }, 800)
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true
      }
      return filtered
    })
  }

  const setPrimaryImage = (id: string) => {
    setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === id })))
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast({ title: "Error", description: "Please add a title.", variant: "error" }); return }
    if (!form.description.trim()) { toast({ title: "Error", description: "Please add a description.", variant: "error" }); return }
    if (!form.categoryId) { toast({ title: "Error", description: "Please select a category.", variant: "error" }); return }

    setSubmitting(true)
    try {
      const payload: any = {
        ...form,
        price: form.price && !form.isFree ? parseFloat(form.price) : null,
        dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : null,
        weeklyRate: form.weeklyRate ? parseFloat(form.weeklyRate) : null,
        deposit: form.deposit ? parseFloat(form.deposit) : null,
        maxLendingDays: form.maxLendingDays ? parseInt(form.maxLendingDays) : null,
        exchangeExtra: form.exchangeExtra ? parseFloat(form.exchangeExtra) : null,
        tags: form.tags ? form.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [],
        subcategoryId: form.subcategoryId || null,
        institutionId: form.institutionId || null,
        campusId: form.campusId || null,
        availableFrom: form.availableFrom || null,
        availableTo: form.availableTo || null,
        status: "ACTIVE",
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!data.success) {
        toast({ title: "Error", description: data.error || "Failed to create listing.", variant: "error" })
        return
      }

      const listingId = data.data.id
      const listingSlug = data.data.slug

      // Add images to the listing
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        await prisma_createListingImage(listingId, img.url, img.isPrimary, i)
      }

      setPublishedListingSlug(listingSlug)
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  async function prisma_createListingImage(listingId: string, url: string, isPrimary: boolean, sortOrder: number) {
    // In a real implementation, call an API endpoint to save image
    await fetch("/api/listings/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, url, isPrimary, sortOrder }),
    }).catch(() => {})
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-green-800" /></div>
  }

  // Success screen
  if (publishedListingSlug) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-sm animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your listing is live! 🎉</h1>
            <p className="text-gray-500 mb-8">Students at your institution can now see and contact you about it.</p>
            <div className="flex flex-col gap-3">
              <Link href={`/listing/${publishedListingSlug}`} className="btn-primary btn-lg">
                View Listing
              </Link>
              <button onClick={() => { setPublishedListingSlug(null); setStep(1); setImages([]); setForm({ title: "", description: "", categoryId: "", subcategoryId: "", type: "SELL", condition: "GOOD", price: "", priceType: "FIXED", isNegotiable: false, isFree: false, dailyRate: "", weeklyRate: "", deposit: "", maxLendingDays: "", availableFrom: "", availableTo: "", lendingTerms: "", exchangeFor: "", exchangeExtra: "", institutionId: "", campusId: "", area: "", meetingLocation: "", tags: "" }) }} className="btn-secondary btn-lg">
                <Plus className="w-4 h-4" />
                Create Another Listing
              </button>
              <Link href="/my-listings" className="text-sm text-gray-500 hover:text-gray-900">
                Go to My Listings →
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  const steps = [
    { num: 1, label: "Photos" },
    { num: 2, label: "Details" },
    { num: 3, label: "Pricing" },
    { num: 4, label: "Location" },
    { num: 5, label: "Review" },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container-main py-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Listing</h1>

          {/* Step Indicator */}
          <div className="flex items-center mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  className={cn(
                    "flex items-center gap-2 shrink-0",
                    s.num < step && "cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    s.num < step ? "bg-green-800 text-white" :
                    s.num === step ? "bg-green-800 text-white ring-4 ring-green-100" :
                    "bg-gray-100 text-gray-400"
                  )}>
                    {s.num < step ? "✓" : s.num}
                  </div>
                  <span className={cn("text-xs font-medium hidden sm:block", s.num === step ? "text-green-800" : "text-gray-400")}>
                    {s.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2", s.num < step ? "bg-green-800" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>

          <div className="card card-body">
            {/* Step 1 — Photos */}
            {step === 1 && (
              <div className="animate-fade-in space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Add Photos</h2>
                <p className="text-sm text-gray-500">Upload up to 8 photos. The first photo will be your main image.</p>

                {/* Image Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                      {img.isPrimary && (
                        <div className="absolute top-1 left-1">
                          <span className="badge bg-green-800 text-white text-[9px]">Main</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        {!img.isPrimary && (
                          <button
                            onClick={() => setPrimaryImage(img.id)}
                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-green-800"
                            title="Set as main photo"
                          >
                            ★
                          </button>
                        )}
                        <button
                          onClick={() => removeImage(img.id)}
                          className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-red-500"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {images.length < 8 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-green-500 hover:bg-green-50/50 transition-all text-gray-400 hover:text-green-600"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-medium">{images.length === 0 ? "Add Photo" : "Add More"}</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <p className="text-xs text-gray-400">Max 5MB per image. JPEG, PNG, or WebP.</p>

                <div className="flex justify-end">
                  <button onClick={() => setStep(2)} className="btn-primary btn-md">
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 2 && (
              <div className="animate-fade-in space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Listing Details</h2>

                <div>
                  <label className="label">Title *</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="What are you selling?" className="input" maxLength={100} />
                  <p className="text-xs text-gray-400 mt-1">{form.title.length}/100</p>
                </div>

                <div>
                  <label className="label">Description *</label>
                  <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your item — condition, features, reason for selling..." className="input min-h-[120px]" maxLength={2000} />
                  <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category *</label>
                    <select name="categoryId" value={form.categoryId} onChange={handleChange} className="select">
                      <option value="">Select category</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory?.subcategories?.length > 0 && (
                    <div>
                      <label className="label">Subcategory</label>
                      <select name="subcategoryId" value={form.subcategoryId} onChange={handleChange} className="select">
                        <option value="">Select subcategory</option>
                        {selectedCategory.subcategories.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Transaction type *</label>
                    <select name="type" value={form.type} onChange={handleChange} className="select">
                      <option value="SELL">For Sale</option>
                      <option value="EXCHANGE">Exchange / Swap</option>
                      <option value="LEND">For Lending</option>
                      <option value="GIVEAWAY">Free / Giveaway</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Condition *</label>
                    <select name="condition" value={form.condition} onChange={handleChange} className="select">
                      <option value="NEW">New</option>
                      <option value="LIKE_NEW">Like New</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="USED">Used</option>
                    </select>
                  </div>
                </div>

                {form.type === "EXCHANGE" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-blue-900 text-sm">Exchange Details</h3>
                    <div>
                      <label className="label">What do you want in exchange?</label>
                      <input name="exchangeFor" value={form.exchangeFor} onChange={handleChange} placeholder="e.g. Scientific calculator, laptop bag..." className="input" />
                    </div>
                    <div>
                      <label className="label">Additional cash you want (GH₵, optional)</label>
                      <input type="number" name="exchangeExtra" value={form.exchangeExtra} onChange={handleChange} placeholder="0" className="input" min={0} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Tags (comma-separated, optional)</label>
                  <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. engineering, calculus, textbook" className="input" />
                </div>

                <div className="flex gap-3 justify-between">
                  <button onClick={() => setStep(1)} className="btn-ghost btn-md"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <button onClick={() => form.title && form.description && form.categoryId && form.type ? setStep(3) : toast({ title: "Error", description: "Please fill in all required fields.", variant: "error" })} className="btn-primary btn-md">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Pricing */}
            {step === 3 && (
              <div className="animate-fade-in space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Pricing</h2>

                {form.type === "SELL" && (
                  <>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isFree" checked={form.isFree} onChange={handleChange} className="accent-green-700 w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700">Give away for free</span>
                      </label>
                    </div>

                    {!form.isFree && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="label">Price (GH₵) *</label>
                            <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" className="input" min={0} step="0.01" />
                          </div>
                          <div>
                            <label className="label">Price type</label>
                            <select name="priceType" value={form.priceType} onChange={handleChange} className="select">
                              <option value="FIXED">Fixed Price</option>
                              <option value="NEGOTIABLE">Negotiable</option>
                              <option value="CONTACT">Contact for Price</option>
                            </select>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="isNegotiable" checked={form.isNegotiable} onChange={handleChange} className="accent-green-700 w-4 h-4" />
                          <span className="text-sm text-gray-700">Price is negotiable</span>
                        </label>
                      </>
                    )}
                  </>
                )}

                {form.type === "LEND" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Daily rate (GH₵)</label>
                        <input type="number" name="dailyRate" value={form.dailyRate} onChange={handleChange} placeholder="0.00" className="input" min={0} />
                      </div>
                      <div>
                        <label className="label">Weekly rate (GH₵)</label>
                        <input type="number" name="weeklyRate" value={form.weeklyRate} onChange={handleChange} placeholder="0.00" className="input" min={0} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Deposit (GH₵)</label>
                        <input type="number" name="deposit" value={form.deposit} onChange={handleChange} placeholder="0.00" className="input" min={0} />
                      </div>
                      <div>
                        <label className="label">Max duration (days)</label>
                        <input type="number" name="maxLendingDays" value={form.maxLendingDays} onChange={handleChange} placeholder="30" className="input" min={1} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Available from</label>
                        <input type="date" name="availableFrom" value={form.availableFrom} onChange={handleChange} className="input" />
                      </div>
                      <div>
                        <label className="label">Available until</label>
                        <input type="date" name="availableTo" value={form.availableTo} onChange={handleChange} className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Lending conditions (optional)</label>
                      <textarea name="lendingTerms" value={form.lendingTerms} onChange={handleChange} placeholder="Any specific conditions for borrowers..." className="input min-h-[80px]" />
                    </div>
                  </div>
                )}

                {(form.type === "EXCHANGE" || form.type === "GIVEAWAY") && (
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                    {form.type === "EXCHANGE" ? "Pricing is set through the exchange offer negotiation." : "This item will be listed as free."}
                  </div>
                )}

                <div className="flex gap-3 justify-between">
                  <button onClick={() => setStep(2)} className="btn-ghost btn-md"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <button onClick={() => setStep(4)} className="btn-primary btn-md">Continue <ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* Step 4 — Location */}
            {step === 4 && (
              <div className="animate-fade-in space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Location</h2>
                <p className="text-sm text-gray-500">Help buyers find you. We never share your exact address.</p>

                <div>
                  <label className="label">Institution</label>
                  <select name="institutionId" value={form.institutionId} onChange={handleChange} className="select">
                    <option value="">Select institution</option>
                    {institutions.map((i: any) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>

                {selectedInstitution?.campuses?.length > 0 && (
                  <div>
                    <label className="label">Campus</label>
                    <select name="campusId" value={form.campusId} onChange={handleChange} className="select">
                      <option value="">Select campus</option>
                      {selectedInstitution.campuses.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">Area / Hostel (optional)</label>
                  <input name="area" value={form.area} onChange={handleChange} placeholder="e.g. Volta Hall, Commonwealth Hall, Block C" className="input" />
                </div>

                <div>
                  <label className="label">Preferred meeting location (optional)</label>
                  <input name="meetingLocation" value={form.meetingLocation} onChange={handleChange} placeholder="e.g. Student Union Building, Main Library" className="input" />
                </div>

                <div className="flex gap-3 justify-between">
                  <button onClick={() => setStep(3)} className="btn-ghost btn-md"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <button onClick={() => setStep(5)} className="btn-primary btn-md">Preview <ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* Step 5 — Review & Publish */}
            {step === 5 && (
              <div className="animate-fade-in space-y-5">
                <h2 className="text-lg font-bold text-gray-900">Review & Publish</h2>

                {/* Preview */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  {images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={images[0].url} alt="Main" className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("badge", {
                        "badge-green": form.type === "SELL",
                        "badge-blue": form.type === "EXCHANGE",
                        "badge-purple": form.type === "LEND",
                        "badge-gold": form.type === "GIVEAWAY",
                      })}>
                        {form.type === "SELL" ? "For Sale" : form.type === "EXCHANGE" ? "Exchange" : form.type === "LEND" ? "For Lending" : "Free"}
                      </span>
                      <span className="badge badge-gray">{form.condition}</span>
                    </div>
                    <h3 className="font-bold text-gray-900">{form.title || "Your listing title"}</h3>
                    <p className="text-2xl font-bold text-green-800 mt-1">
                      {form.isFree || form.type === "GIVEAWAY" ? "Free" : form.price ? `GH₵ ${parseFloat(form.price).toLocaleString()}` : "Price not set"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">{form.description}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Category:</span><span className="font-medium">{categories.find((c: any) => c.id === form.categoryId)?.name || "Not selected"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Images:</span><span className="font-medium">{images.length} photo{images.length !== 1 ? "s" : ""}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Institution:</span><span className="font-medium">{institutions.find((i: any) => i.id === form.institutionId)?.shortName || institutions.find((i: any) => i.id === form.institutionId)?.name || "Not specified"}</span></div>
                </div>

                <div className="flex gap-3 justify-between">
                  <button onClick={() => setStep(4)} className="btn-ghost btn-md"><ChevronLeft className="w-4 h-4" /> Back</button>
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary btn-lg">
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                    ) : (
                      "🚀 Publish Listing"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
