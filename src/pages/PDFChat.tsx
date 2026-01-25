import { PDFChatSplitView } from "@/components/pdf-chat";
import { SEOHead } from "@/components/SEOHead";

export default function PDFChat() {
  return (
    <>
      <SEOHead
        title="Chat with PDF | NewtonAI"
        description="Upload a PDF and ask questions about its content. Get accurate, grounded answers with citations."
      />
      <div className="h-[calc(100vh-4rem)]">
        <PDFChatSplitView />
      </div>
    </>
  );
}
