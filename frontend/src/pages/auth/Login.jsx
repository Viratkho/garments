import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { Scissors, Lock, Mail, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('admin@garmentflow.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Welcome back to DP ENTERPRISES!');
      navigate('/');
    } catch (err) {
      error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@garmentflow.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Typographic DP Monogram Emblem */}
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#172B4D] to-[#0F1B2F] rounded-xl shadow-md border border-blue-500/30 mb-3 select-none">
          <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-300 via-white to-blue-200">
            DP
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-[#172B4D]">DP ENTERPRISES</h2>
        <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mt-1">
          Garment Manufacturing & Business Management
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            DP ENTERPRISES – GarmentFlow
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-md rounded-xl border border-gray-200/80 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@garmentflow.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Default: admin@garmentflow.com / admin123</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="font-medium text-[#2563EB] hover:text-blue-700"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <p className="text-[11px] text-gray-400">
              Secured with bcrypt password hashing & JWT token session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
