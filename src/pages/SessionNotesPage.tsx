import { useParams, Navigate } from "react-router-dom";
import { PostSessionNotesReview } from "@/components/live-notes/PostSessionNotesReview";
import SEOHead from "@/components/SEOHead";

export default function SessionNotesPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  if (!sessionId) return <Navigate to="/dashboard" replace />;
  return (
    <>
      <SEOHead
        title="Session Notes"
        description="Review your AI-enhanced notes from this live class session."
        canonicalPath={`/session-notes/${sessionId}`}
        noIndex
      />
      <PostSessionNotesReview sessionId={sessionId} />
    </>
  );
}
