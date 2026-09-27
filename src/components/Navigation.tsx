'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkout } from '@/context/WorkoutContext';
import {
  Dumbbell,
  BookOpen,
  Plus,
  Clock,
  User,
  Activity,
  Flame,
  Scale,
  TrendingUp,
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { activeWorkout, setIsWorkoutOpen, startWorkout, unit, setUnit } = useWorkout();

  // If on login or signup pages, do not render main navigation
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const navItems = [
    { label: 'Workouts', href: '/', icon: Dumbbell },
    { label: 'Exercises', href: '/exercises', icon: BookOpen },
    { label: 'Analytics', href: '/analytics', icon: TrendingUp },
    { label: 'History', href: '/history', icon: Clock },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  const handleCenterAction = () => {
    if (activeWorkout) {
      setIsWorkoutOpen(true);
    } else {
      startWorkout(null);
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP / TABLET SIDEBAR (Hidden on mobile)             */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 bg-slate-950 border-r border-slate-800/80 p-5 z-30">
        {/* App Logo */}
        <Link href="/" className="flex items-center gap-3 mb-8 px-2 group">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-sky-600/30 group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 fill-current text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>IRON</span>
              <span className="text-sky-400">PULSE</span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Gym Tracker
            </p>
          </div>
        </Link>

        {/* Start Workout Primary CTA Button */}
        <button
          onClick={handleCenterAction}
          className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-sky-600/25 flex items-center justify-center gap-2 mb-6 transition-all active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>{activeWorkout ? 'Resume Workout' : 'Start Workout'}</span>
        </button>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-md shadow-sky-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Unit Preference Switcher */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Scale className="w-4 h-4 text-sky-400" />
              <span className="font-medium">Unit:</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setUnit('KG')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  unit === 'KG'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => setUnit('LBS')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  unit === 'LBS'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LBS
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Hidden on desktop)        */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
          {/* Workouts */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Workouts</span>
          </Link>

          {/* Exercises */}
          <Link
            href="/exercises"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/exercises' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Exercises</span>
          </Link>

          {/* CENTER ELEVATED ACTION BUTTON */}
          <div className="flex-1 flex justify-center -translate-y-4">
            <button
              onClick={handleCenterAction}
              className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 ${
                activeWorkout
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/40 ring-4 ring-slate-950 animate-pulse'
                  : 'bg-linear-to-tr from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white shadow-sky-600/40 ring-4 ring-slate-950'
              }`}
              title={activeWorkout ? 'Resume active workout' : 'Start empty workout'}
            >
              {activeWorkout ? (
                <Activity className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Plus className="w-7 h-7 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Analytics */}
          <Link
            href="/analytics"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/analytics' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Analytics</span>
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/profile' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
