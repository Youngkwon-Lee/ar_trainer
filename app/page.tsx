```javascript
"use client";

import Link from "next/link";
import { Activity, Dumbbell, Zap, User, ArrowRight, Settings, MousePointer2 } from "lucide-react";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Smart Rehab Glass
            </h1>
            <p className="text-slate-400 text-sm mt-1">Welcome back, User</p>
          </div>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-10">

          {/* Section: Today's Plan */}
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> The Big 3 Routine
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. Squat (Active) */}
              <Link href="/exercise/squat" className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500" />
                <div className="relative h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:-translate-y-1 hover:border-indigo-500/50 transition duration-300">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Squat</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Lower body compound. Tracks depth, knee valgus, and trunk lean.
                  </p>
                  <div className="flex items-center text-indigo-400 text-sm font-medium">
                    Start <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>

              {/* 2. Deadlift (Active) */}
              <Link href="/exercise/deadlift" className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500" />
                <div className="relative h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:-translate-y-1 hover:border-amber-500/50 transition duration-300">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Deadlift</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Posterior chain. Monitor back rounding (cat-back) and hip hinge.
                  </p>
                  <div className="flex items-center text-amber-500 text-sm font-medium">
                    Start Session <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>

              {/* 3. Bench Press (Active) */}
              <Link href="/exercise/bench" className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500" />
                <div className="relative h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:-translate-y-1 hover:border-blue-500/50 transition duration-300">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Bench Press</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Upper body power. Track bar path, lock-out, and asymmetry.
                  </p>
                  <div className="flex items-center text-blue-400 text-sm font-medium">
                    Start Session <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* Section: Expert Zone (New) */}
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Lab & Expert Tools
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/expert/annotation" className="group relative">
                <div className="relative h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:-translate-y-1 hover:border-cyan-500/50 transition duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-cyan-400 mb-1">Lumbar Data Labeler</h3>
                      <p className="text-slate-500 text-sm">Create Ground Truth datasets by manually tagging spinal points.</p>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-lg text-cyan-400">
                      <MousePointer2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* Section: Recent History (Placeholder) */}
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Recent Progress
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="text-center text-slate-500 py-8">
                <p>No recent activity recorded.</p>
                <p className="text-sm mt-1">Complete your first session to see stats!</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
```
