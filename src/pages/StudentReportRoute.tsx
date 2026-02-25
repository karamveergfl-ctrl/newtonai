import { useParams } from "react-router-dom";
import { StudentReportPage } from "@/components/intelligence-report/StudentReportPage";
import { AppLayout } from "@/components/AppLayout";
import SEOHead from "@/components/SEOHead";

const StudentReportRoute = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  if (!sessionId) return null;
  return (
    <AppLayout>
      <SEOHead title="Your Class Report" description="Personal intelligence report" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <StudentReportPage sessionId={sessionId} />
      </div>
    </AppLayout>
  );
};

export default StudentReportRoute;
