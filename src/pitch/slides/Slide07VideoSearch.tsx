import { SearchCheck } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide07VideoSearch() {
  return (
    <ToolSlideLayout
      category="VISUAL LEARNING"
      categoryColor="#A855F7"
      toolName="Instant Video Search — Select Any Word, Find the Animation"
      problem="A teacher writes 'Photosynthesis' on the board. A student doesn't understand the concept from the explanation. The teacher searches YouTube separately, wasting 3 minutes, and the class loses momentum. Most educational videos aren't curriculum-aligned."
      solution="The teacher selects any word on the screen — in the PDF, on the whiteboard, in the notes — and Newton instantly searches for curriculum-aligned educational animations. Results appear in 2 seconds. The teacher plays the video for the whole class with one tap."
      highlights={[
        "Works directly from selected text — no tab switching, no searching manually",
        "Plays synchronised for all student devices simultaneously",
        "Every video watched is logged and added to Newton Chat's knowledge",
      ]}
      icon={<SearchCheck size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #A855F7, #6D28D9)"
      videoKey="VIDEO_SEARCH"
      videoSrc={VIDEO_PATHS.VIDEO_SEARCH}
      videoCaption="Watch a teacher select the word 'Mitosis' on a PDF slide, Newton surfaces 6 educational animation videos, and the teacher plays one for the entire class — all without leaving the classroom."
    />
  );
}