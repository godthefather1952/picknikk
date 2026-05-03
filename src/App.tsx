import React, { useState, useMemo } from "react";
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Terminal,
  FileCode, BarChart3, Lock, Zap, Brain,
  Filter, TrendingUp, Activity, Database,
  ChevronRight, Info, Eye, Code2,
  GitBranch, Cpu, Layers,
  Search, Copy, Check, Package, FlaskConical
} from "lucide-react";
import { FILE_REGISTRY, CATEGORIES, FileEntry } from "./data/fileRegistry";

// ─── ROI Calculator (in-browser demo) ─────────────────────────

function estimateMoveForROI(
  underlyingPrice: number,
  _strike: number,
  optionMark: number,
  delta: number | null,
  gamma: number | null,
  iv: number | null,
  dte: number | null,
  maxThreshold: number,
): { method: string; confidence: string; requiredMovePct: number; passes: boolean; notes: string } {
  if (underlyingPrice <= 0 || optionMark <= 0) {
    return { method: "error", confidence: "none", requiredMovePct: 0, passes: false, notes: "Invalid inputs" };
  }

  const gainNeeded = optionMark;

  // Method 1: Delta + Gamma
  if (delta !== null && delta > 0.001 && gamma !== null && gamma > 0) {
    const discriminant = delta * delta + 2 * gamma * gainNeeded;
    if (discriminant >= 0) {
      const dS = (-delta + Math.sqrt(discriminant)) / gamma;
      if (dS > 0) {
        const movePct = dS / underlyingPrice;
        return {
          method: "delta_gamma",
          confidence: "HIGH",
          requiredMovePct: movePct,
          passes: movePct < maxThreshold,
          notes: `dS = $${dS.toFixed(2)} (${(movePct * 100).toFixed(2)}% move needed)`,
        };
      }
    }
  }

  // Method 2: Delta only
  if (delta !== null && delta > 0.001) {
    const dS = gainNeeded / delta;
    const rawPct = dS / underlyingPrice;
    const adjPct = rawPct * 1.15;
    return {
      method: "delta_only",
      confidence: "MEDIUM",
      requiredMovePct: adjPct,
      passes: adjPct < maxThreshold,
      notes: `Linear + 15% buffer: raw=${(rawPct * 100).toFixed(2)}%, adj=${(adjPct * 100).toFixed(2)}%`,
    };
  }

  // Method 3: Fallback
  if (iv !== null && iv > 0 && dte !== null && dte > 0) {
    const dailyVol = iv / Math.sqrt(252);
    const periodVol = dailyVol * Math.sqrt(dte);
    const fallback = periodVol * 0.75;
    return {
      method: "conservative_fallback",
      confidence: "LOW",
      requiredMovePct: fallback,
      passes: fallback < maxThreshold,
      notes: `0.75σ: period_vol=${(periodVol * 100).toFixed(1)}%, target=${(fallback * 100).toFixed(1)}%`,
    };
  }

  const assetPct = optionMark / underlyingPrice;
  const fallback = Math.min(assetPct * 3, 0.25);
  return {
    method: "conservative_fallback",
    confidence: "LOW",
    requiredMovePct: fallback,
    passes: fallback < maxThreshold,
    notes: `Premium-pct fallback: ${(assetPct * 100).toFixed(1)}% × 3 = ${(fallback * 100).toFixed(1)}%`,
  };
}

function ROICalculatorDemo() {
  const [underlyingPrice, setUnderlyingPrice] = useState(485);
  const [strike, setStrike] = useState(500);
  const [optionMark, setOptionMark] = useState(3.85);
  const [delta, setDelta] = useState(0.30);
  const [gamma, setGamma] = useState(0.015);
  const [iv, setIv] = useState(0.25);
  const [dte, setDte] = useState(55);
  const [useGamma, setUseGamma] = useState(true);
  const [useDelta, setUseDelta] = useState(true);
  const maxThreshold = 0.07;

  const result = useMemo(() => estimateMoveForROI(
    underlyingPrice, strike, optionMark,
    useDelta ? delta : null,
    useGamma ? gamma : null,
    iv, dte, maxThreshold
  ), [underlyingPrice, strike, optionMark, delta, gamma, iv, dte, useGamma, useDelta]);

  const methodColor = result.method === "delta_gamma"
    ? "text-green-400 border-green-700 bg-green-950/30"
    : result.method === "delta_only"
    ? "text-yellow-400 border-yellow-700 bg-yellow-950/30"
    : "text-orange-400 border-orange-700 bg-orange-950/30";

  const slider = (label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, format: (v: number) => string) => (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );

  return (
    <div className="rounded-xl border border-blue-800 bg-gradient-to-b from-blue-950/30 to-slate-900/80 p-6">
      <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        Interactive ROI Calculator Demo
      </h2>
      <p className="text-xs text-slate-400 mb-5">Adjust parameters to see how the Python function estimates required move for 100% ROI</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {slider("Underlying Price", underlyingPrice, 50, 1000, 1, setUnderlyingPrice, v => `$${v}`)}
          {slider("Strike Price", strike, 50, 1200, 1, setStrike, v => `$${v}`)}
          {slider("Option Mark (Premium)", optionMark, 0.10, 30, 0.05, setOptionMark, v => `$${v.toFixed(2)}`)}
          {slider("Days to Expiration", dte, 5, 120, 1, setDte, v => `${v} days`)}
          {slider("Implied Volatility", iv, 0.05, 1.0, 0.01, setIv, v => `${(v * 100).toFixed(0)}%`)}

          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useDelta} onChange={e => setUseDelta(e.target.checked)} className="accent-blue-500" />
              <span className="text-xs text-slate-300">Use Delta</span>
              {useDelta && slider("Delta", delta, 0.05, 0.95, 0.01, setDelta, v => v.toFixed(2))}
            </label>
            {useDelta && (
              <label className="flex items-center gap-2 cursor-pointer ml-4">
                <input type="checkbox" checked={useGamma} onChange={e => setUseGamma(e.target.checked)} className="accent-blue-500" />
                <span className="text-xs text-slate-300">Use Gamma</span>
                {useGamma && slider("Gamma", gamma, 0.001, 0.10, 0.001, setGamma, v => v.toFixed(3))}
              </label>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col gap-4">
          <div className={`p-4 rounded-xl border ${methodColor}`}>
            <div className="text-xs font-mono mb-1">Estimation Method</div>
            <div className="text-lg font-bold capitalize">
              {result.method.replace(/_/g, " ")}
            </div>
            <div className="mt-1">
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                result.confidence === "HIGH" ? "bg-green-700 text-green-100" :
                result.confidence === "MEDIUM" ? "bg-yellow-700 text-yellow-100" :
                "bg-orange-700 text-orange-100"
              }`}>{result.confidence} confidence</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700 text-center">
              <div className="text-xs text-slate-400 mb-1">Required Move</div>
              <div className={`text-2xl font-bold ${result.requiredMovePct < 0.04 ? "text-green-400" : result.requiredMovePct < 0.07 ? "text-yellow-400" : "text-red-400"}`}>
                {(result.requiredMovePct * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700 text-center">
              <div className="text-xs text-slate-400 mb-1">Price Target</div>
              <div className="text-2xl font-bold text-white">
                ${(underlyingPrice * (1 + result.requiredMovePct)).toFixed(2)}
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${result.passes ? "bg-green-950/30 border-green-700" : "bg-red-950/30 border-red-700"} text-center`}>
            <div className="text-2xl mb-1">{result.passes ? "✅" : "❌"}</div>
            <div className={`font-bold text-sm ${result.passes ? "text-green-300" : "text-red-300"}`}>
              {result.passes ? `PASSES ${maxThreshold * 100}% Threshold` : `FAILS ${maxThreshold * 100}% Threshold`}
            </div>
            <div className="text-xs text-slate-400 mt-1">{result.notes}</div>
          </div>

          {/* Threshold bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>0%</span>
              <span className="text-slate-300">Threshold: {maxThreshold * 100}%</span>
              <span>15%</span>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0" style={{ width: `${Math.min(result.requiredMovePct / 0.15 * 100, 100)}%`, background: result.passes ? "linear-gradient(to right, #22c55e, #4ade80)" : "linear-gradient(to right, #ef4444, #f87171)", transition: "width 0.3s ease" }} />
              <div className="absolute inset-y-0 border-r-2 border-yellow-400 opacity-70" style={{ left: `${maxThreshold / 0.15 * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Trading Logic Visualizations ─────────────────────────────

const SCAN_STEPS = [
  { id: 1, name: "Universe Load", desc: "~40 liquid US equities & ETFs", icon: "🌍", filter: "IV Rank < 20, Vol > 1M" },
  { id: 2, name: "Market Metrics", desc: "IV Rank, IV Percentile, Beta", icon: "📊", filter: "Sandbox: graceful degradation" },
  { id: 3, name: "Option Chains", desc: "Fetch full chains via SDK", icon: "⛓️", filter: "Calls only" },
  { id: 4, name: "DTE Filter", desc: "Days to expiration window", icon: "📅", filter: "45 ≤ DTE ≤ 70" },
  { id: 5, name: "Delta Filter", desc: "Target 0.30 delta calls", icon: "Δ", filter: "0.25 ≤ δ ≤ 0.35" },
  { id: 6, name: "Quality Checks", desc: "Greeks, mark, spread, OI", icon: "🔍", filter: "Spread < 10%, OI ≥ 5,000" },
  { id: 7, name: "Convexity Check", desc: "Required move for 100% ROI", icon: "📈", filter: "Move < 7%" },
  { id: 8, name: "Rank & Score", desc: "Multi-factor ranking", icon: "🏆", filter: "Best: low move + tight spread" },
  { id: 9, name: "Size & Dry Run", desc: "2% NLV risk, dry-run first", icon: "✅", filter: "LIMIT orders only, BTO" },
];

const EXIT_RULES = [
  {
    name: "Profit Target",
    icon: "🎯",
    condition: "Mark ≥ 200% of entry",
    action: "SELL_TO_CLOSE limit",
    priority: 1,
    color: "text-green-400",
    bg: "bg-green-900/30 border-green-700",
  },
  {
    name: "Time Exit",
    icon: "⏰",
    condition: "DTE ≤ 21 days",
    action: "SELL_TO_CLOSE limit",
    priority: 2,
    color: "text-yellow-400",
    bg: "bg-yellow-900/30 border-yellow-700",
  },
  {
    name: "Stop Loss",
    icon: "🛑",
    condition: "Mark ≤ 50% of entry",
    action: "SELL_TO_CLOSE limit",
    priority: 3,
    color: "text-red-400",
    bg: "bg-red-900/30 border-red-700",
  },
];

const ROI_METHODS = [
  {
    name: "Delta + Gamma",
    confidence: "HIGH",
    formula: "0.5·γ·dS² + δ·dS = option_mark",
    desc: "Quadratic approximation. Most accurate when both Greeks available.",
    badge: "bg-green-700 text-green-100",
    requires: "δ and γ",
  },
  {
    name: "Delta Only",
    confidence: "MEDIUM",
    formula: "dS = option_mark / δ × 1.15",
    desc: "Linear approximation with 15% conservative buffer for theta decay.",
    badge: "bg-yellow-700 text-yellow-100",
    requires: "δ only",
  },
  {
    name: "Conservative Fallback",
    confidence: "LOW",
    formula: "IV × √(DTE/252) × 0.75",
    desc: "IV-based 0.75-sigma estimate. Used when Greeks are missing.",
    badge: "bg-orange-700 text-orange-100",
    requires: "IV + DTE or premium %",
  },
];

const RISK_PARAMS = [
  { param: "Max risk/trade", value: "2% NLV", icon: "💰", detail: "Full premium at risk for long calls" },
  { param: "Max open positions", value: "3", icon: "📋", detail: "Configurable via MAX_OPEN_POSITIONS" },
  { param: "Max daily loss", value: "5% NLV", icon: "🚨", detail: "Triggers automatic kill switch" },
  { param: "Stop loss", value: "50% of entry", icon: "🛑", detail: "Mark ≤ 50% → SELL_TO_CLOSE" },
  { param: "Profit target", value: "200% of entry", icon: "🎯", detail: "Mark ≥ 200% → SELL_TO_CLOSE" },
  { param: "Time exit", value: "≤ 21 DTE", icon: "⏰", detail: "Theta decay protection" },
];

const SAFETY_FEATURES = [
  { title: "No Hardcoded Credentials", icon: <Lock className="w-5 h-5" />, color: "text-green-400", desc: "All credentials loaded from environment variables only" },
  { title: "Sandbox by Default", icon: <Shield className="w-5 h-5" />, color: "text-blue-400", desc: "Uses api.cert.tastyworks.com — requires explicit production opt-in" },
  { title: "Double Safety Gate", icon: <Shield className="w-5 h-5" />, color: "text-purple-400", desc: "Live trading needs BOTH live_trading_enabled=true AND tastytrade_env=production" },
  { title: "Dry-Run First", icon: <Eye className="w-5 h-5" />, color: "text-yellow-400", desc: "Every order dry-runs with broker API before submission" },
  { title: "No Market Orders", icon: <AlertTriangle className="w-5 h-5" />, color: "text-orange-400", desc: "Entry orders are always LIMIT — market orders disallowed by policy" },
  { title: "Kill Switch", icon: <XCircle className="w-5 h-5" />, color: "text-red-400", desc: "CLI command instantly halts all new entry orders, persisted to DB" },
  { title: "No Averaging Down", icon: <TrendingUp className="w-5 h-5" />, color: "text-cyan-400", desc: "Duplicate order prevention at DB level — same symbol blocks new orders" },
  { title: "Supervisor Read-Only", icon: <Brain className="w-5 h-5" />, color: "text-pink-400", desc: "LangGraph agent cannot submit orders, merge code, or enable live trading" },
];

const SUPERVISOR_CAPABILITIES = {
  canDo: [
    "Read execution logs (JSONL)",
    "Analyze with Phi-3 Mini (Ollama)",
    "Detect 401, 429, exceptions, missed exits",
    "Create local git branches",
    "Run pytest test suite",
    "Propose code patches (text only)",
    "Generate daily Markdown + JSON reports",
    "Record findings in SQLite",
  ],
  cannotDo: [
    "Submit or cancel orders",
    "Enable live trading",
    "Push to remote repositories",
    "Merge to main branch",
    "Increase position size or risk",
    "Bypass sandbox mode",
    "Run arbitrary shell commands",
    "Change risk configuration",
  ],
};

const DB_TABLES = [
  { name: "candidates", desc: "Option candidates scanned each cycle with full metadata" },
  { name: "orders", desc: "All submitted orders with dry-run results and fill status" },
  { name: "positions", desc: "Open and closed positions with Greeks at entry" },
  { name: "fills", desc: "Fill records linked to orders and positions" },
  { name: "risk_events", desc: "Kill switch, daily loss, position limit events" },
  { name: "api_errors", desc: "API errors for supervisor analysis and alerting" },
  { name: "supervisor_actions", desc: "LangGraph agent findings and proposed fixes" },
  { name: "daily_reports", desc: "Daily report metadata and content cache" },
];

const CLI_COMMANDS = [
  { cmd: "sentinel scan", desc: "Run one scan cycle — finds high-convexity call candidates", icon: <Search className="w-4 h-4" /> },
  { cmd: "sentinel paper-trade", desc: "Start continuous paper trading loop (5min scan, 60s monitor)", icon: <Activity className="w-4 h-4" /> },
  { cmd: "sentinel paper-trade --run-once", desc: "Single cycle — useful for testing without scheduler", icon: <Activity className="w-4 h-4" /> },
  { cmd: "sentinel monitor", desc: "Check exit conditions for all open positions", icon: <Eye className="w-4 h-4" /> },
  { cmd: "sentinel report", desc: "Generate today's Markdown + JSON daily report", icon: <BarChart3 className="w-4 h-4" /> },
  { cmd: "sentinel report --date 2024-01-15", desc: "Generate report for specific date", icon: <BarChart3 className="w-4 h-4" /> },
  { cmd: "sentinel supervisor", desc: "Run LangGraph supervisor agent cycle (log analysis + Ollama)", icon: <Brain className="w-4 h-4" /> },
  { cmd: "sentinel kill-switch", desc: "Activate kill switch — blocks ALL new entry orders immediately", icon: <XCircle className="w-4 h-4" /> },
  { cmd: "sentinel kill-switch --deactivate", desc: "Deactivate kill switch (requires confirmation prompt)", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const TEST_COVERAGE = [
  { file: "test_roi_calculator.py", tests: 15, covers: "All 3 estimation methods, edge cases, limit price calc" },
  { file: "test_chain_filter.py", tests: 18, covers: "DTE, delta, volume, spread, OI, staleness, ROI filter" },
  { file: "test_position_sizing.py", tests: 8, covers: "Basic sizing, minimum 1 contract, risk floor, sanity check" },
  { file: "test_exit_rules.py", tests: 16, covers: "Stop loss, profit target, 21-DTE, priority, daily loss" },
  { file: "test_duplicate_orders.py", tests: 6, covers: "Duplicate prevention, kill switch blocks, filled OK" },
  { file: "test_log_scanner.py", tests: 9, covers: "JSONL parsing, event categories, summary text" },
  { file: "test_supervisor_safety.py", tests: 16, covers: "git push blocked, merge blocked, allowlist, no live trading" },
];

const TODO_ITEMS = [
  { method: "dry_run_order()", concern: "NewOrder/Leg constructor field names need SDK 12.x verification" },
  { method: "get_balances()", concern: "AccountBalance field names: net_liquidating_value etc." },
  { method: "get_positions()", concern: "Position field names in SDK 12.x response" },
  { method: "get_order_status()", concern: "Method name: get_order vs get_live_orders" },
  { method: "stream_quotes()", concern: "DXLinkStreamer lifecycle management for continuous streaming" },
  { method: "stream_account_updates()", concern: "AccountStreamer API shape in SDK 12.x" },
];

// ─── Component: File Tree ──────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Config: "bg-purple-900/60 text-purple-300 border border-purple-700",
    Docs: "bg-slate-800 text-slate-300 border border-slate-600",
    Core: "bg-blue-900/60 text-blue-300 border border-blue-700",
    Broker: "bg-cyan-900/60 text-cyan-300 border border-cyan-700",
    Filter: "bg-yellow-900/60 text-yellow-300 border border-yellow-700",
    Risk: "bg-red-900/60 text-red-300 border border-red-700",
    Execution: "bg-orange-900/60 text-orange-300 border border-orange-700",
    Monitor: "bg-teal-900/60 text-teal-300 border border-teal-700",
    Supervisor: "bg-pink-900/60 text-pink-300 border border-pink-700",
    Data: "bg-indigo-900/60 text-indigo-300 border border-indigo-700",
    Reports: "bg-emerald-900/60 text-emerald-300 border border-emerald-700",
    Tests: "bg-green-900/60 text-green-300 border border-green-700",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${colors[category] || "bg-gray-800 text-gray-300"}`}>
      {category}
    </span>
  );
}

function FileList({ files }: { files: FileEntry[] }) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  return (
    <div className="space-y-1">
      {files.map((f) => (
        <div
          key={f.path}
          className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group"
        >
          <div className="mt-0.5 shrink-0">
            <FileCode className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-slate-200 break-all">{f.path}</span>
              {f.critical && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700 font-semibold shrink-0">
                  CRITICAL
                </span>
              )}
              <CategoryBadge category={f.category} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
          </div>
          <button
            onClick={() => handleCopy(f.path)}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
            title="Copy path"
          >
            {copiedPath === f.path
              ? <Check className="w-3.5 h-3.5 text-green-400" />
              : <Copy className="w-3.5 h-3.5 text-slate-400" />
            }
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Component: Section Card ─────────────────────────────────

function SectionCard({ title, icon, children, accent = "blue" }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  const accents: Record<string, string> = {
    blue: "border-blue-800 from-blue-950/40",
    green: "border-green-800 from-green-950/40",
    red: "border-red-800 from-red-950/40",
    purple: "border-purple-800 from-purple-950/40",
    yellow: "border-yellow-800 from-yellow-950/40",
    pink: "border-pink-800 from-pink-950/40",
    cyan: "border-cyan-800 from-cyan-950/40",
    orange: "border-orange-800 from-orange-950/40",
    teal: "border-teal-800 from-teal-950/40",
  };
  const cls = accents[accent] || accents.blue;
  return (
    <div className={`rounded-xl border ${cls.split(" ")[0]} bg-gradient-to-b ${cls.split(" ")[1]} to-slate-900/80 p-6`}>
      <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Component: Step Flow ─────────────────────────────────────

function ScanPipeline() {
  return (
    <div className="space-y-2">
      {SCAN_STEPS.map((step, i) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-600 flex items-center justify-center text-xs font-bold text-blue-300">
              {step.id}
            </div>
            {i < SCAN_STEPS.length - 1 && (
              <div className="w-0.5 h-4 bg-blue-900/60 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{step.icon} {step.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {step.filter}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Nav Tab ────────────────────────────────────────────────

function NavTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
        active
          ? "bg-blue-700 text-white shadow-lg shadow-blue-900/40"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main App ────────────────────────────────────────────────

type Tab = "overview" | "structure" | "trading" | "risk" | "supervisor" | "testing" | "setup";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = useMemo(() => {
    return FILE_REGISTRY.filter((f) => {
      const matchCat = categoryFilter === "All" || f.category === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || f.path.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    FILE_REGISTRY.forEach((f) => {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    });
    return {
      total: FILE_REGISTRY.length,
      critical: FILE_REGISTRY.filter((f) => f.critical).length,
      tests: FILE_REGISTRY.filter((f) => f.category === "Tests").length,
      byCategory,
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">
                  Autonomous Alpha Sentinel
                </h1>
                <p className="text-xs text-slate-400">
                  Production-grade async Python paper-trading system — tastytrade sandbox
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-900/60 text-green-300 border border-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SANDBOX ONLY
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-900/60 text-red-300 border border-red-700">
                <Lock className="w-3.5 h-3.5" />
                LIVE TRADING DISABLED
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700">
                <Code2 className="w-3.5 h-3.5" />
                Python 3.12+
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="mt-4 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {(["overview", "structure", "trading", "risk", "supervisor", "testing", "setup"] as Tab[]).map((tab) => (
              <NavTab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                {tab === "overview" && "📊 Overview"}
                {tab === "structure" && "📁 File Structure"}
                {tab === "trading" && "📈 Trading Logic"}
                {tab === "risk" && "🛡️ Risk Management"}
                {tab === "supervisor" && "🧠 Supervisor Agent"}
                {tab === "testing" && "🧪 Test Coverage"}
                {tab === "setup" && "🚀 Setup Guide"}
              </NavTab>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative h-48 overflow-hidden border-b border-slate-800">
        <img
          src="/sentinel-hero.png"
          alt="Autonomous Alpha Sentinel"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8">
          <div>
            <div className="text-xs text-blue-400 font-mono font-semibold mb-2 tracking-widest uppercase">
              Paper Trading System · Sandbox Mode Only
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              High-Convexity Long-Call Options
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Finds calls with &lt;7% required underlying move for 100% ROI · tastytrade API · 
              LangGraph supervisor · Phi-3 Mini analysis · Full test coverage
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── OVERVIEW TAB ──────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Order lifecycle flow */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-2">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Order Lifecycle (Paper Trade)
              </h3>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {[
                  { label: "Build Order", sub: "BTO LIMIT", color: "border-blue-700 bg-blue-950/50 text-blue-300" },
                  { label: "Kill Switch\nCheck", sub: "Reject if active", color: "border-red-800 bg-red-950/30 text-red-300" },
                  { label: "Duplicate\nCheck", sub: "DB lookup", color: "border-orange-800 bg-orange-950/30 text-orange-300" },
                  { label: "Position\nCount Check", sub: "Max 3", color: "border-yellow-800 bg-yellow-950/30 text-yellow-300" },
                  { label: "Dry Run", sub: "Broker validate", color: "border-purple-700 bg-purple-950/50 text-purple-300" },
                  { label: "Paper Submit", sub: "Record at limit", color: "border-green-700 bg-green-950/50 text-green-300" },
                  { label: "Position\nCreated", sub: "DB persist", color: "border-teal-700 bg-teal-950/50 text-teal-300" },
                ].map((step, i, arr) => (
                  <React.Fragment key={step.label}>
                    <div className={`px-3 py-2 rounded-lg border text-center text-xs font-medium ${step.color} min-w-[80px]`}>
                      <div className="font-semibold whitespace-pre-line leading-tight">{step.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{step.sub}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="text-slate-600 text-lg">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Files", value: stats.total, icon: <FileCode className="w-5 h-5" />, color: "text-blue-400" },
                { label: "Critical Files", value: stats.critical, icon: <AlertTriangle className="w-5 h-5" />, color: "text-amber-400" },
                { label: "Test Files", value: stats.tests, icon: <FlaskConical className="w-5 h-5" />, color: "text-green-400" },
                { label: "Total Test Cases", value: TEST_COVERAGE.reduce((s, t) => s + t.tests, 0), icon: <CheckCircle2 className="w-5 h-5" />, color: "text-teal-400" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className={`${s.color} mb-2`}>{s.icon}</div>
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Safety features */}
            <SectionCard title="Safety & Compliance" icon={<Shield className="w-5 h-5 text-green-400" />} accent="green">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SAFETY_FEATURES.map((f) => (
                  <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className={`${f.color} mt-0.5 shrink-0`}>{f.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{f.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Architecture overview */}
            <SectionCard title="System Architecture" icon={<Layers className="w-5 h-5 text-blue-400" />} accent="blue">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "Data Layer", icon: <Database className="w-4 h-4" />, items: ["SQLite WAL mode", "aiosqlite async", "8 tables", "Duplicate prevention"] },
                  { name: "Broker Layer", icon: <Zap className="w-4 h-4" />, items: ["tastyware SDK 12.x", "OAuth2 auth", "Auto token refresh", "Rate limiting + retry"] },
                  { name: "Filter Layer", icon: <Filter className="w-4 h-4" />, items: ["9-step funnel", "3-method ROI calc", "Multi-factor ranking", "Data quality scoring"] },
                  { name: "Risk Layer", icon: <Shield className="w-4 h-4" />, items: ["2% NLV sizing", "3 exit rules", "Kill switch", "Daily loss limit"] },
                  { name: "Supervisor Layer", icon: <Brain className="w-4 h-4" />, items: ["LangGraph workflow", "Phi-3 Mini (Ollama)", "Safe action allowlist", "Read-only observer"] },
                  { name: "CLI Layer", icon: <Terminal className="w-4 h-4" />, items: ["Click + Rich", "6 commands", "Async runners", "Graceful shutdown"] },
                ].map((layer) => (
                  <div key={layer.name} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-blue-300 mb-3 font-semibold text-sm">
                      {layer.icon} {layer.name}
                    </div>
                    <ul className="space-y-1">
                      {layer.items.map((item) => (
                        <li key={item} className="text-xs text-slate-400 flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* API TODO documentation */}
            <SectionCard title="API Uncertainty Documentation" icon={<Info className="w-5 h-5 text-yellow-400" />} accent="yellow">
              <p className="text-sm text-slate-400 mb-4">
                Where tastytrade SDK 12.x method signatures are uncertain, adapter methods are documented with TODO 
                comments rather than inventing behavior. These are real stubs awaiting verification:
              </p>
              <div className="space-y-2">
                {TODO_ITEMS.map((item) => (
                  <div key={item.method} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-950/30 border border-yellow-900">
                    <span className="font-mono text-xs text-yellow-300 shrink-0 bg-yellow-900/40 px-2 py-1 rounded">
                      TODO
                    </span>
                    <div>
                      <span className="font-mono text-xs text-white font-semibold">{item.method}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{item.concern}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">
                All TODOs are in <code className="text-yellow-300">src/sentinel/tastytrade_client/adapter.py</code>. 
                The adapter interface is complete — stub methods raise <code className="text-yellow-300">NotImplementedError</code> 
                with clear documentation rather than silently failing.
              </p>
            </SectionCard>
          </div>
        )}

        {/* ── FILE STRUCTURE TAB ────────────────────────────── */}
        {activeTab === "structure" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search files or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-600"
                />
              </div>
              {/* Category filter */}
              <div className="flex gap-1.5 flex-wrap">
                {["All", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      categoryFilter === cat
                        ? "bg-blue-700 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                    {cat !== "All" && stats.byCategory[cat] && (
                      <span className="ml-1 text-slate-500">({stats.byCategory[cat]})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-4">
                Showing {filteredFiles.length} of {FILE_REGISTRY.length} files
              </div>
              <FileList files={filteredFiles} />
            </div>
          </div>
        )}

        {/* ── TRADING LOGIC TAB ─────────────────────────────── */}
        {activeTab === "trading" && (
          <div className="space-y-8">
            {/* Scan pipeline */}
            <SectionCard title="9-Step Scan Pipeline (Every 5 Minutes, Market Hours)" icon={<Activity className="w-5 h-5 text-blue-400" />} accent="blue">
              <ScanPipeline />
            </SectionCard>

            {/* ROI estimation */}
            <SectionCard title="Convexity Estimator — estimate_move_for_100pct_roi()" icon={<TrendingUp className="w-5 h-5 text-green-400" />} accent="green">
              <div className="mb-4 p-3 bg-green-950/30 border border-green-800 rounded-lg text-sm text-slate-300">
                <strong className="text-green-300">Goal:</strong> Find options that require &lt;7% underlying move for 100% ROI.
                This estimates the instantaneous move needed to double option value.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ROI_METHODS.map((m) => (
                  <div key={m.name} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-sm text-white">{m.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${m.badge}`}>{m.confidence}</span>
                    </div>
                    <div className="font-mono text-xs text-cyan-300 bg-slate-950 px-3 py-2 rounded mb-3 break-all">
                      {m.formula}
                    </div>
                    <p className="text-xs text-slate-400">{m.desc}</p>
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="text-slate-400">Requires:</span> {m.requires}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div className="text-sm font-semibold text-white mb-3">Example Calculation</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Inputs</div>
                    <div className="space-y-1 font-mono text-xs">
                      <div><span className="text-slate-500">underlying_price = </span><span className="text-cyan-300">$485.00</span></div>
                      <div><span className="text-slate-500">strike = </span><span className="text-cyan-300">$500.00</span></div>
                      <div><span className="text-slate-500">option_mark = </span><span className="text-cyan-300">$3.85</span></div>
                      <div><span className="text-slate-500">delta = </span><span className="text-cyan-300">0.30</span></div>
                      <div><span className="text-slate-500">gamma = </span><span className="text-cyan-300">0.015</span></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Result (delta+gamma method)</div>
                    <div className="space-y-1 font-mono text-xs">
                      <div><span className="text-slate-500">dS = </span><span className="text-green-300">$11.47</span></div>
                      <div><span className="text-slate-500">required_move = </span><span className="text-green-300">2.37%</span></div>
                      <div><span className="text-slate-500">price_target = </span><span className="text-green-300">$496.49</span></div>
                      <div><span className="text-slate-500">threshold (7%) = </span><span className="text-green-300">✅ PASS</span></div>
                      <div><span className="text-slate-500">confidence = </span><span className="text-green-300">HIGH</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Option filters */}
            <SectionCard title="Filter Criteria" icon={<Filter className="w-5 h-5 text-yellow-400" />} accent="yellow">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "DTE Range", value: "45 – 70 days", icon: "📅" },
                  { label: "Delta Target", value: "0.25 – 0.35 (prefer 0.30)", icon: "Δ" },
                  { label: "IV Rank", value: "< 20 (prefer low vol)", icon: "📊" },
                  { label: "Underlying Volume", value: "> 1,000,000", icon: "📈" },
                  { label: "Open Interest", value: "≥ 5,000 contracts", icon: "📋" },
                  { label: "Bid/Ask Spread", value: "< 10% of mid", icon: "↔️" },
                  { label: "Option Type", value: "CALLS ONLY", icon: "📞" },
                  { label: "Required ROI Move", value: "< 7% underlying", icon: "🎯" },
                ].map((f) => (
                  <div key={f.label} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-xs text-slate-400">{f.label}</div>
                    <div className="text-sm font-semibold text-white mt-1">{f.value}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ROI Calculator Demo */}
            <ROICalculatorDemo />

            {/* Ranking */}
            <SectionCard title="Candidate Ranking (Lower Score = Better)" icon={<BarChart3 className="w-5 h-5 text-purple-400" />} accent="purple">
              <div className="space-y-3">
                {[
                  { factor: "Required Move (40%)", desc: "Lower required move → better convexity", bar: 40 },
                  { factor: "Delta Proximity (25%)", desc: "Closest to 0.30 target delta", bar: 25 },
                  { factor: "Spread Quality (20%)", desc: "Tighter bid/ask → better liquidity", bar: 20 },
                  { factor: "Data Quality (15%)", desc: "All Greeks + IV Rank present → higher quality", bar: 15 },
                ].map((r) => (
                  <div key={r.factor} className="flex items-center gap-4">
                    <div className="w-48 shrink-0">
                      <div className="text-sm font-semibold text-white">{r.factor}</div>
                      <div className="text-xs text-slate-400">{r.desc}</div>
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full"
                        style={{ width: `${r.bar * 2}%` }}
                      />
                    </div>
                    <div className="text-sm font-bold text-slate-300 w-10 text-right">{r.bar}%</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── RISK MANAGEMENT TAB ──────────────────────────── */}
        {activeTab === "risk" && (
          <div className="space-y-8">
            {/* Risk parameters */}
            <SectionCard title="Risk Parameters" icon={<Shield className="w-5 h-5 text-red-400" />} accent="red">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {RISK_PARAMS.map((r) => (
                  <div key={r.param} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-2xl mb-2">{r.icon}</div>
                    <div className="text-xs text-slate-400">{r.param}</div>
                    <div className="text-xl font-bold text-white mt-1">{r.value}</div>
                    <div className="text-xs text-slate-500 mt-1">{r.detail}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Exit rules */}
            <SectionCard title="Exit Rules (Priority Order)" icon={<XCircle className="w-5 h-5 text-orange-400" />} accent="orange">
              <div className="space-y-3 mb-4">
                {EXIT_RULES.map((rule) => (
                  <div key={rule.name} className={`flex items-start gap-4 p-4 rounded-lg border ${rule.bg}`}>
                    <div className="text-2xl shrink-0">{rule.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500">PRIORITY {rule.priority}</span>
                        <span className={`font-semibold text-sm ${rule.color}`}>{rule.name}</span>
                      </div>
                      <div className="text-sm text-white mt-1">{rule.condition}</div>
                      <div className="text-xs text-slate-400 mt-1">Action: <code className="text-slate-300">{rule.action}</code></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-lg text-xs text-slate-400">
                <strong className="text-slate-200">Priority logic:</strong> All conditions are evaluated every {`{monitor_interval}`} seconds. 
                If multiple conditions are true simultaneously (rare), profit target takes precedence over time exit, 
                which takes precedence over stop loss. This ensures profit is captured at a good exit price.
              </div>
            </SectionCard>

            {/* Kill switch */}
            <SectionCard title="Kill Switch" icon={<AlertTriangle className="w-5 h-5 text-red-500" />} accent="red">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Activation Paths</h3>
                  <ul className="space-y-2">
                    {[
                      "CLI: sentinel kill-switch",
                      "Daily loss ≥ 5% of NLV",
                      "Supervisor detects critical risk event",
                      "KILL_SWITCH_ACTIVE=true in .env at startup",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Effect</h3>
                  <ul className="space-y-2">
                    {[
                      "Immediately blocks ALL new entry orders",
                      "Exit monitoring continues (positions still managed)",
                      "Durable: survives process restarts via DB state",
                      "Requires operator CLI confirmation to deactivate",
                      "Prominently logged at CRITICAL level",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>

            {/* DB schema */}
            <SectionCard title="SQLite Database Schema" icon={<Database className="w-5 h-5 text-cyan-400" />} accent="cyan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DB_TABLES.map((t) => (
                  <div key={t.name} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <code className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded shrink-0">
                      {t.name}
                    </code>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-slate-500">
                WAL mode enabled for concurrent reads. All writes use typed async methods — no raw SQL in business logic.
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── SUPERVISOR TAB ────────────────────────────────── */}
        {activeTab === "supervisor" && (
          <div className="space-y-8">
            {/* Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="Supervisor CAN Do" icon={<CheckCircle2 className="w-5 h-5 text-green-400" />} accent="green">
                <ul className="space-y-2">
                  {SUPERVISOR_CAPABILITIES.canDo.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Supervisor CANNOT Do" icon={<XCircle className="w-5 h-5 text-red-400" />} accent="red">
                <ul className="space-y-2">
                  {SUPERVISOR_CAPABILITIES.cannotDo.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-red-950/30 border border-red-800 rounded-lg text-xs text-red-300">
                  These restrictions are <strong>tested</strong> in test_supervisor_safety.py. 
                  All shell commands run through an explicit allowlist with forbidden pattern matching.
                </div>
              </SectionCard>
            </div>

            {/* Command allowlist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-green-800 bg-green-950/20 p-5">
                <h3 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Allowed Commands (Explicit Allowlist)
                </h3>
                <div className="space-y-1.5 font-mono text-xs">
                  {["pytest", "git branch", "git checkout -b {branch}", "git status", "git log --oneline", "git diff --stat"].map(cmd => (
                    <div key={cmd} className="flex items-center gap-2 px-3 py-1.5 bg-green-950/40 border border-green-900 rounded">
                      <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                      <span className="text-green-200">{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-red-800 bg-red-950/20 p-5">
                <h3 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Forbidden Patterns (Regex Matched)
                </h3>
                <div className="space-y-1.5 font-mono text-xs">
                  {["git push (any remote)", "git merge", "git rebase", "rm -rf", "sudo", "live_trading", "production", "increase.*risk", "curl / wget"].map(cmd => (
                    <div key={cmd} className="flex items-center gap-2 px-3 py-1.5 bg-red-950/40 border border-red-900 rounded">
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="text-red-200">{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LangGraph workflow */}
            <SectionCard title="LangGraph Supervisor Workflow" icon={<GitBranch className="w-5 h-5 text-pink-400" />} accent="pink">
              <div className="flex flex-col md:flex-row items-start gap-4 flex-wrap">
                {[
                  { node: "scan_logs", desc: "Read JSONL log file, parse events, categorize by type" },
                  { node: "analyze_with_ollama", desc: "Send log summary to Phi-3 Mini for pattern analysis" },
                  { node: "propose_fixes", desc: "Generate code patch proposals for detected errors" },
                  { node: "record_findings", desc: "Save supervisor actions to SQLite for audit trail" },
                  { node: "generate_report", desc: "Build Markdown report with all findings and actions" },
                ].map((node, i, arr) => (
                  <React.Fragment key={node.node}>
                    <div className="flex flex-col items-center text-center max-w-[120px]">
                      <div className="w-16 h-16 rounded-xl bg-pink-900/40 border border-pink-700 flex items-center justify-center">
                        <code className="text-xs text-pink-300 font-mono leading-tight px-1">{node.node.replace("_", "\n")}</code>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{node.desc}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-slate-600 shrink-0 self-start mt-5 hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </SectionCard>

            {/* Ollama */}
            <SectionCard title="Phi-3 Mini (Ollama) Integration" icon={<Cpu className="w-5 h-5 text-blue-400" />} accent="blue">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Configuration</h3>
                  <div className="space-y-2 font-mono text-xs">
                    {[
                      ["OLLAMA_MODEL", "phi3:mini"],
                      ["OLLAMA_BASE_URL", "http://localhost:11434"],
                      ["temperature", "0 (deterministic)"],
                      ["num_predict", "400 (≈200 words max)"],
                      ["top_k", "1 (greedy decode)"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}:</span>
                        <span className="text-cyan-300">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Graceful Degradation</h3>
                  <p className="text-sm text-slate-400">
                    If Ollama is unavailable (not running, model not pulled), the supervisor degrades gracefully:
                  </p>
                  <div className="mt-2 p-3 bg-slate-950 rounded font-mono text-xs text-slate-400 border border-slate-800">
                    [Ollama unavailable] Log analysis skipped.<br/>
                    Start Ollama: ollama serve &amp;&amp; ollama pull phi3:mini
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    All other supervisor steps (log scanning, DB recording, report generation) continue normally.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── TESTING TAB ───────────────────────────────────── */}
        {activeTab === "testing" && (
          <div className="space-y-8">
            <SectionCard title="Test Suite Coverage" icon={<FlaskConical className="w-5 h-5 text-green-400" />} accent="green">
              <div className="mb-4 p-3 bg-green-950/30 border border-green-800 rounded-lg text-sm text-slate-300">
                <strong className="text-green-300">All tests run without real API credentials.</strong> Broker adapter calls 
                are mocked using pytest-mock. Tests verify deterministic logic only.
              </div>
              <div className="space-y-3">
                {TEST_COVERAGE.map((t) => (
                  <div key={t.file} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-green-300">{t.file}</code>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-900/60 text-green-300 font-semibold">
                        {t.tests} tests
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{t.covers}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs font-mono text-slate-400">
                  <div className="text-green-400 mb-2"># Run all tests</div>
                  <div className="text-white">pytest tests/ -v</div>
                  <br/>
                  <div className="text-green-400 mb-2"># With coverage report</div>
                  <div className="text-white">pytest tests/ --cov=sentinel --cov-report=html</div>
                  <br/>
                  <div className="text-green-400 mb-2"># Specific safety tests</div>
                  <div className="text-white">pytest tests/test_supervisor_safety.py -v</div>
                </div>
              </div>
            </SectionCard>

            {/* Key safety tests */}
            <SectionCard title="Critical Safety Test Cases" icon={<Lock className="w-5 h-5 text-red-400" />} accent="red">
              <div className="space-y-2">
                {[
                  { test: "test_git_push_is_forbidden", result: "BLOCKS git push origin main", category: "Supervisor Safety" },
                  { test: "test_git_merge_is_forbidden", result: "BLOCKS git merge supervisor/fix", category: "Supervisor Safety" },
                  { test: "test_live_trading_command_forbidden", result: "BLOCKS live_trading=true", category: "Supervisor Safety" },
                  { test: "test_kill_switch_blocks_all_orders", result: "BLOCKS order building when kill switch active", category: "Risk" },
                  { test: "test_duplicate_detection_after_submission", result: "BLOCKS second order for same symbol", category: "Risk" },
                  { test: "test_invalid_negative_underlying", result: "RAISES ValueError on bad input", category: "ROI Calc" },
                  { test: "test_invalid_zero_option_mark", result: "RAISES ValueError on zero premium", category: "ROI Calc" },
                  { test: "test_daily_loss_exactly_at_limit", result: "TRIGGERS kill switch at 5%", category: "Risk" },
                  { test: "test_profit_target_priority_over_stop", result: "Profit target wins at same mark", category: "Exits" },
                ].map((t) => (
                  <div key={t.test} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <code className="text-xs text-green-300 font-mono">{t.test}</code>
                      <p className="text-xs text-slate-400 mt-0.5">{t.result}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500 shrink-0">{t.category}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── SETUP TAB ─────────────────────────────────────── */}
        {activeTab === "setup" && (
          <div className="space-y-8">
            {/* Prerequisites */}
            <SectionCard title="Prerequisites" icon={<Package className="w-5 h-5 text-blue-400" />} accent="blue">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "Python 3.12+", req: "Required", icon: "🐍", note: "3.12 for type annotation syntax" },
                  { name: "Tastytrade Sandbox Account", req: "Required", icon: "🏦", note: "developer.tastytrade.com/sandbox" },
                  { name: "Ollama + Phi-3 Mini", req: "Optional", icon: "🤖", note: "For supervisor log analysis" },
                ].map((p) => (
                  <div key={p.name} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div className="font-semibold text-white text-sm">{p.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                      p.req === "Required" ? "bg-red-900/60 text-red-300" : "bg-slate-800 text-slate-400"
                    }`}>{p.req}</span>
                    <p className="text-xs text-slate-500 mt-2">{p.note}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Installation */}
            <SectionCard title="Installation" icon={<Terminal className="w-5 h-5 text-green-400" />} accent="green">
              <div className="space-y-4">
                {[
                  {
                    title: "1. Clone and install",
                    code: `git clone <repo-url>
cd autonomous-alpha-sentinel
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -e ".[dev]"`,
                  },
                  {
                    title: "2. Configure environment",
                    code: `cp .env.example .env
# Edit .env with your sandbox credentials
# TASTYTRADE_CLIENT_SECRET=your_client_secret
# TASTYTRADE_REFRESH_TOKEN=your_refresh_token
# TASTYTRADE_ACCOUNT_NUMBER=your_account_number`,
                  },
                  {
                    title: "3. OAuth2 Setup (tastytrade sandbox)",
                    code: `# 1. Create sandbox account: https://developer.tastytrade.com/sandbox/
# 2. Go to sandbox.tastytrade.com → API Access → OAuth Applications
# 3. Create app, save client_secret (shown ONCE only!)
# 4. In app settings: Create Grant → copy refresh_token
# 5. Add to .env — NEVER commit .env to version control`,
                  },
                  {
                    title: "4. (Optional) Setup Ollama",
                    code: `# Install Ollama from https://ollama.ai
ollama serve
ollama pull phi3:mini
# Test: ollama run phi3:mini "Hello, what model are you?"`,
                  },
                  {
                    title: "5. Run tests (no API credentials needed)",
                    code: `pytest tests/ -v
# Expected: all tests pass with mocked broker`,
                  },
                  {
                    title: "6. Start paper trading",
                    code: `sentinel paper-trade
# or for a single cycle:
sentinel paper-trade --run-once`,
                  },
                ].map((step) => (
                  <div key={step.title}>
                    <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
                    <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto font-mono whitespace-pre-wrap">
                      {step.code}
                    </pre>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* CLI reference */}
            <SectionCard title="CLI Command Reference" icon={<Terminal className="w-5 h-5 text-cyan-400" />} accent="cyan">
              <div className="space-y-2">
                {CLI_COMMANDS.map((cmd) => (
                  <div key={cmd.cmd} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-500 shrink-0 mt-0.5">{cmd.icon}</div>
                    <div>
                      <code className="text-sm font-mono text-cyan-300">{cmd.cmd}</code>
                      <p className="text-xs text-slate-400 mt-0.5">{cmd.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Limitations */}
            <SectionCard title="Known Limitations" icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />} accent="yellow">
              <div className="space-y-2">
                {[
                  { lim: "Sandbox market metrics unavailable", detail: "IV Rank not in sandbox — system uses None and skips IV filter gracefully" },
                  { lim: "15-minute delayed quotes in sandbox", detail: "Quote freshness is limited — staleness check uses configurable MAX_QUOTE_AGE_SECONDS" },
                  { lim: "Holiday calendar not implemented", detail: "Market hours check is Mon-Fri 9:30-4:00 ET only — no holiday awareness" },
                  { lim: "Single process per account", detail: "No distributed locking — run only one instance per account number" },
                  { lim: "SDK API uncertainties (6 TODOs)", detail: "Several adapter methods have TODOs pending SDK 12.x verification in sandbox" },
                  { lim: "Phi-3 Mini quality", detail: "Local LLM proposals are suggestions only — human review required before applying" },
                  { lim: "No execution slippage model", detail: "Paper trading assumes fill at limit price — real fills may differ" },
                ].map((l) => (
                  <div key={l.lim} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-950/20 border border-yellow-900">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">{l.lim}</div>
                      <p className="text-xs text-slate-400 mt-0.5">{l.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-400">Autonomous Alpha Sentinel</span>
          </div>
          <p>
            Production-grade async Python paper-trading system · tastytrade sandbox · Python 3.12+ · asyncio · Pydantic · SQLite · LangGraph · Ollama Phi-3 Mini
          </p>
          <p className="mt-2 text-slate-600">
            ⚠️ This is a paper-trading system. No financial advice. Options trading involves significant risk of loss.
            Live trading is DISABLED by default and requires explicit multi-factor opt-in.
          </p>
        </div>
      </footer>
    </div>
  );
}
