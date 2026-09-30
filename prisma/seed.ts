import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Student Marketplace database...")

  // ============================================================
  // INSTITUTIONS
  // ============================================================
  const institutions = await Promise.all([
    prisma.institution.upsert({
      where: { slug: "ug" },
      update: {},
      create: {
        name: "University of Ghana",
        shortName: "UG",
        slug: "ug",
        emailDomain: "st.ug.edu.gh",
        location: "Legon, Accra",
        region: "Greater Accra",
        website: "https://ug.edu.gh",
        campuses: {
          create: [
            { name: "Main Campus (Legon)", slug: "legon" },
            { name: "Korle-Bu Campus", slug: "korle-bu" },
            { name: "City Campus", slug: "city-campus" },
          ],
        },
      },
    }),
    prisma.institution.upsert({
      where: { slug: "knust" },
      update: {},
      create: {
        name: "Kwame Nkrumah University of Science and Technology",
        shortName: "KNUST",
        slug: "knust",
        emailDomain: "st.knust.edu.gh",
        location: "Kumasi",
        region: "Ashanti",
        website: "https://knust.edu.gh",
        campuses: {
          create: [
            { name: "Main Campus", slug: "main-campus" },
            { name: "KNUST College of Health Sciences", slug: "health-sciences" },
          ],
        },
      },
    }),
    prisma.institution.upsert({
      where: { slug: "ucc" },
      update: {},
      create: {
        name: "University of Cape Coast",
        shortName: "UCC",
        slug: "ucc",
        emailDomain: "ucc.edu.gh",
        location: "Cape Coast",
        region: "Central",
        website: "https://ucc.edu.gh",
        campuses: {
          create: [
            { name: "Main Campus", slug: "main-campus" },
            { name: "School of Medical Sciences", slug: "sms" },
          ],
        },
      },
    }),
    prisma.institution.upsert({
      where: { slug: "uew" },
      update: {},
      create: {
        name: "University of Education, Winneba",
        shortName: "UEW",
        slug: "uew",
        location: "Winneba",
        region: "Central",
        website: "https://uew.edu.gh",
        campuses: {
          create: [
            { name: "Winneba Campus", slug: "winneba" },
            { name: "Kumasi Campus", slug: "kumasi" },
            { name: "Mampong Campus", slug: "mampong" },
          ],
        },
      },
    }),
    prisma.institution.upsert({
      where: { slug: "ashesi" },
      update: {},
      create: {
        name: "Ashesi University",
        shortName: "Ashesi",
        slug: "ashesi",
        emailDomain: "ashesi.edu.gh",
        location: "Berekuso",
        region: "Eastern",
        website: "https://ashesi.edu.gh",
        campuses: {
          create: [
            { name: "Main Campus (Berekuso)", slug: "berekuso" },
          ],
        },
      },
    }),
    prisma.institution.upsert({
      where: { slug: "gimpa" },
      update: {},
      create: {
        name: "Ghana Institute of Management and Public Administration",
        shortName: "GIMPA",
        slug: "gimpa",
        location: "Greenhill, Accra",
        region: "Greater Accra",
        website: "https://gimpa.edu.gh",
        campuses: {
          create: [
            { name: "Greenhill Campus", slug: "greenhill" },
          ],
        },
      },
    }),
    prisma.institution.upsert({
      where: { slug: "uds" },
      update: {},
      create: {
        name: "University for Development Studies",
        shortName: "UDS",
        slug: "uds",
        location: "Tamale",
        region: "Northern",
        website: "https://uds.edu.gh",
        campuses: {
          create: [
            { name: "Tamale Campus", slug: "tamale" },
            { name: "Wa Campus", slug: "wa" },
            { name: "Nyankpala Campus", slug: "nyankpala" },
          ],
        },
      },
    }),
    prisma.institution.upsert({
      where: { slug: "atu" },
      update: {},
      create: {
        name: "Accra Technical University",
        shortName: "ATU",
        slug: "atu",
        location: "Accra",
        region: "Greater Accra",
        campuses: {
          create: [
            { name: "Main Campus", slug: "main-campus" },
          ],
        },
      },
    }),
    prisma.institution.upsert({
      where: { slug: "takoradi-tech" },
      update: {},
      create: {
        name: "Takoradi Technical University",
        shortName: "TTU",
        slug: "takoradi-tech",
        location: "Takoradi",
        region: "Western",
        campuses: {
          create: [
            { name: "Main Campus", slug: "main-campus" },
          ],
        },
      },
    }),
  ])

  console.log(`✅ Created ${institutions.length} institutions`)

  // ============================================================
  // CATEGORIES
  // ============================================================
  const categoryData = [
    {
      name: "Textbooks & Study Materials",
      slug: "textbooks-study-materials",
      icon: "📚",
      color: "#2d8a5a",
      sortOrder: 1,
      subcategories: [
        { name: "Textbooks", slug: "textbooks" },
        { name: "Past Questions", slug: "past-questions" },
        { name: "Lecture Notes", slug: "lecture-notes" },
        { name: "Study Guides", slug: "study-guides" },
        { name: "Calculators", slug: "calculators" },
        { name: "Stationery", slug: "stationery" },
      ],
    },
    {
      name: "Electronics",
      slug: "electronics",
      icon: "💻",
      color: "#1a5fb4",
      sortOrder: 2,
      subcategories: [
        { name: "Laptops", slug: "laptops" },
        { name: "Phones", slug: "phones" },
        { name: "Tablets", slug: "tablets" },
        { name: "Headphones", slug: "headphones" },
        { name: "Speakers", slug: "speakers" },
        { name: "Chargers", slug: "chargers" },
        { name: "Power Banks", slug: "power-banks" },
        { name: "Computer Accessories", slug: "computer-accessories" },
      ],
    },
    {
      name: "Fashion",
      slug: "fashion",
      icon: "👗",
      color: "#c64600",
      sortOrder: 3,
      subcategories: [
        { name: "Clothes", slug: "clothes" },
        { name: "Shoes", slug: "shoes" },
        { name: "Bags", slug: "bags" },
        { name: "Watches", slug: "watches" },
        { name: "Accessories", slug: "accessories" },
      ],
    },
    {
      name: "School Supplies",
      slug: "school-supplies",
      icon: "🎒",
      color: "#e5a50a",
      sortOrder: 4,
      subcategories: [
        { name: "Backpacks", slug: "backpacks" },
        { name: "Notebooks", slug: "notebooks" },
        { name: "Pens & Pencils", slug: "pens-pencils" },
        { name: "Drawing Supplies", slug: "drawing-supplies" },
        { name: "Laboratory Supplies", slug: "laboratory-supplies" },
        { name: "Other Supplies", slug: "other-supplies" },
      ],
    },
    {
      name: "Dorm & Hostel",
      slug: "dorm-hostel",
      icon: "🛏️",
      color: "#865e3c",
      sortOrder: 5,
      subcategories: [
        { name: "Mattresses", slug: "mattresses" },
        { name: "Chairs", slug: "chairs" },
        { name: "Tables", slug: "tables" },
        { name: "Bedding", slug: "bedding" },
        { name: "Kitchen Items", slug: "kitchen-items" },
        { name: "Appliances", slug: "appliances" },
        { name: "Storage", slug: "storage" },
      ],
    },
    {
      name: "Services",
      slug: "services",
      icon: "⚙️",
      color: "#613583",
      sortOrder: 6,
      subcategories: [
        { name: "Tutoring", slug: "tutoring" },
        { name: "Graphic Design", slug: "graphic-design" },
        { name: "Photography", slug: "photography" },
        { name: "Printing", slug: "printing" },
        { name: "Web Development", slug: "web-development" },
        { name: "Hair & Beauty", slug: "hair-beauty" },
        { name: "Repairs", slug: "repairs" },
      ],
    },
    {
      name: "Free / Giveaway",
      slug: "free-giveaway",
      icon: "🎁",
      color: "#2ec27e",
      sortOrder: 7,
      subcategories: [
        { name: "Books", slug: "free-books" },
        { name: "Clothes", slug: "free-clothes" },
        { name: "Electronics", slug: "free-electronics" },
        { name: "Furniture", slug: "free-furniture" },
        { name: "Other", slug: "free-other" },
      ],
    },
  ]

  const categories: any[] = []
  for (const cat of categoryData) {
    const { subcategories, ...catData } = cat
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        ...catData,
        subcategories: { create: subcategories.map((s, i) => ({ ...s, sortOrder: i })) },
      },
    })
    categories.push(category)
  }

  console.log(`✅ Created ${categories.length} categories`)

  // ============================================================
  // ADMIN USER
  // ============================================================
  const adminEmail = process.env.ADMIN_EMAIL || "admin@studentmarketplace.gh"
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456"
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      verificationStatus: "FULLY_VERIFIED",
      profile: {
        create: {
          fullName: "Platform Admin",
          bio: "Student Marketplace platform administrator.",
        },
      },
    },
  })

  console.log(`✅ Admin user: ${adminEmail}`)

  // ============================================================
  // DEMO STUDENTS
  // ============================================================
  const ugInstitution = await prisma.institution.findUnique({ where: { slug: "ug" } })
  const knustInstitution = await prisma.institution.findUnique({ where: { slug: "knust" } })
  const ugLegonCampus = await prisma.campus.findFirst({ where: { slug: "legon", institutionId: ugInstitution?.id } })
  const knustMainCampus = await prisma.campus.findFirst({ where: { slug: "main-campus", institutionId: knustInstitution?.id } })

  const studentData = [
    {
      email: "kwame.mensah@st.ug.edu.gh",
      name: "Kwame Mensah",
      institution: ugInstitution?.id,
      campus: ugLegonCampus?.id,
      programme: "BSc Computer Science",
      level: "Level 300",
      studentId: "10834521",
    },
    {
      email: "ama.asante@st.ug.edu.gh",
      name: "Ama Asante",
      institution: ugInstitution?.id,
      campus: ugLegonCampus?.id,
      programme: "BA Economics",
      level: "Level 200",
      studentId: "10912345",
    },
    {
      email: "kofi.boateng@st.knust.edu.gh",
      name: "Kofi Boateng",
      institution: knustInstitution?.id,
      campus: knustMainCampus?.id,
      programme: "BSc Mechanical Engineering",
      level: "Level 400",
      studentId: "KN20431256",
    },
    {
      email: "abena.osei@st.knust.edu.gh",
      name: "Abena Osei",
      institution: knustInstitution?.id,
      campus: knustMainCampus?.id,
      programme: "BSc Nursing",
      level: "Level 300",
      studentId: "KN20512389",
    },
    {
      email: "yaw.darko@ashesi.edu.gh",
      name: "Yaw Darko",
      institution: await prisma.institution.findUnique({ where: { slug: "ashesi" } }).then(i => i?.id),
      campus: null,
      programme: "BA Business Administration",
      level: "Level 400",
      studentId: "ASH21045",
    },
  ]

  const studentPassword = await bcrypt.hash("Student@123", 12)
  const students: any[] = []

  for (const student of studentData) {
    const user = await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        email: student.email,
        passwordHash: studentPassword,
        role: "STUDENT",
        status: "ACTIVE",
        verificationStatus: "EMAIL_VERIFIED",
        profile: {
          create: {
            fullName: student.name,
            institutionId: student.institution || null,
            campusId: student.campus || null,
            programme: student.programme,
            level: student.level,
            studentId: student.studentId,
          },
        },
      },
    })
    students.push(user)
  }

  console.log(`✅ Created ${students.length} demo student accounts`)

  // ============================================================
  // DEMO LISTINGS
  // ============================================================
  const textbookCategory = categories.find((c: any) => c.slug === "textbooks-study-materials")
  const electronicsCategory = categories.find((c: any) => c.slug === "electronics")
  const dormCategory = categories.find((c: any) => c.slug === "dorm-hostel")
  const fashionCategory = categories.find((c: any) => c.slug === "fashion")
  const freeCategory = categories.find((c: any) => c.slug === "free-giveaway")

  const listingsData = [
    {
      sellerId: students[0].id,
      title: "Calculus for Engineers - Stroud 7th Edition",
      description:
        "Excellent condition textbook for engineering mathematics. Used for only one semester. All pages intact, no missing pages, minimal highlighting. Perfect for Level 100-200 Engineering students.\n\nPickup from Volta Hall area.",
      type: "SELL",
      status: "ACTIVE",
      condition: "GOOD",
      price: 85,
      priceType: "NEGOTIABLE",
      isNegotiable: true,
      categoryId: textbookCategory?.id,
      institutionId: ugInstitution?.id,
      campusId: ugLegonCampus?.id,
      area: "Volta Hall",
      tags: ["engineering", "mathematics", "calculus", "textbook"],
      isFeatured: true,
    },
    {
      sellerId: students[0].id,
      title: "HP Laptop 250 G8 - Core i5, 8GB RAM",
      description:
        "Lightly used HP laptop. Excellent for programming, design work, and general studies. Battery lasts 5+ hours.\n\nSpecs:\n- Intel Core i5 11th Gen\n- 8GB RAM\n- 256GB SSD\n- Windows 11\n- 15.6\" Full HD Display\n\nComes with charger and original box.",
      type: "SELL",
      status: "ACTIVE",
      condition: "LIKE_NEW",
      price: 2800,
      priceType: "NEGOTIABLE",
      isNegotiable: true,
      categoryId: electronicsCategory?.id,
      institutionId: ugInstitution?.id,
      campusId: ugLegonCampus?.id,
      area: "Commonwealth Hall",
      tags: ["laptop", "hp", "computer", "programming"],
      isFeatured: true,
    },
    {
      sellerId: students[1].id,
      title: "Casio fx-991ES PLUS Scientific Calculator",
      description:
        "Scientific calculator in perfect working condition. Essential for maths and science courses. Battery recently replaced.\n\nPerfect for WASSCE graduates and university students in sciences, engineering, and mathematics.",
      type: "LEND",
      status: "ACTIVE",
      condition: "GOOD",
      price: null,
      priceType: "CONTACT",
      dailyRate: 5,
      weeklyRate: 25,
      deposit: 50,
      maxLendingDays: 30,
      lendingTerms: "Borrower is responsible for any damage. Must be returned in the same condition.",
      categoryId: textbookCategory?.id,
      institutionId: ugInstitution?.id,
      campusId: ugLegonCampus?.id,
      tags: ["calculator", "casio", "scientific", "maths"],
    },
    {
      sellerId: students[2].id,
      title: "Engineering Drawing Set - Full Set",
      description:
        "Complete engineering drawing set including:\n- Set squares (30/60 and 45 degrees)\n- Compass\n- Protractor\n- Pencils (H, 2H, HB)\n- Drawing board (A2)\n- T-square\n- Curves\n\nUsed for 2 semesters. All items in good condition.",
      type: "SELL",
      status: "ACTIVE",
      condition: "FAIR",
      price: 120,
      priceType: "FIXED",
      isNegotiable: false,
      categoryId: categories.find((c: any) => c.slug === "school-supplies")?.id,
      institutionId: knustInstitution?.id,
      campusId: knustMainCampus?.id,
      tags: ["drawing", "engineering", "drawing-set"],
    },
    {
      sellerId: students[2].id,
      title: "KNUST Engineering Textbooks Bundle - Fluid Mechanics + Thermodynamics",
      description:
        "Selling two core engineering textbooks together or separately:\n\n1. Fluid Mechanics - Cengel & Cimbala (3rd Ed) - GHS 150\n2. Engineering Thermodynamics - Cengel & Boles (8th Ed) - GHS 180\n\nBundle price: GHS 280 (save GHS 50!)\n\nBoth books in good condition with some highlighting.",
      type: "EXCHANGE",
      status: "ACTIVE",
      condition: "GOOD",
      price: 280,
      priceType: "NEGOTIABLE",
      isNegotiable: true,
      exchangeFor: "Computer Science textbooks or a scientific calculator",
      categoryId: textbookCategory?.id,
      institutionId: knustInstitution?.id,
      campusId: knustMainCampus?.id,
      tags: ["engineering", "thermodynamics", "fluid mechanics", "textbook"],
    },
    {
      sellerId: students[3].id,
      title: "Single Bed Foam Mattress - 6 inches",
      description:
        "High-quality foam mattress from graduating senior. Very comfortable. Clean, no stains.\n\nDimensions: 3.5ft x 6ft (standard single bed size, fits most hostels)\n\nCollection only from Pent Hill Hostel area.",
      type: "SELL",
      status: "ACTIVE",
      condition: "USED",
      price: 200,
      priceType: "NEGOTIABLE",
      isNegotiable: true,
      categoryId: dormCategory?.id,
      institutionId: knustInstitution?.id,
      campusId: knustMainCampus?.id,
      area: "Pent Hill",
      tags: ["mattress", "bed", "hostel", "furniture"],
    },
    {
      sellerId: students[4].id,
      title: "Introduction to Programming with Python - Free for Level 100s",
      description:
        "Giving away my first-year CS textbooks free of charge to incoming Level 100 students.\n\nBooks included:\n- Python Programming: An Introduction to Computer Science\n- Discrete Mathematics for CS\n- A First Course in Abstract Algebra\n\nFirst come, first served.",
      type: "GIVEAWAY",
      status: "ACTIVE",
      condition: "GOOD",
      price: 0,
      priceType: "FREE",
      isFree: true,
      categoryId: freeCategory?.id,
      institutionId: await prisma.institution.findUnique({ where: { slug: "ashesi" } }).then(i => i?.id),
      tags: ["free", "textbooks", "programming", "python", "giveaway"],
    },
    {
      sellerId: students[1].id,
      title: "Apple AirPods Pro (2nd Gen)",
      description:
        "Apple AirPods Pro in excellent condition. Active Noise Cancellation works perfectly. Both earbuds and charging case included.\n\nBought 6 months ago, barely used. Still have warranty till next year.",
      type: "SELL",
      status: "ACTIVE",
      condition: "LIKE_NEW",
      price: 900,
      priceType: "NEGOTIABLE",
      isNegotiable: false,
      categoryId: electronicsCategory?.id,
      institutionId: ugInstitution?.id,
      campusId: ugLegonCampus?.id,
      tags: ["airpods", "apple", "headphones", "earbuds"],
      isFeatured: true,
    },
  ]

  for (const listingData of listingsData) {
    const uniqueId = Math.random().toString(36).slice(-6)
    const baseSlug = listingData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .trim()
      .slice(0, 60)
    const slug = `${baseSlug}-${uniqueId}`

    await prisma.listing.create({
      data: {
        ...listingData,
        slug,
        description: listingData.description,
        publishedAt: new Date(),
      } as any,
    })
  }

  console.log(`✅ Created ${listingsData.length} demo listings`)

  console.log("")
  console.log("🎉 Seeding complete!")
  console.log("")
  console.log("📝 Demo Accounts:")
  console.log(`   Admin:   ${adminEmail} / ${adminPassword}`)
  console.log(`   Student: kwame.mensah@st.ug.edu.gh / Student@123`)
  console.log(`   Student: ama.asante@st.ug.edu.gh / Student@123`)
  console.log(`   Student: kofi.boateng@st.knust.edu.gh / Student@123`)
  console.log("")
  console.log("⚠️  IMPORTANT: Change admin password after first login in production!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
