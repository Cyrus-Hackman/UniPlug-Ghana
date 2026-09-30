import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, internalErrorResponse } from "@/lib/api-response"

import { MOCK_CATEGORIES } from "@/lib/mock-data"

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
    if (categories.length > 0) return successResponse(categories)
  } catch (error) {
    console.warn("Using offline fallback categories")
  }
  return successResponse(MOCK_CATEGORIES)
}
