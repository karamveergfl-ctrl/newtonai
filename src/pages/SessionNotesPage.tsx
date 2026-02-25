import { useParams, Navigate } from "react-router-dom";
import { PostSessionNotesReview } from "@/components/live-notes/PostSessionNotesReview";

export default function SessionNotesPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  if (!sessionId) return <Navigate to="/dashboard" replace />;
  return <PostSessionNotesReview sessionId={sessionId} />;
}
