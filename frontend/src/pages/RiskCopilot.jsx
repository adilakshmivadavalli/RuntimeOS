import { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, PageWrap } from "@/components/ui-lib";
import { ShieldAlert, Search, Ban, ArrowUpRight, CheckCircle2, AlertTriangle, Gauge, GitBranch, LockKeyhole, FileCheck2 } from "lucide-react";

const LEVELS = [
  { id: "OFF", title: "Off", desc: "Baseline comparison", tone: "muted" },
  { id: "LOW", title: "Low", desc: "Named actions + redaction", tone: "cyan" },
  { id: "MEDIUM", title: "Medium", desc: "Context + step-up + dual control", tone: "amber" },
  { id: "HIGH", title: "High", desc: "Harm + provenance + uncertainty", tone: "violet" },
];

export default function RiskCopilot() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState("Show high-risk transactions");
  const [answer, setAnswer] = useState(null);
  const [governance, setGovernance] = useState(null);
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState("HIGH");
  const [scenarios, setScenarios] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState("B1");
  const [scenarioRun, setScenarioRun] = useState(null);
  const [auditCheck, setAuditCheck] = useState(null);

  const load = async () => {
    const [{ data: s }, { data: t }, { data: sc }, { data: m }] = await Promise.all([
      api.get("/risk/summary"),
      api.get("/risk/transactions?min_risk=60&limit=12"),
      api.get("/risk/scenarios"),
      api.get("/risk/metrics"),
    ]);
    setSummary(s); setTransactions(t.transactions || []); setScenarios(sc.scenarios || []); setMetrics(m);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const runQuery = async (q = query) => {
    setBusy(true);
    try { const { data } = await api.post("/risk/copilot/query", { query: q }); setAnswer(data); }
    finally { setBusy(false); }
  };

  const govern = async (payload) => {
    setBusy(true);
    try {
      const { data } = await api.post("/risk/govern", { governance_level: level, ...payload });
      setGovernance(data);
    } finally { setBusy(false); }
  };

  const runScenario = async (scenarioId = selectedScenario) => {
    setBusy(true);
    try {
      const { data } = await api.get(`/risk/scenarios/${scenarioId}/run?level=${level}`);
      setScenarioRun(data);
    } finally { setBusy(false); }
  };

  const verifyAudit = async () => {
    const { data } = await api.get("/risk/audit-chain?limit=100");
    setAuditCheck(data);
  };

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Google AI Builder Cup · BFSI"
        title="Risk, Fraud & Regulatory Intelligence Copilot"
        subtitle="Gemini reasons over risk and regulatory evidence. RuntimeOS governs every consequential action at runtime, with every decision logged to Firestore."
        testid="risk-copilot-header"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        {summary && [
          ["Transactions", summary.transactions?.toLocaleString()],
          ["Fraud labels", summary.fraud_labels?.toLocaleString()],
          ["High / critical", `${((summary.risk_counts?.HIGH || 0) + (summary.risk_counts?.CRITICAL || 0)).toLocaleString()}`],
          ["High-risk share", `${summary.high_risk_share_pct}%`],
        ].map(([label, value]) => (
          <div className="surface rounded-xl p-4" key={label}>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono-plex">{label}</div>
            <div className="font-display text-2xl mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div className="surface rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="font-display text-lg">Governance level</div>
            <div className="text-xs text-neutral-500">Same action, different control strength. Designed for side-by-side security/utility comparison.</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500"><Gauge size={14} />Runtime gate</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {LEVELS.map((item) => (
            <button
              key={item.id}
              onClick={() => setLevel(item.id)}
              className={`text-left rounded-lg border p-3 transition ${level === item.id ? "border-cyan-400 bg-cyan-400/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm">{item.title}</span>
                <span className="text-[10px] font-mono-plex text-neutral-500">{item.id}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="surface rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center gap-2 mb-3"><Search size={16} className="text-cyan-300" /><div className="font-display text-lg">Ask the copilot</div></div>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && runQuery()} />
            <button className="btn-primary" onClick={() => runQuery()} disabled={busy}>{busy ? "Working…" : "Ask"}</button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {["Show high-risk transactions", "Why was TXN-00000071 flagged?", "What AML controls are relevant?", "Generate an audit report", "Compare governance levels"].map(q => (
              <button key={q} className="btn-secondary text-xs" onClick={() => { setQuery(q); runQuery(q); }}>{q}</button>
            ))}
          </div>
          {answer && (
            <div className="rounded-lg border hairline p-4 bg-black/10">
              <div className="text-xs text-neutral-400 mb-2">{answer.answer || "Copilot result"}</div>
              {answer.transactions && (
                <div className="overflow-auto"><table className="w-full text-xs"><thead><tr><th className="text-left p-2">Transaction</th><th className="text-left p-2">Amount</th><th className="text-left p-2">Risk</th><th className="text-left p-2">Signals</th></tr></thead>
                  <tbody>{answer.transactions.map(t => <tr key={t.transaction_id} className="border-t hairline"><td className="p-2 font-mono-plex">{t.transaction_id}</td><td className="p-2">₹{Number(t.amount_inr).toLocaleString()}</td><td className="p-2">{t.risk_score} / {t.risk_level}</td><td className="p-2">{t.risk_signals}</td></tr>)}</tbody>
                </table></div>
              )}
              {answer.matches && (
                <div className="space-y-2">{answer.matches.map(m => <div key={m.doc_id} className="border hairline rounded-lg p-3"><div className="font-medium text-sm">{m.document_name}</div><div className="text-xs text-neutral-400 mt-1">{m.section_hint}</div><div className="text-xs text-neutral-500 mt-1">{m.guidance_summary}</div><a className="text-xs text-cyan-300" href={m.source_url} target="_blank" rel="noreferrer">Source ↗</a></div>)}</div>
              )}
              {answer.report && <pre className="mt-3 text-[11px] whitespace-pre-wrap text-neutral-400">{JSON.stringify(answer.report, null, 2)}</pre>}
            </div>
          )}
        </div>

        <div className="surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3"><ShieldAlert size={16} className="text-cyan-300" /><div className="font-display text-lg">RuntimeOS enforcement</div></div>
          <p className="text-xs text-neutral-500 mb-4">Current level: <span className="text-neutral-200">{level}</span>. Risk intelligence informs the action, but RuntimeOS decides what reaches the tool.</p>
          <div className="space-y-2">
            <button className="w-full btn-secondary flex items-center justify-between" onClick={() => govern({ action: "read", resource: "account.balance" })}><span>Read balance</span><CheckCircle2 size={14} /></button>
            <button className="w-full btn-secondary flex items-center justify-between" onClick={() => govern({ action: "read", resource: "customer.profile", contains_pii: true })}><span>Access customer PII</span><AlertTriangle size={14} /></button>
            <button className="w-full btn-secondary flex items-center justify-between" onClick={() => govern({ action: "transfer", resource: "customer.account", amount_inr: 50000, external: true, new_beneficiary: true })}><span>Transfer ₹50,000</span><Ban size={14} /></button>
            <button className="w-full btn-secondary flex items-center justify-between" onClick={() => govern({ action: "transfer", resource: "customer.account", amount_inr: 150000, external: true, delegation_scope: 100000 })}><span>Transfer ₹1.5L</span><ArrowUpRight size={14} /></button>
          </div>
          {governance && (
            <div className="mt-4 p-4 rounded-lg border hairline">
              <div className="flex items-center justify-between"><div className="text-[10px] uppercase tracking-wider text-neutral-500">Decision</div><div className="text-[10px] font-mono-plex text-neutral-600">{governance.decision_id}</div></div>
              <div className="font-display text-2xl mt-1">{governance.decision}</div>
              <div className="text-xs text-neutral-400 mt-2">Risk {governance.risk_score} · {governance.risk_level} · P(harm) {governance.harm_probability ?? "—"}</div>
              <div className="text-xs text-neutral-400 mt-2">{governance.reason}</div>
              <div className="mt-3 space-y-1"><div className="text-[10px] uppercase tracking-wider text-neutral-600">Trace</div>{(governance.evaluation_trace || []).map((x, i) => <div key={i} className="text-[11px] text-neutral-500"><span className="text-neutral-300">{x.step}:</span> {x.detail}</div>)}</div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500"><LockKeyhole size={13} /> Provenance {governance.provenance?.verified ? "verified" : "untrusted"}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="surface rounded-xl p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-3"><div><div className="font-display text-lg">Curated BFSI red-team scenarios</div><div className="text-xs text-neutral-500">Nine scenario patterns mapped from the supplied governance research note.</div></div><div className="flex items-center gap-2"><select className="input text-xs" value={selectedScenario} onChange={e => setSelectedScenario(e.target.value)}>{scenarios.map(s => <option key={s.id} value={s.id}>{s.id} · {s.domain}</option>)}</select><button className="btn-primary text-xs" onClick={() => runScenario()} disabled={busy}>Replay {level}</button></div></div>
          <div className="overflow-auto"><table className="w-full text-xs"><thead><tr><th className="text-left p-2">ID</th><th className="text-left p-2">Domain</th><th className="text-left p-2">Attack</th><th className="text-left p-2">Expected</th></tr></thead><tbody>{scenarios.map(s => <tr key={s.id} className="border-t hairline"><td className="p-2 font-mono-plex">{s.id}</td><td className="p-2">{s.domain}</td><td className="p-2 max-w-[420px]">{s.attack}</td><td className="p-2">{s.expected?.[level]}</td></tr>)}</tbody></table></div>
          {scenarioRun && <div className="mt-4 rounded-lg border hairline p-4"><div className="flex items-center gap-2"><GitBranch size={14} className="text-cyan-300" /><span className="text-sm font-medium">{scenarioRun.scenario_id} · {scenarioRun.governance_level}</span></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3"><div><div className="text-[10px] text-neutral-500">Decision</div><div className="font-display text-xl">{scenarioRun.decision}</div></div><div><div className="text-[10px] text-neutral-500">Risk</div><div className="font-display text-xl">{scenarioRun.risk_score}</div></div><div><div className="text-[10px] text-neutral-500">P(harm)</div><div className="font-display text-xl">{scenarioRun.harm_probability ?? "—"}</div></div><div><div className="text-[10px] text-neutral-500">Attack executes?</div><div className="font-display text-xl">{scenarioRun.harmful_action_executes ? "YES" : "NO"}</div></div></div><div className="text-xs text-neutral-400 mt-3">{scenarioRun.reason}</div></div>}
        </div>

        <div className="surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3"><FileCheck2 size={15} className="text-cyan-300" /><div className="font-display text-lg">Governance evidence</div></div>
          {metrics?.levels?.length ? <div className="space-y-2">{metrics.levels.map(m => <div key={m.level} className="rounded-lg border hairline p-3"><div className="flex items-center justify-between"><span className="font-medium text-sm">{m.level}</span><span className="font-mono-plex text-[10px] text-neutral-500">ASR {Math.round(m.attack_success_rate_pct)}%</span></div><div className="grid grid-cols-3 gap-2 mt-2 text-[11px] text-neutral-500"><div>Esc {Math.round(m.escalation_rate * 100)}%</div><div>NRP {m.nrp}</div><div>p95 {m.p95_gate_latency_ms_local}ms</div></div></div>)}</div> : <div className="text-xs text-neutral-500">Metrics unavailable.</div>}
          <button className="btn-secondary text-xs mt-3 w-full" onClick={verifyAudit}>Verify audit chain</button>
          {auditCheck && <div className={`mt-3 text-xs rounded-lg border p-3 ${auditCheck.valid ? "border-emerald-400/30" : "border-red-400/30"}`}>Hash chain: <strong>{auditCheck.valid ? "VALID" : "INVALID"}</strong> · {auditCheck.events_checked} events checked</div>}
        </div>
      </div>

      <div className="surface rounded-xl p-5 mt-4"><div className="font-display text-lg mb-3">Highest-risk transactions</div><div className="overflow-auto"><table className="w-full text-xs"><thead><tr><th className="text-left p-2">ID</th><th className="text-left p-2">Customer</th><th className="text-left p-2">Amount</th><th className="text-left p-2">Country</th><th className="text-left p-2">Risk</th><th className="text-left p-2">Signals</th></tr></thead><tbody>{transactions.map(t => <tr key={t.transaction_id} className="border-t hairline"><td className="p-2 font-mono-plex">{t.transaction_id}</td><td className="p-2">{t.customer_id}</td><td className="p-2">₹{Number(t.amount_inr).toLocaleString()}</td><td className="p-2">{t.country}</td><td className="p-2">{t.risk_score} / {t.risk_level}</td><td className="p-2">{t.risk_signals}</td></tr>)}</tbody></table></div></div>
      <div className="text-[10px] text-neutral-600 font-mono-plex mt-4">Data is synthetic for the hackathon. Regulatory summaries are illustrative evidence seeds; replace them with current official source documents before production/legal use. External benchmark repositories require separate setup and licence validation.</div>
    </PageWrap>
  );
}
