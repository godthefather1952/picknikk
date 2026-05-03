// File registry - maps paths to their description and category
export interface FileEntry {
  path: string;
  category: string;
  description: string;
  language: string;
  critical?: boolean;
}

export const FILE_REGISTRY: FileEntry[] = [
  // Config files
  { path: "pyproject.toml", category: "Config", description: "Python project configuration, dependencies, and CLI entry point", language: "toml", critical: true },
  { path: ".env.example", category: "Config", description: "Environment variable template — copy to .env and fill credentials", language: "bash", critical: true },
  { path: "README.md", category: "Docs", description: "Setup guide, architecture overview, trading logic, limitations", language: "markdown" },

  // Core sentinel package
  { path: "src/sentinel/__init__.py", category: "Core", description: "Package init with version and safety documentation", language: "python" },
  { path: "src/sentinel/config.py", category: "Core", description: "Pydantic Settings config — all env vars, validation, safety gates", language: "python", critical: true },
  { path: "src/sentinel/models.py", category: "Core", description: "Core Pydantic data models: Option, Position, Order, Candidate, Greeks", language: "python", critical: true },
  { path: "src/sentinel/database.py", category: "Core", description: "Async SQLite layer — schema, CRUD, duplicate detection", language: "python", critical: true },
  { path: "src/sentinel/logging_config.py", category: "Core", description: "Structured JSON logging with secret redaction", language: "python" },
  { path: "src/sentinel/scheduler.py", category: "Core", description: "APScheduler async loops — market hours check, scan/monitor jobs", language: "python" },
  { path: "src/sentinel/main.py", category: "Core", description: "Click CLI entrypoint: scan, paper-trade, monitor, report, supervisor, kill-switch", language: "python", critical: true },

  // Tastytrade client
  { path: "src/sentinel/tastytrade_client/__init__.py", category: "Broker", description: "Broker adapter package", language: "python" },
  { path: "src/sentinel/tastytrade_client/auth.py", category: "Broker", description: "OAuth2 session management using tastyware SDK >= 12.0", language: "python" },
  { path: "src/sentinel/tastytrade_client/adapter.py", category: "Broker", description: "Full broker adapter: all API methods, retry, rate limiting, TODO docs", language: "python", critical: true },
  { path: "src/sentinel/tastytrade_client/market_data.py", category: "Broker", description: "Universe loading and market metrics fetching", language: "python" },
  { path: "src/sentinel/tastytrade_client/exceptions.py", category: "Broker", description: "Typed exception hierarchy for broker layer", language: "python" },

  // Option filter
  { path: "src/sentinel/option_filter/__init__.py", category: "Filter", description: "Option filter package", language: "python" },
  { path: "src/sentinel/option_filter/roi_calculator.py", category: "Filter", description: "Core convexity estimator: delta/gamma, delta-only, conservative fallback", language: "python", critical: true },
  { path: "src/sentinel/option_filter/chain_filter.py", category: "Filter", description: "Full 9-step filter funnel: IV rank, volume, DTE, delta, spread, OI, ROI", language: "python", critical: true },
  { path: "src/sentinel/option_filter/scorer.py", category: "Filter", description: "Multi-factor candidate ranking: move size, delta, spread, data quality", language: "python" },

  // Risk manager
  { path: "src/sentinel/risk_manager/__init__.py", category: "Risk", description: "Risk management package", language: "python" },
  { path: "src/sentinel/risk_manager/sizing.py", category: "Risk", description: "Position sizing: 2% NLV risk, floor to min 1 contract", language: "python", critical: true },
  { path: "src/sentinel/risk_manager/exits.py", category: "Risk", description: "Exit rules: stop loss 50%, profit 200%, time exit 21 DTE, daily loss", language: "python", critical: true },
  { path: "src/sentinel/risk_manager/kill_switch.py", category: "Risk", description: "Emergency halt — async-safe, durable, operator-reset required", language: "python", critical: true },

  // Execution engine
  { path: "src/sentinel/execution_engine/__init__.py", category: "Execution", description: "Execution engine package", language: "python" },
  { path: "src/sentinel/execution_engine/order_builder.py", category: "Execution", description: "Order construction: BUY_TO_OPEN only, LIMIT only, duplicate check, kill switch", language: "python", critical: true },
  { path: "src/sentinel/execution_engine/executor.py", category: "Execution", description: "Dry-run → submit pipeline with paper trade fallback", language: "python" },

  // Position monitor
  { path: "src/sentinel/position_monitor/__init__.py", category: "Monitor", description: "Position monitor package", language: "python" },
  { path: "src/sentinel/position_monitor/monitor.py", category: "Monitor", description: "Exit condition checking, mark fetching, daily loss, emergency halt", language: "python" },

  // Supervisor agent
  { path: "src/sentinel/supervisor_agent/__init__.py", category: "Supervisor", description: "Supervisor package", language: "python" },
  { path: "src/sentinel/supervisor_agent/ollama_client.py", category: "Supervisor", description: "Phi-3 Mini via Ollama for log analysis and patch proposals", language: "python" },
  { path: "src/sentinel/supervisor_agent/log_scanner.py", category: "Supervisor", description: "JSONL log scanner: 401s, rate limits, exceptions, missed exits", language: "python" },
  { path: "src/sentinel/supervisor_agent/safe_actions.py", category: "Supervisor", description: "Command allowlist enforcement — TESTED: blocks git push, merge, live trading", language: "python", critical: true },
  { path: "src/sentinel/supervisor_agent/graph.py", category: "Supervisor", description: "LangGraph supervisor workflow: scan → analyze → propose → record → report", language: "python" },

  // Data engine
  { path: "src/sentinel/data_engine/__init__.py", category: "Data", description: "Data engine package", language: "python" },
  { path: "src/sentinel/data_engine/universe.py", category: "Data", description: "Symbol universe management", language: "python" },
  { path: "src/sentinel/data_engine/market_metrics.py", category: "Data", description: "IV rank mapping with sandbox graceful degradation", language: "python" },

  // Reports
  { path: "src/sentinel/reports/__init__.py", category: "Reports", description: "Reports package", language: "python" },
  { path: "src/sentinel/reports/daily_report.py", category: "Reports", description: "Daily Markdown + JSON reports with full P&L, Greeks, supervisor findings", language: "python" },

  // Tests
  { path: "tests/__init__.py", category: "Tests", description: "Test package init", language: "python" },
  { path: "tests/conftest.py", category: "Tests", description: "Shared pytest fixtures — all broker calls mocked, no real API needed", language: "python", critical: true },
  { path: "tests/test_roi_calculator.py", category: "Tests", description: "ROI estimator tests: all 3 methods, edge cases, thresholds", language: "python", critical: true },
  { path: "tests/test_chain_filter.py", category: "Tests", description: "Filter funnel tests: DTE, delta, volume, spread, OI, staleness", language: "python", critical: true },
  { path: "tests/test_position_sizing.py", category: "Tests", description: "Sizing tests: basic, minimum, large account, edge cases", language: "python", critical: true },
  { path: "tests/test_exit_rules.py", category: "Tests", description: "Exit rule tests: stop loss, profit target, 21-DTE, priority ordering", language: "python", critical: true },
  { path: "tests/test_duplicate_orders.py", category: "Tests", description: "Duplicate prevention: symbol check, kill switch, filled order handling", language: "python", critical: true },
  { path: "tests/test_log_scanner.py", category: "Tests", description: "Log scanner: JSONL parsing, categorization, summary generation", language: "python", critical: true },
  { path: "tests/test_supervisor_safety.py", category: "Tests", description: "SAFETY TESTS: git push blocked, live trading blocked, allowlist enforcement", language: "python", critical: true },
];

export const CATEGORIES = [
  "Config", "Docs", "Core", "Broker", "Filter", "Risk",
  "Execution", "Monitor", "Supervisor", "Data", "Reports", "Tests"
] as const;

export type Category = typeof CATEGORIES[number];
