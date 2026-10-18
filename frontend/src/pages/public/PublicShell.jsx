import { Link, NavLink } from "react-router-dom";
import {
  Shield, Github, ArrowRight, ShieldCheck,
  Sparkles, MapPin,
} from "lucide-react";

const NAV = [
  { to: "/product",    label: "Product" },
  { to: "/pricing",    label: "Pricing" },
  { to: "/docs",       label: "Docs" },
  { to: "/security",   label: "Security" },
  { to: "/customers",  label: "Customers" },
  { to: "/playground", label: "Playground" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-black/60 border-b hairline">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="public-logo">
          <div className="w-8 h-8 rounded-lg surface flex items-center justify-center">
            <Shield size={16} className="text-cyan-300" />
          </div>
          <div>
            <div className="font-display text-[15px] leading-none">RuntimeOS</div>
            <div className="text-[10px] text-neutral-500 font-mono-plex mt-1">
              runtime.governance
            </div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`public-nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                `px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive ? "text-white bg-white/[0.05]" : "text-neutral-400 hover:text-white"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 ml-auto">
          <a
            href="https://github.com/Embergroundagents/Agentflow.ai"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm hidden sm:flex items-center gap-2"
            data-testid="public-header-github"
          >
            <Github size={13} /> GitHub
          </a>
          <Link
            to="/console"
            className="btn-secondary text-sm hidden sm:inline-flex"
            data-testid="public-signin"
          >
            Open console
          </Link>
          <Link
            to="/pilot"
            className="btn-primary text-sm flex items-center gap-2"
            data-testid="public-cta-pilot"
          >
            Book a pilot <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}

const COL_PRODUCT = [
  ["Overview", "/product"],
  ["Pricing", "/pricing"],
  ["Playground", "/playground"],
  ["Benchmarks", "/benchmarks"],
  ["Security", "/security"],
];

const COL_RESOURCES = [
  ["Documentation", "/docs"],
  ["API reference", "/api/docs"],
  ["Python SDK", "/docs#python"],
  ["TypeScript SDK", "/docs#typescript"],
  ["Changelog", "https://github.com/Embergroundagents/Agentflow.ai/releases"],
];

const COL_COMPANY = [
  ["About", "/product"],
  ["Customers", "/customers"],
  ["Book a pilot", "/pilot"],
  ["Terms", "#"],
  ["Privacy", "#"],
];

/** Animated grid + glow + node network background. */
function AiBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-40"
           style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.22), transparent 70%)" }} />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 90%)",
        }}
      />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 380" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mg-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="rgba(34,211,238,0)" />
            <stop offset="50%"  stopColor="rgba(34,211,238,0.55)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        {[
          [90, 60, 400, 120],
          [340, 190, 720, 90],
          [640, 260, 980, 60],
          [180, 320, 560, 220],
          [820, 220, 1120, 320],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="url(#mg-line)"
            strokeWidth="1"
            opacity="0.7"
          />
        ))}
        {[
          [90, 60], [340, 190], [640, 260], [180, 320], [820, 220],
          [400, 120], [720, 90], [980, 60], [560, 220], [1120, 320],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="2.5" fill="rgba(34,211,238,0.9)">
              <animate attributeName="opacity" values="0.3;1;0.3" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
            </circle>
            <circle cx={cx} cy={cy} r="7" fill="rgba(34,211,238,0.15)">
              <animate attributeName="r" values="4;12;4" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
              <animate attributeName="opacity" values="0.5;0;0.5" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
            </circle>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}

function FooterCol({ title, links, testid }) {
  return (
    <div data-testid={testid}>
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono-plex mb-4">
        {title}
      </div>
      <div className="space-y-2.5">
        {links.map(([label, href]) => {
          const external = href.startsWith("http") || href.startsWith("mailto");
          const hash = href === "#";
          if (external || hash) {
            return (
              <div key={label}>
                <a
                  href={href}
                  target={external && !href.startsWith("mailto") ? "_blank" : undefined}
                  rel={external && !href.startsWith("mailto") ? "noreferrer" : undefined}
                  className="text-sm text-neutral-400 hover:text-cyan-300 transition-colors"
                >
                  {label}
                </a>
              </div>
            );
          }
          return (
            <div key={label}>
              <Link to={href} className="text-sm text-neutral-400 hover:text-cyan-300 transition-colors">
                {label}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="relative mt-24 border-t hairline bg-black" data-testid="public-footer">
      <AiBackdrop />

      {/* Top strip: mission + CTAs */}
      <div className="relative max-w-[1400px] mx-auto px-6 pt-16 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-10 border-b hairline">
        <div>
          <div className="text-[11px] tracking-[0.2em] uppercase text-cyan-300 font-mono-plex mb-3 flex items-center gap-2">
            <Sparkles size={12} /> Runtime governance for autonomous AI
          </div>
          <h3 className="font-display text-3xl md:text-4xl tracking-tight max-w-xl">
            Deploy, govern, and scale AI agents your security team can defend.
          </h3>
        </div>
        <div className="flex flex-col justify-center gap-4">
          <p className="text-neutral-400 text-sm max-w-md">
            One control plane for every agent — LangGraph, OpenAI Agents SDK, CrewAI, Google
            ADK, and MCP. Explainable decisions, versioned policies, and enterprise-grade
            audit built in.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/pilot"
              className="btn-primary flex items-center gap-2"
              data-testid="footer-cta-pilot"
            >
              Book a pilot <ArrowRight size={14} />
            </Link>
            <Link
              to="/pricing"
              className="btn-secondary flex items-center gap-2"
              data-testid="footer-cta-pricing"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Main 4-column nav grid */}
      <div className="relative max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg surface flex items-center justify-center">
              <Shield size={18} className="text-cyan-300" />
            </div>
            <div>
              <div className="font-display text-[16px]">RuntimeOS</div>
              <div className="text-[10px] text-neutral-500 font-mono-plex -mt-0.5">
                runtime.governance
              </div>
            </div>
          </div>
          <p className="text-neutral-500 text-sm max-w-sm leading-relaxed">
            The zero-trust runtime infrastructure layer for autonomous AI. Deployed by
            platform, security, and compliance teams shipping agents into production.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500 font-mono-plex">
            <ShieldCheck size={12} className="text-cyan-300" />
            SOC 2 · ISO 27001 · GDPR · HIPAA
          </div>
        </div>

        <FooterCol title="Product"   links={COL_PRODUCT}   testid="footer-col-product" />
        <FooterCol title="Resources" links={COL_RESOURCES} testid="footer-col-resources" />
        <FooterCol title="Company"   links={COL_COMPANY}   testid="footer-col-company" />
      </div>

      {/* Dedicated Contact section — inline, no cards */}
      <div id="contact" className="relative border-t hairline">
        <div
          className="max-w-[1400px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-x-10 gap-y-8"
          data-testid="footer-contact"
        >
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono-plex mb-3">
              Contact
            </div>
            <div className="font-display text-2xl tracking-tight leading-tight">
              Talk to a human.
            </div>
            <div className="text-neutral-500 text-sm mt-2 max-w-xs">
              Enterprise, security questionnaires, or a quick demo — we usually reply within
              one business day.
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono-plex mb-3">
              Email
            </div>
            <a
              href="mailto:adilakshmi.vadavalli@gmail.com"
              data-testid="footer-contact-email"
              title="adilakshmi.vadavalli@gmail.com"
              className="font-mono-plex text-cyan-300 text-[15px] hover:underline decoration-cyan-500/40 underline-offset-4 block truncate max-w-full"
            >
              adilakshmi.vadavalli@gmail.com
            </a>
          </div>

          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono-plex mb-3">
              GitHub
            </div>
            <a
              href="https://github.com/Embergroundagents/Agentflow.ai"
              target="_blank"
              rel="noreferrer"
              data-testid="footer-social-github"
              className="inline-flex items-center gap-2 font-mono-plex text-cyan-300 text-[15px] hover:underline decoration-cyan-500/40 underline-offset-4 whitespace-nowrap"
            >
              <Github size={14} /> Embergrounds / RuntimeOS
            </a>
          </div>
        </div>
      </div>

      {/* Legal bar */}
      <div className="relative border-t hairline bg-black/60">
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-neutral-600 text-xs font-mono-plex flex items-center gap-2">
            <MapPin size={12} className="text-cyan-300/70" />
            © 2026 RuntimeOS · zero-trust runtime for autonomous AI
          </div>
          <div className="text-neutral-600 text-xs font-mono-plex flex flex-wrap items-center gap-x-4 gap-y-2 max-w-full">
            <a
              href="mailto:adilakshmi.vadavalli@gmail.com"
              className="hover:text-cyan-300 transition-colors truncate max-w-[240px]"
              title="adilakshmi.vadavalli@gmail.com"
            >
              adilakshmi.vadavalli@gmail.com
            </a>
            <span>·</span>
            <a
              href="https://github.com/Embergroundagents/Agentflow.ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
            >
              <Github size={11} /> GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}
