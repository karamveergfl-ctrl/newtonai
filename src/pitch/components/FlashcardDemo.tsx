import { MouseEvent, useState } from "react";

export function FlashcardDemo() {
  const [flip, setFlip] = useState(false);
  return (
    <div className="flex flex-col items-center mt-6" onClick={(e: MouseEvent) => e.stopPropagation()}>
      <div style={{ perspective: 800, width: 360, height: 200 }} onClick={() => setFlip(f => !f)}>
        <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d",
          transition: "transform 600ms ease", transform: flip ? "rotateY(180deg)" : "rotateY(0deg)", cursor: "pointer" }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 16,
            background: "linear-gradient(135deg, #6366F1, #4338CA)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            textAlign: "center", fontWeight: 700, fontSize: 18, boxShadow: "0 16px 40px rgba(99,102,241,0.35)" }}>
            What is Newton's Second Law of Motion?
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 16,
            background: "white", color: "#0F172A", transform: "rotateY(180deg)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 24, textAlign: "center", boxShadow: "0 16px 40px rgba(99,102,241,0.2)", border: "1px solid #E2E8F0" }}>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>
              Force equals mass multiplied by acceleration. <strong style={{ color: "#6366F1" }}>F = ma.</strong> The acceleration of an object is directly proportional to the net force and inversely proportional to its mass.
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 10 }}>Source: Session Notes Oct 12</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 10 }}>Click the card to flip it →</div>
    </div>
  );
}