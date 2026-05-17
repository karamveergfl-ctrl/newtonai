import { FileSearch } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide13PDFChat() {
  return (
    <ToolSlideLayout
      category="DOCUMENT AI"
      categoryColor="#A855F7"
      toolName="PDF Chat — Have a Conversation With Any Document"
      problem="A student receives a 180-page reference textbook. They need to find one specific concept for their assignment. Searching manually takes 20 minutes. Copying text to ask an AI gives wrong answers because the AI doesn't know the specific context of their curriculum."
      solution="Newton lets students upload any PDF and have a full conversation with it. Ask any question, get an answer with the exact page number cited. Newton reads only that document — answers are accurate, sourced, and curriculum-relevant."
      highlights={[
        "Upload any PDF up to 200 pages — fully indexed in under 30 seconds",
        "Every answer cites the exact page number it came from",
        "Select any text in the PDF → instantly ask Newton to explain it",
      ]}
      icon={<FileSearch size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #A855F7, #6D28D9)"
      videoSrc={VIDEO_PATHS.PDF_CHAT}
      videoCaption="A student uploads their school's prescribed Chemistry reference book and asks: 'Explain the difference between covalent and ionic bonds as described in this book.' Newton answers in 5 seconds, citing pages 34 and 51."
    />
  );
}