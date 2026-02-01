import { useCreditsContext } from "@/contexts/CreditsContext";
import { useStudyContext } from "@/contexts/StudyContext";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  className?: string;
}

const AD_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center;
      min-height: 90px;
      background: transparent;
    }
  </style>
</head>
<body>
  <script>
    atOptions = {
      'key' : 'c5d398ab0a723a7cfa61f3c2d7960602',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://lozengehelped.com/c5d398ab0a723a7cfa61f3c2d7960602/invoke.js"></script>
</body>
</html>`;

export function AdBanner({ className }: AdBannerProps) {
  const { isPremium } = useCreditsContext();
  const { isInDeepStudy } = useStudyContext();

  // Hide for premium users or during deep study
  if (isPremium || isInDeepStudy) return null;

  return (
    <div className={cn("w-full flex flex-col items-center my-6", className)}>
      <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
        Sponsored
      </span>
      <iframe
        srcDoc={AD_HTML}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-[728px] max-w-full h-[90px] overflow-hidden rounded-lg"
        title="Advertisement"
      />
    </div>
  );
}
