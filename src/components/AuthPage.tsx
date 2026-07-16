import React, { useState, useEffect, useRef } from "react";
import { Stethoscope, Lock, Mail, User, ArrowRight, ShieldAlert, Sparkles, Check } from "lucide-react";

interface AuthPageProps {
  onLoginSuccess: (user: { name: string; email: string; picture?: string }) => void;
  theme: "light" | "slate" | "dark";
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, theme }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMockGooglePicker, setShowMockGooglePicker] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign-In
  useEffect(() => {
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "10086-dummy.apps.googleusercontent.com";
    
    const initGoogleSignIn = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              setIsLoading(true);
              setError(null);
              try {
                // Decode JWT payload
                const base64Url = response.credential.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
                );
                const payload = JSON.parse(jsonPayload);
                
                if (payload && payload.email) {
                  setSuccess("Successfully authenticated with Google!");
                  setTimeout(() => {
                    onLoginSuccess({
                      name: payload.name || payload.given_name || "Google User",
                      email: payload.email,
                      picture: payload.picture,
                    });
                    setIsLoading(false);
                  }, 1200);
                } else {
                  throw new Error("Invalid credential payload received from Google");
                }
              } catch (err: any) {
                console.error("Google credential decoding failed:", err);
                setError("Google Sign-In failed to parse user information. Please try again.");
                setIsLoading(false);
              }
            },
          });

          if (googleBtnRef.current) {
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: theme === "dark" || theme === "slate" ? "filled_blue" : "outline",
              size: "large",
              width: 320,
              shape: "pill",
            });
          }
        } catch (e) {
          console.warn("Failed to initialize Google Identity button:", e);
        }
      }
    };

    // Retry checking google object if it loads asynchronously
    const timer = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogleSignIn();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [theme, isSignUp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isSignUp) {
      if (!name.trim()) return setError("Full Name is required");
      if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email address");
      if (password.length < 6) return setError("Password must be at least 6 characters");
      if (password !== confirmPassword) return setError("Passwords do not match");

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccess("Account successfully created! Please sign in.");
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
      }, 1500);
    } else {
      if (!email.trim()) return setError("Email is required");
      if (!password) return setError("Password is required");

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess({
          name: name || email.split("@")[0],
          email,
        });
      }, 1200);
    }
  };

  const handleSimulatedGoogleLogin = (mockName: string, mockEmail: string, mockPic: string) => {
    setIsLoading(true);
    setShowMockGooglePicker(false);
    setTimeout(() => {
      onLoginSuccess({
        name: mockName,
        email: mockEmail,
        picture: mockPic,
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-12 font-sans relative overflow-hidden selection:bg-teal-500/20" id="auth-page">
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Glassmorphic Panel */}
      <div className="bg-white dark:bg-slate-900/90 w-full max-w-md rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl relative overflow-hidden p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 animate-bounce">
            <Stethoscope className="w-6.5 h-6.5" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
              {isSignUp ? "Create New Account" : "Welcome to BOO"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[280px]">
              {isSignUp 
                ? "Join our educational health ecosystem for secure, smart symptom guidance." 
                : "Sign in to access your secure clinical case files and symptom analysis."}
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-[11px] text-red-600 dark:text-red-400 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-[11px] text-emerald-650 dark:text-emerald-400 font-medium">
            <Check className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:border-teal-500 dark:focus:border-teal-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:border-teal-500 dark:focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:border-teal-500 dark:focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:border-teal-500 dark:focus:border-teal-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Form Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 text-white font-bold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 hover:translate-x-0.5 cursor-pointer mt-6"
          >
            {isLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            or continue with
          </span>
        </div>

        {/* Google Authentication Section */}
        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Official Google Button Container */}
          <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />

          {/* Backup/Simulated Google Button if Client ID setup is in sandbox */}
          <button
            onClick={() => setShowMockGooglePicker(true)}
            type="button"
            className="w-full max-w-[320px] bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs py-2.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.647 5.647 0 0 1 8.3 12.95a5.647 5.647 0 0 1 5.69-5.65c1.472 0 2.825.534 3.87 1.414l3.1-3.1C18.99 3.754 16.666 2.5 13.99 2.5a9.952 9.952 0 0 0-9.95 9.95 9.952 9.952 0 0 0 9.95 9.95c6.262 0 10.156-4.4 10.156-10.3 0-.693-.058-1.228-.15-1.815H12.24Z"
              />
            </svg>
            <span>One-Click Google Login</span>
          </button>
        </div>

        {/* Form Toggle Switch */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              type="button"
              className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
            >
              {isSignUp ? "Sign In Here" : "Create New Account"}
            </button>
          </p>
        </div>
      </div>

      {/* Premium Mock Google Account Picker Modal */}
      {showMockGooglePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setShowMockGooglePicker(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.14 0-5.8-2.11-6.75-4.96H1.31v3.15C3.29 22.35 7.37 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.25 14.24a7.147 7.147 0 0 1 0-4.48V6.61H1.31a11.94 11.94 0 0 0 0 10.78l3.94-3.15Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.37 0 3.29 1.65 1.31 4.81l3.94 3.15c.95-2.85 3.61-4.96 6.75-4.96Z"
                />
              </svg>
              <h2 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                Choose an account
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                to continue to BOO Healthcare
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSimulatedGoogleLogin("Sarah Jenkins", "sarah.jenkins@gmail.com", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-all cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                  alt="Sarah"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Sarah Jenkins</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">sarah.jenkins@gmail.com</p>
                </div>
              </button>

              <button
                onClick={() => handleSimulatedGoogleLogin("Dr. Marcus Vance", "marcus.vance@stanford.edu", "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-all cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop"
                  alt="Marcus"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Dr. Marcus Vance</h4>
                  <p className="text-[10px] text-slate-550 dark:text-slate-400">marcus.vance@stanford.edu</p>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800/80 text-[10px] text-slate-400 text-center">
              Safe & secure standard OAuth 2.0 simulation
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
