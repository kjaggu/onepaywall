import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminTopbar } from "@/components/admin/topbar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
