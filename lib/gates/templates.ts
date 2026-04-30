export type StepTemplate = {
  stepType: "ad" | "subscription_cta" | "one_time_unlock"
  config: Record<string, unknown>
  onSkip: "proceed" | "next_step"
  onDecline: "proceed" | "next_step"
}

export type GateTemplate = {
  id: string
  name: string
  description: string
  badge: string
  steps: StepTemplate[]
  urlPattern: string
}

export const GATE_TEMPLATES: GateTemplate[] = [
  {
    id: "subscription-and-unlock",
    name: "Subscribe or pay per article",
    description: "Offer a subscription first. Readers who skip can unlock the current article with a one-time payment.",
    badge: "Subscription + Unlock",
    urlPattern: "/**",
    steps: [
      {
        stepType: "subscription_cta",
        config: {
          heading: "Support our journalism",
          subtext: "Subscribe for full access. Cancel anytime.",
          ctaLabel: "Subscribe",
        },
        onSkip: "next_step",
        onDecline: "next_step",
      },
      {
        stepType: "one_time_unlock",
        config: {
          label: "Unlock this article",
          priceInPaise: 500,
          unlockDurationSeconds: 86400 * 365,
          hideSkip: true,
        },
        onSkip: "proceed",
        onDecline: "proceed",
      },
    ],
  },
  {
    id: "ad-and-unlock",
    name: "View ad or pay to skip",
    description: "Show an ad to readers. Those who'd rather skip the ad can pay a small amount to unlock the article.",
    badge: "Ad + Unlock",
    urlPattern: "/**",
    steps: [
      {
        stepType: "ad",
        config: {},
        onSkip: "next_step",
        onDecline: "next_step",
      },
      {
        stepType: "one_time_unlock",
        config: {
          label: "Skip ads — unlock this article",
          priceInPaise: 200,
          unlockDurationSeconds: 86400 * 365,
        },
        onSkip: "proceed",
        onDecline: "proceed",
      },
    ],
  },
  {
    id: "pay-per-article",
    name: "Pay per article",
    description: "Each article requires a small one-time payment. Readers keep permanent access to articles they've paid for.",
    badge: "Per article",
    urlPattern: "/**",
    steps: [
      {
        stepType: "one_time_unlock",
        config: {
          label: "Unlock this article",
          priceInPaise: 500,
          unlockDurationSeconds: 86400 * 365,
        },
        onSkip: "proceed",
        onDecline: "proceed",
      },
    ],
  },
]
