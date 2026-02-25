import { useParams } from "react-router-dom";
import { TeacherReportPage } from "@/components/intelligence-report/TeacherReportPage";
import { AppLayout } from "@/components/AppLayout";
import SEOHead from "@/components/SEOHead";

const TeacherReportRoute = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  if (!sessionId) return null;
  return (
    <AppLayout>
      <SEOHead title="Class Intelligence Report" description="AI-generated session report" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <TeacherReportPage sessionId={sessionId} />
      </div>
    </AppLayout>
  );
};

export default TeacherReportRoute;
