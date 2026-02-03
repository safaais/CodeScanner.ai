import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Code, Shield, Sparkles, Terminal, ChevronRight, Activity, Target, Zap, Eye, TrendingUp, Award
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface ReviewData {
  summary: string;
  scores: Record<string, number>;
  issues: Array<{
    severity: string;
    category: string;
    description: string;
    suggestion: string;
  }>;
  recommendations: string[];
}

// Circular Chart Component
const CircularChart = ({ 
  value, 
  maxValue = 10, 
  size = 110, 
  strokeWidth = 10, 
  label, 
  icon: Icon,
  color 
}: {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  icon?: any;
  color: { from: string; to: string };
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedValue / maxValue) * 100;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center group">
      <div className="relative transform transition-all duration-300 hover:scale-105" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gradient-${label})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color.from} />
              <stop offset="100%" stopColor={color.to} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {Icon && <Icon className="w-5 h-5 text-gray-400 mb-1" />}
          <span className="text-2xl font-bold text-gray-900">{animatedValue}</span>
          <span className="text-xs text-gray-400">/ {maxValue}</span>
        </div>
      </div>
      <div className="mt-3 text-xs font-semibold text-gray-600 capitalize">{label}</div>
    </div>
  );
};

const CodeReviewUI = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [loading, setLoading] = useState<boolean>(false);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        setIsOnline(res.ok);
      } catch {
        setIsOnline(false);
      }
    };
    checkStatus();
  }, []);

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setReview(null);

    try {
      const res = await fetch(`${API_BASE}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setReview(data);
    } catch (err) {
      console.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const chartColors: Record<string, { from: string; to: string }> = {
    overall: { from: '#6366f1', to: '#4f46e5' },
    security: { from: '#f87171', to: '#ef4444' },
    performance: { from: '#a78bfa', to: '#8b5cf6' },
    readability: { from: '#60a5fa', to: '#3b82f6' },
    maintainability: { from: '#34d399', to: '#10b981' }
  };

  const chartIcons: Record<string, any> = {
    security: Shield,
    performance: Zap,
    readability: Eye,
    maintainability: TrendingUp,
    overall: Award
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500 p-3 rounded-lg">
              <Terminal className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CodeScanner</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-medium text-gray-500">
                  {isOnline ? 'Engine Active' : 'Engine Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <optgroup label="Web">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="php">PHP</option>
              </optgroup>
              <optgroup label="System">
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="rust">Rust</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Editor Area */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1 font-semibold text-gray-700">
              <Code size={18} className="text-indigo-500" />
              <span>Input Terminal</span>
            </div>
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-6 rounded-xl border border-gray-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm leading-relaxed transition-all resize-none"
                style={{
                  minHeight: '200px',
                  height: code ? `${Math.min(Math.max(200, code.split('\n').length * 24 + 80), 600)}px` : '200px',
                  maxHeight: '600px'
                }}
                placeholder="// Paste your code to start scanning..."
              />
              <button
                onClick={handleReview}
                disabled={loading}
                className="absolute bottom-6 right-6 px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                {loading ? 'Analyzing...' : 'Scan'}
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-6">
            {!review ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm h-[256px] flex flex-col items-center justify-center text-gray-300">
                <Activity size={48} className="mb-4 opacity-20" />
                <p className="font-medium text-gray-400">System Ready For Input</p>
              </div>
            ) : (
              <>
                {/* Metrics Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {Object.entries(review.scores).map(([key, value], index) => (
                      <div key={key} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 100}ms` }}>
                        <CircularChart
                          value={value}
                          label={key}
                          icon={chartIcons[key]}
                          color={chartColors[key] || chartColors.overall}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm animate-in fade-in slide-in-from-right-2 duration-500">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4">AI Audit Summary</h3>
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <p className="text-gray-700 font-medium leading-relaxed">"{review.summary}"</p>
                  </div>
                </div>

                {/* Findings List */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">Detailed Findings</h3>
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {review.issues.map((issue, i) => (
                      <div 
                        key={i} 
                        className="flex gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className={`mt-0.5 p-2 rounded-lg ${
                          issue.severity === 'high' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {issue.severity === 'high' ? <Shield size={18} /> : <AlertCircle size={18} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm mb-2">{issue.description}</p>
                          <div className="flex items-start gap-2 text-green-700 font-medium">
                            <ChevronRight size={16} className="mt-0.5 flex-shrink-0" />
                            <p className="text-xs leading-relaxed">{issue.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default CodeReviewUI;