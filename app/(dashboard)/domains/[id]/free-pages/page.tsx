import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getDomain } from "@/lib/db/queries/domains"
import { DomainWhitelist } from "@/components/dashboard/domains/domain-whitelist"

export default async function DomainFreePagesTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const domain = await getDomain(id, session.publisherId)
  if (!domain) notFound()

  return (
    <DomainWhitelist
      domainId={domain.id}
      initialPaths={(domain.whitelistedPaths ?? []) as string[]}
    />
  )
}
