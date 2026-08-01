import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Monitor } from "lucide-react";
import Logo from "@/components/Logo";
import SEOHead from "@/components/SEOHead";
import { activateBoard, readSmartBoardSession, writeSmartBoardSession } from "@/lib/smartboardSession";

export default function SmartBoardActivate() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readSmartBoardSession()) navigate("/smartboard/classroom", { replace: true });
  }, [navigate]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 5) return;
    setLoading(true);
    setError(null);

    const { data, message } = await activateBoard(code.trim());
    setLoading(false);

    if (!data) {
      setError(message ?? "Could not activate this board. Please try again.");
      return;
    }

    writeSmartBoardSession({
      deviceToken: data.deviceToken,
      ...data.board,
      activatedAt: new Date().toISOString(),
    });
    navigate("/smartboard/classroom", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A1628] px-4 py-6">
      <SEOHead
        title="SmartBoard Activation"
        description="Activate a NewtonAI classroom SmartBoard with your school's activation code."
        canonicalPath="/smartboard/activate"
        noIndex
      />
      <div className="absolute left-6 top-6">
        <Logo size="sm" />
      </div>

      <div className="flex min-h-[85vh] items-center justify-center">
        <div className="w-full max-w-[460px] rounded-2xl border border-indigo-500/30 bg-slate-800 p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <Monitor className="h-8 w-8 text-teal-400" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-white">Activate this SmartBoard</h1>
            <p className="text-base text-slate-400">
              Enter the activation code once. This board will stay signed in afterwards.
            </p>
          </div>

          <form onSubmit={handleActivate} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="board-code" className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                Activation Code
              </label>
              <input
                id="board-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="DPS-6A-X9F2"
                autoComplete="off"
                className="h-16 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 font-mono text-xl tracking-[4px] text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4">
                <p className="text-base text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length < 5}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
              Start teaching
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-base">
            <p>
              <Link to="/auth" className="text-slate-400 underline-offset-4 hover:text-white hover:underline">
                Are you a teacher or student?
              </Link>
            </p>
            <p>
              <Link to="/smartboard-admin/login" className="text-indigo-300 underline-offset-4 hover:underline">
                School administrator? Login here →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}