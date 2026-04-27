(function () {
  "use strict";

  // ─── Config ─────────────────────────────────────────────────────────────────

  var API_BASE = "https://www.onepaywall.com";
  var LS_CLIENT_ID = "opw_cid";
  var LS_TOKEN_PREFIX = "opw_tok_";
  var SCRIPT_ATTR = "data-site-key";

  // ─── Utilities ──────────────────────────────────────────────────────────────

  function getScript() {
    return (
      document.currentScript ||
      document.querySelector('script[' + SCRIPT_ATTR + ']')
    );
  }

  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getClientId() {
    try {
      var id = localStorage.getItem(LS_CLIENT_ID);
      if (!id) { id = uuid(); localStorage.setItem(LS_CLIENT_ID, id); }
      return id;
    } catch (e) { return uuid(); }
  }

  function getToken(siteKey) {
    try { return localStorage.getItem(LS_TOKEN_PREFIX + siteKey) || ""; } catch (e) { return ""; }
  }

  function setToken(siteKey, token) {
    try { localStorage.setItem(LS_TOKEN_PREFIX + siteKey, token); } catch (e) {}
  }

  function deviceType() {
    var w = window.innerWidth;
    return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  }

  function qs(params) {
    return Object.keys(params)
      .filter(function (k) { return params[k] != null && params[k] !== ""; })
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); })
      .join("&");
  }

  // ─── Overlay ─────────────────────────────────────────────────────────────────

  var styles = [
    ".opw-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}",
    ".opw-card{background:#fff;border-radius:12px;padding:32px;max-width:420px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,.2);text-align:center}",
    ".opw-title{font-size:20px;font-weight:700;color:#111;margin:0 0 8px}",
    ".opw-sub{font-size:14px;color:#666;margin:0 0 24px;line-height:1.5}",
    ".opw-btn{display:inline-block;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;margin:4px}",
    ".opw-btn-primary{background:#27adb0;color:#fff}",
    ".opw-btn-primary:hover{background:#1f9598}",
    ".opw-btn-secondary{background:#f0f0f0;color:#555}",
    ".opw-btn-secondary:hover{background:#e0e0e0}",
    ".opw-step-label{font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px}",
  ].join("");

  function injectStyles() {
    if (document.getElementById("opw-styles")) return;
    var el = document.createElement("style");
    el.id = "opw-styles";
    el.textContent = styles;
    document.head.appendChild(el);
  }

  function lockScroll() {
    document.body.style.overflow = "hidden";
  }

  function unlockScroll() {
    document.body.style.overflow = "";
  }

  function removeOverlay() {
    var el = document.getElementById("opw-overlay");
    if (el) el.remove();
    unlockScroll();
  }

  // ─── Step renderers ──────────────────────────────────────────────────────────

  function renderStep(step, gateId, token, stepIndex, totalSteps, onComplete) {
    var card = document.createElement("div");
    card.className = "opw-card";

    var label = document.createElement("div");
    label.className = "opw-step-label";
    label.textContent = "Step " + (stepIndex + 1) + " of " + totalSteps;
    card.appendChild(label);

    sendEvent(token, gateId, step.id, "step_shown");

    if (step.stepType === "subscription_cta") {
      var cfg = step.config || {};
      var title = document.createElement("div");
      title.className = "opw-title";
      title.textContent = cfg.heading || "Support our work";
      card.appendChild(title);

      var sub = document.createElement("div");
      sub.className = "opw-sub";
      sub.textContent = cfg.subtext || "Subscribe to continue reading.";
      card.appendChild(sub);

      var cta = document.createElement("button");
      cta.className = "opw-btn opw-btn-primary";
      cta.textContent = cfg.ctaLabel || "Subscribe";
      cta.onclick = function () {
        sendEvent(token, gateId, step.id, "subscription_cta_click");
        if (cfg.ctaUrl) window.open(cfg.ctaUrl, "_blank");
        if (step.onDecline === "proceed") { removeOverlay(); onComplete(); }
      };
      card.appendChild(cta);

      var skip = document.createElement("button");
      skip.className = "opw-btn opw-btn-secondary";
      skip.textContent = "Maybe later";
      skip.onclick = function () {
        sendEvent(token, gateId, step.id, "subscription_cta_skip");
        if (step.onSkip === "proceed") { removeOverlay(); onComplete(); }
        else onComplete();
      };
      card.appendChild(skip);

    } else if (step.stepType === "one_time_unlock") {
      var cfg2 = step.config || {};
      var paise = cfg2.priceInPaise || 0;
      var rupees = (paise / 100).toFixed(0);

      var title2 = document.createElement("div");
      title2.className = "opw-title";
      title2.textContent = cfg2.label || "Unlock this article";
      card.appendChild(title2);

      var sub2 = document.createElement("div");
      sub2.className = "opw-sub";
      sub2.textContent = "One-time payment of ₹" + rupees;
      card.appendChild(sub2);

      var pay = document.createElement("button");
      pay.className = "opw-btn opw-btn-primary";
      pay.textContent = "Pay ₹" + rupees;
      pay.onclick = function () {
        sendEvent(token, gateId, step.id, "one_time_unlock_start");
        pay.disabled = true;
        pay.textContent = "Opening payment…";
        var base = (typeof OPW_API_BASE !== "undefined" ? OPW_API_BASE : API_BASE);
        fetch(base + "/api/embed/unlock?action=create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token, gateId: gateId, stepId: step.id, url: location.href }),
        })
          .then(function (r) { return r.json(); })
          .then(function (order) {
            if (order.error) { pay.disabled = false; pay.textContent = "Pay ₹" + rupees; return; }
            function loadRazorpay(cb) {
              if (window.Razorpay) return cb();
              var s = document.createElement("script");
              s.src = "https://checkout.razorpay.com/v1/checkout.js";
              s.onload = cb;
              document.head.appendChild(s);
            }
            loadRazorpay(function () {
              var rzp = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: "OnePaywall",
                description: cfg2.label || "Article unlock",
                handler: function (response) {
                  fetch(base + "/api/embed/unlock?action=verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      token: token,
                      gateId: gateId,
                      orderId: response.razorpay_order_id,
                      paymentId: response.razorpay_payment_id,
                      signature: response.razorpay_signature,
                    }),
                  })
                    .then(function (r) { return r.json(); })
                    .then(function (result) {
                      if (result.ok) {
                        sendEvent(token, gateId, step.id, "one_time_unlock_complete");
                        removeOverlay();
                        onComplete();
                      }
                    })
                    .catch(function () {});
                },
                modal: {
                  ondismiss: function () {
                    pay.disabled = false;
                    pay.textContent = "Pay ₹" + rupees;
                  },
                },
              });
              rzp.open();
            });
          })
          .catch(function () { pay.disabled = false; pay.textContent = "Pay ₹" + rupees; });
      };
      card.appendChild(pay);

      var skip2 = document.createElement("button");
      skip2.className = "opw-btn opw-btn-secondary";
      skip2.textContent = "Skip";
      skip2.onclick = function () {
        sendEvent(token, gateId, step.id, "one_time_unlock_skip");
        if (step.onSkip === "proceed") { removeOverlay(); onComplete(); }
        else onComplete();
      };
      card.appendChild(skip2);

    } else if (step.stepType === "ad") {
      var title3 = document.createElement("div");
      title3.className = "opw-title";
      title3.textContent = "Quick ad break";
      card.appendChild(title3);

      var sub3 = document.createElement("div");
      sub3.className = "opw-sub";
      sub3.textContent = "Watch a short ad to continue reading for free.";
      card.appendChild(sub3);

      // Ad placeholder — real ad serving wired in next phase
      var adBox = document.createElement("div");
      adBox.style.cssText = "background:#f5f5f5;border-radius:8px;height:120px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:13px;margin-bottom:16px";
      adBox.textContent = "Ad";
      card.appendChild(adBox);

      sendEvent(token, gateId, step.id, "ad_start");

      var completeBtn = document.createElement("button");
      completeBtn.className = "opw-btn opw-btn-primary";
      completeBtn.textContent = "Continue";
      completeBtn.onclick = function () {
        sendEvent(token, gateId, step.id, "ad_complete");
        if (step.onSkip === "proceed") { removeOverlay(); onComplete(); }
        else onComplete();
      };
      card.appendChild(completeBtn);
    }

    return card;
  }

  function showGate(gate, token) {
    injectStyles();
    removeOverlay();
    lockScroll();

    var overlay = document.createElement("div");
    overlay.className = "opw-overlay";
    overlay.id = "opw-overlay";
    document.body.appendChild(overlay);

    sendEvent(token, gate.id, null, "gate_shown");

    var steps = gate.steps || [];
    var stepIndex = 0;

    function showStep() {
      overlay.innerHTML = "";
      if (stepIndex >= steps.length) {
        // All steps done — gate passed
        sendEvent(token, gate.id, null, "gate_passed");
        removeOverlay();
        return;
      }
      var card = renderStep(steps[stepIndex], gate.id, token, stepIndex, steps.length, function () {
        stepIndex++;
        showStep();
      });
      overlay.appendChild(card);
    }

    showStep();
  }

  // ─── Events & signals ────────────────────────────────────────────────────────

  function sendEvent(token, gateId, stepId, eventType) {
    var base = (typeof OPW_API_BASE !== "undefined" ? OPW_API_BASE : API_BASE);
    fetch(base + "/api/embed/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token, gateId: gateId, stepId: stepId, eventType: eventType }),
      keepalive: true,
    }).catch(function () {});
  }

  function sendSignal(token, extra) {
    var base = (typeof OPW_API_BASE !== "undefined" ? OPW_API_BASE : API_BASE);
    var body = Object.assign({ token: token, url: location.href, referrer: document.referrer, deviceType: deviceType() }, extra);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(base + "/api/embed/signal", JSON.stringify(body));
    } else {
      fetch(base + "/api/embed/signal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(function () {});
    }
  }

  // ─── Main ────────────────────────────────────────────────────────────────────

  function init() {
    var script = getScript();
    if (!script) return;

    var siteKey = script.getAttribute(SCRIPT_ATTR);
    if (!siteKey) return;

    var clientId = getClientId();
    var token = getToken(siteKey);
    var base = script.getAttribute("data-api-base") || API_BASE;
    var publishedAt = script.getAttribute("data-published-at") || "";
    var isPreview = script.getAttribute("data-preview") === "1";

    var startTime = Date.now();

    // Gate check
    fetch(base + "/api/embed/gate-check?" + qs({
      siteKey: siteKey,
      clientId: clientId,
      url: location.href,
      device: deviceType(),
      publishedAt: publishedAt,
      preview: isPreview ? "1" : null,
    }), { credentials: "omit" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.token) { setToken(siteKey, data.token); token = data.token; }
        if (data.gate) showGate(data.gate, token);
      })
      .catch(function () { /* fail open — never block readers on error */ });

    // Signal on page unload with read time + scroll depth
    var maxScroll = 0;
    document.addEventListener("scroll", function () {
      var el = document.documentElement;
      var scrolled = el.scrollTop || document.body.scrollTop;
      var total = el.scrollHeight - el.clientHeight;
      if (total > 0) maxScroll = Math.max(maxScroll, Math.round((scrolled / total) * 100));
    }, { passive: true });

    window.addEventListener("pagehide", function () {
      if (!token) return;
      sendSignal(token, {
        readTimeSeconds: Math.round((Date.now() - startTime) / 1000),
        scrollDepthPct: maxScroll,
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
