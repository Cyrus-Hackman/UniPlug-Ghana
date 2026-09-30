import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, internalErrorResponse } from "@/lib/api-response"

import { MOCK_INSTITUTIONS } from "@/lib/mock-data"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get("includeInactive") === "true"

    const institutions = await prisma.institution.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
      include: {
        campuses: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { name: "asc" },
        },
        _count: { select: { listings: { where: { status: "ACTIVE" } } } },
      },
    })
    if (institutions.length > 0) return successResponse(institutions)
  } catch (error) {
    console.warn("Using offline fallback institutions")
  }
  return successResponse(MOCK_INSTITUTIONS)
}
