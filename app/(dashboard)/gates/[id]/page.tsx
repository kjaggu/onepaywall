import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getGate, listSteps, listRules } from "@/lib/db/queries/gates"
import { GateHeader } from "@/components/dashboard/gates/gate-header"
import { GateRules } from "@/components/dashboard/gates/gate-rules"
import { GateSteps } from "@/components/dashboard/gates/gate-steps"

type Props = { params: Promise<{ id: string }> }

export default async function GatePage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const [row, steps, rules] = await Promise.all([
    getGate(id, session.publisherId),
    listSteps(id, session.publisherId),
    listRules(id, session.publisherId),
  ])

  if (!row || steps === null || rules === null) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/gates"
        className="inline-flex items-center gap-1 text-body-sm text-[var(--muted-foreground)] hover:text-[var(--color-text)] mb-5 transition-colors"
      >
        <ChevronLeft size={14} />
        All gates
      </Link>

      <div className="flex flex-col gap-5">
        <GateHeader gate={row.gate} domain={row.domain} />
        <GateRules gateId={id} initialRules={rules} />
        <GateSteps gateId={id} initialSteps={steps as Parameters<typeof GateSteps>[0]["initialSteps"]} />
      </div>
    </div>
  )
}
