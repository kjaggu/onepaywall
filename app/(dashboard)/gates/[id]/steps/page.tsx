import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { listSteps } from "@/lib/db/queries/gates"
import { GateSteps } from "@/components/dashboard/gates/gate-steps"

export default async function GateStepsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const steps = await listSteps(id, session.publisherId)
  if (steps === null) notFound()

  return <GateSteps gateId={id} initialSteps={steps as Parameters<typeof GateSteps>[0]["initialSteps"]} />
}
