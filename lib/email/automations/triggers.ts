export type AutomationTriggerType =
  | "new_subscriber"
  | "segment_entered"
  | "ad_engaged"
  | "inactivity"

export type AutomationEvent =
  | { type: "new_subscriber"; publisherId: string; subscriberId: string }
  | { type: "segment_entered"; publisherId: string; readerId: string; segment: string }
  | { type: "ad_engaged"; publisherId: string; readerId: string }
  | { type: "inactivity"; publisherId: string; subscriberId: string }

export type TriggerConfig = {
  // segment_entered: which segment transition to watch
  targetSegment?: string
  // inactivity: days without a page signal
  inactiveDays?: number
  // delay before sending (hours)
  delayHours?: number
}

export function eventMatchesAutomation(
  event: AutomationEvent,
  triggerType: string,
  triggerConfig: TriggerConfig,
): boolean {
  if (event.type !== triggerType) return false

  if (event.type === "segment_entered" && triggerConfig.targetSegment) {
    return event.segment === triggerConfig.targetSegment
  }

  return true
}
