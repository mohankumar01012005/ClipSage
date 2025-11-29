// PricingPage.jsx
import React, { useState, useEffect } from "react";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/**
 * Tailwind v3+ required.
 * Usage: <PricingPage currency="₹" />
 */

const PLANS = [
  { key: "go", name: "Go", price: 200, period: "mo", highlight: false, features: ["Basic summaries", "3 AI calls / day", "Community support"] },
  { key: "plus", name: "Plus", price: 500, period: "mo", highlight: true, features: ["Everything in Go", "50 AI calls / month", "Saved prompts", "Priority queue"] },
  { key: "pro", name: "Pro", price: 700, period: "mo", highlight: false, features: ["Everything in Plus", "Unlimited AI calls", "Team seats", "SLA & onboarding"] },
];

function Badge({ children }) {
  return <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm">{children}</span>;
}

export default function PricingPage({ currency = "₹" }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("white");
  const isBlue = theme === "blue";
  const [isLoading, setIsLoading] = useState({ go: false, plus: false, pro: false });

  // get userId from localStorage (adjust if you store under different key)
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // Load Razorpay script
  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handlePaymentSuccess(response) {
        alert("Payment successful and verified!");
        localStorage.setItem("isPremium",true);
        navigate("/dashboard?paymentSuccess=true");
  }

  async function checkoutHandler(amount, planKey, planName) {
    if (!userId) {
      alert("Please login to purchase a subscription.");
      return;
    }

    setIsLoading((s) => ({ ...s, [planKey]: true }));

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load payment gateway. Try again later.");
        setIsLoading((s) => ({ ...s, [planKey]: false }));
        return;
      }

      // 1) get key from backend
      const { data: keyData } = await axios.get("http://localhost:5005/api/pay/getkey");
      const key = keyData?.key;
      if (!key) {
        alert("Failed to fetch payment key.");
        setIsLoading((s) => ({ ...s, [planKey]: false }));
        return;
      }

      // 2) create order at backend
      const { data: orderResp } = await axios.post(`http://localhost:5005/api/pay/checkout/${userId}`, {
        amount, // backend should expect amount in smallest currency unit (paise) or as you design it
        protype: planName,
      });

      const order = orderResp?.order;
      if (!order || !order.id) {
        console.error("Order creation response:", orderResp);
        alert("Failed to create order. Try again.");
        setIsLoading((s) => ({ ...s, [planKey]: false }));
        return;
      }

      const options = {
        key,
        amount: order.amount, // amount in paise (or as returned by your backend)
        currency: order.currency || "INR",
        name: "ClipSage",
        description: `${planName} Plan`,
        order_id: order.id,
        prefill: {
          name: localStorage.getItem("name") || localStorage.getItem("userName") || "User",
          email: localStorage.getItem("email") || "",
          contact: localStorage.getItem("phone") || "",
        },
        notes: {
          userId,
          planType: planName,
        },
        theme: {
          color: "#0ea5e9",
        },
        handler: function (razorpayResponse) {
          // razorpayResponse contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
          handlePaymentSuccess(razorpayResponse);
        },
        modal: {
          ondismiss: function () {
            setIsLoading((s) => ({ ...s, [planKey]: false }));
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response);
        alert(response.error?.description || "Payment failed. Try again.");
        setIsLoading((s) => ({ ...s, [planKey]: false }));
      });

      rzp.open();
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong during checkout. Try again.");
      setIsLoading((s) => ({ ...s, [planKey]: false }));
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-16 px-6 ${isBlue ? "bg-gradient-to-br from-sky-800 via-sky-700 to-sky-900 text-white" : "bg-gray-50 text-slate-900"}`}>
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isBlue ? "bg-white/10" : "bg-white shadow"}`} onClick={() => navigate("/")}>
              <Home className={`${isBlue ? "text-white" : "text-blue-500"}`} />
            </div>
            <div>
              <h2 className={`text-lg font-extrabold ${isBlue ? "text-white" : "text-slate-900"}`}>ClipSage Pricing</h2>
              <p className={`text-sm ${isBlue ? "text-sky-200/70" : "text-slate-600"}`}>Choose a plan that scales with your learning.</p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const featured = plan.highlight;
            const keyName = plan.key;
            return (
              <div key={plan.key} className={`relative rounded-2xl p-6 flex flex-col justify-between shadow-lg transform transition hover:-translate-y-1 ${isBlue ? (featured ? "bg-gradient-to-br from-sky-700 to-cyan-600 text-white" : "bg-white/6 text-white") : featured ? "bg-white border-2 border-sky-600" : "bg-white"}`}>
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${isBlue ? "bg-yellow-400 text-slate-900" : "bg-sky-600 text-white"}`}>Most Popular</div>
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-2xl font-extrabold ${isBlue ? "" : "text-slate-900"}`}>{plan.name}</h4>
                    <div className="text-right">
                      <div className={`text-3xl font-extrabold ${isBlue ? "" : "text-slate-900"}`}>
                        {currency}{plan.price}
                        <span className="text-base font-medium">/{plan.period}</span>
                      </div>
                    </div>
                  </div>

                  <p className={`mt-3 text-sm ${isBlue ? "text-sky-100/80" : "text-slate-600"}`}>{plan.name === "Go" ? "Get started with core features." : plan.name === "Plus" ? "For serious learners & creators." : "For teams and heavy users."}</p>

                  <ul className={`mt-6 space-y-3 text-sm ${isBlue ? "text-sky-100" : "text-slate-700"}`}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={`${isBlue ? "text-white" : "text-sky-600"} flex-none`}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M8 12.5l2 2 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition ${isBlue ? (featured ? "bg-white text-sky-700" : "bg-white/10 text-white hover:bg-white/20") : featured ? "bg-sky-600 text-white" : "bg-sky-50 text-slate-900"}`}
                    onClick={() => checkoutHandler(plan.price * 100, keyName, plan.name)} // multiplying by 100 to send paise; adjust based on your backend expectation
                    disabled={isLoading[keyName]}
                    aria-label={`Choose ${plan.name}`}
                  >
                    {isLoading[keyName] ? "Processing..." : featured ? "Start Pro" : `Choose ${plan.name}`}
                  </button>
                  <p className={`text-xs text-center mt-3 ${isBlue ? "text-sky-100/80" : "text-slate-500"}`}>No credit card required • Cancel anytime</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`mt-10 text-center text-sm ${isBlue ? "text-sky-100/70" : "text-slate-600"}`}>
          <p>Need a custom plan? <button className={`font-semibold ${isBlue ? "underline" : "text-sky-600 underline"}`}>Contact sales</button></p>
        </div>
      </div>
    </div>
  );
}
