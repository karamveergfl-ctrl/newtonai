import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Monitor } from "lucide-react";
import Logo from "@/components/Logo";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

export default function SmartBoardAdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const noAccess = (location.state as { noAccess?: boolean } | null)?.noAccess;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    noAccess ? "This account is not registered as a SmartBoard school administrator." : null,
  );

  useEffect(() => {
    const check = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      const { data } = await supabase
        .from("sb_institution_admins")
        .select("institution_id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (data) navigate("/smartboard-admin/dashboard", { replace: true });
    };
    void check();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      setLoading(false);
      setError(signInError?.message ?? "Could not sign in. Please check your details.");
      return;
    }

    const { data: membership } = await supabase
      .from("sb_institution_admins")
      .select("institution_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    setLoading(false);
    if (!membership) {
      setError("This account is not registered as a SmartBoard school administrator.");
      return;
    }
    navigate("/smartboard-admin/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A1628] px-4 py-6">
      <SEOHead
        title="SmartBoard School Login"
        description="Sign in to manage your school's NewtonAI SmartBoards."
        canonicalPath="/smartboard-admin/login"
        noIndex
      />
      <div className="absolute left-6 top-6">
        <Logo size="sm" />
      </div>

      <div className="flex min-h-[85vh] items-center justify-center">
        <div className="w-full max-w-[440px] rounded-2xl border border-indigo-500/30 bg-slate-800 p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <Monitor className="h-7 w-7 text-indigo-400" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-white">SmartBoard School Portal</h1>
            <p className="text-sm text-slate-400">Manage your classroom boards and usage reports</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="sb-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email
              </label>
              <input
                id="sb-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sb-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                id="sb-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 text-white outline-none focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Activating a classroom board?{" "}
            <Link to="/smartboard/activate" className="text-indigo-300 underline-offset-4 hover:underline">
              Enter your activation code
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}