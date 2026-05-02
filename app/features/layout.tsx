import { LandingNav } from "@/components/landing/nav"
import { LandingFooter } from "@/components/landing/footer"

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <LandingNav />
      {children}
      <LandingFooter />
    </div>
  )
}
