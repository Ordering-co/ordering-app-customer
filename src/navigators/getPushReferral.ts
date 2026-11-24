function hasValue (value: unknown) {
  return value != null && value !== '' && value !== 'null'
}

type PushReferral = { source: string, medium?: string, campaign?: string }

function pushData (notification: unknown) {
  return notification && typeof notification === 'object'
    ? (notification as { additionalData?: any, data?: any }).additionalData ??
      (notification as { additionalData?: any, data?: any }).data
    : undefined
}

/**
 * The UTM values a marketing campaign push carries, or null for any other
 * push. Reads the same payload shapes as getPushNotificationTarget
 * (OneSignal `additionalData`, FCM and notifee `data`). The library
 * validates and normalizes the values; here only "has a value" matters.
 */
export function getPushReferral (notification: unknown): PushReferral | null {
  const data = pushData(notification)
  if (!hasValue(data?.utm_source)) {
    return null
  }
  const referral: PushReferral = { source: data.utm_source }
  if (hasValue(data.utm_medium)) {
    referral.medium = data.utm_medium
  }
  if (hasValue(data.utm_campaign)) {
    referral.campaign = data.utm_campaign
  }
  return referral
}

// Firebase returns the notification that launched the app again each time the
// navigator mounts again; the same tap must not count as a newer click, even
// after another push was opened in between.
const registeredPushIds = new Set<string>()

/**
 * Registers the visit of an opened marketing push. Never throws: attribution
 * must not get in the way of opening the notification.
 */
export function registerPushReferral (
  notification: unknown,
  registerReferral?: (referral: PushReferral) => unknown
) {
  const referral = getPushReferral(notification)
  if (!referral || typeof registerReferral !== 'function') {
    return
  }
  const { messageId, notificationId } = (notification ?? {}) as { messageId?: unknown, notificationId?: unknown }
  const id = hasValue(messageId) ? String(messageId) : hasValue(notificationId) ? String(notificationId) : null
  if (id && registeredPushIds.has(id)) {
    return
  }
  try {
    registerReferral(referral)
    if (id) {
      registeredPushIds.add(id)
    }
  } catch (error) {
    console.log('Push referral error:', error)
  }
}

export function resetRegisteredPushReferral () {
  registeredPushIds.clear()
}
