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

  // ─── Logout helpers ──────────────────────────────────────────────────────────

  function clearReaderIdentity() {
    try {
      localStorage.removeItem(LS_CLIENT_ID);
      var keysToRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(LS_TOKEN_PREFIX) === 0) keysToRemove.push(k);
      }
      keysToRemove.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
  }

  // ─── Subscriber widget ───────────────────────────────────────────────────────

  function renderSubscriberWidget(data) {
    if (!data.widget || !data.subscribedSince) return;
    if (document.getElementById("opw-widget")) return;
    var pos = data.widget.position || "bottom";
    var since = new Date(data.subscribedSince);
    var sinceLabel = since.toLocaleDateString("en", { month: "long", year: "numeric" });
    var isTop = pos === "top";

    var wrap = document.createElement("div");
    wrap.id = "opw-widget";
    wrap.className = "opw-widget opw-widget-" + pos;

    var panel = document.createElement("div");
    panel.className = "opw-widget-panel" + (isTop ? " opw-widget-panel-top" : "") + " opw-widget-hidden";
    panel.innerHTML =
      "<p class=\"opw-widget-title\">✓ You’re subscribed</p>" +
      "<p class=\"opw-widget-since\">Since " + sinceLabel + "</p>" +
      "<button class=\"opw-btn opw-btn-secondary\" style=\"width:100%;margin:0;font-size:13px;padding:8px 14px\" id=\"opw-signout-btn\">Sign out</button>";

    var badge = document.createElement("button");
    badge.className = "opw-widget-badge";
    badge.innerHTML = "✓ Subscribed";
    badge.onclick = function () { panel.classList.toggle("opw-widget-hidden"); };

    if (isTop) { wrap.appendChild(badge); wrap.appendChild(panel); }
    else { wrap.appendChild(panel); wrap.appendChild(badge); }

    document.body.appendChild(wrap);

    document.getElementById("opw-signout-btn").onclick = function () {
      window.OnePaywall && window.OnePaywall.logout();
    };
  }

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
    ".opw-widget{position:fixed;z-index:2147483646;right:16px;font-family:system-ui,sans-serif;font-size:0}",
    ".opw-widget-bottom{bottom:0;border-radius:8px 8px 0 0}",
    ".opw-widget-top{top:0;border-radius:0 0 8px 8px}",
    ".opw-widget-float{bottom:16px;border-radius:99px}",
    ".opw-widget-badge{display:flex;align-items:center;gap:6px;padding:7px 14px;background:#27adb0;color:#fff;font-size:13px;font-weight:600;cursor:pointer;border:none;width:100%;border-radius:inherit;white-space:nowrap}",
    ".opw-widget-badge:hover{background:#1f9598}",
    ".opw-widget-panel{background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:14px 16px;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,.12);margin-bottom:2px}",
    ".opw-widget-panel-top{margin-top:2px;margin-bottom:0}",
    ".opw-widget-title{font-size:13px;font-weight:600;color:#111;margin:0 0 2px}",
    ".opw-widget-since{font-size:12px;color:#666;margin:0 0 10px}",
    ".opw-widget-hidden{display:none!important}",
    ".opw-skip-timer{font-size:11px;color:#aaa;margin-bottom:8px}",
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
      var cfg3 = step.config || {};
      var adUnitId3 = cfg3.selectedAdUnitId || null;
      var skipSecs3 = cfg3.skipAfterSeconds || null;

      var title3 = document.createElement("div");
      title3.className = "opw-title";
      title3.textContent = "Quick ad break";
      card.appendChild(title3);

      var sub3 = document.createElement("div");
      sub3.className = "opw-sub";
      sub3.textContent = "Watch a short ad to continue reading for free.";
      card.appendChild(sub3);

      var continueBtn3 = document.createElement("button");
      continueBtn3.className = "opw-btn opw-btn-primary";
      continueBtn3.textContent = "Continue";
      continueBtn3.style.display = "none";
      continueBtn3.onclick = function () {
        sendEvent(token, gateId, step.id, "ad_complete", adUnitId3);
        if (step.onSkip === "proceed") { removeOverlay(); onComplete(); }
        else onComplete();
      };

      var skipBtn3 = document.createElement("button");
      skipBtn3.className = "opw-btn opw-btn-secondary";
      skipBtn3.textContent = "Skip ad";
      skipBtn3.style.display = "none";
      skipBtn3.onclick = function () {
        sendEvent(token, gateId, step.id, "ad_skip", adUnitId3);
        if (step.onSkip === "proceed") { removeOverlay(); onComplete(); }
        else onComplete();
      };

      var timerLabel3 = document.createElement("div");
      timerLabel3.className = "opw-skip-timer";
      timerLabel3.style.display = "none";

      function enableAdControls3() {
        continueBtn3.style.display = "";
        if (skipSecs3) skipBtn3.style.display = "";
      }

      function startAdTimer3(secs) {
        timerLabel3.style.display = "block";
        timerLabel3.textContent = "Skip in " + secs + "s";
        var remaining3 = secs;
        var t3 = setInterval(function () {
          remaining3--;
          if (remaining3 <= 0) {
            clearInterval(t3);
            timerLabel3.style.display = "none";
            enableAdControls3();
          } else {
            timerLabel3.textContent = "Skip in " + remaining3 + "s";
          }
        }, 1000);
      }

      if (cfg3.cdnUrl) {
        if (cfg3.mediaType === "video") {
          var vid3 = document.createElement("video");
          vid3.style.cssText = "width:100%;border-radius:8px;display:block;margin-bottom:16px;max-height:240px;background:#000";
          vid3.setAttribute("playsinline", "");
          vid3.muted = false;
          vid3.src = cfg3.cdnUrl;
          var adStarted3 = false;
          vid3.oncanplay = function () {
            if (adStarted3) return;
            adStarted3 = true;
            sendEvent(token, gateId, step.id, "ad_start", adUnitId3);
            if (skipSecs3) startAdTimer3(skipSecs3);
            vid3.play().catch(function () {});
          };
          vid3.onended = function () {
            timerLabel3.style.display = "none";
            sendEvent(token, gateId, step.id, "ad_complete", adUnitId3);
            if (step.onSkip === "proceed") { removeOverlay(); onComplete(); }
            else onComplete();
          };
          vid3.onerror = function () {
            if (!adStarted3) {
              adStarted3 = true;
              sendEvent(token, gateId, step.id, "ad_start", adUnitId3);
            }
            vid3.style.display = "none";
            enableAdControls3();
          };
          card.appendChild(vid3);
        } else {
          var img3 = document.createElement("img");
          img3.style.cssText = "width:100%;border-radius:8px;display:block;margin-bottom:16px";
          img3.alt = "";
          img3.src = cfg3.cdnUrl;
          var imgLoaded3 = false;
          img3.onload = function () {
            if (imgLoaded3) return;
            imgLoaded3 = true;
            sendEvent(token, gateId, step.id, "ad_start", adUnitId3);
            if (skipSecs3) startAdTimer3(skipSecs3);
            else enableAdControls3();
          };
          img3.onerror = function () {
            if (!imgLoaded3) {
              imgLoaded3 = true;
              img3.style.display = "none";
              sendEvent(token, gateId, step.id, "ad_start", adUnitId3);
              enableAdControls3();
            }
          };
          card.appendChild(img3);
          if (cfg3.ctaLabel && cfg3.ctaUrl) {
            var ctaLink3 = document.createElement("a");
            ctaLink3.className = "opw-btn opw-btn-secondary";
            ctaLink3.style.cssText = "display:block;margin-bottom:8px;text-align:center;text-decoration:none";
            ctaLink3.href = cfg3.ctaUrl;
            ctaLink3.target = "_blank";
            ctaLink3.rel = "noopener noreferrer";
            ctaLink3.textContent = cfg3.ctaLabel;
            card.appendChild(ctaLink3);
          }
        }
      } else {
        var adBox3 = document.createElement("div");
        adBox3.style.cssText = "background:#f5f5f5;border-radius:8px;height:120px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:13px;margin-bottom:16px";
        adBox3.textContent = "Ad";
        card.appendChild(adBox3);
        sendEvent(token, gateId, step.id, "ad_start", adUnitId3);
        enableAdControls3();
      }

      card.appendChild(timerLabel3);
      card.appendChild(continueBtn3);
      if (skipSecs3) card.appendChild(skipBtn3);

    } else if (step.stepType === "lead_capture") {
      var cfg4 = step.config || {};

      var title4 = document.createElement("div");
      title4.className = "opw-title";
      title4.textContent = cfg4.heading || "Get free access";
      card.appendChild(title4);

      var emailIn4 = document.createElement("input");
      emailIn4.className = "opw-input";
      emailIn4.type = "email";
      emailIn4.placeholder = "Your email address";
      card.appendChild(emailIn4);

      var nameIn4 = null;
      if (cfg4.nameRequired) {
        nameIn4 = document.createElement("input");
        nameIn4.className = "opw-input";
        nameIn4.type = "text";
        nameIn4.placeholder = "Your name";
        nameIn4.style.marginTop = "8px";
        card.appendChild(nameIn4);
      }

      var gdprRow4 = document.createElement("label");
      gdprRow4.style.cssText = "display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#666;margin:10px 0;cursor:pointer;";
      var gdprCheck4 = document.createElement("input");
      gdprCheck4.type = "checkbox";
      gdprCheck4.style.marginTop = "2px";
      var gdprSpan4 = document.createElement("span");
      gdprSpan4.textContent = cfg4.gdprText || "I agree to receive emails from this publisher.";
      gdprRow4.appendChild(gdprCheck4);
      gdprRow4.appendChild(gdprSpan4);
      card.appendChild(gdprRow4);

      var cta4 = document.createElement("button");
      cta4.className = "opw-btn opw-btn-primary";
      cta4.textContent = cfg4.ctaLabel || "Get access";
      cta4.onclick = function () {
        if (!emailIn4.value || emailIn4.value.indexOf("@") === -1) { emailIn4.focus(); return; }
        if (cfg4.nameRequired && nameIn4 && !nameIn4.value.trim()) { nameIn4.focus(); return; }
        if (!gdprCheck4.checked) { gdprCheck4.focus(); return; }
        cta4.disabled = true;
        cta4.textContent = "Submitting…";
        fetch(_base + "/api/embed/lead-capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: token,
            gateId: gateId,
            stepId: step.id,
            email: emailIn4.value,
            name: nameIn4 ? nameIn4.value.trim() : null,
            gdprConsent: true,
          }),
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.ok) {
              removeOverlay();
              onComplete();
            } else {
              cta4.disabled = false;
              cta4.textContent = cfg4.ctaLabel || "Get access";
            }
          })
          .catch(function () {
            cta4.disabled = false;
            cta4.textContent = cfg4.ctaLabel || "Get access";
          });
      };
      card.appendChild(cta4);

    } else if (step.stepType === "digital_product") {
      var cfg5 = step.config || {};
      var dpPaise = cfg5.priceInPaise || 0;
      var dpRupees = (dpPaise / 100).toFixed(0);

      var title5 = document.createElement("div");
      title5.className = "opw-title";
      title5.textContent = cfg5.productTitle || cfg5.label || "Download";
      card.appendChild(title5);

      if (cfg5.productDescription) {
        var desc5 = document.createElement("div");
        desc5.className = "opw-sub";
        desc5.textContent = cfg5.productDescription;
        card.appendChild(desc5);
      }

      var sub5 = document.createElement("div");
      sub5.className = "opw-sub";
      sub5.textContent = "One-time purchase — ₹" + dpRupees;
      card.appendChild(sub5);

      var buyEmail5 = document.createElement("input");
      buyEmail5.className = "opw-input";
      buyEmail5.type = "email";
      buyEmail5.placeholder = "Email for download link";
      card.appendChild(buyEmail5);

      var buy5 = document.createElement("button");
      buy5.className = "opw-btn opw-btn-primary";
      buy5.textContent = "Buy & Download — ₹" + dpRupees;
      buy5.onclick = function () {
        if (!buyEmail5.value || buyEmail5.value.indexOf("@") === -1) { buyEmail5.focus(); return; }
        buy5.disabled = true;
        buy5.textContent = "Opening payment…";
        fetch(_base + "/api/embed/digital-product?action=create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token, gateId: gateId, stepId: step.id, email: buyEmail5.value }),
        })
          .then(function (r) { return r.json(); })
          .then(function (order) {
            if (order.error) {
              buy5.disabled = false;
              buy5.textContent = "Buy & Download — ₹" + dpRupees;
              return;
            }
            loadRazorpay(function () {
              try {
                var rzp5 = new window.Razorpay({
                  key: order.keyId,
                  amount: order.amount,
                  currency: order.currency,
                  order_id: order.orderId,
                  name: "OnePaywall",
                  description: cfg5.productTitle || "Digital download",
                  handler: function (response) {
                    fetch(_base + "/api/embed/digital-product?action=verify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        token: token,
                        gateId: gateId,
                        stepId: step.id,
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        email: buyEmail5.value,
                      }),
                    })
                      .then(function (r) { return r.json(); })
                      .then(function (result) {
                        if (result.downloadUrl) {
                          var a = document.createElement("a");
                          a.href = result.downloadUrl;
                          a.download = cfg5.fileName || "download";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          removeOverlay();
                          onComplete();
                        } else {
                          buy5.disabled = false;
                          buy5.textContent = "Buy & Download — ₹" + dpRupees;
                        }
                      })
                      .catch(function () {
                        buy5.disabled = false;
                        buy5.textContent = "Buy & Download — ₹" + dpRupees;
                      });
                  },
                  modal: {
                    ondismiss: function () {
                      buy5.disabled = false;
                      buy5.textContent = "Buy & Download — ₹" + dpRupees;
                    },
                  },
                });
                rzp5.open();
              } catch (e) {
                buy5.disabled = false;
                buy5.textContent = "Buy & Download — ₹" + dpRupees;
              }
            }, function () {
              buy5.disabled = false;
              buy5.textContent = "Buy & Download — ₹" + dpRupees;
            });
          })
          .catch(function () {
            buy5.disabled = false;
            buy5.textContent = "Buy & Download — ₹" + dpRupees;
          });
      };
      card.appendChild(buy5);

      if (!cfg5.hideSkip) {
        var skip5 = document.createElement("button");
        skip5.className = "opw-btn opw-btn-secondary";
        skip5.textContent = "Skip";
        skip5.onclick = function () {
          if (step.onSkip === "proceed") { removeOverlay(); onComplete(); }
          else onComplete();
        };
        card.appendChild(skip5);
      }
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

  function sendEvent(token, gateId, stepId, eventType, adUnitId) {
    var body = { token: token, gateId: gateId, stepId: stepId, eventType: eventType };
    if (adUnitId) body.adUnitId = adUnitId;
    fetch(_base + "/api/embed/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  function sendPageEvent(token, eventType, extra) {
    var body = Object.assign({ token: token, eventType: eventType, url: location.href, referrer: document.referrer }, extra || {});
    fetch(_base + "/api/embed/page-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(function () {});
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

    // Logout via URL param
    var logoutParam = "";
    try { logoutParam = new URLSearchParams(location.search).get("opw_logout") || ""; } catch (e) {}
    if (logoutParam === "1") {
      clearReaderIdentity();
      var cleanUrl = new URL(location.href);
      var redirectTo = cleanUrl.searchParams.get("opw_redirect") || "";
      cleanUrl.searchParams.delete("opw_logout");
      cleanUrl.searchParams.delete("opw_redirect");
      if (redirectTo) {
        try {
          var dest = new URL(redirectTo, location.origin);
          if (dest.origin === location.origin) { location.replace(dest.href); return; }
        } catch (e) {}
      }
      history.replaceState(null, "", cleanUrl.toString());
      location.reload();
      return;
    }

    var startTime = Date.now();
    var isSubscriber = false;
    var gateShown = false;

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
        isSubscriber = !!data.isSubscriber;
        gateShown = !!data.gate;
        if (token) sendPageEvent(token, "page_view");
        if (isSubscriber) {
          if (restoreToken) {
            var cleanSub = new URL(location.href);
            cleanSub.searchParams.delete("opw_restore_token");
            history.replaceState(null, "", cleanSub.toString());
          }
          injectStyles();
          renderSubscriberWidget(data);
          return;
        }
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

    // Fire read_complete once when scroll >= 80% AND elapsed >= 30s
    var readComplete = false;
    var readCheckInterval = setInterval(function () {
      if (readComplete) { clearInterval(readCheckInterval); return; }
      var elapsed = Math.round((Date.now() - startTime) / 1000);
      if (maxScroll >= 80 && elapsed >= 30) {
        readComplete = true;
        clearInterval(readCheckInterval);
        if (token) sendPageEvent(token, "read_complete", { readTimeSeconds: elapsed, scrollDepthPct: maxScroll });
      }
    }, 5000);

    window.addEventListener("pagehide", function () {
      clearInterval(readCheckInterval);
      if (!token) return;
      sendSignal(token, {
        readTimeSeconds: Math.round((Date.now() - startTime) / 1000),
        scrollDepthPct: maxScroll,
        isSubscriber: isSubscriber,
        gateShown: gateShown,
      });
    });
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  window.OnePaywall = window.OnePaywall || {};
  window.OnePaywall.logout = function (opts) {
    clearReaderIdentity();
    var ret = opts && opts.returnUrl ? opts.returnUrl : null;
    if (ret) {
      try {
        var u = new URL(ret, location.origin);
        if (u.origin === location.origin) { location.replace(u.href); return; }
      } catch (e) {}
    }
    location.reload();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
