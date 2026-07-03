"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Show error toast if redirected back from a failed OAuth callback
  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      toast.error("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (error.message.toLowerCase().includes("email not confirmed")) {
          toast.error("Please confirm your email before signing in. Check your inbox.");
        } else if (error.message.toLowerCase().includes("email")) {
          setErrors({ email: error.message });
        } else if (error.message.toLowerCase().includes("password") || error.message.toLowerCase().includes("credentials")) {
          setErrors({ password: "Invalid email or password" });
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Welcome back!");
      router.refresh();
      router.push("/dashboard");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left Panel — Branding ── */}
      <div
        className="relative flex flex-col justify-center lg:w-1/2 px-8 py-12 lg:px-16 lg:py-0 min-h-[280px] lg:min-h-screen"
        style={{
          backgroundColor: "#F8F8F6",
          backgroundImage:
            "radial-gradient(ellipse at 60% 40%, rgba(220,215,240,0.6) 0%, rgba(255,220,210,0.4) 40%, rgba(255,255,255,0.1) 80%)",
        }}
      >
        {/* Logo — top left */}
        <div className="absolute top-10 left-12 lg:top-10 lg:left-12">
          <span
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#0A0A0A",
            }}
          >
            APEX MARKETING
          </span>
        </div>

        {/* Center copy */}
        <div className="max-w-[460px] mx-auto lg:mx-0 lg:pl-12 text-center lg:text-left mt-8 lg:mt-0">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: "clamp(36px, 4.5vw, 56px)",
              fontWeight: 300,
              color: "#0A0A0A",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Welcome back.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 15,
              fontWeight: 400,
              color: "rgba(0,0,0,0.55)",
              lineHeight: 1.6,
              marginTop: 20,
            }}
          >
            Sign in to manage your brand&apos;s
            <br className="hidden lg:block" />
            marketing on autopilot.
          </motion.p>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 lg:py-0">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="w-full max-w-[380px]"
        >
          {/* Form title */}
          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 24,
              fontWeight: 500,
              color: "#0A0A0A",
              marginBottom: 32,
            }}
          >
            Sign in
          </motion.h2>

          <form
            onSubmit={handleLogin}
            className={shake ? "animate-[authShake_0.4s_ease-in-out]" : ""}
          >
            {/* Email */}
            <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
              <label
                htmlFor="login-email"
                style={{
                  display: "block",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.7)",
                  marginBottom: 4,
                }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                required
                autoComplete="email"
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  padding: "12px 0",
                  border: "none",
                  borderBottom: `1px solid ${errors.email ? "#EF4444" : "rgba(0,0,0,0.15)"}`,
                  background: "transparent",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 15,
                  color: "#0A0A0A",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { if (!errors.email) e.currentTarget.style.borderBottomColor = "#0A0A0A"; }}
                onBlur={(e) => { if (!errors.email) e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.15)"; }}
              />
              {errors.email && (
                <p style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{errors.email}</p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp} style={{ marginBottom: 0 }}>
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.7)",
                  marginBottom: 4,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "12px 36px 12px 0",
                    border: "none",
                    borderBottom: `1px solid ${errors.password ? "#EF4444" : "rgba(0,0,0,0.15)"}`,
                    background: "transparent",
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: 15,
                    color: "#0A0A0A",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { if (!errors.password) e.currentTarget.style.borderBottomColor = "#0A0A0A"; }}
                  onBlur={(e) => { if (!errors.password) e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.15)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: "rgba(0,0,0,0.35)",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{errors.password}</p>
              )}
            </motion.div>

            {/* Forgot password */}
            <motion.div variants={fadeUp} style={{ textAlign: "right", marginTop: 8 }}>
              <Link
                href="#"
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 12,
                  color: "rgba(0,0,0,0.45)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#0A0A0A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(0,0,0,0.45)"; }}
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Sign In button */}
            <motion.div variants={fadeUp}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 14,
                  marginTop: 32,
                  background: loading ? "rgba(10,10,10,0.7)" : "#0A0A0A",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = loading ? "rgba(10,10,10,0.7)" : "#0A0A0A"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
            <span
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 12,
                color: "rgba(0,0,0,0.4)",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
          </motion.div>

          {/* Google button */}
          <motion.div variants={fadeUp}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: "100%",
                padding: 12,
                background: "white",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 14,
                fontWeight: 400,
                color: "#0A0A0A",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0A0A0A"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.background = "white"; }}
            >
              {/* Google icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </motion.div>

          {/* Bottom link */}
          <motion.p
            variants={fadeUp}
            style={{
              textAlign: "center",
              marginTop: 24,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 13,
              color: "rgba(0,0,0,0.5)",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              style={{
                color: "#0A0A0A",
                textDecoration: "none",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
            >
              Sign up
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
