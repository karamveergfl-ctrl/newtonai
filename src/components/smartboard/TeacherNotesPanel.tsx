import { useEffect, useState } from "react";
import { Copy, NotebookPen, Trash2, X } from "lucide-react";

interface Props {
  /** Notes are kept per open document for the life of the board session. */
  docKey: string;
}

const store = new Map<string, string>();

export function TeacherNotesPanel({ docKey }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => store.get(docKey) ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setText(store.get(docKey) ?? "");
  }, [docKey]);

  useEffect(() => {
    store.set(docKey, text);
  }, [docKey, text]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open teacher notes"
          className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl bg-teal-600 py-6 pl-4 pr-3 text-base font-semibold text-white shadow-lg hover:bg-teal-500"
        >
          <NotebookPen className="h-5 w-5" aria-hidden="true" />
          <span className="[writing-mode:vertical-rl]">Notes</span>
        </button>
      )}

      <aside
        aria-label="Teacher notes"
        className={`fixed right-0 top-0 z-40 flex h-full w-[min(460px,90vw)] flex-col border-l border-slate-700 bg-[#0C1B33] shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <p className="flex items-center gap-2 text-lg font-bold text-white">
            <NotebookPen className="h-5 w-5 text-teal-400" aria-hidden="true" /> Teacher notes
          </p>
          <button
            type="button"
            aria-label="Close teacher notes"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write anything for this class — key points, formulas, homework…"
          className="flex-1 resize-none bg-transparent p-4 text-xl leading-relaxed text-white outline-none placeholder:text-slate-500"
        />

        <div className="flex items-center justify-between gap-3 border-t border-slate-700 p-3">
          <button
            type="button"
            onClick={() => setText("")}
            className="flex min-h-[52px] items-center gap-2 rounded-xl border border-slate-600 px-5 text-base font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" /> Clear
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="flex min-h-[52px] items-center gap-2 rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white hover:bg-indigo-500"
          >
            <Copy className="h-5 w-5" aria-hidden="true" /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </aside>
    </>
  );
}

export default TeacherNotesPanel;
