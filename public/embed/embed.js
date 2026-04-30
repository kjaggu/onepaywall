(function () {
  "use strict";

  // ─── Config ─────────────────────────────────────────────────────────────────

  var API_BASE = "https://www.onepaywall.com";
  var _base = API_BASE; // set in init() from data-api-base attr; shared by sendEvent/sendSignal
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
    ".opw-input{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:14px;margin:0 0 12px;outline:none}",
    ".opw-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px}",
    ".opw-plan{border:1px solid #ddd;background:#fff;border-radius:8px;padding:9px 6px;cursor:pointer;color:#333;font-size:12px;font-weight:700}",
    ".opw-plan-active{border-color:#27adb0;background:#eefafa;color:#13777a}",
    ".opw-note{font-size:12px;color:#888;line-height:1.45;margin:8px 0 0}",
  ].join("");

  function injectStyles() {
    if (document.getElementById("opw-styles")) return;
    var el = document.createElement("style");
    el.id = "opw-styles";
    el.textContent = styles;
    document.head.appendChild(el);
  }

  function loadRazorpay(cb, errCb) {
    if (window.Razorpay) return cb();
    var s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = cb;
    s.onerror = errCb || function () {};
    document.head.appendChild(s);
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
      var intervals = cfg.intervals || [];
      var title = document.createElement("div");
      title.className = "opw-title";
      title.textContent = cfg.heading || "Support our work";
      card.appendChild(title);

      var sub = document.createElement("div");
      sub.className = "opw-sub";
      sub.textContent = cfg.subtext || "Subscribe to continue reading.";
      card.appendChild(sub);

      if (intervals.length > 0) {
        var selected = intervals[0];
        var plans = document.createElement("div");
        plans.className = "opw-plans";
        intervals.forEach(function (item) {
          var b = document.createElement("button");
          b.className = "opw-plan" + (item.interval === selected.interval ? " opw-plan-active" : "");
          b.type = "button";
          b.textContent = item.interval.charAt(0).toUpperCase() + item.interval.slice(1) + " ₹" + ((item.price || 0) / 100).toFixed(0);
          b.onclick = function () {
            selected = item;
            Array.prototype.forEach.call(plans.children, function (el) { el.className = "opw-plan"; });
            b.className = "opw-plan opw-plan-active";
          };
          plans.appendChild(b);
        });
        card.appendChild(plans);

        var email = document.createElement("input");
        email.className = "opw-input";
        email.type = "email";
        email.placeholder = "Email for subscription access";
        card.appendChild(email);

        var cta = document.createElement("button");
        cta.className = "opw-btn opw-btn-primary";
        cta.textContent = cfg.ctaLabel || "Subscribe";
        cta.onclick = function () {
          if (!email.value || email.value.indexOf("@") === -1) { email.focus(); return; }
          sendEvent(token, gateId, step.id, "subscription_cta_click");
          cta.disabled = true;
          cta.textContent = "Opening checkout…";

          function showCtaError(msg) {
            cta.disabled = false;
            cta.textContent = cfg.ctaLabel || "Subscribe";
            var existing = card.querySelector(".opw-cta-error");
            if (existing) existing.remove();
            var err = document.createElement("div");
            err.className = "opw-cta-error";
            err.style.cssText = "color:#c0392b;font-size:13px;margin-top:6px;text-align:center;";
            err.textContent = msg || "Something went wrong. Please try again.";
            cta.parentNode.insertBefore(err, cta.nextSibling);
            setTimeout(function () { if (err.parentNode) err.parentNode.removeChild(err); }, 5000);
          }

          // Open popup synchronously in the click handler so popup blockers don't fire.
          // We redirect it to the full checkout URL once we have the subscription ID.
          var pw = 480, ph = 640;
          var pl = Math.round(window.screenX + (window.outerWidth - pw) / 2);
          var pt = Math.round(window.screenY + (window.outerHeight - ph) / 2);
          var checkoutWin = window.open(
            _base + "/checkout",
            "opw-checkout",
            "width=" + pw + ",height=" + ph + ",left=" + pl + ",top=" + pt + ",scrollbars=no,resizable=no,toolbar=no,menubar=no,location=no,status=no"
          );
          if (!checkoutWin) {
            cta.disabled = false;
            cta.textContent = cfg.ctaLabel || "Subscribe";
            showCtaError("Allow popups on this page to open the payment window.");
            return;
          }

          window.addEventListener("message", function onMsg(e) {
            if (!e.data || e.data.type !== "opw-checkout") return;
            window.removeEventListener("message", onMsg);
            if (e.data.status === "success") {
              removeOverlay();
              onComplete();
            } else {
              cta.disabled = false;
              cta.textContent = cfg.ctaLabel || "Subscribe";
            }
          });

          fetch(_base + "/api/embed/subscription?action=create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token, gateId: gateId, interval: selected.interval, email: email.value }),
          })
            .then(function (r) { return r.json(); })
            .then(function (created) {
              if (created.error === "already_subscribed") {
                checkoutWin.close();
                showCtaError("This email already has an active subscription. Use \"Already subscribed?\" to restore access.");
                return;
              }
              if (created.error) {
                checkoutWin.close();
                showCtaError("Could not start checkout. Please try again.");
                return;
              }
              checkoutWin.location.replace(
                _base + "/checkout?" + qs({ sid: created.subscriptionId, kid: created.keyId, email: email.value, rt: token, gid: gateId, base: _base, pub: created.publisherName })
              );
            })
            .catch(function () {
              checkoutWin.close();
              showCtaError("Network error. Please check your connection and try again.");
            });
        };
        card.appendChild(cta);

        var restore = document.createElement("button");
        restore.className = "opw-btn opw-btn-secondary";
        restore.textContent = "Already subscribed?";
        restore.onclick = function () {
          if (!email.value || email.value.indexOf("@") === -1) { email.focus(); return; }

          restore.disabled = true;
          restore.textContent = "Check your email";
          fetch(_base + "/api/embed/subscription?action=restore-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token, email: email.value, returnUrl: location.href }),
          }).catch(function () {});
        };
        card.appendChild(restore);

        var note = document.createElement("div");
        note.className = "opw-note";
        note.textContent = "Your email lets you restore access on another device.";
        card.appendChild(note);
      } else {
        var cta = document.createElement("button");
        cta.className = "opw-btn opw-btn-primary";
        cta.textContent = cfg.ctaLabel || "Subscribe";
        cta.onclick = function () {
          sendEvent(token, gateId, step.id, "subscription_cta_click");
          if (cfg.ctaUrl) {
            window.open(cfg.ctaUrl, "_blank");
            return;
          }
          // No subscription configured — treat as skip so reader isn't stuck
          if (step.onDecline === "proceed") removeOverlay();
          onComplete();
        };
        card.appendChild(cta);
      }

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

      var unlockEmail = document.createElement("input");
      unlockEmail.className = "opw-input";
      unlockEmail.type = "email";
      unlockEmail.placeholder = "Email for receipt and support";
      card.appendChild(unlockEmail);

      var pay = document.createElement("button");
      pay.className = "opw-btn opw-btn-primary";
      pay.textContent = "Pay ₹" + rupees;
      pay.onclick = function () {
        if (!unlockEmail.value || unlockEmail.value.indexOf("@") === -1) { unlockEmail.focus(); return; }
        sendEvent(token, gateId, step.id, "one_time_unlock_start");
        pay.disabled = true;
        pay.textContent = "Opening payment…";
        fetch(_base + "/api/embed/unlock?action=create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token, gateId: gateId, stepId: step.id, url: location.href, email: unlockEmail.value }),
        })
          .then(function (r) { return r.json(); })
          .then(function (order) {
            if (order.error) { pay.disabled = false; pay.textContent = "Pay ₹" + rupees; return; }
            loadRazorpay(function () {
              try {
                var rzp = new window.Razorpay({
                  key: order.keyId,
                  amount: order.amount,
                  currency: order.currency,
                  order_id: order.orderId,
                  name: "OnePaywall",
                  description: cfg2.label || "Article unlock",
                  handler: function (response) {
                    fetch(_base + "/api/embed/unlock?action=verify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        token: token,
                        gateId: gateId,
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        email: unlockEmail.value,
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
              } catch (e) {
                pay.disabled = false;
                pay.textContent = "Pay ₹" + rupees;
              }
            }, function () {
              pay.disabled = false;
              pay.textContent = "Pay ₹" + rupees;
            });
          })
          .catch(function () { pay.disabled = false; pay.textContent = "Pay ₹" + rupees; });
      };
      card.appendChild(pay);

      if (!cfg2.hideSkip) {
        var skip2 = document.createElement("button");
        skip2.className = "opw-btn opw-btn-secondary";
        skip2.textContent = "Skip";
        skip2.onclick = function () {
          sendEvent(token, gateId, step.id, "one_time_unlock_skip");
          if (step.onSkip === "proceed") { removeOverlay(); onComplete(); }
          else onComplete();
        };
        card.appendChild(skip2);
      }

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
    fetch(_base + "/api/embed/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token, gateId: gateId, stepId: stepId, eventType: eventType }),
      keepalive: true,
    }).catch(function () {});
  }

  function sendSignal(token, extra) {
    var body = Object.assign({ token: token, url: location.href, referrer: document.referrer, deviceType: deviceType() }, extra);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(_base + "/api/embed/signal", JSON.stringify(body));
    } else {
      fetch(_base + "/api/embed/signal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(function () {});
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
    var apiBaseAttr = script.getAttribute("data-api-base");
    _base = apiBaseAttr !== null ? apiBaseAttr : API_BASE;
    var publishedAt = script.getAttribute("data-published-at") || "";
    var isPreview = script.getAttribute("data-preview") === "1";
    var restoreToken = "";
    try { restoreToken = new URLSearchParams(location.search).get("opw_restore_token") || ""; } catch (e) {}

    var startTime = Date.now();

    // Gate check
    fetch(_base + "/api/embed/gate-check?" + qs({
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
        if (restoreToken && token) {
          fetch(_base + "/api/embed/subscription?action=restore-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token, restoreToken: restoreToken }),
          })
            .then(function (r) { return r.json(); })
            .then(function (result) {
              if (result.ok) {
                var clean = new URL(location.href);
                clean.searchParams.delete("opw_restore_token");
                location.replace(clean.toString());
              } else if (data.gate) showGate(data.gate, token);
            })
            .catch(function () { if (data.gate) showGate(data.gate, token); });
          return;
        }
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
