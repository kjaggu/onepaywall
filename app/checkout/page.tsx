"use client"
import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

function CheckoutInner() {
  const params = useSearchParams()
  const subscriptionId = params.get("sid")
  const keyId = params.get("kid")
  const email = params.get("email") ?? ""
  const readerToken = params.get("rt")
  const gateId = params.get("gid")
  const apiBase = params.get("base") ?? ""
  const launched = useRef(false)

  useEffect(() => {
    if (launched.current || !subscriptionId || !keyId || !readerToken || !gateId) return
    launched.current = true

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => {
      const rzp = new window.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: "OnePaywall",
        description: "Reader membership",
        prefill: { email },
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_subscription_id: string
          razorpay_signature: string
        }) => {
          try {
            const res = await fetch(apiBase + "/api/embed/subscription?action=verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: readerToken,
                gateId,
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const result = await res.json()
            if (result.ok && window.opener) {
              window.opener.postMessage({ type: "opw-checkout", status: "success" }, "*")
            }
          } catch {
            // verification failure — popup closes, user can retry
          }
          window.close()
        },
        modal: {
          ondismiss: () => {
            if (window.opener) {
              window.opener.postMessage({ type: "opw-checkout", status: "dismissed" }, "*")
            }
            window.close()
          },
        },
      })
      rzp.open()
    }
    script.onerror = () => {
      if (window.opener) {
        window.opener.postMessage({ type: "opw-checkout", status: "error" }, "*")
      }
      window.close()
    }
    document.head.appendChild(script)
  }, [subscriptionId, keyId, readerToken, gateId, email, apiBase])

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "system-ui, sans-serif",
      background: "#f9fafa",
      color: "#666",
      fontSize: "14px",
    }}>
      Opening payment window…
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  )
}
