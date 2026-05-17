import { motion } from "framer-motion";
import { X, Clock, Lock } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

const cards = [
  { icon: X, title: "One Teacher, 40 Students", body: "Personalised attention is impossible at this scale." },
  { icon: Clock, title: "Feedback Comes Too Late", body: "Monthly exams reveal gaps after damage is done." },
  { icon: Lock, title: "Quality Tutoring is Unaffordable", body: "₹2,000–₹20,000/month for coaching — inaccessible to most." },
];

export default function Slide02Problem() {
  return (
    <SlideShell theme="dark">
      <div className="h-full grid grid-cols-2 gap-12 px-20 pt-28 pb-20">
        <div className="flex flex-col justify-center">
          <motion.div variants={slideChild} style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700, letterSpacing: "0.3em" }}>
            THE CHALLENGE
          </motion.div>
          <motion.h1 variants={slideHeading} className="mt-3"
            style={{ fontWeight: 800, fontSize: 44, color: "white", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            India's students<br/>deserve better.
          </motion.h1>
          <motion.p variants={slideChild} className="mt-6"
            style={{ fontSize: 17, color: "#94A3B8", lineHeight: 1.7, maxWidth: 440 }}>
            260 million school-going students. A 35:1 student-to-teacher ratio. 50% of Grade 8 students unable to do basic arithmetic. Quality tutoring costs ₹20,000/month — out of reach for 70% of families.
          </motion.p>
        </div>
        <div className="flex flex-col justify-center gap-4">
          {cards.map((c, i) => (
            <motion.div key={i} variants={slideChild} className="rounded-2xl p-5 flex gap-4 items-start"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{ width: 40, height: 40, background: "rgba(239,68,68,0.18)" }}>
                <c.icon size={20} color="#F87171" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: "white" }}>{c.title}</div>
                <div style={{ fontSize: 14, color: "#94A3B8", marginTop: 4 }}>{c.body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}