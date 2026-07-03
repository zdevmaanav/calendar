"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Search } from "lucide-react";
import Link from "next/link";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/* Shared underline input style */
const inputBase: React.CSSProperties = {
  width: "100%", padding: "12px 0", border: "none",
  borderBottom: "1px solid rgba(0,0,0,0.15)", background: "transparent",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: 15, color: "#0A0A0A", outline: "none", transition: "border-color 0.2s",
};
const labelBase: React.CSSProperties = {
  display: "block", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.7)", marginBottom: 4,
};
const helvetica = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (password.length < 8) newErrors.password = "Minimum 8 characters";
    if (Object.keys(newErrors).length) { setErrors(newErrors); setShake(true); setTimeout(() => setShake(false), 500); return; }
    setErrors({});
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      });
      if (error) { toast.error(error.message); return; }

      // If email confirmation is required, the session will be null
      if (!data.session) {
        toast.success("Check your email to confirm your account, then sign in.");
        router.push("/auth/login");
        return;
      }

      // Create organization using the user from the signUp response
      const user = data.user;
      if (user) {
        const { data: org } = await supabase.from("organizations")
          .insert({ user_id: user.id, name: companyName, website_url: "" })
          .select().single();

        if (org) {
          setAnalyzing(true);
          try { await fetch("/api/analyze-brand", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId: org.id }) }); } catch { /* may timeout */ }
        }
      }

      toast.success("Account created!");
      router.refresh();
      router.push("/dashboard");
    } catch { toast.error("An unexpected error occurred"); }
    finally { setLoading(false); setAnalyzing(false); }
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  };

  /* Analyzing screen */
  if (analyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#0A0A0A] flex items-center justify-center">
            <Search className="w-10 h-10 text-white" />
          </motion.div>
          <h2 style={{ fontFamily: helvetica, fontSize: 24, fontWeight: 500, color: "#0A0A0A", marginBottom: 8 }}>Analyzing your brand...</h2>
          <p style={{ fontFamily: helvetica, fontSize: 15, color: "rgba(0,0,0,0.55)", maxWidth: 400 }}>
            We&apos;re building an AI-powered brand profile. This takes about 30 seconds.
          </p>
          <div className="mt-8 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                className="w-2.5 h-2.5 rounded-full bg-[#0A0A0A]" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="relative flex flex-col justify-center lg:w-1/2 px-8 py-12 lg:px-16 lg:py-0 min-h-[280px] lg:min-h-screen"
        style={{ backgroundColor: "#F8F8F6", backgroundImage: "radial-gradient(ellipse at 60% 40%, rgba(220,215,240,0.6) 0%, rgba(255,220,210,0.4) 40%, rgba(255,255,255,0.1) 80%)" }}>
        <div className="absolute top-10 left-12">
          <span style={{ fontFamily: helvetica, fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", color: "#1a1208" }}>APEX MARKETING</span>
        </div>
        <div className="max-w-[460px] mx-auto lg:mx-0 lg:pl-12 text-center lg:text-left mt-8 lg:mt-0">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            style={{ fontFamily: helvetica, fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 300, color: "#0A0A0A", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Let&apos;s get started.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            style={{ fontFamily: helvetica, fontSize: 15, fontWeight: 400, color: "rgba(0,0,0,0.55)", lineHeight: 1.6, marginTop: 20 }}>
            Create your Apex Marketing account and put<br className="hidden lg:block" />
            your brand&apos;s marketing on autopilot in minutes.
          </motion.p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 lg:py-0">
        <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-[380px]">
          <motion.h2 variants={fadeUp} style={{ fontFamily: helvetica, fontSize: 24, fontWeight: 500, color: "#0A0A0A", marginBottom: 32 }}>
            Create account
          </motion.h2>

          <form onSubmit={handleRegister} className={shake ? "animate-[authShake_0.4s_ease-in-out]" : ""}>
            {/* Full Name */}
            <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
              <label htmlFor="reg-name" style={labelBase}>Full Name</label>
              <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Name" style={inputBase}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#0A0A0A"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.15)"; }} />
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
              <label htmlFor="reg-email" style={labelBase}>Email</label>
              <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@company.com" style={inputBase} autoComplete="email"
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#0A0A0A"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.15)"; }} />
            </motion.div>

            {/* Company Name */}
            <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
              <label htmlFor="reg-company" style={labelBase}>Company Name</label>
              <input id="reg-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                placeholder="Acme Corp" style={inputBase}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#0A0A0A"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.15)"; }} />
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp} style={{ marginBottom: 0 }}>
              <label htmlFor="reg-password" style={labelBase}>Password</label>
              <div style={{ position: "relative" }}>
                <input id="reg-password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                  required placeholder="••••••••"
                  style={{ ...inputBase, paddingRight: 36, borderBottomColor: errors.password ? "#EF4444" : "rgba(0,0,0,0.15)" }}
                  onFocus={(e) => { if (!errors.password) e.currentTarget.style.borderBottomColor = "#0A0A0A"; }}
                  onBlur={(e) => { if (!errors.password) e.currentTarget.style.borderBottomColor = "rgba(0,0,0,0.15)"; }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(0,0,0,0.35)" }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password
                ? <p style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{errors.password}</p>
                : <p style={{ fontFamily: helvetica, fontSize: 11, color: "rgba(0,0,0,0.35)", marginTop: 6 }}>Minimum 8 characters</p>}
            </motion.div>

            {/* Create Account button */}
            <motion.div variants={fadeUp}>
              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: 14, marginTop: 32, background: loading ? "rgba(10,10,10,0.7)" : "#0A0A0A",
                  color: "white", border: "none", borderRadius: 8, fontFamily: helvetica, fontSize: 14, fontWeight: 500,
                  letterSpacing: "0.02em", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = loading ? "rgba(10,10,10,0.7)" : "#0A0A0A"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                {loading ? (<><Loader2 size={16} className="animate-spin" />Creating account...</>) : "Create Account"}
              </button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
            <span style={{ fontFamily: helvetica, fontSize: 12, color: "rgba(0,0,0,0.4)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
          </motion.div>

          {/* Google */}
          <motion.div variants={fadeUp}>
            <button type="button" onClick={handleGoogleSignup}
              style={{ width: "100%", padding: 12, background: "white", border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8, fontFamily: helvetica, fontSize: 14, fontWeight: 400, color: "#0A0A0A",
                cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0A0A0A"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.background = "white"; }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>

          {/* Terms */}
          <motion.p variants={fadeUp} style={{ textAlign: "center", marginTop: 16, fontFamily: helvetica, fontSize: 11, color: "rgba(0,0,0,0.35)", lineHeight: 1.5 }}>
            By creating an account you agree to our{" "}
            <Link href="#" style={{ textDecoration: "underline" }}>Terms of Service</Link> and{" "}
            <Link href="#" style={{ textDecoration: "underline" }}>Privacy Policy</Link>.
          </motion.p>

          {/* Bottom link */}
          <motion.p variants={fadeUp} style={{ textAlign: "center", marginTop: 20, fontFamily: helvetica, fontSize: 13, color: "rgba(0,0,0,0.5)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#0A0A0A", textDecoration: "none", fontWeight: 500 }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}>
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
