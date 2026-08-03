import { useEffect, useState } from "react";
import newtonLogoN from "@/assets/newtonai-logo-n.png.asset.json";

interface Props {
  onDismiss: () => void;
}

export function IdleScreen({ onDismiss }: Props) {
  const [now, setNow] = useState(new Date());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    const raf = window.requestAnimationFrame(() => setVisible(true));
    return () => {
      window.clearInterval(id);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const dismiss = () => onDismiss();
    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", dismiss);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 transition-opacity duration-1000"
      style={{
        opacity: visible ? 1 : 0,
        background: "linear-gradient(135deg, #06080F 0%, #0D0F2B 50%, #060A0F 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <img
          src={newtonLogoN.url}
          alt="NewtonAI"
          className="h-[72px] w-[72px] rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-2"
        />
        <p className="text-[32px] font-extrabold leading-tight text-white">NewtonAI</p>
        <p className="text-sm uppercase tracking-[2px] text-slate-500">SmartBoard</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p
          className="font-extrabold leading-none text-white tabular-nums"
          style={{ fontSize: "clamp(64px, 10vw, 120px)" }}
        >
          {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
        </p>
        <p className="text-lg font-normal text-slate-400">
          {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <p className="animate-pulse text-sm text-slate-600">Touch anywhere to continue teaching</p>
    </div>
  );
}

export default IdleScreen;
