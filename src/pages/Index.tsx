import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { ResultsView } from "@/components/ResultsView";

const Index = () => {
  const [results, setResults] = useState<{ topics: any[]; pdfName: string } | null>(null);

  const handleUploadComplete = (data: { topics: any[]; pdfName: string }) => {
    setResults(data);
  };

  const handleReset = () => {
    setResults(null);
  };

  return (
    <>
      {!results ? (
        <UploadZone onUploadComplete={handleUploadComplete} />
      ) : (
        <ResultsView
          topics={results.topics}
          pdfName={results.pdfName}
          onReset={handleReset}
        />
      )}
    </>
  );
};

export default Index;
