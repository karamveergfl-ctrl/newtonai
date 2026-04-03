import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

const TeacherAnalytics = () => (
  <AppLayout>
    <SEOHead title="Teacher Analytics" description="View teaching analytics" noIndex />
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="h-8 w-8 text-primary" />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Teaching performance insights</p>
      </div>
      <Card className="border-border/50">
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Analytics dashboard coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">Track engagement, attendance, and student performance across all your classes</p>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default TeacherAnalytics;
