import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, internalErrorResponse } from "@/lib/api-response"
import { MOCK_CATEGORIES } from "@/lib/mock-data"
import { isDemoMode } from "@/lib/demo-mode"

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { listings: { where: { status: "ACTIVE" } } } },
      },
    })
    return successResponse(categories)
  } catch (error) {
    if (!isDemoMode()) return internalErrorResponse(error)
    console.warn("DEMO_MODE: database unavailable, serving mock categories")
    return successResponse(MOCK_CATEGORIES)
  }
}
