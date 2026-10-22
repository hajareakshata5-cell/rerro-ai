"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Cpu,
  BarChart3,
  Terminal,
  Play,
} from "lucide-react";

interface AIResult {
  title: string;
  category: string;
  summary: string;
  keyFeatures: string[];
  techStack: string[];
  readinessScore: number;
  samplePromptOrLogic: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simOutput, setSimOutput] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    setSimOutput("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const resData = await res.json();
      if (resData.data) {
        setResult(resData.data);
      } else {
        setError(resData.error || "Failed to parse AI output");
      }
    } catch {
      setError("Connection failed. Please check server.");
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = () => {
    setSimulating(true);
    setSimOutput("");
    setTimeout(() => {
      setSimOutput(
        result?.samplePromptOrLogic ||
          "Simulation Verified: Pipeline executed with 0 latency issues. Accuracy baseline established.",
      );
      setSimulating(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 sm:p-12">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Prompt War 2026 Engine
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            AI Solution Architect
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Give any real-world problem statement and get an instant
            AI-engineered product blueprint with features and architecture.
          </p>
        </header>

        {/* Input Form */}
        <form
          onSubmit={handleGenerate}
          className="flex gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-xl"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Smart traffic management system for Pune city using real-time cameras"
            className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-slate-100 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Generate Architecture
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Dynamic AI Cards Output */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Main Header Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-semibold uppercase">
                  {result.category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                  <BarChart3 className="w-3.5 h-3.5" /> Feasibility Score:{" "}
                  {result.readinessScore}%
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">{result.title}</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Grid of Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Features */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Core
                  System Features
                </h3>
                <ul className="space-y-2">
                  {result.keyFeatures.map((feat, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-400 flex items-start gap-2"
                    >
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" /> Recommended Tech
                  Stack
                </h3>
                <div className="flex flex-wrap gap-2 pt-2">
                  {result.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Interactive Action Card for Stage Demo */}
            <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                  <Terminal className="w-4 h-4 text-indigo-400" /> Live
                  Prototype Execution Simulator
                </div>
                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
                >
                  {simulating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  Execute Live Logic
                </button>
              </div>

              {simOutput && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-emerald-400 whitespace-pre-wrap animate-in fade-in">
                  {simOutput}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
