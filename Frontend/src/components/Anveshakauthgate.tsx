import React, { useState, useEffect } from 'react';
import { ArrowLeft, Key, CheckCircle2 } from 'lucide-react';

type AccessLevel = 'Admin' | 'Senior' | 'Field';
type Mode = 'login' | 'signup' | 'otp' | 'success';

interface AnveshakAuthGateProps {
  children: React.ReactNode;
}

const LEVELS: AccessLevel[] = ['Admin', 'Senior', 'Field'];

export const AnveshakAuthGate: React.FC<AnveshakAuthGateProps> = ({ children }) => {
  const [authed, setAuthed] = useState<boolean>(() => sessionStorage.getItem('anveshak_authed') === '1');
  const [mode, setMode] = useState<Mode>('login');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('Senior');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [badgeId, setBadgeId] = useState('');
  
  // New state for 6-digit OTP and timer
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timeLeft, setTimeLeft] = useState(102); // 1 minute 42 seconds
  const [authenticating, setAuthenticating] = useState(false);

  // Timer logic for OTP screen
  useEffect(() => {
    if (mode === 'otp' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, timeLeft]);

  // Success sequence logic
  useEffect(() => {
    if (mode === 'success') {
      const timer = setTimeout(() => {
        sessionStorage.setItem('anveshak_authed', '1');
        sessionStorage.setItem('anveshak_access_level', accessLevel);
        setAuthed(true);
      }, 2500); // Show success screen for 2.5s before loading app
      return () => clearTimeout(timer);
    }
  }, [mode, accessLevel]);

  if (authed) return <>{children}</>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setMode('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const completeAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setTimeout(() => {
      setAuthenticating(false);
      setMode('success');
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#182029] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2933] border border-white/10 rounded-2xl shadow-2xl p-7 relative overflow-hidden">
        
        {/* Brand header (hidden on success screen) */}
        {mode !== 'success' && (
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="w-3 h-3 bg-[#a94e2c] rotate-45 shadow-xs" />
              </div>
              <div>
                <div className="font-serif font-bold text-base text-white tracking-wide leading-none flex items-center gap-2">
                  ANVESHAK <span className="text-[9px] bg-white/10 text-[#a94e2c] px-1.5 py-0.5 rounded font-mono">V3.8</span>
                </div>
                <div className="text-[9.5px] text-[#7b8695] tracking-wider uppercase mt-1">Criminal Network Intelligence</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-bold text-[#a94e2c] border border-[#a94e2c]/30 bg-[#a94e2c]/10 px-1.5 py-0.5 rounded mb-0.5 tracking-widest uppercase inline-block">
                LEO RESTRICTED
              </div>
              <div className="text-[8px] text-[#5f6773] tracking-widest uppercase">SEC 65B CERTIFIED</div>
            </div>
          </div>
        )}

        {mode === 'signup' ? (
          <form onSubmit={startOtp} className="space-y-4">
            {/* Same signup form as original, left intact */}
            <Field label="Username">
              <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Full name or username" className="auth-input" />
            </Field>
            <Field label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@agency.gov" className="auth-input" />
            </Field>
            <Field label="Badge ID">
              <input required value={badgeId} onChange={(e) => setBadgeId(e.target.value)} placeholder="INV-XXXX" className="auth-input" />
            </Field>
            <Field label="Password">
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="auth-input" />
            </Field>
            <Field label="Access level">
              <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as AccessLevel)} className="auth-input cursor-pointer">
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>

            <button type="submit" className="auth-btn mt-2">CREATE ACCOUNT</button>
            <p className="text-center text-xs text-[#8891a0]">
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-[#a94e2c] font-semibold hover:underline cursor-pointer">
                Log in
              </button>
            </p>
          </form>
        ) : mode === 'login' ? (
          <form onSubmit={startOtp} className="space-y-5">
            <div className="mb-2">
              <h2 className="text-sm font-bold text-white tracking-wide">Official Access Portal</h2>
              <p className="text-[11px] text-[#8891a0] mt-0.5">Authenticate through multi-tenant nodal gateway</p>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#8891a0] font-bold mb-2">Access level selection</div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-lg">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setAccessLevel(l)}
                    className={`py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      accessLevel === l
                        ? 'bg-[#a94e2c]/20 text-white border border-[#a94e2c]/50 shadow-[0_0_10px_rgba(169,78,44,0.15)]'
                        : 'text-[#9aa2ac] hover:text-white border border-transparent'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Badge ID / Officer Handle">
              <input
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="INV-4819"
                className="auth-input font-mono"
              />
            </Field>
            <Field label="Secured Passkey">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input tracking-widest"
              />
            </Field>

            <button type="submit" className="auth-btn mt-4">CONTINUE TO OTP VERIFICATION &rarr;</button>
            <p className="text-center text-xs text-[#8891a0] pt-2">
              Don't have an account?{' '}
              <button type="button" onClick={() => setMode('signup')} className="text-[#a94e2c] font-semibold hover:underline cursor-pointer">
                Create one
              </button>
            </p>
          </form>
        ) : mode === 'otp' ? (
          <form onSubmit={completeAuth} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex items-center gap-1.5 text-xs text-[#8891a0] hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="px-2 py-1 rounded text-[9px] font-bold tracking-wider uppercase border border-[#a94e2c]/30 text-[#a94e2c]">
                {accessLevel} TIER
              </div>
            </div>

            <div className="text-center space-y-1.5">
              <div className="mx-auto w-12 h-12 rounded-full border border-[#a94e2c]/30 bg-[#a94e2c]/10 flex items-center justify-center mb-4">
                <Key className="w-5 h-5 text-[#a94e2c]" />
              </div>
              <h2 className="text-[15px] font-bold text-white tracking-wide">OTP Verification</h2>
              <p className="text-[11px] text-[#8891a0]">6-digit time-based token sent to registered device</p>
              <p className="text-[11px] text-[#a94e2c] font-mono tracking-wide pt-1">
                {(email || 'r***@cid.wb.gov.in')}
              </p>
            </div>

            {/* 6 OTP Boxes */}
            <div className="flex justify-between gap-2 py-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-mono font-bold bg-[#182029] border border-white/10 rounded-lg text-white focus:border-[#a94e2c] focus:ring-1 focus:ring-[#a94e2c]/50 focus:outline-none transition-all shadow-inner"
                />
              ))}
            </div>

            <button type="submit" disabled={authenticating || otp.join('').length < 6} className="auth-btn disabled:opacity-60 disabled:cursor-not-allowed">
              {authenticating ? 'VERIFYING...' : 'VERIFY & GRANT ACCESS'}
            </button>

            <div className="flex items-center justify-between text-[11px] text-[#8891a0] pt-3">
              <span className="font-mono">Valid for: {formatTime(timeLeft)}</span>
              <button type="button" onClick={() => setTimeLeft(102)} className="text-[#a94e2c] hover:underline cursor-pointer transition-colors">
                Resend token
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen Mode */
          <div className="py-14 space-y-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-2 border-[#a94e2c]/30 bg-[#a94e2c]/5">
                <div className="absolute inset-0 rounded-full border-2 border-[#a94e2c] animate-[ping_2s_ease-in-out_infinite] opacity-20" />
                <CheckCircle2 className="w-12 h-12 text-[#a94e2c]" strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-[22px] font-bold text-white tracking-[0.2em] uppercase">
                Access Granted
              </h2>
              <p className="text-[10px] text-[#a94e2c] font-mono tracking-widest uppercase leading-relaxed max-w-[280px] mx-auto opacity-90">
                Security clearance verified <br/> &bull; <br/> Initializing intelligence feed...
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        {mode !== 'success' && (
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[9px] text-[#5f6773] uppercase tracking-widest font-mono">
            <span className="text-[#a94e2c] font-bold">&gt;_</span>
            ENCRYPTED · CLASSIFIED · OFFICIAL USE ONLY
          </div>
        )}
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: #f1ede4;
          font-size: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          outline: none;
          transition: all 0.2s;
        }
        .auth-input::placeholder { color: #5f6773; }
        .auth-input:focus { border-color: #a94e2c; background: rgba(255,255,255,0.05); }
        .auth-btn {
          width: 100%;
          background: #a94e2c;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.85rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px 0 rgba(169, 78, 44, 0.25);
        }
        .auth-btn:hover:not(:disabled) { 
          background: #8f4124; 
          box-shadow: 0 4px 14px 0 rgba(169, 78, 44, 0.4);
        }
      `}</style>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-[9.5px] uppercase tracking-wider text-[#8891a0] font-bold mb-2">{label}</div>
    {children}
  </div>
);