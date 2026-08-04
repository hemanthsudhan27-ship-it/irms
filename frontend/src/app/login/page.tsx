'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { Building2, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (err: any) {
      let msg = 'Invalid email or password';
      if (!err.response) {
        msg = 'Unable to connect to the backend server. Please verify it is running on port 5000.';
      } else if (err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-800">
            <Building2 className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              IRMS SaaS
            </h1>
            <p className="text-xs text-slate-400">Integrated Residency Management System</p>
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-medium text-slate-200">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800/80 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@irms.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-black bg-white hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Login Helpers */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-3 text-center">Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@irms.com');
                  setPassword('SuperAdmin@123#');
                }}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 text-center transition-colors cursor-pointer"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('complexadmin@irms.com');
                  setPassword('ComplexAdmin@123#');
                }}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 text-center transition-colors cursor-pointer"
              >
                Complex Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
