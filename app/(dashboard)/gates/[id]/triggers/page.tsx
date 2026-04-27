import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getGate } from "@/lib/db/queries/gates"
import { GateTriggers, type TriggerConditions } from "@/components/dashboard/gates/gate-triggers"

export default async function GateTriggersTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const row = await getGate(id, session.publisherId)
  if (!row) notFound()

  const initialConditions = (row.gate.triggerConditions ?? {}) as TriggerConditions

  return <GateTriggers gateId={id} initialConditions={initialConditions} />
}
