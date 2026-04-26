import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}
