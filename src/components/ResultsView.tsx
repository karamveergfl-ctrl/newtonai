import { TopicCard } from "./TopicCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ResultsViewProps {
  topics: any[];
  pdfName: string;
  onReset: () => void;
}

export const ResultsView = ({ topics, pdfName, onReset }: ResultsViewProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <Button
            onClick={onReset}
            variant="ghost"
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Upload Another PDF
          </Button>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {pdfName}
          </h1>
          <p className="text-muted-foreground">
            Found {topics.length} topics with curated educational videos
          </p>
        </div>

        <div className="space-y-6">
          {topics.map((topic, index) => (
            <div
              key={index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <TopicCard topic={topic} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
