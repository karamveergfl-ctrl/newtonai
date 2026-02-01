import { useCreditsContext } from "@/contexts/CreditsContext";
import { cn } from "@/lib/utils";

interface PrimaryAdBannerProps {
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

export function PrimaryAdBanner({ className }: PrimaryAdBannerProps) {
  const { isPremium, loading } = useCreditsContext();

  // Only hide for confirmed premium users (not during loading)
  // This ensures the first ad ALWAYS appears until we confirm premium status
  if (!loading && isPremium) return null;

  return (
    <div className={cn("w-full flex flex-col items-center my-6 min-h-[106px]", className)}>
      <span className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wider">
        Sponsored
      </span>
      <iframe
        srcDoc={AD_HTML}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="border-0 w-[728px] max-w-full h-[90px] overflow-hidden rounded-lg"
        title="Advertisement"
        loading="eager"
      />
    </div>
  );
}
