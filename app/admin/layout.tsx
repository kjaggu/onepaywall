import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminTopbar } from "@/components/admin/topbar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "superadmin") redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 border-l border-[#ebebeb]">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}
