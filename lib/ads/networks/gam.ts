import type { GAMCredentials } from "@/lib/db/queries/ad-networks"

export type GAMRenderConfig = {
  renderType: "gam"
  adUnitPath: string
  sizes: number[][]
}

/**
 * Produces the render config needed by embed.js to inject a GAM (DFP) ad slot
 * using the Google Publisher Tag (GPT) library.
 */
export function resolveGAMConfig(
  networkConfig: { adUnitPath: string; sizes: number[][] },
  credentials: GAMCredentials,
): GAMRenderConfig {
  // networkCode is used by the publisher to set up their DFP targeting;
  // the full ad unit path already encodes the network code in most setups.
  void credentials
  return {
    renderType: "gam",
    adUnitPath: networkConfig.adUnitPath,
    sizes:      networkConfig.sizes,
  }
}
