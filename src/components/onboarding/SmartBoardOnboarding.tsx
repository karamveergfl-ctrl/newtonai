import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSchoolBoards, signInBoardAsSchool, type SchoolBoardOption } from "@/lib/smartboardSession";

interface Props {
  onBack: () => void;
}

/** Lets a signed-in school account turn this device into one of its classroom boards. */
export default function SmartBoardOnboarding({ onBack }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [boards, setBoards] = useState<SchoolBoardOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, message } = await listSchoolBoards();
      if (cancelled) return;
      if (!data) {
        setError(message ?? "Could not load your school's boards.");
      } else {
        setSchoolName(data.institution?.name ?? null);
        setBoards(data.boards ?? []);
      }
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = async (boardId: string) => {
    setSigningIn(boardId);
    setError(null);
    const { data, message } = await signInBoardAsSchool(boardId);
    if (!data) {
      setSigningIn(null);
      setError(message ?? "Could not sign in this board. Please try again.");
      return;
    }
    navigate("/smartboard/classroom", { replace: true });
  };

  return (
    <div className="w-full max-w-2xl">
      <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">Sign in this SmartBoard</CardTitle>
          <CardDescription className="text-base mt-2">
            {schoolName ? `${schoolName} — choose which classroom board this display is` : "Choose which classroom board this display is"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              <div className="mt-2">
                <Link to="/smartboard/activate" className="underline underline-offset-4">
                  Use an activation code instead
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && boards.length === 0 && (
            <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
              No boards have been added for your school yet. Add one from the SmartBoard school portal first.
            </div>
          )}

          {!loading && boards.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleSelect(board.id)}
                  disabled={signingIn !== null}
                  className="flex items-center justify-between rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-60"
                >
                  <span>
                    <span className="block font-semibold">{board.board_name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {[board.grade_level, board.subject_focus].filter(Boolean).join(" · ") || "Classroom board"}
                    </span>
                  </span>
                  {signingIn === board.id && <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={onBack} disabled={signingIn !== null}>
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Back
            </Button>
            <Link to="/smartboard/activate" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Use an activation code
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
