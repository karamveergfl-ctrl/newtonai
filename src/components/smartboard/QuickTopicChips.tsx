export const SUBJECT_TOPICS: { subject: string; topics: string[] }[] = [
  { subject: "Science", topics: ["Photosynthesis", "Newton's Laws", "Water Cycle", "Cell Division", "Ecosystems"] },
  { subject: "Maths", topics: ["Pythagoras", "Fractions", "Area and Perimeter", "Algebra Basics", "Trigonometry"] },
  { subject: "Physics", topics: ["Gravity", "Electricity", "Light Refraction", "Magnetism", "Sound Waves"] },
  { subject: "Chemistry", topics: ["Atoms", "Chemical Bonds", "Periodic Table", "Acids and Bases", "Combustion"] },
  { subject: "History", topics: ["World War II", "Indian Independence", "Ancient Egypt", "Industrial Revolution"] },
  { subject: "Geography", topics: ["Volcanoes", "Earthquakes", "Solar System", "Seasons", "Rivers and Mountains"] },
];

interface Props {
  onSelect: (topic: string) => void;
}

export function QuickTopicChips({ onSelect }: Props) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max flex-col gap-3">
        {SUBJECT_TOPICS.map((group) => (
          <div key={group.subject} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-base font-semibold text-slate-400">{group.subject}</span>
            <div className="flex gap-3">
              {group.topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => onSelect(topic)}
                  className="min-h-[52px] rounded-full border border-slate-600 bg-slate-700 px-6 text-base font-medium text-slate-200 transition-colors hover:border-indigo-500 hover:bg-indigo-900 hover:text-indigo-200"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickTopicChips;