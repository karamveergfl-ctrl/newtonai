import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

const TeacherMaterials = () => (
  <AppLayout>
    <SEOHead title="Materials" description="Manage teaching materials" noIndex />
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ScrollText className="h-8 w-8 text-primary" />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Materials</h1>
        <p className="text-muted-foreground mt-1">All your teaching resources</p>
      </div>
      <Card className="border-border/50">
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Materials library coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">Upload, organize, and share materials across all your classes</p>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

export default TeacherMaterials;
