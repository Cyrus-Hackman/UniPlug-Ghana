// Fallback / seed mock data for Ghanaian university marketplace
// Used when database server is not yet configured or temporarily unreachable

export interface MockInstitution {
  id: string
  name: string
  shortName: string
  slug: string
  emailDomain?: string
  location?: string
  region?: string
  campuses: { id: string; name: string; slug: string }[]
}

export interface MockCategory {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  sortOrder: number
  subcategories: { id: string; name: string; slug: string }[]
}

export interface MockListing {
  id: string
  title: string
  slug: string
  description: string
  price: number | null
  priceType: "FIXED" | "NEGOTIABLE" | "FREE" | "CONTACT"
  isNegotiable: boolean
  isFree: boolean
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "USED"
  type: "SELL" | "EXCHANGE" | "LEND" | "GIVEAWAY"
  status: "ACTIVE" | "RESERVED" | "SOLD"
  views: number
  isFeatured: boolean
  dailyRate?: number
  weeklyRate?: number
  deposit?: number
  exchangeFor?: string
  area?: string
  tags: string[]
  createdAt: string
  category: { id: string; name: string; slug: string; icon: string; color: string }
  institution: { id: string; name: string; shortName: string; slug: string }
  campus?: { id: string; name: string; slug: string }
  seller: {
    id: string
    verificationStatus: "UNVERIFIED" | "EMAIL_VERIFIED" | "STUDENT_VERIFIED" | "FULLY_VERIFIED"
    profile: {
      fullName: string
      avatarUrl: string | null
      averageRating: number
      ratingCount: number
    }
  }
  images: { id: string; url: string; isPrimary: boolean }[]
  _count: { favourites: number }
}

export const MOCK_INSTITUTIONS: MockInstitution[] = [
  {
    id: "inst-ug",
    name: "University of Ghana",
    shortName: "UG",
    slug: "ug",
    emailDomain: "st.ug.edu.gh",
    location: "Legon, Accra",
    region: "Greater Accra",
    campuses: [
      { id: "camp-ug-1", name: "Main Campus (Legon)", slug: "legon" },
      { id: "camp-ug-2", name: "Korle-Bu Campus", slug: "korle-bu" },
      { id: "camp-ug-3", name: "City Campus", slug: "city-campus" },
    ],
  },
  {
    id: "inst-knust",
    name: "Kwame Nkrumah University of Science and Technology",
    shortName: "KNUST",
    slug: "knust",
    emailDomain: "st.knust.edu.gh",
    location: "Kumasi",
    region: "Ashanti",
    campuses: [
      { id: "camp-knust-1", name: "Main Campus", slug: "main-campus" },
      { id: "camp-knust-2", name: "College of Health Sciences", slug: "health-sciences" },
    ],
  },
  {
    id: "inst-ucc",
    name: "University of Cape Coast",
    shortName: "UCC",
    slug: "ucc",
    emailDomain: "ucc.edu.gh",
    location: "Cape Coast",
    region: "Central",
    campuses: [{ id: "camp-ucc-1", name: "Main Campus", slug: "main-campus" }],
  },
  {
    id: "inst-ashesi",
    name: "Ashesi University",
    shortName: "Ashesi",
    slug: "ashesi",
    emailDomain: "ashesi.edu.gh",
    location: "Berekuso",
    region: "Eastern",
    campuses: [{ id: "camp-ash-1", name: "Main Campus (Berekuso)", slug: "berekuso" }],
  },
  {
    id: "inst-uew",
    name: "University of Education, Winneba",
    shortName: "UEW",
    slug: "uew",
    location: "Winneba",
    region: "Central",
    campuses: [{ id: "camp-uew-1", name: "Winneba Campus", slug: "winneba" }],
  },
  {
    id: "inst-gimpa",
    name: "Ghana Institute of Management and Public Administration",
    shortName: "GIMPA",
    slug: "gimpa",
    location: "Greenhill, Accra",
    region: "Greater Accra",
    campuses: [{ id: "camp-gimpa-1", name: "Greenhill Campus", slug: "greenhill" }],
  },
]

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: "cat-textbooks",
    name: "Textbooks & Study Materials",
    slug: "textbooks-study-materials",
    icon: "📚",
    color: "#2d8a5a",
    sortOrder: 1,
    subcategories: [
      { id: "sub-1", name: "Textbooks", slug: "textbooks" },
      { id: "sub-2", name: "Past Questions", slug: "past-questions" },
      { id: "sub-3", name: "Lecture Notes", slug: "lecture-notes" },
      { id: "sub-4", name: "Calculators", slug: "calculators" },
    ],
  },
  {
    id: "cat-electronics",
    name: "Electronics",
    slug: "electronics",
    icon: "💻",
    color: "#1a5fb4",
    sortOrder: 2,
    subcategories: [
      { id: "sub-5", name: "Laptops", slug: "laptops" },
      { id: "sub-6", name: "Phones", slug: "phones" },
      { id: "sub-7", name: "Headphones", slug: "headphones" },
      { id: "sub-8", name: "Power Banks", slug: "power-banks" },
    ],
  },
  {
    id: "cat-fashion",
    name: "Fashion",
    slug: "fashion",
    icon: "👗",
    color: "#c64600",
    sortOrder: 3,
    subcategories: [
      { id: "sub-9", name: "Clothes", slug: "clothes" },
      { id: "sub-10", name: "Shoes", slug: "shoes" },
      { id: "sub-11", name: "Bags", slug: "bags" },
    ],
  },
  {
    id: "cat-school-supplies",
    name: "School Supplies",
    slug: "school-supplies",
    icon: "🎒",
    color: "#e5a50a",
    sortOrder: 4,
    subcategories: [
      { id: "sub-12", name: "Backpacks", slug: "backpacks" },
      { id: "sub-13", name: "Notebooks", slug: "notebooks" },
      { id: "sub-14", name: "Drawing Instruments", slug: "drawing-instruments" },
    ],
  },
  {
    id: "cat-dorm",
    name: "Dorm & Hostel",
    slug: "dorm-hostel",
    icon: "🛏️",
    color: "#865e3c",
    sortOrder: 5,
    subcategories: [
      { id: "sub-15", name: "Mattresses", slug: "mattresses" },
      { id: "sub-16", name: "Chairs & Desks", slug: "chairs-desks" },
      { id: "sub-17", name: "Appliances", slug: "appliances" },
    ],
  },
  {
    id: "cat-services",
    name: "Services",
    slug: "services",
    icon: "⚙️",
    color: "#613583",
    sortOrder: 6,
    subcategories: [
      { id: "sub-18", name: "Tutoring", slug: "tutoring" },
      { id: "sub-19", name: "Graphic Design", slug: "graphic-design" },
      { id: "sub-20", name: "Printing & Binding", slug: "printing-binding" },
    ],
  },
  {
    id: "cat-giveaway",
    name: "Free / Giveaway",
    slug: "free-giveaway",
    icon: "🎁",
    color: "#2ec27e",
    sortOrder: 7,
    subcategories: [
      { id: "sub-21", name: "Free Books", slug: "free-books" },
      { id: "sub-22", name: "Free Household", slug: "free-household" },
    ],
  },
]

export const MOCK_LISTINGS: MockListing[] = [
  {
    id: "list-1",
    title: "Calculus for Engineers - Stroud 7th Edition",
    slug: "calculus-for-engineers-stroud-7th-edition-ug001",
    description:
      "Excellent condition textbook for engineering mathematics. Used for only one semester at UG. All pages intact, minimal highlighting. Perfect for Level 100-200 Engineering and Computer Science students. Pickup around Volta Hall or Pent.",
    price: 85,
    priceType: "NEGOTIABLE",
    isNegotiable: true,
    isFree: false,
    condition: "GOOD",
    type: "SELL",
    status: "ACTIVE",
    views: 142,
    isFeatured: true,
    area: "Volta Hall",
    tags: ["engineering", "mathematics", "calculus", "textbook"],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    category: MOCK_CATEGORIES[0],
    institution: MOCK_INSTITUTIONS[0],
    campus: MOCK_INSTITUTIONS[0].campuses[0],
    seller: {
      id: "user-kwame",
      verificationStatus: "STUDENT_VERIFIED",
      profile: {
        fullName: "Kwame Mensah",
        avatarUrl: null,
        averageRating: 4.9,
        ratingCount: 14,
      },
    },
    images: [{ id: "img-1", url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", isPrimary: true }],
    _count: { favourites: 12 },
  },
  {
    id: "list-2",
    title: "HP Laptop 250 G8 - Core i5, 8GB RAM, 256GB SSD",
    slug: "hp-laptop-250-g8-core-i5-8gb-ram-ug002",
    description:
      "Lightly used HP laptop in mint condition. Ideal for programming, coursework, online lectures, and project presentations. Battery lasts 5+ hours. Comes with genuine charger and laptop sleeve.",
    price: 2800,
    priceType: "NEGOTIABLE",
    isNegotiable: true,
    isFree: false,
    condition: "LIKE_NEW",
    type: "SELL",
    status: "ACTIVE",
    views: 310,
    isFeatured: true,
    area: "Commonwealth Hall",
    tags: ["laptop", "hp", "computer", "programming"],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    category: MOCK_CATEGORIES[1],
    institution: MOCK_INSTITUTIONS[0],
    campus: MOCK_INSTITUTIONS[0].campuses[0],
    seller: {
      id: "user-kwame",
      verificationStatus: "STUDENT_VERIFIED",
      profile: {
        fullName: "Kwame Mensah",
        avatarUrl: null,
        averageRating: 4.9,
        ratingCount: 14,
      },
    },
    images: [{ id: "img-2", url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80", isPrimary: true }],
    _count: { favourites: 28 },
  },
  {
    id: "list-3",
    title: "Casio fx-991EX ClassWiz Scientific Calculator",
    slug: "casio-fx-991ex-classwiz-scientific-calculator-ug003",
    description:
      "Original Casio ClassWiz in perfect working condition. Solar and battery powered. Available for lending or rent per week during exam periods, or direct purchase.",
    price: 180,
    priceType: "FIXED",
    isNegotiable: false,
    isFree: false,
    condition: "GOOD",
    type: "LEND",
    dailyRate: 5,
    weeklyRate: 25,
    deposit: 50,
    status: "ACTIVE",
    views: 89,
    isFeatured: true,
    area: "Akuafo Hall",
    tags: ["calculator", "casio", "scientific", "maths"],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    category: MOCK_CATEGORIES[0],
    institution: MOCK_INSTITUTIONS[0],
    campus: MOCK_INSTITUTIONS[0].campuses[0],
    seller: {
      id: "user-ama",
      verificationStatus: "FULLY_VERIFIED",
      profile: {
        fullName: "Ama Asante",
        avatarUrl: null,
        averageRating: 5.0,
        ratingCount: 9,
      },
    },
    images: [{ id: "img-3", url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80", isPrimary: true }],
    _count: { favourites: 6 },
  },
  {
    id: "list-4",
    title: "KNUST Engineering Drawing Board & Instrument Set",
    slug: "knust-engineering-drawing-board-instrument-set-kn004",
    description:
      "Complete Level 100 Engineering Drawing Kit: A2 board, T-Square, 30/60 set squares, protractor, dividers and carrying case. Saved me in first year, passing it on to a fresher!",
    price: 130,
    priceType: "NEGOTIABLE",
    isNegotiable: true,
    isFree: false,
    condition: "GOOD",
    type: "SELL",
    status: "ACTIVE",
    views: 74,
    isFeatured: false,
    area: "Brunei Complex",
    tags: ["drawing", "engineering", "t-square", "knust"],
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    category: MOCK_CATEGORIES[3],
    institution: MOCK_INSTITUTIONS[1],
    campus: MOCK_INSTITUTIONS[1].campuses[0],
    seller: {
      id: "user-kofi",
      verificationStatus: "STUDENT_VERIFIED",
      profile: {
        fullName: "Kofi Boateng",
        avatarUrl: null,
        averageRating: 4.8,
        ratingCount: 11,
      },
    },
    images: [{ id: "img-4", url: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80", isPrimary: true }],
    _count: { favourites: 4 },
  },
  {
    id: "list-5",
    title: "Single Bed High-Density Foam Mattress (6 inches)",
    slug: "single-bed-high-density-foam-mattress-kn005",
    description:
      "Clean 6-inch high-density foam mattress, bought new last semester for hostel stay. Graduating student moving out. Sanitized, odor-free, non-sagging. Pick up at Pent Hall.",
    price: 220,
    priceType: "NEGOTIABLE",
    isNegotiable: true,
    isFree: false,
    condition: "GOOD",
    type: "SELL",
    status: "ACTIVE",
    views: 195,
    isFeatured: false,
    area: "Pent Hall",
    tags: ["mattress", "dorm", "hostel", "bed"],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    category: MOCK_CATEGORIES[4],
    institution: MOCK_INSTITUTIONS[1],
    campus: MOCK_INSTITUTIONS[1].campuses[0],
    seller: {
      id: "user-abena",
      verificationStatus: "STUDENT_VERIFIED",
      profile: {
        fullName: "Abena Osei",
        avatarUrl: null,
        averageRating: 4.7,
        ratingCount: 8,
      },
    },
    images: [{ id: "img-5", url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80", isPrimary: true }],
    _count: { favourites: 15 },
  },
  {
    id: "list-6",
    title: "Intro to Python & Discrete Maths Textbooks - Free Giveaway",
    slug: "intro-to-python-discrete-maths-textbooks-giveaway-ash006",
    description:
      "Donating my Level 100 Computer Science textbooks free to any Ashesi fresher or tertiary student who needs them. Includes Python Programming (Zelle) and Discrete Mathematics notes.",
    price: 0,
    priceType: "FREE",
    isNegotiable: false,
    isFree: true,
    condition: "GOOD",
    type: "GIVEAWAY",
    status: "ACTIVE",
    views: 240,
    isFeatured: true,
    area: "Campus Courtyard",
    tags: ["free", "python", "programming", "cs"],
    createdAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    category: MOCK_CATEGORIES[6],
    institution: MOCK_INSTITUTIONS[3],
    campus: MOCK_INSTITUTIONS[3].campuses[0],
    seller: {
      id: "user-yaw",
      verificationStatus: "FULLY_VERIFIED",
      profile: {
        fullName: "Yaw Darko",
        avatarUrl: null,
        averageRating: 5.0,
        ratingCount: 19,
      },
    },
    images: [{ id: "img-6", url: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80", isPrimary: true }],
    _count: { favourites: 42 },
  },
  {
    id: "list-7",
    title: "Anatomy & Physiology for Nurses + Lab Coat (Size M)",
    slug: "anatomy-physiology-for-nurses-plus-lab-coat-kn007",
    description:
      "Core nursing textbook (Marieb 10th Ed) paired with a clean, branded white lab coat size M. Willing to swap for Level 300 Pharmacology notes or sell directly.",
    price: 190,
    priceType: "NEGOTIABLE",
    isNegotiable: true,
    isFree: false,
    condition: "GOOD",
    type: "EXCHANGE",
    exchangeFor: "Level 300 Pharmacology Book or Clinical Guide",
    status: "ACTIVE",
    views: 112,
    isFeatured: false,
    area: "College of Health Sciences",
    tags: ["nursing", "medical", "lab-coat", "textbook"],
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    category: MOCK_CATEGORIES[0],
    institution: MOCK_INSTITUTIONS[1],
    campus: MOCK_INSTITUTIONS[1].campuses[1],
    seller: {
      id: "user-abena",
      verificationStatus: "STUDENT_VERIFIED",
      profile: {
        fullName: "Abena Osei",
        avatarUrl: null,
        averageRating: 4.7,
        ratingCount: 8,
      },
    },
    images: [{ id: "img-7", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80", isPrimary: true }],
    _count: { favourites: 9 },
  },
  {
    id: "list-8",
    title: "Apple AirPods Pro (2nd Gen) with MagSafe Case",
    slug: "apple-airpods-pro-2nd-gen-with-magsafe-case-ug008",
    description:
      "Original Apple AirPods Pro 2nd Gen. Active Noise Cancellation is amazing for studying in Balme Library or busy halls. Comes with box, silicone tips, and charging cable.",
    price: 950,
    priceType: "NEGOTIABLE",
    isNegotiable: true,
    isFree: false,
    condition: "LIKE_NEW",
    type: "SELL",
    status: "ACTIVE",
    views: 420,
    isFeatured: true,
    area: "Night Market / Sarbah Hall",
    tags: ["apple", "airpods", "audio", "noise-cancelling"],
    createdAt: new Date(Date.now() - 3600000 * 80).toISOString(),
    category: MOCK_CATEGORIES[1],
    institution: MOCK_INSTITUTIONS[0],
    campus: MOCK_INSTITUTIONS[0].campuses[0],
    seller: {
      id: "user-ama",
      verificationStatus: "FULLY_VERIFIED",
      profile: {
        fullName: "Ama Asante",
        avatarUrl: null,
        averageRating: 5.0,
        ratingCount: 9,
      },
    },
    images: [{ id: "img-8", url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80", isPrimary: true }],
    _count: { favourites: 35 },
  },
]
