import { Activity } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";
import { PulseMeterDemo } from "../components/PulseMeterDemo";

export default function Slide06PulseMeter() {
  return (
    <ToolSlideLayout
      category="REAL-TIME FEEDBACK"
      categoryColor="#F59E0B"
      toolName="Live Pulse Meter — Know If They're Following"
      problem="A teacher finishes explaining a complex concept and asks 'Does everyone understand?' — 40 students nod. But do they really? By the time a test reveals the truth, weeks have passed and the topic has moved on."
      solution="Every 5 minutes during class, Newton automatically asks every student 'How are you following?' Students respond privately from their devices. The teacher sees a live fluctuation bar on the board. If understanding drops below 50%, the bar turns red and an alert fires."
      highlights={[
        "Three-tap response: Got It / Slightly Lost / Lost — takes 1 second per student",
        "Live fluctuation bar visible to the teacher on the smartboard",
        "Full session pulse timeline saved for post-class analysis",
      ]}
      icon={<Activity size={48} color="white" strokeWidth={2.5} />}
      iconGradient="linear-gradient(135deg, #F59E0B, #B45309)"
      videoSrc={VIDEO_PATHS.PULSE_METER}
      videoCaption="Watch the pulse meter fire automatically mid-lecture, students tap their responses, and the fluctuation bar on the teacher's board turn red as confusion spikes — triggering a recap prompt."
      extra={<PulseMeterDemo />}
    />
  );
}