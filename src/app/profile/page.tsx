import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProfileRedirectPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile")
  }
  redirect(`/user/${session.user.id}`)
}
