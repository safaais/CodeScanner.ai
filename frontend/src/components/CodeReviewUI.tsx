import React, { useState, useRef, useEffect } from 'react';
import { Shield, Zap, Eye, TrendingUp, Award, Lock, Globe, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const LANGUAGES = [
  { value: 'python',     label: '🐍 Python' },
  { value: 'javascript', label: '⚡ JavaScript' },
  { value: 'typescript', label: '🔷 TypeScript' },
  { value: 'java',       label: '☕ Java' },
  { value: 'cpp',        label: '⚙️ C++' },
  { value: 'csharp',     label: '🔵 C#' },
  { value: 'go',         label: '🐹 Go' },
  { value: 'rust',       label: '🦀 Rust' },
  { value: 'php',        label: '🐘 PHP' },
  { value: 'ruby',       label: '💎 Ruby' },
];

const SAMPLE_CODE: Record<string, string> = {};

interface Issue {
  severity: string;
  category: string;
  description: string;
  suggestion: string;
  line_number?: number;
}

interface ReviewData {
  summary: string;
  scores: Record<string, number>;
  issues: Issue[];
  recommendations: string[];
}

interface URLIssue {
  severity: string;
  category: string;
  description: string;
  suggestion: string;
}

interface URLScanData {
  success: boolean;
  url: string;
  final_url?: string;
  status_code?: number;
  scan_time: number;
  scores?: {
    overall: number;
    security: number;
    performance: number;
    privacy: number;
  };
  summary?: string;
  issues?: URLIssue[];
  details?: {
    tls: Record<string, any>;
    headers: Record<string, any>;
    redirects: Record<string, any>;
    exposed_paths: Record<string, any>;
    content: Record<string, any>;
  };
  recommendations?: string[];
  error?: string;
}

interface PhishingDetection {
  is_phishing: boolean;
  confidence: number;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  indicators: string[];
  brand_spoofed?: string | null;
  explanation: string;
  suggested_action: 'allow' | 'warn' | 'block';
  detection_time_ms?: number;
  detectors_used?: string[];
}

interface PhishingResult {
  success: boolean;
  url?: string;
  detection: PhishingDetection;
  timestamp: string;
}

interface LogEntry {
  text: string;
  type: 'info' | 'dim' | 'error' | 'warn';
  id: number;
}

interface BlockedInfo {
  riskLevel: string;
  message: string;
}

// ── Theme ─────────────────────────────────────────────────────────────────────

interface Theme {
  bg: string;
  bgCard: string;
  bgEditor: string;
  bgHeader: string;
  bgTerminal: string;
  bgLineNum: string;
  border: string;
  borderAccent: string;
  text: string;
  textMuted: string;
  textDim: string;
  textCode: string;
  accent: string;
  accentRgb: string;
  scrollTrack: string;
  gridLine: string;
  logDim: string;
  issueHover: string;
  recBorder: string;
}

const DARK: Theme = {
  bg: '#080c10',
  bgCard: 'rgba(0,0,0,0.4)',
  bgEditor: 'rgba(0,0,0,0.4)',
  bgHeader: 'rgba(8,12,16,0.92)',
  bgTerminal: 'rgba(0,0,0,0.5)',
  bgLineNum: 'rgba(0,0,0,0.2)',
  border: 'rgba(255,255,255,0.06)',
  borderAccent: 'rgba(232,41,74,0.15)',
  text: 'white',
  textMuted: 'rgba(255,255,255,0.4)',
  textDim: 'rgba(255,255,255,0.2)',
  textCode: '#e8eaed',
  accent: '#ff2d6b',
  accentRgb: '255,45,107',
  scrollTrack: '#0d1117',
  gridLine: 'rgba(255,45,107,0.015)',
  logDim: 'rgba(255,255,255,0.3)',
  issueHover: 'rgba(255,255,255,0.04)',
  recBorder: 'rgba(255,45,107,0.3)',
};

const LIGHT: Theme = {
  bg: '#eceef1',
  bgCard: 'rgba(255,255,255,0.85)',
  bgEditor: 'rgba(255,255,255,0.98)',
  bgHeader: 'rgba(236,238,241,0.94)',
  bgTerminal: 'rgba(218,221,228,0.75)',
  bgLineNum: 'rgba(0,0,0,0.03)',
  border: 'rgba(0,0,0,0.09)',
  borderAccent: 'rgba(232,41,74,0.3)',
  text: '#0f1117',
  textMuted: '#5a6072',
  textDim: '#9099a8',
  textCode: '#1a1f2e',
  accent: '#e8294a',
  accentRgb: '232,41,74',
  scrollTrack: '#d4d7dc',
  gridLine: 'rgba(0,0,0,0.045)',
  logDim: '#7a8494',
  issueHover: 'rgba(0,0,0,0.03)',
  recBorder: 'rgba(232,41,74,0.25)',
};

// ── Score Ring ────────────────────────────────────────────────────────────────

const SCORE_COLORS: Record<string, string> = {
  security: '#e8294a',
  performance: '#f59e0b',
  readability: '#6366f1',
  maintainability: '#10b981',
  overall: '#ff2d6b',
  quality: '#8b5cf6',
  privacy: '#06b6d4',
};

const SCORE_ICONS: Record<string, React.ElementType> = {
  security: Shield,
  performance: Zap,
  readability: Eye,
  maintainability: TrendingUp,
  overall: Award,
  privacy: Lock,
};

function ScoreRing({ label, value, isDark }: { label: string; value: number; isDark: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const color = SCORE_COLORS[label] || '#ff2d6b';
  const Icon = SCORE_ICONS[label];

  useEffect(() => {
    setDisplayed(0);
    let start = 0;
    const step = value / 30;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(Math.round(start * 10) / 10);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);

  const offset = circumference - (displayed / 10) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={radius} fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="6" />
        <circle cx="42" cy="42" r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 5px ${color})` }}
        />
        <foreignObject x="14" y="14" width="56" height="56">
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1px',
          }}>
            {Icon && <Icon size={12} color={isDark ? 'rgba(255,255,255,0.3)' : '#9099a8'} />}
            <span style={{
              fontSize: '15px', fontWeight: 700, lineHeight: 1,
              color: isDark ? 'white' : '#0f1117',
              fontFamily: "'JetBrains Mono', monospace",
            }}>{displayed.toFixed(0)}</span>
          </div>
        </foreignObject>
      </svg>
      <span style={{
        fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase',
        fontFamily: "'JetBrains Mono', monospace",
        color: isDark ? 'rgba(255,255,255,0.4)' : '#5a6072',
      }}>{label}</span>
    </div>
  );
}

// ── Severity badge ────────────────────────────────────────────────────────────

const SEVERITY: Record<string, { color: string; bg: string; label: string; glyph: string }> = {
  high:   { color: '#e8294a', bg: 'rgba(232,41,74,0.1)',   label: 'HIGH', glyph: '▲' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'MED',  glyph: '◆' },
  low:    { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  label: 'LOW',  glyph: '●' },
};

// ── URL Scanner Sub-components ────────────────────────────────────────────────

function HeadersGrid({ present, missing, t, isDark }: {
  present: string[]; missing: string[]; t: Theme; isDark: boolean;
}) {
  const all = [...present.map(h => ({ name: h, ok: true })), ...missing.map(h => ({ name: h, ok: false }))];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {all.map(({ name, ok }) => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 10px',
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          borderRadius: '3px',
          border: `1px solid ${t.border}`,
        }}>
          <span style={{ fontSize: '11px', color: t.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
            {name}
          </span>
          <span style={{ fontSize: '10px', color: ok ? '#10b981' : '#e8294a' }}>
            {ok ? '✓ present' : '✗ missing'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Threat Level Logic ────────────────────────────────────────────────────────

interface ThreatInfo {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAN';
  riskScore: number;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  label: string;
  description: string;
}

function computeThreat(result: URLScanData): ThreatInfo {
  const issues = result.issues || [];

  const HIGH_W   = 20;
  const MEDIUM_W = 8;
  const LOW_W    = 3;

  const CRITICAL_CATS = new Set(['tls', 'exposed_path']);

  let raw = 0;
  for (const issue of issues) {
    const base =
      issue.severity === 'high'   ? HIGH_W :
      issue.severity === 'medium' ? MEDIUM_W : LOW_W;
    const multiplier = CRITICAL_CATS.has(issue.category) ? 1.5 : 1;
    raw += base * multiplier;
  }

  const overallPenalty = result.scores ? (10 - result.scores.overall) * 4 : 0;
  raw += overallPenalty;

  const riskScore = Math.min(100, Math.round(raw));

  if (riskScore >= 70) return {
    level: 'CRITICAL', riskScore,
    color: '#ff2d6b', bgColor: 'rgba(255,45,107,0.08)',
    borderColor: 'rgba(255,45,107,0.35)', glowColor: 'rgba(255,45,107,0.3)',
    label: 'CRITICAL RISK',
    description: 'Serious vulnerabilities detected. Do not proceed.',
  };
  if (riskScore >= 45) return {
    level: 'HIGH', riskScore,
    color: '#f97316', bgColor: 'rgba(249,115,22,0.08)',
    borderColor: 'rgba(249,115,22,0.35)', glowColor: 'rgba(249,115,22,0.25)',
    label: 'HIGH RISK',
    description: 'Multiple security issues require immediate attention.',
  };
  if (riskScore >= 20) return {
    level: 'MEDIUM', riskScore,
    color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.3)', glowColor: 'rgba(245,158,11,0.2)',
    label: 'MEDIUM RISK',
    description: 'Some issues found. Review recommendations.',
  };
  if (riskScore >= 5) return {
    level: 'LOW', riskScore,
    color: '#6366f1', bgColor: 'rgba(99,102,241,0.08)',
    borderColor: 'rgba(99,102,241,0.25)', glowColor: 'rgba(99,102,241,0.15)',
    label: 'LOW RISK',
    description: 'Minor issues only. Generally safe.',
  };
  return {
    level: 'CLEAN', riskScore,
    color: '#10b981', bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)', glowColor: 'rgba(16,185,129,0.15)',
    label: 'CLEAN',
    description: 'No significant threats detected.',
  };
}

// ── Threat Meter Component ────────────────────────────────────────────────────

function ThreatMeter({ threat, isDark }: { threat: ThreatInfo; isDark: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const size   = 160;
  const stroke = 10;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;

  useEffect(() => {
    setDisplayed(0);
    let v = 0;
    const step = threat.riskScore / 40;
    const timer = setInterval(() => {
      v += step;
      if (v >= threat.riskScore) { setDisplayed(threat.riskScore); clearInterval(timer); }
      else setDisplayed(Math.round(v));
    }, 16);
    return () => clearInterval(timer);
  }, [threat.riskScore]);

  const offset = circ - (displayed / 100) * circ;

  const LEVEL_BARS: { level: ThreatInfo['level']; color: string; threshold: number }[] = [
    { level: 'CLEAN',    color: '#10b981', threshold: 5  },
    { level: 'LOW',      color: '#6366f1', threshold: 20 },
    { level: 'MEDIUM',   color: '#f59e0b', threshold: 45 },
    { level: 'HIGH',     color: '#f97316', threshold: 70 },
    { level: 'CRITICAL', color: '#ff2d6b', threshold: 101 },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0',
      padding: '24px 20px 18px',
      background: threat.bgColor,
      border: `1px solid ${threat.borderColor}`,
      borderRadius: '6px',
      boxShadow: `0 0 40px ${threat.glowColor}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '220px', height: '220px', borderRadius: '50%',
        border: `1px solid ${threat.borderColor}`,
        opacity: 0.3, pointerEvents: 'none',
        animation: 'pulse-dot 3s infinite',
      }} />

      <div style={{
        fontSize: '9px', letterSpacing: '0.25em', color: threat.color,
        marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace",
        opacity: 0.8,
      }}>
        THREAT ANALYSIS
      </div>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={threat.color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.025s linear',
            filter: `drop-shadow(0 0 8px ${threat.glowColor})`,
          }}
        />
        <text
          x={size / 2} y={size / 2 - 10}
          textAnchor="middle" dominantBaseline="middle"
          fill={threat.color}
          fontSize="32" fontWeight="700"
          fontFamily="'JetBrains Mono', monospace"
          style={{ filter: `drop-shadow(0 0 6px ${threat.glowColor})` }}
        >
          {displayed}
        </text>
        <text
          x={size / 2} y={size / 2 + 18}
          textAnchor="middle"
          fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'}
          fontSize="10" fontFamily="'JetBrains Mono', monospace"
          letterSpacing="3"
        >
          / 100
        </text>
      </svg>

      <div style={{
        marginTop: '12px',
        padding: '5px 20px',
        background: threat.color,
        borderRadius: '2px',
        fontSize: '12px', fontWeight: 700,
        letterSpacing: '0.2em',
        color: 'white',
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: `0 0 16px ${threat.glowColor}`,
      }}>
        {threat.label}
      </div>

      <div style={{
        marginTop: '8px', fontSize: '11px',
        color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
        textAlign: 'center', lineHeight: 1.5,
        fontFamily: "'JetBrains Mono', monospace",
        maxWidth: '200px',
      }}>
        {threat.description}
      </div>

      <div style={{ display: 'flex', gap: '3px', marginTop: '16px', alignItems: 'flex-end' }}>
        {LEVEL_BARS.map(({ level, color }) => {
          const active = threat.level === level;
          return (
            <div key={level} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div style={{
                width: '28px',
                height: active ? '18px' : '8px',
                background: active ? color : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'),
                borderRadius: '2px',
                transition: 'all 0.3s',
                boxShadow: active ? `0 0 8px ${color}` : 'none',
              }} />
              <span style={{
                fontSize: '7px', color: active ? color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'),
                letterSpacing: '0.05em', fontFamily: "'JetBrains Mono', monospace",
              }}>
                {level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const CodeReviewUI: React.FC = () => {
  // ── Code Review state ──
  const [code, setCode]         = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading]   = useState(false);
  const [review, setReview]     = useState<ReviewData | null>(null);
  const [blocked, setBlocked]   = useState<BlockedInfo | null>(null);
  const [logs, setLogs]         = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'issues' | 'recommendations'>('issues');

  // ── URL Scanner state ──
  const [urlInput, setUrlInput]       = useState('');
  const [urlLoading, setUrlLoading]   = useState(false);
  const [urlResult, setUrlResult]     = useState<URLScanData | null>(null);
  const [urlLogs, setUrlLogs]         = useState<LogEntry[]>([]);
  const [urlActiveTab, setUrlActiveTab] = useState<'issues' | 'details' | 'recommendations'>('issues');
  const [portScan, setPortScan]       = useState(false);

  // ── Phishing Detection state ──
  const [phishingInput, setPhishingInput]     = useState('');
  const [phishingContent, setPhishingContent] = useState('');
  const [phishingLoading, setPhishingLoading] = useState(false);
  const [phishingResult, setPhishingResult]   = useState<PhishingResult | null>(null);
  const [phishingLogs, setPhishingLogs]       = useState<LogEntry[]>([]);

  const phishingLogsRef = useRef<HTMLDivElement>(null);

  // ── Shared state ──
  const [darkMode, setDarkMode]       = useState(true);
  const [mainTab, setMainTab]         = useState<'code' | 'url' | 'phishing'>('code');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logsRef     = useRef<HTMLDivElement>(null);
  const urlLogsRef  = useRef<HTMLDivElement>(null);

  const t = darkMode ? DARK : LIGHT;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addLog = (
    setter: React.Dispatch<React.SetStateAction<LogEntry[]>>,
    text: string,
    type: LogEntry['type'] = 'info',
    delay = 0
  ) => {
    setTimeout(() => {
      setter(prev => [...prev, { text, type, id: Date.now() + Math.random() }]);
    }, delay);
  };

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (urlLogsRef.current) urlLogsRef.current.scrollTop = urlLogsRef.current.scrollHeight;
  }, [urlLogs]);

  useEffect(() => {
    if (phishingLogsRef.current) phishingLogsRef.current.scrollTop = phishingLogsRef.current.scrollHeight;
  }, [phishingLogs]);

  const logColor = (type: LogEntry['type']) => {
    if (type === 'error') return '#e8294a';
    if (type === 'warn')  return '#f59e0b';
    if (type === 'dim')   return t.logDim;
    return t.accent;
  };

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    if (SAMPLE_CODE[lang]) setCode(SAMPLE_CODE[lang]);
  };

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + 2; }, 0);
    }
  };

  const ext: Record<string, string> = {
    javascript: 'js', typescript: 'ts', python: 'py',
    cpp: 'cpp', csharp: 'cs', go: 'go', rust: 'rs', php: 'php', ruby: 'rb', java: 'java',
  };

  // ── Code Review scan ──────────────────────────────────────────────────────

  const handleScan = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setReview(null);
    setBlocked(null);
    setLogs([]);
    addLog(setLogs, 'Initializing scan engine...', 'info', 0);
    addLog(setLogs, `Language detected: ${language.toUpperCase()}`, 'info', 200);
    addLog(setLogs, 'Parsing AST structure...', 'dim', 500);
    addLog(setLogs, 'Running security analysis...', 'info', 900);
    addLog(setLogs, 'Connecting to AI engine...', 'dim', 1300);

    try {
      const res = await fetch(`${API_BASE}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.error === 'prompt_injection_detected') {
          const riskLevel = (data.risk_level || 'high').toUpperCase();
          setTimeout(() => {
            addLog(setLogs, '🚨 Scan blocked: prompt injection detected.', 'error');
            addLog(setLogs, `Risk level: ${riskLevel}`, 'warn');
            addLog(setLogs, 'Submit only source code for review.', 'warn');
            setBlocked({
              riskLevel,
              message: data.message || 'Your submission contains prompt injection patterns.',
            });
            setLoading(false);
          }, 1600);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      setTimeout(() => {
        addLog(setLogs, `Analysis complete. ${(data.issues || []).length} issues found.`, 'info');
        setReview(data as ReviewData);
        setLoading(false);
      }, 1600);
    } catch (err: any) {
      setTimeout(() => {
        addLog(setLogs, `Connection failed: ${err.message}`, 'error');
        addLog(setLogs, 'Ensure backend is running on port 8000', 'warn');
        setLoading(false);
      }, 1600);
    }
  };

  // ── URL Scan ──────────────────────────────────────────────────────────────

  const handleURLScan = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setUrlResult(null);
    setUrlLogs([]);

    addLog(setUrlLogs, `Target: ${urlInput}`, 'info', 0);
    addLog(setUrlLogs, 'Resolving DNS...', 'dim', 200);
    addLog(setUrlLogs, 'Checking TLS certificate...', 'info', 600);
    addLog(setUrlLogs, 'Analysing security headers...', 'dim', 1000);
    addLog(setUrlLogs, 'Probing sensitive paths...', 'info', 1400);
    if (portScan) addLog(setUrlLogs, 'Running port scan...', 'dim', 1700);

    try {
      const res = await fetch(`${API_BASE}/scan-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data: URLScanData = await res.json();

      if (!res.ok) {
        setTimeout(() => {
          addLog(setUrlLogs, `Scan failed: ${(data as any).detail || 'Unknown error'}`, 'error');
          setUrlLoading(false);
        }, 1800);
        return;
      }

      setTimeout(() => {
        const issueCount = (data.issues || []).length;
        addLog(setUrlLogs, `Scan complete in ${data.scan_time}s — ${issueCount} issue(s) found.`, 'info');
        setUrlResult(data);
        setUrlLoading(false);
      }, 1800);
    } catch (err: any) {
      setTimeout(() => {
        addLog(setUrlLogs, `Connection failed: ${err.message}`, 'error');
        addLog(setUrlLogs, 'Ensure backend is running on port 8000', 'warn');
        setUrlLoading(false);
      }, 1800);
    }
  };

  // ── Phishing Detection ────────────────────────────────────────────────────

  const handlePhishingDetect = async () => {
    if (!phishingInput.trim() && !phishingContent.trim()) return;
    setPhishingLoading(true);
    setPhishingResult(null);
    setPhishingLogs([]);

    addLog(setPhishingLogs, 'Initializing phishing detector...', 'info', 0);
    addLog(setPhishingLogs, 'Running URL heuristics...', 'dim', 300);
    addLog(setPhishingLogs, 'Checking brand spoofing patterns...', 'info', 700);
    addLog(setPhishingLogs, 'Running ML classifier...', 'dim', 1100);

    try {
      const res = await fetch(`${API_BASE}/detect-phishing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: phishingInput.trim() || undefined,
          content: phishingContent.trim() || undefined,
        }),
      });
      const data: PhishingResult = await res.json();

      if (!res.ok) {
        setTimeout(() => {
          addLog(setPhishingLogs, `Detection failed: ${(data as any).detail || 'Unknown error'}`, 'error');
          setPhishingLoading(false);
        }, 1400);
        return;
      }

      setTimeout(() => {
        const rl = data.detection.risk_level.toUpperCase();
        addLog(setPhishingLogs, `Detection complete — risk level: ${rl}`, data.detection.is_phishing ? 'error' : 'info');
        setPhishingResult(data);
        setPhishingLoading(false);
      }, 1400);
    } catch (err: any) {
      setTimeout(() => {
        addLog(setPhishingLogs, `Connection failed: ${err.message}`, 'error');
        addLog(setPhishingLogs, 'Ensure backend is running on port 8000', 'warn');
        setPhishingLoading(false);
      }, 1400);
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────

  const cardStyle = {
    background: t.bgCard,
    border: `1px solid ${t.border}`,
    borderRadius: '4px',
    padding: '14px 16px',
    boxShadow: darkMode ? 'none' : '0 2px 16px rgba(0,0,0,0.08)',
  };

  const sectionLabel = {
    fontSize: '10px', color: t.accent,
    letterSpacing: '0.2em', marginBottom: '10px', opacity: 0.8,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: t.bg,
      fontFamily: "'JetBrains Mono', monospace",
      color: t.text,
      transition: 'background 0.35s, color 0.35s',
      backgroundImage: darkMode ? `
        radial-gradient(ellipse at 15% 50%, rgba(${t.accentRgb},0.04) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 15%, rgba(99,102,241,0.04) 0%, transparent 50%),
        linear-gradient(${t.gridLine} 1px, transparent 1px),
        linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px)
      ` : `
        radial-gradient(ellipse at 20% 50%, rgba(${t.accentRgb},0.06) 0%, transparent 45%),
        radial-gradient(ellipse at 80% 10%, rgba(99,102,241,0.05) 0%, transparent 40%),
        linear-gradient(${t.gridLine} 1px, transparent 1px),
        linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px)
      `,
      backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${t.scrollTrack}; }
        ::-webkit-scrollbar-thumb { background: rgba(${t.accentRgb},0.25); border-radius: 2px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes slideUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .issue-card:hover { background: ${t.issueHover} !important; }
        textarea { resize: none; }
        textarea:focus { outline: none; }
        .lang-btn:hover { opacity: 0.9; }
        .scan-btn:hover:not(:disabled) { box-shadow: 0 0 28px rgba(${t.accentRgb},0.3) !important; background: rgba(${t.accentRgb},0.08) !important; }
        .theme-btn:hover { opacity: 0.8; }
        .tab-btn:hover { color: ${t.accent} !important; }
        .main-tab:hover { opacity: 0.9; }
        .url-input:focus { outline: none; border-color: rgba(${t.accentRgb},0.4) !important; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        borderBottom: `1px solid ${t.border}`,
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        background: t.bgHeader,
        boxShadow: darkMode ? 'none' : '0 1px 16px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: t.accent, boxShadow: `0 0 10px ${t.accent}`,
            animation: 'pulse-dot 2.5s infinite',
          }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, letterSpacing: '0.04em' }}>
            CODE<span style={{ color: t.accent }}>SCANNER</span>
            <span style={{ color: t.textDim, fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, marginLeft: '6px' }}>.ai</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: '4px', padding: '3px' }}>
          {([
            { key: 'code',     icon: '⬡', label: 'CODE REVIEW' },
            { key: 'url',      icon: '⊕', label: 'URL SCANNER' },
            { key: 'phishing', icon: '⚠', label: 'PHISHING' },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              className="main-tab"
              onClick={() => setMainTab(key)}
              style={{
                background: mainTab === key ? `rgba(${t.accentRgb},0.1)` : 'transparent',
                border: `1px solid ${mainTab === key ? t.accent : 'transparent'}`,
                color: mainTab === key ? t.accent : t.textMuted,
                padding: '6px 16px', fontSize: '11px', cursor: 'pointer',
                borderRadius: '3px', letterSpacing: '0.12em',
                transition: 'all 0.2s', fontFamily: "'JetBrains Mono', monospace",
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: mainTab === key ? `0 0 12px rgba(${t.accentRgb},0.15)` : 'none',
              }}
            >
              <span style={{ fontSize: '13px' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="theme-btn"
            onClick={() => setDarkMode(d => !d)}
            style={{
              background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${t.border}`,
              borderRadius: '20px', padding: '6px 14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              fontSize: '12px', color: t.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'opacity 0.2s',
            }}
          >
            <span>{darkMode ? '☀' : '☾'}</span>
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          CODE REVIEW TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'code' && (
        <main style={{
          maxWidth: '1400px', margin: '0 auto', padding: '28px 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
          minHeight: 'calc(100vh - 66px)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.value}
                  className="lang-btn"
                  onClick={() => handleLangChange(lang.value)}
                  style={{
                    background: language === lang.value ? `rgba(${t.accentRgb},0.1)` : 'transparent',
                    border: `1px solid ${language === lang.value ? t.accent : t.border}`,
                    color: language === lang.value ? t.accent : t.textMuted,
                    padding: '4px 10px', fontSize: '11px', cursor: 'pointer',
                    borderRadius: '2px', letterSpacing: '0.06em',
                    transition: 'all 0.2s',
                    boxShadow: language === lang.value ? `0 0 10px rgba(${t.accentRgb},0.12)` : 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div style={{
              border: `1px solid ${t.borderAccent}`,
              borderRadius: '4px', overflow: 'hidden',
              background: t.bgEditor,
              boxShadow: darkMode
                ? `0 0 40px rgba(${t.accentRgb},0.05)`
                : '0 4px 24px rgba(0,0,0,0.1)',
            }}>
              <div style={{
                padding: '9px 14px', borderBottom: `1px solid ${t.border}`,
                display: 'flex', alignItems: 'center', gap: '7px',
                background: darkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
                <span style={{ marginLeft: '8px', fontSize: '11px', color: t.textMuted, letterSpacing: '0.08em' }}>
                  main.{ext[language] || language}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: t.textDim }}>
                  {code.split('\n').length} lines
                </span>
              </div>

              <div style={{ display: 'flex', height: '300px' }}>
                <div style={{
                  padding: '14px 10px', borderRight: `1px solid ${t.border}`,
                  color: t.textDim, fontSize: '12px', lineHeight: '1.6',
                  userSelect: 'none', minWidth: '38px', textAlign: 'right',
                  overflowY: 'hidden', background: t.bgLineNum,
                }}>
                  {code.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={handleTabKey}
                  spellCheck={false}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: t.textCode, padding: '14px', fontSize: '12px',
                    lineHeight: '1.6', fontFamily: "'JetBrains Mono', monospace",
                    overflowY: 'auto', caretColor: t.accent,
                  }}
                  placeholder="// Paste your code here..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="scan-btn"
                onClick={handleScan}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: `1px solid ${loading ? `rgba(${t.accentRgb},0.3)` : t.accent}`,
                  color: t.accent, padding: '11px 28px',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '13px',
                  letterSpacing: '0.18em', cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: '2px', transition: 'all 0.25s', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                {loading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span>
                    SCANNING...
                  </>
                ) : '⟶ RUN SCAN'}
              </button>
            </div>

            <div ref={logsRef} style={{
              background: t.bgTerminal, border: `1px solid ${t.border}`,
              borderRadius: '4px', padding: '12px 14px', height: '118px', overflowY: 'auto',
            }}>
              {logs.length === 0
                ? <span style={{ color: t.textDim, fontSize: '12px' }}>// Awaiting scan...</span>
                : logs.map(log => (
                  <div key={log.id} style={{ color: logColor(log.type), fontSize: '12px', lineHeight: '1.8' }}>
                    <span style={{ color: t.textDim, marginRight: '7px' }}>›</span>{log.text}
                  </div>
                ))
              }
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {blocked && !loading && (
              <div style={{
                flex: 1,
                border: `1px solid rgba(232,41,74,0.4)`,
                borderRadius: '4px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '18px',
                background: 'rgba(232,41,74,0.05)',
                boxShadow: '0 0 40px rgba(232,41,74,0.15)',
                padding: '30px',
                animation: 'slideUp 0.5s ease',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '260px', height: '260px', borderRadius: '50%',
                  border: '1px solid rgba(232,41,74,0.2)',
                  opacity: 0.4, pointerEvents: 'none',
                  animation: 'pulse-dot 3s infinite',
                }} />

                <div style={{
                  fontSize: '56px', opacity: 0.9,
                  animation: 'shake 0.5s ease',
                  filter: 'drop-shadow(0 0 20px rgba(232,41,74,0.6))',
                }}>🚨</div>

                <div style={{
                  fontSize: '16px', fontWeight: 700,
                  color: '#e8294a', letterSpacing: '0.15em',
                  fontFamily: "'JetBrains Mono', monospace",
                  textShadow: '0 0 12px rgba(232,41,74,0.5)',
                }}>
                  SCAN BLOCKED
                </div>

                <div style={{
                  fontSize: '12px', color: t.textMuted,
                  letterSpacing: '0.08em', textAlign: 'center',
                  maxWidth: '320px', lineHeight: 1.6,
                }}>
                  Prompt injection detected in submitted code.
                </div>

                <div style={{
                  padding: '10px 24px',
                  background: '#e8294a',
                  color: 'white',
                  fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.2em',
                  borderRadius: '3px',
                  boxShadow: '0 0 24px rgba(232,41,74,0.5)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  RISK LEVEL: {blocked.riskLevel}
                </div>

                <div style={{
                  fontSize: '11px', color: t.textDim,
                  maxWidth: '300px', textAlign: 'center',
                  lineHeight: 1.7, marginTop: '8px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  Only source code is accepted for review.
                  Please remove any embedded instructions and try again.
                </div>

                <div style={{
                  marginTop: '10px',
                  padding: '8px 14px',
                  background: 'rgba(232,41,74,0.08)',
                  border: '1px solid rgba(232,41,74,0.2)',
                  borderRadius: '3px',
                  fontSize: '10px',
                  color: 'rgba(232,41,74,0.8)',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.1em',
                }}>
                  ⚠ 3-LAYER DEFENSE ACTIVE
                </div>
              </div>
            )}

            {!review && !loading && !blocked && (
              <div style={{
                flex: 1, border: `1px dashed ${t.border}`,
                borderRadius: '4px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '14px',
              }}>
                <div style={{ fontSize: '44px', color: t.accent, opacity: 0.2 }}>⬡</div>
                <div style={{ fontSize: '12px', letterSpacing: '0.15em', color: t.textMuted }}>AWAITING SCAN</div>
                <div style={{ fontSize: '11px', color: t.textDim }}>Paste code and press RUN SCAN</div>
              </div>
            )}

            {loading && (
              <div style={{
                flex: 1, border: `1px solid ${t.borderAccent}`,
                borderRadius: '4px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '20px',
                background: t.bgCard,
              }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      position: 'absolute', inset: `${i * 10}px`,
                      border: `1px solid rgba(${t.accentRgb},${0.6 - i * 0.15})`,
                      borderRadius: '50%',
                      animation: `spin ${1 + i * 0.3}s linear infinite ${i % 2 ? 'reverse' : ''}`,
                    }} />
                  ))}
                  <div style={{
                    position: 'absolute', inset: '30px',
                    background: t.accent, borderRadius: '50%',
                    boxShadow: `0 0 20px ${t.accent}`,
                    animation: 'pulse-dot 1s infinite',
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: t.accent, letterSpacing: '0.2em', animation: 'pulse-dot 1.5s infinite' }}>
                  ANALYZING...
                </div>
              </div>
            )}

            {review && !blocked && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'slideUp 0.5s ease' }}>

                <div style={{
                  ...cardStyle,
                  borderLeft: `3px solid ${t.accent}`,
                }}>
                  <div style={sectionLabel as any}>SUMMARY</div>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: t.text }}>{review.summary}</p>
                </div>

                {review.scores && (
                  <div style={{ ...cardStyle }}>
                    <div style={{ fontSize: '10px', color: t.textMuted, letterSpacing: '0.2em', marginBottom: '14px' }}>SCORES</div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px' }}>
                      {Object.entries(review.scores).map(([key, val]) => (
                        <ScoreRing key={key} label={key} value={Number(val)} isDark={darkMode} />
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
                  {(['issues', 'recommendations'] as const).map(tab => (
                    <button
                      key={tab}
                      className="tab-btn"
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: 'transparent', border: 'none',
                        borderBottom: `2px solid ${activeTab === tab ? t.accent : 'transparent'}`,
                        color: activeTab === tab ? t.accent : t.textMuted,
                        padding: '9px 18px', fontSize: '11px', cursor: 'pointer',
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                        transition: 'all 0.2s', fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {tab}{tab === 'issues' && review.issues ? ` (${review.issues.length})` : ''}
                    </button>
                  ))}
                </div>

                {activeTab === 'issues' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                    {(!review.issues || review.issues.length === 0)
                      ? <div style={{ padding: '24px', textAlign: 'center', color: t.accent, fontSize: '12px' }}>✓ No issues detected</div>
                      : review.issues.map((issue, i) => {
                        const sev = SEVERITY[issue.severity] || SEVERITY.low;
                        return (
                          <div key={i} className="issue-card" style={{
                            background: t.bgCard, border: `1px solid ${t.border}`,
                            borderLeft: `3px solid ${sev.color}`, borderRadius: '4px',
                            padding: '11px 13px', transition: 'background 0.2s',
                            animation: 'slideUp 0.4s ease forwards',
                            animationDelay: `${i * 0.06}s`,
                            boxShadow: darkMode ? 'none' : '0 1px 8px rgba(0,0,0,0.07)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                              <span style={{
                                fontSize: '9px', padding: '2px 6px', borderRadius: '2px',
                                background: sev.bg, color: sev.color, fontWeight: 700, letterSpacing: '0.08em',
                              }}>{sev.glyph} {sev.label}</span>
                              <span style={{ fontSize: '10px', color: t.textMuted, letterSpacing: '0.08em' }}>
                                {issue.category?.toUpperCase()}
                              </span>
                              {issue.line_number && (
                                <span style={{ marginLeft: 'auto', fontSize: '10px', color: t.textDim }}>L{issue.line_number}</span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: t.text, marginBottom: '5px', lineHeight: 1.5 }}>{issue.description}</p>
                            {issue.suggestion && (
                              <p style={{ fontSize: '11px', color: t.accent, lineHeight: 1.5, opacity: 0.8 }}>→ {issue.suggestion}</p>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                    {(!review.recommendations || review.recommendations.length === 0)
                      ? <div style={{ padding: '24px', textAlign: 'center', color: t.textMuted, fontSize: '12px' }}>No recommendations</div>
                      : review.recommendations.map((rec, i) => (
                        <div key={i} style={{
                          background: t.bgCard, border: `1px solid ${t.border}`,
                          borderLeft: `3px solid ${t.recBorder}`, borderRadius: '4px',
                          padding: '11px 13px', fontSize: '12px', color: t.text, lineHeight: 1.6,
                          animation: 'slideUp 0.4s ease forwards',
                          animationDelay: `${i * 0.06}s`,
                          boxShadow: darkMode ? 'none' : '0 1px 8px rgba(0,0,0,0.07)',
                        }}>
                          <span style={{ color: t.accent, marginRight: '8px' }}>◈</span>{rec}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          URL SCANNER TAB  ← FIXED: URL input added back
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'url' && (
        <main style={{
          maxWidth: '1400px', margin: '0 auto', padding: '28px 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
          minHeight: 'calc(100vh - 66px)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* ✅ URL INPUT — RESTORED */}
            <div style={{
              border: `1px solid ${t.borderAccent}`,
              borderRadius: '4px', overflow: 'hidden',
              background: t.bgEditor,
              boxShadow: darkMode ? `0 0 40px rgba(${t.accentRgb},0.05)` : '0 4px 24px rgba(0,0,0,0.1)',
            }}>
              <div style={{
                padding: '9px 14px', borderBottom: `1px solid ${t.border}`,
                display: 'flex', alignItems: 'center', gap: '7px',
                background: darkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
              }}>
                <Globe size={12} color={t.accent} style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '11px', color: t.textMuted, letterSpacing: '0.08em' }}>TARGET URL</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: t.textDim }}>http:// or https://</span>
              </div>
              <div style={{ padding: '16px' }}>
                <input
                  className="url-input"
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleURLScan()}
                  placeholder="https://example.com"
                  style={{
                    width: '100%', background: 'transparent', border: `1px solid ${t.border}`,
                    borderRadius: '3px', padding: '10px 14px',
                    color: t.textCode, fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    caretColor: t.accent, transition: 'border-color 0.2s',
                    letterSpacing: '0.02em',
                  }}
                />
              </div>
            </div>

            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '10px', color: t.textMuted, letterSpacing: '0.15em' }}>OPTIONS</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginLeft: 'auto' }}>
                <div
                  onClick={() => setPortScan(p => !p)}
                  style={{
                    width: '32px', height: '17px', borderRadius: '9px',
                    background: portScan ? t.accent : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'),
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                    boxShadow: portScan ? `0 0 8px rgba(${t.accentRgb},0.4)` : 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '2px',
                    left: portScan ? '17px' : '2px',
                    width: '13px', height: '13px', borderRadius: '50%',
                    background: 'white', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: t.textMuted }}>Include port scan <span style={{ color: t.textDim }}>(adds ~2s)</span></span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="scan-btn"
                onClick={handleURLScan}
                disabled={urlLoading || !urlInput.trim()}
                style={{
                  background: 'transparent',
                  border: `1px solid ${urlLoading || !urlInput.trim() ? `rgba(${t.accentRgb},0.3)` : t.accent}`,
                  color: urlLoading || !urlInput.trim() ? `rgba(${t.accentRgb},0.5)` : t.accent,
                  padding: '11px 28px',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '13px',
                  letterSpacing: '0.18em', cursor: urlLoading || !urlInput.trim() ? 'not-allowed' : 'pointer',
                  borderRadius: '2px', transition: 'all 0.25s', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                {urlLoading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span>
                    SCANNING...
                  </>
                ) : '▶ SCAN'}
              </button>
            </div>

            <div ref={urlLogsRef} style={{
              background: t.bgTerminal, border: `1px solid ${t.border}`,
              borderRadius: '4px', padding: '12px 14px', height: '118px', overflowY: 'auto',
            }}>
              {urlLogs.length === 0
                ? <span style={{ color: t.textDim, fontSize: '12px' }}>// Enter a URL and press SCAN...</span>
                : urlLogs.map(log => (
                  <div key={log.id} style={{ color: logColor(log.type), fontSize: '12px', lineHeight: '1.8' }}>
                    <span style={{ color: t.textDim, marginRight: '7px' }}>›</span>{log.text}
                  </div>
                ))
              }
            </div>

            <div style={{ ...cardStyle }}>
              <div style={sectionLabel as any}>WHAT WE CHECK</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { icon: '🔒', label: 'TLS / HTTPS encryption' },
                  { icon: '🛡', label: 'Security response headers' },
                  { icon: '↪', label: 'Redirect chain analysis' },
                  { icon: '📂', label: 'Exposed sensitive paths' },
                  { icon: '🔍', label: 'Information disclosure' },
                  { icon: '⚠', label: 'Suspicious URL patterns' },
                  { icon: '🌐', label: 'Mixed content detection' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: t.textMuted }}>
                    <span>{icon}</span>{label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!urlResult && !urlLoading && (
              <div style={{
                flex: 1, border: `1px dashed ${t.border}`,
                borderRadius: '4px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '14px',
              }}>
                <div style={{ fontSize: '44px', color: t.accent, opacity: 0.2 }}>⊕</div>
                <div style={{ fontSize: '12px', letterSpacing: '0.15em', color: t.textMuted }}>AWAITING TARGET</div>
                <div style={{ fontSize: '11px', color: t.textDim }}>Enter a URL and press SCAN</div>
              </div>
            )}

            {urlLoading && (
              <div style={{
                flex: 1, border: `1px solid ${t.borderAccent}`,
                borderRadius: '4px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '20px',
                background: t.bgCard,
              }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      position: 'absolute', inset: `${i * 10}px`,
                      border: `1px solid rgba(${t.accentRgb},${0.6 - i * 0.15})`,
                      borderRadius: '50%',
                      animation: `spin ${1 + i * 0.3}s linear infinite ${i % 2 ? 'reverse' : ''}`,
                    }} />
                  ))}
                  <div style={{
                    position: 'absolute', inset: '30px',
                    background: t.accent, borderRadius: '50%',
                    boxShadow: `0 0 20px ${t.accent}`,
                    animation: 'pulse-dot 1s infinite',
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: t.accent, letterSpacing: '0.2em', animation: 'pulse-dot 1.5s infinite' }}>
                  SCANNING URL...
                </div>
              </div>
            )}

            {urlResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'slideUp 0.5s ease' }}>
                <div style={{ ...cardStyle, borderLeft: `3px solid ${t.accent}` }}>
                  <div style={sectionLabel as any}>SUMMARY</div>
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: t.text, marginBottom: '10px' }}>
                    {urlResult.summary}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {urlResult.status_code && (
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '2px',
                        background: urlResult.status_code === 200 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: urlResult.status_code === 200 ? '#10b981' : '#f59e0b',
                        border: `1px solid ${urlResult.status_code === 200 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      }}>
                        HTTP {urlResult.status_code}
                      </span>
                    )}
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '2px',
                      background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      color: t.textMuted, border: `1px solid ${t.border}`,
                    }}>
                      ⏱ {urlResult.scan_time}s
                    </span>
                    {urlResult.final_url && urlResult.final_url !== urlResult.url && (
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '2px',
                        background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}>
                        ↪ redirected
                      </span>
                    )}
                  </div>
                </div>

                <ThreatMeter threat={computeThreat(urlResult)} isDark={darkMode} />

                <div style={{ ...cardStyle, padding: '12px 16px' }}>
                  <div style={{ fontSize: '10px', color: t.textMuted, letterSpacing: '0.2em', marginBottom: '10px' }}>
                    CATEGORY SCORES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {urlResult.scores && Object.entries(urlResult.scores)
                      .filter(([k]) => k !== 'overall')
                      .map(([key, val]) => {
                        const pct = (Number(val) / 10) * 100;
                        const color = SCORE_COLORS[key] || t.accent;
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              fontSize: '10px', color: t.textMuted, letterSpacing: '0.1em',
                              textTransform: 'uppercase', minWidth: '90px',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>{key}</span>
                            <div style={{
                              flex: 1, height: '4px', borderRadius: '2px',
                              background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%', width: `${pct}%`,
                                background: color, borderRadius: '2px',
                                boxShadow: `0 0 6px ${color}`,
                                transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                              }} />
                            </div>
                            <span style={{
                              fontSize: '11px', fontWeight: 700, color,
                              minWidth: '28px', textAlign: 'right',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>{Number(val).toFixed(1)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
                  {(['issues', 'details', 'recommendations'] as const).map(tab => (
                    <button
                      key={tab}
                      className="tab-btn"
                      onClick={() => setUrlActiveTab(tab)}
                      style={{
                        background: 'transparent', border: 'none',
                        borderBottom: `2px solid ${urlActiveTab === tab ? t.accent : 'transparent'}`,
                        color: urlActiveTab === tab ? t.accent : t.textMuted,
                        padding: '9px 14px', fontSize: '11px', cursor: 'pointer',
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        transition: 'all 0.2s', fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {tab}{tab === 'issues' && urlResult.issues ? ` (${urlResult.issues.length})` : ''}
                    </button>
                  ))}
                </div>

                {urlActiveTab === 'issues' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                    {(!urlResult.issues || urlResult.issues.length === 0)
                      ? <div style={{ padding: '24px', textAlign: 'center', color: '#10b981', fontSize: '12px' }}>✓ No issues detected — site looks clean!</div>
                      : urlResult.issues.map((issue, i) => {
                        const sev = SEVERITY[issue.severity] || SEVERITY.low;
                        return (
                          <div key={i} className="issue-card" style={{
                            background: t.bgCard, border: `1px solid ${t.border}`,
                            borderLeft: `3px solid ${sev.color}`, borderRadius: '4px',
                            padding: '11px 13px', transition: 'background 0.2s',
                            animation: 'slideUp 0.4s ease forwards',
                            animationDelay: `${i * 0.06}s`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                              <span style={{
                                fontSize: '9px', padding: '2px 6px', borderRadius: '2px',
                                background: sev.bg, color: sev.color, fontWeight: 700, letterSpacing: '0.08em',
                              }}>{sev.glyph} {sev.label}</span>
                              <span style={{ fontSize: '10px', color: t.textMuted, letterSpacing: '0.08em' }}>
                                {issue.category?.toUpperCase().replace('_', ' ')}
                              </span>
                            </div>
                            <p style={{ fontSize: '12px', color: t.text, marginBottom: '5px', lineHeight: 1.5 }}>{issue.description}</p>
                            <p style={{ fontSize: '11px', color: t.accent, lineHeight: 1.5, opacity: 0.8 }}>→ {issue.suggestion}</p>
                          </div>
                        );
                      })
                    }
                  </div>
                )}

                {urlActiveTab === 'details' && urlResult.details && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                    <div style={{ ...cardStyle }}>
                      <div style={sectionLabel as any}>SECURITY HEADERS</div>
                      <HeadersGrid
                        present={urlResult.details.headers.present || []}
                        missing={urlResult.details.headers.missing || []}
                        t={t}
                        isDark={darkMode}
                      />
                    </div>
                    <div style={{ ...cardStyle }}>
                      <div style={sectionLabel as any}>REDIRECTS</div>
                      <div style={{ fontSize: '12px', color: t.textMuted, marginBottom: '8px' }}>
                        {urlResult.details.redirects.redirect_count} hop(s) detected
                      </div>
                      {(urlResult.details.redirects.chain || []).map((url: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', color: t.textDim }}>{i === 0 ? '⊕' : '↪'}</span>
                          <span style={{ fontSize: '11px', color: t.textMuted, wordBreak: 'break-all', fontFamily: "'JetBrains Mono', monospace" }}>
                            {url}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ ...cardStyle }}>
                      <div style={sectionLabel as any}>PATH PROBE</div>
                      <div style={{ fontSize: '12px', color: t.textMuted, marginBottom: '6px' }}>
                        Probed {urlResult.details.exposed_paths.probed || 0} paths
                      </div>
                      {(urlResult.details.exposed_paths.exposed || []).length === 0
                        ? <div style={{ fontSize: '11px', color: '#10b981' }}>✓ No sensitive paths exposed</div>
                        : (urlResult.details.exposed_paths.exposed as string[]).map((p: string) => (
                          <div key={p} style={{ fontSize: '11px', color: '#e8294a', padding: '3px 0' }}>▲ {p}</div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {urlActiveTab === 'recommendations' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                    {(!urlResult.recommendations || urlResult.recommendations.length === 0)
                      ? <div style={{ padding: '24px', textAlign: 'center', color: t.textMuted, fontSize: '12px' }}>No recommendations</div>
                      : urlResult.recommendations.map((rec, i) => (
                        <div key={i} style={{
                          background: t.bgCard, border: `1px solid ${t.border}`,
                          borderLeft: `3px solid ${t.recBorder}`, borderRadius: '4px',
                          padding: '11px 13px', fontSize: '12px', color: t.text, lineHeight: 1.6,
                          animation: 'slideUp 0.4s ease forwards',
                          animationDelay: `${i * 0.06}s`,
                        }}>
                          <span style={{ color: t.accent, marginRight: '8px' }}>◈</span>{rec}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PHISHING DETECTION TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'phishing' && (() => {
        const RISK_META: Record<string, { color: string; bg: string; border: string; glow: string; label: string }> = {
          safe:     { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.15)',  label: 'SAFE' },
          low:      { color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)',  glow: 'rgba(99,102,241,0.15)',  label: 'LOW RISK' },
          medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',   glow: 'rgba(245,158,11,0.2)',   label: 'MEDIUM RISK' },
          high:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.35)',  glow: 'rgba(249,115,22,0.25)',  label: 'HIGH RISK' },
          critical: { color: '#ff2d6b', bg: 'rgba(255,45,107,0.08)',  border: 'rgba(255,45,107,0.35)',  glow: 'rgba(255,45,107,0.3)',   label: 'CRITICAL' },
        };

        const ACTION_META: Record<string, { color: string; label: string; icon: string }> = {
          allow: { color: '#10b981', label: 'ALLOW', icon: '✓' },
          warn:  { color: '#f59e0b', label: 'WARN',  icon: '⚠' },
          block: { color: '#ff2d6b', label: 'BLOCK', icon: '✗' },
        };

        const det = phishingResult?.detection;
        const risk = det ? (RISK_META[det.risk_level] || RISK_META.safe) : null;
        const act  = det ? (ACTION_META[det.suggested_action] || ACTION_META.warn) : null;

        return (
          <main style={{
            maxWidth: '1400px', margin: '0 auto', padding: '28px 24px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px',
            minHeight: 'calc(100vh - 66px)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                border: `1px solid ${t.borderAccent}`, borderRadius: '4px',
                background: t.bgEditor,
                boxShadow: darkMode ? `0 0 40px rgba(${t.accentRgb},0.05)` : '0 4px 24px rgba(0,0,0,0.1)',
              }}>
                <div style={{
                  padding: '9px 14px', borderBottom: `1px solid ${t.border}`,
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: darkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                }}>
                  <AlertTriangle size={12} color={t.accent} style={{ opacity: 0.7 }} />
                  <span style={{ fontSize: '11px', color: t.textMuted, letterSpacing: '0.08em' }}>
                    PHISHING ANALYSIS TARGET
                  </span>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: t.textDim, letterSpacing: '0.12em', marginBottom: '6px' }}>URL TO ANALYZE</div>
                    <input
                      className="url-input"
                      type="text"
                      value={phishingInput}
                      onChange={e => setPhishingInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePhishingDetect()}
                      placeholder="https://suspicious-site.xyz"
                      style={{
                        width: '100%', background: 'transparent', border: `1px solid ${t.border}`,
                        borderRadius: '3px', padding: '9px 12px',
                        color: t.textCode, fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        caretColor: t.accent, transition: 'border-color 0.2s',
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: t.textDim, letterSpacing: '0.12em', marginBottom: '6px' }}>HTML CONTENT (optional)</div>
                    <textarea
                      value={phishingContent}
                      onChange={e => setPhishingContent(e.target.value)}
                      placeholder="Paste page HTML or email content for deeper analysis..."
                      rows={5}
                      style={{
                        width: '100%', background: 'transparent', border: `1px solid ${t.border}`,
                        borderRadius: '3px', padding: '9px 12px',
                        color: t.textCode, fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        caretColor: t.accent, resize: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="scan-btn"
                  onClick={handlePhishingDetect}
                  disabled={phishingLoading || (!phishingInput.trim() && !phishingContent.trim())}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${phishingLoading ? `rgba(${t.accentRgb},0.3)` : t.accent}`,
                    color: phishingLoading ? `rgba(${t.accentRgb},0.5)` : t.accent,
                    padding: '11px 28px',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '13px',
                    letterSpacing: '0.18em', cursor: phishingLoading ? 'not-allowed' : 'pointer',
                    borderRadius: '2px', transition: 'all 0.25s', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  {phishingLoading ? (
                    <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span>ANALYZING...</>
                  ) : '⚠ DETECT PHISHING'}
                </button>
              </div>

              <div ref={phishingLogsRef} style={{
                background: t.bgTerminal, border: `1px solid ${t.border}`,
                borderRadius: '4px', padding: '12px 14px', height: '100px', overflowY: 'auto',
              }}>
                {phishingLogs.length === 0
                  ? <span style={{ color: t.textDim, fontSize: '12px' }}>// Enter a URL or content to analyze...</span>
                  : phishingLogs.map(log => (
                    <div key={log.id} style={{ color: logColor(log.type), fontSize: '12px', lineHeight: '1.8' }}>
                      <span style={{ color: t.textDim, marginRight: '7px' }}>›</span>{log.text}
                    </div>
                  ))
                }
              </div>

              <div style={{ ...cardStyle }}>
                <div style={sectionLabel as any}>DETECTION METHODS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { icon: '🎣', label: 'URL pattern & TLD analysis' },
                    { icon: '🏷', label: 'Brand spoofing / typosquatting' },
                    { icon: '📋', label: 'HTML content scanning' },
                    { icon: '🤖', label: 'ML classifier (simulated)' },
                    { icon: '🔗', label: 'External form action detection' },
                    { icon: '🚨', label: 'Credential harvesting indicators' },
                  ].map(({ icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: t.textMuted }}>
                      <span>{icon}</span>{label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!phishingResult && !phishingLoading && (
                <div style={{
                  flex: 1, border: `1px dashed ${t.border}`,
                  borderRadius: '4px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '14px',
                  minHeight: '320px',
                }}>
                  <div style={{ fontSize: '44px', color: t.accent, opacity: 0.2 }}>⚠</div>
                  <div style={{ fontSize: '12px', letterSpacing: '0.15em', color: t.textMuted }}>AWAITING ANALYSIS</div>
                  <div style={{ fontSize: '11px', color: t.textDim }}>Enter a URL or content above</div>
                </div>
              )}

              {phishingLoading && (
                <div style={{
                  flex: 1, border: `1px solid ${t.borderAccent}`,
                  borderRadius: '4px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '20px',
                  background: t.bgCard, minHeight: '320px',
                }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        position: 'absolute', inset: `${i * 10}px`,
                        border: `1px solid rgba(${t.accentRgb},${0.6 - i * 0.15})`,
                        borderRadius: '50%',
                        animation: `spin ${1 + i * 0.3}s linear infinite ${i % 2 ? 'reverse' : ''}`,
                      }} />
                    ))}
                    <div style={{
                      position: 'absolute', inset: '30px',
                      background: t.accent, borderRadius: '50%',
                      boxShadow: `0 0 20px ${t.accent}`,
                      animation: 'pulse-dot 1s infinite',
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: t.accent, letterSpacing: '0.2em', animation: 'pulse-dot 1.5s infinite' }}>
                    ANALYZING...
                  </div>
                </div>
              )}

              {phishingResult && det && risk && act && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'slideUp 0.5s ease' }}>
                  <div style={{
                    ...cardStyle, padding: '18px 20px',
                    background: risk.bg,
                    border: `1px solid ${risk.border}`,
                    borderLeft: `4px solid ${risk.color}`,
                    boxShadow: `0 0 24px ${risk.glow}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>{det.is_phishing ? '🎣' : '✅'}</span>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: risk.color, letterSpacing: '0.1em' }}>
                            {risk.label}
                          </div>
                          <div style={{ fontSize: '10px', color: t.textMuted, marginTop: '2px' }}>
                            {det.is_phishing ? 'PHISHING DETECTED' : 'NO PHISHING DETECTED'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '28px', fontWeight: 700, color: risk.color,
                          fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
                        }}>{Math.round(det.confidence * 100)}%</div>
                        <div style={{ fontSize: '9px', color: t.textMuted, letterSpacing: '0.12em' }}>CONFIDENCE</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '2px', fontWeight: 700,
                        background: `rgba(${act.color === '#10b981' ? '16,185,129' : act.color === '#f59e0b' ? '245,158,11' : '255,45,107'},0.15)`,
                        color: act.color, border: `1px solid ${act.color}`,
                        letterSpacing: '0.1em',
                      }}>{act.icon} SUGGESTED: {act.label}</span>
                      {det.brand_spoofed && (
                        <span style={{
                          fontSize: '10px', padding: '3px 10px', borderRadius: '2px',
                          background: 'rgba(249,115,22,0.1)', color: '#f97316',
                          border: '1px solid rgba(249,115,22,0.3)',
                        }}>🏷 SPOOFS: {det.brand_spoofed.toUpperCase()}</span>
                      )}
                      {det.detectors_used && (
                        <span style={{
                          fontSize: '10px', padding: '3px 10px', borderRadius: '2px',
                          background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                          color: t.textMuted, border: `1px solid ${t.border}`,
                        }}>🤖 {det.detectors_used.join(' + ')}</span>
                      )}
                      {det.detection_time_ms && (
                        <span style={{
                          fontSize: '10px', padding: '3px 10px', borderRadius: '2px',
                          background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                          color: t.textMuted, border: `1px solid ${t.border}`,
                        }}>⏱ {det.detection_time_ms}ms</span>
                      )}
                    </div>
                  </div>

                  <div style={{ ...cardStyle }}>
                    <div style={sectionLabel as any}>EXPLANATION</div>
                    <p style={{ fontSize: '12px', color: t.text, lineHeight: 1.7 }}>{det.explanation}</p>
                  </div>

                  <div style={{ ...cardStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={sectionLabel as any}>RISK SCORE</div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: risk.color, fontFamily: "'JetBrains Mono', monospace" }}>
                        {det.risk_score}/100
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${det.risk_score}%`,
                        background: `linear-gradient(90deg, #10b981, ${risk.color})`,
                        borderRadius: '3px', boxShadow: `0 0 8px ${risk.color}`,
                        transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                      }} />
                    </div>
                  </div>

                  {det.indicators && det.indicators.length > 0 && (
                    <div style={{ ...cardStyle }}>
                      <div style={sectionLabel as any}>INDICATORS ({det.indicators.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                        {det.indicators.map((ind, i) => (
                          <div key={i} className="issue-card" style={{
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            background: t.bgCard, border: `1px solid ${t.border}`,
                            borderLeft: `3px solid ${risk.color}`, borderRadius: '4px',
                            padding: '8px 12px', fontSize: '12px', color: t.text,
                            animation: 'slideUp 0.4s ease forwards',
                            animationDelay: `${i * 0.05}s`,
                          }}>
                            <span style={{ color: risk.color, marginTop: '1px', flexShrink: 0 }}>▲</span>
                            {ind}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        );
      })()}
    </div>
  );
};

export default CodeReviewUI;