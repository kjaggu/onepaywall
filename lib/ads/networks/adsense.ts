import type { AdsenseCredentials } from "@/lib/db/queries/ad-networks"

export type AdsenseRenderConfig = {
  renderType: "adsense"
  adClientId: string
  adSlotId: string
}

/**
 * Produces the render config needed by embed.js to inject an AdSense slot.
 *
 * ToS note: Google AdSense Program Policies restrict ads in interstitials/overlays
 * that prevent access to content. Publishers connecting AdSense must acknowledge
 * compliance in the UI. Use GAM for placements requiring explicit approval.
 */
export function resolveAdsenseConfig(
  networkConfig: { adSlotId: string },
  credentials: AdsenseCredentials,
): AdsenseRenderConfig {
  return {
    renderType: "adsense",
    adClientId: credentials.adClientId,
    adSlotId:   networkConfig.adSlotId,
  }
}
