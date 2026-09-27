'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/context/WorkoutContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  Flame,
  Scale,
  LogOut,
  Dumbbell,
  Activity,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface UserProfileData {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
  weightUnit?: 'KG' | 'LBS';
  createdAt?: string;
}

interface RecentPRItem {
  id: string;
  type: string;
  value: number;
  reps?: number;
  achievedAt: string;
  exercise: {
    id: string;
    name: string;
    primaryMuscle: string;
  };
}

interface ProfileAnalytics {
  stats: {
    totalWorkouts: number;
    totalVolumeKg: number;
    totalSets: number;
    streakDays?: number;
  };
  muscleDistribution: Record<string, number>;
  recentPRs: RecentPRItem[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { unit, setUnit, displayWeight } = useWorkout();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, analyticsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/analytics'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success) {
            setProfile(meData.user);
            if (meData.user.weightUnit) {
              setUnit(meData.user.weightUnit as 'KG' | 'LBS');
            }
          }
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          if (analyticsData.success) {
            setAnalytics(analyticsData);
          }
        }
      } catch (err) {
        console.error('Failed to load profile/analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setUnit]);

  const handleUnitChange = async (newUnit: 'KG' | 'LBS') => {
    setUnit(newUnit);
    setSavingSettings(true);
    try {
      await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightUnit: newUnit }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const maxMuscleCount = analytics?.muscleDistribution
    ? Math.max(1, ...Object.values(analytics.muscleDistribution as Record<string, number>))
    : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
      {/* Header Profile Banner */}
      <div className="glass-panel-elevated p-6 md:p-8 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-linear-to-tr from-sky-600 to-blue-500 text-white font-black text-2xl md:text-3xl flex items-center justify-center shadow-xl shadow-sky-600/30">
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : profile ? (
                profile.fullName.charAt(0).toUpperCase()
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {profile ? profile.fullName : 'Guest Athlete'}
              </h2>
              <p className="text-xs md:text-sm font-mono text-sky-400">
                @{profile ? profile.username : 'athlete'}
              </p>
              {profile?.bio && (
                <p className="text-xs text-slate-300 pt-1 max-w-md">{profile.bio}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 transition-all self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Direct Link to Charts & Analytics */}
      <Link
        href="/analytics"
        className="glass-panel p-4 md:p-5 rounded-3xl border border-sky-500/30 bg-linear-to-r from-sky-950/40 via-slate-900 to-slate-950 flex items-center justify-between hover:border-sky-400 transition-all shadow-xl group"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-white group-hover:text-sky-300 transition-colors">
              Detailed Charts & Strength Progression
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive volume graphs, 1RM strength curves, and 12-week consistency heatmap
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
          <span>Open Charts</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>

      {/* Lifetime Stats Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Workouts */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Workouts</span>
            <Dumbbell className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono">
            {analytics?.stats?.totalWorkouts ?? 0}
          </span>
        </div>

        {/* Volume */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {displayWeight(analytics?.stats?.totalVolumeKg ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 ml-1 font-bold">{unit}</span>
        </div>

        {/* Completed Sets */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sets</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono">
            {analytics?.stats?.totalSets ?? 0}
          </span>
        </div>

        {/* Streak */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Streak</span>
            <Flame className="w-4 h-4 text-amber-400 fill-current" />
          </div>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {analytics?.stats?.streakDays ?? 0}
          </span>
          <span className="text-[10px] text-slate-500 ml-1 font-bold">days</span>
        </div>
      </div>

      {/* Account Details & Preferences */}
      <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-5">
        <h3 className="text-base font-bold text-white tracking-tight">App Preferences</h3>

        {/* Weight Unit Switcher */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Weight Measurement Unit</span>
              <span className="text-[11px] text-slate-400">
                Display weights in Kilograms (KG) or Pounds (LBS)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-[11px] font-bold text-emerald-400">Saved!</span>
            )}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                disabled={savingSettings}
                onClick={() => handleUnitChange('KG')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  unit === 'KG'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                KG
              </button>
              <button
                disabled={savingSettings}
                onClick={() => handleUnitChange('LBS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  unit === 'LBS'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LBS
              </button>
            </div>
          </div>
        </div>

        {/* User Registration Details */}
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <div className="text-xs truncate">
                <span className="text-[10px] text-slate-500 block">Email Address</span>
                <span className="font-semibold text-slate-200">{profile.email}</span>
              </div>
            </div>

            {profile.phone && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div className="text-xs truncate">
                  <span className="text-[10px] text-slate-500 block">Phone</span>
                  <span className="font-semibold text-slate-200">{profile.phone}</span>
                </div>
              </div>
            )}

            {profile.dateOfBirth && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div className="text-xs truncate">
                  <span className="text-[10px] text-slate-500 block">Date of Birth</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div className="text-xs truncate">
                <span className="text-[10px] text-slate-500 block">Member Since</span>
                <span className="font-semibold text-slate-200">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })
                    : 'Recently'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Muscle Volume Breakdown (Hevy Style) */}
      <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Muscle Group Distribution
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Completed sets per muscle</span>
        </div>

        <div className="space-y-2.5">
          {analytics?.muscleDistribution ? (
            Object.entries(analytics.muscleDistribution)
              .filter(([, count]) => count > 0)
              .map(([muscle, count]) => {
                const percent = Math.round((count / maxMuscleCount) * 100);
                return (
                  <div key={muscle} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{muscle}</span>
                      <span className="font-mono text-slate-400">{count} sets</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-sky-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              Complete workouts to view your muscle distribution heatmaps.
            </p>
          )}

          {analytics?.muscleDistribution &&
            Object.values(analytics.muscleDistribution as Record<string, number>).every(
              (c) => c === 0
            ) && (
              <p className="text-xs text-slate-500 py-4 text-center">
                No completed sets yet. Log workouts to populate muscle volume.
              </p>
            )}
        </div>
      </div>

      {/* Personal Records (PRs) */}
      {analytics?.recentPRs && analytics.recentPRs.length > 0 && (
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-4">
          <div className="flex items-center gap-2 text-purple-400">
            <Award className="w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Recent Personal Records (PRs)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analytics.recentPRs.map((pr: RecentPRItem) => (
              <div
                key={pr.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block">
                    {pr.exercise?.name || 'Exercise'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    {pr.type === 'ESTIMATED_1RM' ? 'Est. 1 Rep Max' : pr.type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-purple-400">
                    {displayWeight(pr.value)} {unit}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {new Date(pr.achievedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
