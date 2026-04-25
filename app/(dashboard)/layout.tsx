import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
