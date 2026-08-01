import { useEffect, useState } from "react";
import newtonLogoN from "@/assets/newtonai-logo-n.png.asset.json";

interface Props {
  onDismiss: () => void;
}

export function IdleScreen({ onDismiss }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
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
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#0A1628]">
      <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.25),transparent_60%)]" />
      <img src={newtonLogoN.url} alt="NewtonAI" className="relative h-24 w-24 animate-pulse rounded-2xl" />
      <p className="relative text-[64px] font-extrabold leading-none tracking-tight text-white">
        {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="relative text-2xl text-slate-400">
        {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <p className="relative mt-6 text-xl text-slate-300">Tap anywhere to search for educational videos</p>
    </div>
  );
}

export default IdleScreen;