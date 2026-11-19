import { useState, FormEvent } from 'react';
import { X, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types/marketplace';
import { api, setAuthToken } from '../utils/api';
import { validateDguEmail } from '../utils/marketplaceLogic';

interface AuthModalProps {
  isOpen: boolean;
  allowedDomains: string[];
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify';

export function AuthModal({
  isOpen,
  allowedDomains,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hostelBlock, setHostelBlock] = useState('Boys Hostel Block A');
  const [programAndYear, setProgramAndYear] = useState('MBA · 1st Year');

  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedCodeHint, setSimulatedCodeHint] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);

  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.login({ email, password });
      setAuthToken(token);
      onAuthenticated(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const domainCheck = validateDguEmail(email, allowedDomains);
    if (!domainCheck.valid) {
      setError(domainCheck.error || 'DGU student email required.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.signup({
        name,
        email,
        password,
        hostelBlock,
        programAndYear,
      });
      setAuthToken(res.token);
      setPendingUser(res.user);
      setSimulatedCodeHint(res.demoVerificationCode);
      setInfoMsg(res.simulatedCampusEmailNotice);
      setMode('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user } = await api.verifyEmail(verificationCode);
      onAuthenticated(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipVerificationForNow = () => {
    if (pendingUser) {
      onAuthenticated(pendingUser);
    }
    onClose();
  };

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (resetStep === 'request') {
        const res = await api.forgotPassword(resetEmail);
        setSimulatedCodeHint(res.demoResetCode);
        setInfoMsg(res.message);
        setResetStep('confirm');
      } else {
        const res = await api.resetPassword({
          email: resetEmail,
          code: resetCode,
          newPassword,
        });
        setInfoMsg(res.message);
        setMode('login');
        setEmail(resetEmail);
        setResetStep('request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoEnter = async (accountType: 'student' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.enterDemoSession(accountType);
      setAuthToken(token);
      onAuthenticated(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-2xl border border-[#E2EAE5] max-w-md w-full p-6 sm:p-7 space-y-5 relative my-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 p-2 text-[#526058] hover:text-[#202824] rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <p className="text-xs font-medium text-[#145C45]">
            HostelLoop · DBS Global University
          </p>
          <h2 id="auth-modal-title" className="text-xl font-bold text-[#202824] mt-1">
            {mode === 'login' && 'Sign in to Campus Marketplace'}
            {mode === 'signup' && 'Create Student Account'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'verify' && 'Verify Your DGU Email'}
          </h2>
        </div>

        {/* Mode Switcher for Login / Signup */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F8FAF8] border border-[#E2EAE5] rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-white text-[#145C45] shadow-xs'
                  : 'text-[#526058]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-[#145C45] shadow-xs'
                  : 'text-[#526058]'
              }`}
            >
              Sign Up (@dgu.ac.in)
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-[#DDF4E7]/70 border border-[#C3E5D2] rounded-xl text-xs text-[#202824] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#145C45] shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-[#526058] mb-1"
              >
                Student Email (@{allowedDomains.join(', @')})
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@dgu.ac.in"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-[#526058]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setInfoMsg(null);
                  }}
                  className="text-xs text-[#145C45] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#526058]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-medium text-[#526058] mb-1"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ananya Rawat"
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-medium text-[#526058] mb-1"
              >
                Authorized DGU Email (@{allowedDomains.join(', @')})
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@dgu.ac.in"
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="signup-hostel"
                  className="block text-xs font-medium text-[#526058] mb-1"
                >
                  Hostel Block
                </label>
                <select
                  id="signup-hostel"
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-xs"
                >
                  <option>Boys Hostel Block A</option>
                  <option>Boys Hostel Block B</option>
                  <option>Girls Hostel Block</option>
                  <option>Off-Campus Selaqui</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="signup-program"
                  className="block text-xs font-medium text-[#526058] mb-1"
                >
                  Program & Year
                </label>
                <input
                  id="signup-program"
                  type="text"
                  value={programAndYear}
                  onChange={(e) => setProgramAndYear(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-medium text-[#526058] mb-1"
              >
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 pr-10 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#526058]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg"
            >
              {loading ? 'Creating Account...' : 'Create DGU Account'}
            </button>
          </form>
        )}

        {/* VERIFY EMAIL STEP */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {simulatedCodeHint && (
              <div className="p-3 bg-[#F8FAF8] border border-[#D4E3DA] rounded-xl text-xs text-[#202824]">
                Simulated campus email code:{' '}
                <strong className="font-mono-tabular text-[#145C45]">
                  {simulatedCodeHint}
                </strong>
              </div>
            )}
            <div>
              <label
                htmlFor="verify-code-input"
                className="block text-xs font-medium text-[#526058] mb-1"
              >
                6-Digit Verification Code
              </label>
              <input
                id="verify-code-input"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm font-mono-tabular"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#145C45] text-white text-sm font-medium rounded-lg"
            >
              {loading ? 'Verifying...' : 'Confirm DGU Email'}
            </button>
            <button
              type="button"
              onClick={handleSkipVerificationForNow}
              className="w-full py-2 text-xs text-[#526058] hover:text-[#202824]"
            >
              Continue as Unverified (Verify later in Profile)
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD STEP */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-medium text-[#526058] mb-1"
              >
                Registered DGU Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="student@dgu.ac.in"
                className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                required
              />
            </div>

            {resetStep === 'confirm' && (
              <>
                {simulatedCodeHint && (
                  <p className="text-xs bg-[#F8FAF8] p-2.5 rounded-lg border border-[#D4E3DA]">
                    Simulated reset code:{' '}
                    <strong className="font-mono-tabular text-[#145C45]">
                      {simulatedCodeHint}
                    </strong>
                  </p>
                )}
                <div>
                  <label className="block text-xs font-medium text-[#526058] mb-1">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm font-mono-tabular"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#526058] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#145C45] text-white text-sm font-medium rounded-lg"
            >
              {resetStep === 'request' ? 'Generate Reset Code' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setResetStep('request');
                setError(null);
              }}
              className="w-full text-xs text-[#526058] hover:underline"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* Clearly Labelled Demo Mode */}
        <div className="pt-4 border-t border-[#EEF3EF] space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#202824]">
            <ShieldCheck className="w-4 h-4 text-[#145C45]" />
            <span>Demo Mode (Without DGU Campus Inbox)</span>
          </div>
          <p className="text-[11px] text-[#526058] leading-relaxed">
            Exploring HostelLoop without a live campus email? Enter Demo Mode — clearly marked as
            unverified sample access.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoEnter('student')}
              className="py-2 px-3 bg-[#DDF4E7] hover:bg-[#CBEBD9] text-[#145C45] text-xs font-medium rounded-lg transition-colors"
            >
              Demo Student
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoEnter('admin')}
              className="py-2 px-3 bg-[#F8FAF8] hover:bg-[#EEF3EF] border border-[#D4E3DA] text-[#202824] text-xs font-medium rounded-lg transition-colors"
            >
              Demo Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
