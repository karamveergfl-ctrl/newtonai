export const SUBJECT_TOPICS: { subject: string; color: string; topics: string[] }[] = [
  {
    subject: "Science",
    color: "#10B981",
    topics: ["Photosynthesis", "Newton's Laws", "Water Cycle", "Cell Division", "DNA & Genetics", "Ecosystems"],
  },
  {
    subject: "Maths",
    color: "#6366F1",
    topics: ["Pythagoras Theorem", "Fractions", "Algebra Basics", "Trigonometry", "Probability"],
  },
  {
    subject: "Physics",
    color: "#F59E0B",
    topics: ["Gravity", "Electricity Circuits", "Light Refraction", "Magnetism", "Sound Waves"],
  },
  {
    subject: "Chemistry",
    color: "#EF4444",
    topics: ["Atoms & Molecules", "Chemical Bonds", "Periodic Table", "Acids and Bases"],
  },
];

interface Props {
  onSelect: (topic: string) => void;
}

export function QuickTopicChips({ onSelect }: Props) {
  return (
    <div className="w-full">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-slate-500">Quick Topics</p>
      <div className="flex flex-wrap gap-2">
        {SUBJECT_TOPICS.flatMap((group) =>
          group.topics.map((topic) => (
            <button
              key={`${group.subject}-${topic}`}
              type="button"
              onClick={() => onSelect(topic)}
              className="flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-400 transition-all duration-150 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: group.color }} />
              {topic}
            </button>
          )),
        )}
      </div>
    </div>
  );
}

export default QuickTopicChips;
