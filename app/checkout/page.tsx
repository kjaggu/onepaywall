"use client"
import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

function CheckoutInner() {
  const params = useSearchParams()
  const subscriptionId = params.get("sid")
  const keyId = params.get("kid")
  const email = params.get("email") ?? ""
  const readerToken = params.get("rt")
  const gateId = params.get("gid")
  const apiBase = params.get("base") ?? ""
  const publisherName = params.get("pub") ?? "OnePaywall"
  const launched = useRef(false)

  useEffect(() => {
    if (launched.current || !subscriptionId || !keyId || !readerToken || !gateId) return
    launched.current = true

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => {
      const Win = window as typeof window & { Razorpay: new (o: Record<string, unknown>) => { open(): void } }
      const rzp = new Win.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: publisherName,
        description: `Subscribe to ${publisherName}`,
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
  }, [subscriptionId, keyId, readerToken, gateId, email, apiBase, publisherName])

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      margin: 0,
      background: "#0f0f0f",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        textAlign: "center",
        color: "#fff",
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: "3px solid rgba(255,255,255,0.15)",
          borderTopColor: "#27adb0",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          Opening secure payment…
        </p>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; }
      `}</style>
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
