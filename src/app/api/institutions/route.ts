import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, internalErrorResponse } from "@/lib/api-response"
import { MOCK_INSTITUTIONS } from "@/lib/mock-data"
import { isDemoMode } from "@/lib/demo-mode"

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
    return successResponse(institutions)
  } catch (error) {
    if (!isDemoMode()) return internalErrorResponse(error)
    console.warn("DEMO_MODE: database unavailable, serving mock institutions")
    return successResponse(MOCK_INSTITUTIONS)
  }
}
