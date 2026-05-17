import { MouseEvent, useState } from "react";

const OPTIONS = [
  "A) Newton's First Law",
  "B) Newton's Second Law",
  "C) Newton's Third Law",
  "D) Law of Gravitation",
];

export function QuizDemo() {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="w-full max-w-xl mx-auto mt-6 p-5 rounded-2xl"
      onClick={(e: MouseEvent) => e.stopPropagation()}
      style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 14 }}>
        Which law states that Force = Mass × Acceleration?
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o, i) => {
          const selected = picked === i;
          const dim = picked !== null && !selected;
          return (
            <button key={i} onClick={() => picked === null && setPicked(i)}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: selected ? "#6366F1" : "white",
                color: selected ? "white" : "#0F172A",
                border: selected ? "1px solid transparent" : "1px solid #E2E8F0",
                opacity: dim ? 0.5 : 1,
                cursor: picked === null ? "pointer" : "default",
              }}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div style={{ marginTop: 12, fontSize: 13, color: "#10B981", fontWeight: 600 }}>
          ✓ Answer submitted — response locked
        </div>
      )}
    </div>
  );
}