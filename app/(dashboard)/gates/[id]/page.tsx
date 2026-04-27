import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { listRules } from "@/lib/db/queries/gates"
import { GateRules } from "@/components/dashboard/gates/gate-rules"

export default async function GateUrlRulesTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const rules = await listRules(id, session.publisherId)
  if (rules === null) notFound()

  return <GateRules gateId={id} initialRules={rules} />
}
