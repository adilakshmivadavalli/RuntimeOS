import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PublicShell } from "./PublicShell";
import { API } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Rocket } from "lucide-react";

const MAX_ATTEMPTS = 10;
const POLL_MS = 2000;

export default function PricingSuccess() {
  const [params] = useSearchParams();
  const checkoutRef = params.get("checkout_ref") || params.get("session_id");
  const [state, setState] = useState({
    phase: checkoutRef ? "polling" : "missing",
    attempts: 0,
    amount_total: 0,
    currency: "usd",
    package_id: "",
  });

  useEffect(() => {
    if (!checkoutRef) return;
    let cancelled = false;
    let timer;

    const poll = async (attempt) => {
      if (cancelled) return;
      try {
        const r = await fetch(`${API}/payments/status/${checkoutRef}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (cancelled) return;
        if (d.payment_status === "paid") {
          setState({
            phase: "success",
            attempts: attempt,
            amount_total: d.amount_total,
            currency: d.currency,
            package_id: d.package_id,
          });
          return;
        }
        if (d.status === "expired" || d.payment_status === "failed") {
          setState((s) => ({ ...s, phase: "failed", attempts: attempt }));
          return;
        }
        if (attempt >= MAX_ATTEMPTS) {
          setState((s) => ({ ...s, phase: "timeout", attempts: attempt }));
          return;
        }
        timer = setTimeout(() => poll(attempt + 1), POLL_MS);
      } catch (e) {
        if (attempt >= MAX_ATTEMPTS) {
          setState((s) => ({ ...s, phase: "timeout", attempts: attempt }));
          return;
        }
        timer = setTimeout(() => poll(attempt + 1), POLL_MS);
      }
    };
    poll(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [checkoutRef]);

  return (
    <PublicShell>
      <section className="max-w-[720px] mx-auto px-6 py-24 text-center" data-testid="pricing-success">
        {state.phase === "polling" && (
          <>
            <div className="w-16 h-16 rounded-full border border-cyan-500/40 bg-cyan-500/[0.08] flex items-center justify-center mx-auto">
              <Loader2 size={28} className="text-cyan-300 animate-spin" />
            </div>
            <h1 className="font-display text-4xl tracking-tight mt-6">
              Confirming your subscription…
            </h1>
            <p className="text-neutral-400 mt-3">
              Dodo Payments is finalizing the payment. This usually takes a couple of seconds.
            </p>
          </>
        )}

        {state.phase === "success" && (
          <>
            <div className="w-16 h-16 rounded-full border border-emerald-500/40 bg-emerald-500/[0.08] flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-emerald-300" />
            </div>
            <h1 className="font-display text-4xl tracking-tight mt-6" data-testid="pricing-success-heading">
              You're on Growth. 🎉
            </h1>
            <p className="text-neutral-400 mt-4 max-w-md mx-auto leading-relaxed">
              We've charged{" "}
              <span className="font-mono-plex text-cyan-300">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: (state.currency || "usd").toUpperCase(),
                }).format((state.amount_total || 0) / 100)}
              </span>{" "}
              — a receipt is on its way to your inbox. Your Growth tenant is being
              provisioned; you'll get onboarding steps in the next few minutes.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Link to="/console" className="btn-primary flex items-center gap-2" data-testid="pricing-success-console">
                Open the console <ArrowRight size={14} />
              </Link>
              <Link to="/docs" className="btn-secondary flex items-center gap-2">
                Read the docs
              </Link>
            </div>
            <div className="mt-8 surface rounded-xl p-5 text-left max-w-md mx-auto">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono-plex mb-2 flex items-center gap-2">
                <Rocket size={12} className="text-cyan-300" /> What happens next
              </div>
              <ol className="text-sm text-neutral-300 space-y-2 list-decimal list-inside">
                <li>Onboarding call scheduled within 1 business day.</li>
                <li>We help you author your first 5 policies.</li>
                <li>Route your production agents through the runtime.</li>
              </ol>
            </div>
          </>
        )}

        {(state.phase === "failed" || state.phase === "timeout" || state.phase === "missing") && (
          <>
            <div className="w-16 h-16 rounded-full border border-rose-500/40 bg-rose-500/[0.08] flex items-center justify-center mx-auto">
              <XCircle size={28} className="text-rose-300" />
            </div>
            <h1 className="font-display text-4xl tracking-tight mt-6">
              {state.phase === "missing" ? "No session found" : "Payment not completed"}
            </h1>
            <p className="text-neutral-400 mt-4 max-w-md mx-auto">
              {state.phase === "timeout"
                ? "We couldn't confirm the payment in time. Check your email for a Dodo Payments receipt or contact us."
                : "The checkout was cancelled or failed. You can try again from the pricing page."}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/pricing" className="btn-primary flex items-center gap-2">
                Back to pricing <ArrowRight size={14} />
              </Link>
              <a href="mailto:praneethmangala339@gmail.com" className="btn-secondary flex items-center gap-2">
                Contact us
              </a>
            </div>
          </>
        )}
      </section>
    </PublicShell>
  );
}
