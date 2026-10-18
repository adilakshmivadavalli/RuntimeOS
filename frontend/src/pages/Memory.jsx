import { useState } from "react";
import api from "@/lib/api";
import { Brain, Search, Save, Loader2 } from "lucide-react";

export default function Memory() {
  const [write, setWrite] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const saveMemory = async () => {
    if (!write.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/memory/write", { content: write, extract_intent: true });
      setResult(data.result);
      setWrite("");
    } finally { setLoading(false); }
  };

  const searchMemory = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/memory/search", { query, limit: 10 });
      setResult(data.result);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-7 py-7">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300 font-mono-plex">memory plane</div>
          <h1 className="font-display text-3xl mt-1">Breeth Memory</h1>
          <p className="text-neutral-400 text-sm mt-2 max-w-2xl">Persistent, intent-aware agent memory behind the RuntimeOS governance boundary. Tenant scope is mapped to the Breeth group.</p>
        </div>
        <div className="surface rounded-lg px-3 py-2 text-xs text-neutral-400 flex items-center gap-2"><Brain size={14} className="text-cyan-300"/> Breeth</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="surface rounded-xl p-5">
          <div className="font-display text-base flex items-center gap-2"><Save size={15} className="text-cyan-300"/> Write memory</div>
          <textarea value={write} onChange={e=>setWrite(e.target.value)} className="mt-4 w-full min-h-[170px] bg-black/20 border hairline rounded-lg p-3 text-sm text-neutral-200 outline-none" placeholder="e.g. Customer prefers email communication and approved a follow-up next week." />
          <button onClick={saveMemory} disabled={loading || !write.trim()} className="btn-primary mt-3 flex items-center gap-2">{loading?<Loader2 size={14} className="animate-spin"/>:<Save size={14}/>} Store with intent extraction</button>
        </div>
        <div className="surface rounded-xl p-5">
          <div className="font-display text-base flex items-center gap-2"><Search size={15} className="text-cyan-300"/> Recall memory</div>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchMemory()} className="mt-4 w-full bg-black/20 border hairline rounded-lg p-3 text-sm text-neutral-200 outline-none" placeholder="Ask what the agent should remember…" />
          <button onClick={searchMemory} disabled={loading || !query.trim()} className="btn-secondary mt-3 flex items-center gap-2"><Search size={14}/> Search Breeth</button>
        </div>
      </div>
      <div className="surface rounded-xl p-5 mt-4">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono-plex mb-3">result</div>
        <pre className="text-xs text-neutral-300 whitespace-pre-wrap overflow-auto max-h-[360px]">{result ? JSON.stringify(result, null, 2) : "No memory operation yet."}</pre>
      </div>
    </div>
  );
}
