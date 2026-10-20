import { describe, it, expect } from "vitest";
import { buildAssignmentContent } from "@/components/teacher/SendToClassDialog";

const questions = [
  { question: "2+2?", options: ["3", "4", "5"], correctIndex: 1, explanation: "basic" },
];

describe("Send to Class content", () => {
  it("stores quiz answers as option text so the server grader can score them", () => {
    const c = buildAssignmentContent("quiz", { questions }) as { questions: { correct_answer: string }[] };
    expect(c.questions[0].correct_answer).toBe("4");
  });

  it("stores tests in the same graded format as quizzes", () => {
    const c = buildAssignmentContent("test", { questions }) as { questions: unknown[] };
    expect(c.questions).toHaveLength(1);
  });

  it("stores flashcards as front/back cards", () => {
    const c = buildAssignmentContent("flashcards", { cards: [{ front: "Q", back: "A" }] });
    expect(c).toEqual({ cards: [{ front: "Q", back: "A" }] });
  });
});
