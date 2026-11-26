import { useState, FormEvent } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Leaf,
  Loader2,
  X,
} from 'lucide-react';
import { AppRoute, UserProfile } from '../types/marketplace';
import { HERO_CAMPUS_IMAGE } from '../data/seedData';
import { api, setAuthToken } from '../utils/api';
import {
  isFirebaseConfigured,
  signInWithGoogleFirebase,
  signInWithGoogleOAuthPopup,
} from '../utils/googleAuth';
import { CAMPUS_AFFILIATION_OPTIONS, validateAnyEmail } from '../utils/marketplaceLogic';

interface SignInPageProps {
  firebaseConfigured: boolean;
  googleOAuthConfigured: boolean;
  redirectNotice?: string | null;
  onBack: () => void;
  onAuthenticated: (user: UserProfile, isNewUser?: boolean) => Promise<void>;
  onNavigate: (route: AppRoute) => void;
}

function GoogleLogoSvg() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export function SignInPage({
  firebaseConfigured,
  googleOAuthConfigured,
  redirectNotice,
  onBack,
  onAuthenticated,
}: SignInPageProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configNoticeOpen, setConfigNoticeOpen] = useState(false);

  // Secondary Email / Password & Demo options
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [emailTab, setEmailTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [campusAffiliation, setCampusAffiliation] = useState(CAMPUS_AFFILIATION_OPTIONS[0]);
  const [hostelBlock, setHostelBlock] = useState('Boys Hostel Block A');
  const [programAndYear, setProgramAndYear] = useState('MBA · 1st Year');

  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [simulatedResetHint, setSimulatedResetHint] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [secondaryLoading, setSecondaryLoading] = useState(false);

  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const clientFirebaseReady = isFirebaseConfigured() || firebaseConfigured;
  const anyGoogleProviderReady = clientFirebaseReady || googleOAuthConfigured;

  const handleContinueWithGoogle = async () => {
    setError(null);
    setInfoMsg(null);
    setConfigNoticeOpen(false);

    if (!anyGoogleProviderReady) {
      setConfigNoticeOpen(true);
      setError(
        'Google Sign-In is not configured in this environment yet. Add your Firebase Web credentials (VITE_FIREBASE_*) or Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) to enable real Google account sign-in.'
      );
      return;
    }

    setGoogleLoading(true);
    try {
      const result = clientFirebaseReady
        ? await signInWithGoogleFirebase()
        : await signInWithGoogleOAuthPopup();
      await onAuthenticated(result.user, result.isNewUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSecondaryLoading(true);
    try {
      const { token, user } = await api.login({ email, password });
      setAuthToken(token);
      await onAuthenticated(user, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSecondaryLoading(false);
    }
  };

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = validateAnyEmail(email);
    if (!check.valid) {
      setError(check.error || 'Enter a valid email address.');
      return;
    }
    setSecondaryLoading(true);
    try {
      const res = await api.signup({
        name,
        email,
        password,
        campusAffiliation,
        hostelBlock,
        programAndYear,
      });
      setAuthToken(res.token);
      await onAuthenticated(res.user, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setSecondaryLoading(false);
    }
  };

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSecondaryLoading(true);
    try {
      if (resetStep === 'request') {
        const res = await api.forgotPassword(email);
        setSimulatedResetHint(res.demoResetCode);
        setInfoMsg(res.message);
        setResetStep('confirm');
      } else {
        const res = await api.resetPassword({
          email,
          code: resetCode,
          newPassword,
        });
        setInfoMsg(res.message);
        setEmailTab('login');
        setResetStep('request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setSecondaryLoading(false);
    }
  };

  const handleDemoEnter = async (accountType: 'student' | 'admin') => {
    setError(null);
    setSecondaryLoading(true);
    try {
      const { token, user } = await api.enterDemoSession(accountType);
      setAuthToken(token);
      await onAuthenticated(user, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login unavailable.');
    } finally {
      setSecondaryLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#F8FAF8] via-[#EEF7F2] to-[#E3F3EA] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#526058] hover:text-[#145C45] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        {redirectNotice && (
          <div className="mb-6 p-3.5 bg-white border border-[#C3E5D2] rounded-xl text-sm text-[#145C45] flex items-center gap-2.5 shadow-2xs">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{redirectNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: Brand Story, Campus Visual, 3 Benefits */}
          <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#145C45] text-white flex items-center justify-center font-bold text-base shadow-xs">
                HL
              </div>
              <div>
                <span className="text-lg font-bold text-[#145C45] tracking-tight block leading-none">
                  HostelLoop
                </span>
                <span className="text-[11px] text-[#526058]">
                  DBS Global University · Selaqui, Dehradun
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#202824] tracking-tight leading-tight">
                Your Campus. Your Marketplace. Your Loop.
              </h1>
              <p className="text-sm sm:text-base text-[#526058] leading-relaxed max-w-xl">
                Connect directly with fellow hostel residents and graduating seniors to buy, sell,
                exchange, rent, or donate everyday study and room essentials right inside campus.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#D4E3DA] bg-white shadow-sm">
              <img
                src={HERO_CAMPUS_IMAGE}
                alt="Student hostel room study setup on campus"
                className="w-full h-52 sm:h-60 object-cover"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white/90 border border-[#E2EAE5] rounded-xl p-4 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-[#DDF4E7] text-[#145C45] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-[#202824]">1. Affordable Finds.</p>
                <p className="text-xs text-[#526058] leading-relaxed">
                  Save up to 60% on lamps, tables, kettles, and calculators.
                </p>
              </div>

              <div className="bg-white/90 border border-[#E2EAE5] rounded-xl p-4 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-[#DDF4E7] text-[#145C45] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-[#202824]">2. Student Community.</p>
                <p className="text-xs text-[#526058] leading-relaxed">
                  Meet safely at familiar campus spots instead of strangers.
                </p>
              </div>

              <div className="bg-white/90 border border-[#E2EAE5] rounded-xl p-4 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-[#DDF4E7] text-[#145C45] flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-[#202824]">3. Sustainable Reuse.</p>
                <p className="text-xs text-[#526058] leading-relaxed">
                  Give usable semester gear a second life instead of waste.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Clean White Auth Card */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="bg-white border border-[#E2EAE5] rounded-2xl shadow-md p-6 sm:p-9 max-w-lg mx-auto space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#145C45] bg-[#DDF4E7]/70 px-2.5 py-1 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>HostelLoop Account</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#202824] tracking-tight">
                  Welcome to HostelLoop
                </h2>
                <p className="text-base font-medium text-[#145C45]">
                  Your campus marketplace starts here.
                </p>
                <p className="text-sm text-[#526058] leading-relaxed">
                  Discover affordable essentials, connect with fellow students and give your unused
                  items a second life.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {infoMsg && (
                <div className="p-3.5 bg-[#DDF4E7]/70 border border-[#C3E5D2] rounded-xl text-xs text-[#202824] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#145C45] shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* Primary Prominent Continue with Google Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleContinueWithGoogle}
                  disabled={googleLoading || secondaryLoading}
                  className="w-full py-3.5 px-5 bg-white hover:bg-[#F8FAF8] active:scale-[0.99] text-[#202824] border border-[#D4E3DA] hover:border-[#145C45]/50 rounded-xl shadow-xs hover:shadow-md transition-all duration-150 flex items-center justify-center gap-3 text-base font-semibold disabled:opacity-65 cursor-pointer"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#145C45]" />
                      <span>Signing in with Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleLogoSvg />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-[#526058] text-center">
                  Sign in with any valid Google account (e.g., <span className="font-medium">@gmail.com</span> or{' '}
                  <span className="font-medium">@dgu.ac.in</span>).
                </p>
              </div>

              {/* Honest configuration guidance when Google credentials are not yet configured */}
              {(configNoticeOpen || !anyGoogleProviderReady) && (
                <div className="p-4 bg-[#F8FAF8] border border-[#D4E3DA] rounded-xl space-y-2 text-xs text-[#526058]">
                  <p className="font-semibold text-[#202824]">
                    Google Sign-In Credentials Required in Environment
                  </p>
                  <p className="leading-relaxed">
                    HostelLoop uses real Google authentication (never simulated Google accounts). To
                    enable the Google popup on this deployment, set{' '}
                    <code className="text-[#145C45] font-mono-tabular">
                      VITE_FIREBASE_API_KEY
                    </code>
                    ,{' '}
                    <code className="text-[#145C45] font-mono-tabular">
                      VITE_FIREBASE_AUTH_DOMAIN
                    </code>
                    ,{' '}
                    <code className="text-[#145C45] font-mono-tabular">
                      VITE_FIREBASE_PROJECT_ID
                    </code>
                    , and{' '}
                    <code className="text-[#145C45] font-mono-tabular">
                      VITE_FIREBASE_APP_ID
                    </code>{' '}
                    (or{' '}
                    <code className="text-[#145C45] font-mono-tabular">GOOGLE_CLIENT_ID</code> &amp;{' '}
                    <code className="text-[#145C45] font-mono-tabular">GOOGLE_CLIENT_SECRET</code>).
                  </p>
                </div>
              )}

              {/* Security reassurance & Terms/Privacy links */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2.5 text-xs text-[#526058] bg-[#F8FAF8] border border-[#EEF3EF] rounded-xl p-3">
                  <Lock className="w-4 h-4 text-[#145C45] shrink-0 mt-0.5" />
                  <span>
                    Secured by Google OAuth. HostelLoop never accesses or stores your Google
                    password—only your name, email, and profile picture.
                  </span>
                </div>

                <p className="text-xs text-[#526058] text-center">
                  By continuing, you agree to HostelLoop’s{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="text-[#145C45] font-medium hover:underline"
                  >
                    Terms of Campus Use
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="text-[#145C45] font-medium hover:underline"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
              </div>

              {/* Secondary Email / Password & Demo Mode Drawer */}
              <div className="pt-4 border-t border-[#EEF3EF] space-y-3">
                <button
                  type="button"
                  onClick={() => setShowOtherMethods((prev) => !prev)}
                  className="w-full text-xs font-medium text-[#526058] hover:text-[#145C45] flex items-center justify-center gap-1 py-1"
                >
                  <span>
                    {showOtherMethods
                      ? 'Hide email sign-in & Demo Mode options'
                      : 'Or continue with Email / Password or Demo Mode'}
                  </span>
                </button>

                {showOtherMethods && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-1 p-1 bg-[#F8FAF8] border border-[#E2EAE5] rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setEmailTab('login');
                          setError(null);
                        }}
                        className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                          emailTab === 'login'
                            ? 'bg-white text-[#145C45] shadow-xs'
                            : 'text-[#526058]'
                        }`}
                      >
                        Email Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailTab('signup');
                          setError(null);
                        }}
                        className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                          emailTab === 'signup'
                            ? 'bg-white text-[#145C45] shadow-xs'
                            : 'text-[#526058]'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    {emailTab === 'login' && (
                      <form onSubmit={handleEmailLogin} className="space-y-3">
                        <div>
                          <label
                            htmlFor="signin-email"
                            className="block text-xs font-medium text-[#526058] mb-1"
                          >
                            Email Address
                          </label>
                          <input
                            id="signin-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@gmail.com or student@dgu.ac.in"
                            className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label
                              htmlFor="signin-password"
                              className="block text-xs font-medium text-[#526058]"
                            >
                              Password
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setEmailTab('forgot');
                                setError(null);
                              }}
                              className="text-xs text-[#145C45] hover:underline"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              id="signin-password"
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
                          disabled={secondaryLoading}
                          className="w-full py-2.5 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg"
                        >
                          {secondaryLoading ? 'Signing in...' : 'Sign In with Email'}
                        </button>
                      </form>
                    )}

                    {emailTab === 'signup' && (
                      <form onSubmit={handleEmailSignup} className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-[#526058] mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Ritish Sharma"
                            className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#526058] mb-1">
                            Email Address (Any valid email)
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@gmail.com"
                            className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#526058] mb-1">
                            Campus Affiliation
                          </label>
                          <select
                            value={campusAffiliation}
                            onChange={(e) => setCampusAffiliation(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-xs"
                          >
                            {CAMPUS_AFFILIATION_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-medium text-[#526058] mb-1">
                              Hostel Block
                            </label>
                            <select
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
                            <label className="block text-xs font-medium text-[#526058] mb-1">
                              Program & Year
                            </label>
                            <input
                              type="text"
                              value={programAndYear}
                              onChange={(e) => setProgramAndYear(e.target.value)}
                              className="w-full px-3 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#526058] mb-1">
                            Password (min. 6 characters)
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={secondaryLoading}
                          className="w-full py-2.5 bg-[#145C45] hover:bg-[#0F4634] text-white text-sm font-medium rounded-lg"
                        >
                          {secondaryLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                      </form>
                    )}

                    {emailTab === 'forgot' && (
                      <form onSubmit={handleForgotSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-[#526058] mb-1">
                            Registered Email
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                            required
                          />
                        </div>
                        {resetStep === 'confirm' && (
                          <>
                            {simulatedResetHint && (
                              <p className="text-xs bg-[#F8FAF8] p-2.5 rounded-lg border border-[#D4E3DA]">
                                Simulated reset code:{' '}
                                <strong className="font-mono-tabular text-[#145C45]">
                                  {simulatedResetHint}
                                </strong>
                              </p>
                            )}
                            <input
                              type="text"
                              value={resetCode}
                              onChange={(e) => setResetCode(e.target.value)}
                              placeholder="Reset code"
                              className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm font-mono-tabular"
                              required
                            />
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="New password"
                              className="w-full px-3.5 py-2 bg-[#F8FAF8] border border-[#D4E3DA] rounded-lg text-sm"
                              required
                            />
                          </>
                        )}
                        <button
                          type="submit"
                          disabled={secondaryLoading}
                          className="w-full py-2.5 bg-[#145C45] text-white text-sm font-medium rounded-lg"
                        >
                          {resetStep === 'request' ? 'Generate Reset Code' : 'Update Password'}
                        </button>
                      </form>
                    )}

                    <div className="pt-3 border-t border-[#EEF3EF] space-y-2">
                      <p className="text-[11px] font-medium text-[#526058]">
                        Preview without signing in (Clearly labelled unverified Demo Mode):
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={secondaryLoading}
                          onClick={() => handleDemoEnter('student')}
                          className="py-2 px-3 bg-[#DDF4E7] hover:bg-[#CBEBD9] text-[#145C45] text-xs font-medium rounded-lg transition-colors"
                        >
                          Demo Student
                        </button>
                        <button
                          type="button"
                          disabled={secondaryLoading}
                          onClick={() => handleDemoEnter('admin')}
                          className="py-2 px-3 bg-[#F8FAF8] hover:bg-[#EEF3EF] border border-[#D4E3DA] text-[#202824] text-xs font-medium rounded-lg transition-colors"
                        >
                          Demo Admin
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Privacy Modal */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#E2EAE5] rounded-2xl max-w-md w-full p-6 space-y-4 relative">
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              aria-label="Close legal dialog"
              className="absolute top-4 right-4 p-1.5 text-[#526058] hover:text-[#202824] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-[#202824]">
              {legalModal === 'terms' ? 'HostelLoop Terms of Campus Use' : 'HostelLoop Privacy Policy'}
            </h3>
            {legalModal === 'terms' ? (
              <div className="text-xs text-[#526058] space-y-2 leading-relaxed">
                <p>
                  HostelLoop connects students for lawful peer-to-peer buying, selling, renting,
                  exchanging, and donating of campus and hostel essentials.
                </p>
                <p>
                  Always inspect items in person at public campus locations (such as the Central
                  Library Entrance or Main Academic Block Courtyard) before completing payment.
                  Prohibited or unsafe items may be removed by campus moderators.
                </p>
              </div>
            ) : (
              <div className="text-xs text-[#526058] space-y-2 leading-relaxed">
                <p>
                  When you sign in with Google, HostelLoop receives only your Google User ID,
                  display name, email address, and profile photograph. We never receive or store
                  your Google password.
                </p>
                <p>
                  Your hostel block and optional contact details are used solely to coordinate
                  campus pickups with buyers or sellers you choose to interact with.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="w-full py-2.5 bg-[#145C45] text-white text-sm font-medium rounded-lg"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
