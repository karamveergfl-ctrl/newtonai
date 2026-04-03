import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

const TeacherStudents = () => (
  <AppLayout>
    <SEOHead title="Students" description="Manage your students" noIndex />
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-primary" />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Students</h1>
        <p className="text-muted-foreground mt-1">View all enrolled students</p>
      </div>
      <Card className="border-border/50">
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Student management coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">View, manage, and track all your students in one place</p>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default TeacherStudents;
