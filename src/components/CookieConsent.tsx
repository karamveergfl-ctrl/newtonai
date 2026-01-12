import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const handleDisable = () => {
    localStorage.setItem('cookie-consent', 'disabled');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <Card className="max-w-[400px] shadow-lg border bg-card">
        <CardContent className="p-6 relative">
          {/* Cookie emoji */}
          <span className="absolute top-4 right-4 text-3xl">🍪</span>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2 pr-10">
            Your data. Your choice.
          </h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4">
            We use cookies to analyze our traffic and improve your experience. 
            Learn more in our{" "}
            <Link 
              to="/privacy" 
              className="text-primary hover:underline font-medium"
            >
              Privacy Hub
            </Link>
            .
          </p>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleAccept}
              className="flex-1 gap-2"
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDisable}
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4" />
              Disable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsent;
