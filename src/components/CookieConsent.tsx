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
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 p-4">
      <Card className="w-full max-w-screen-xl mx-auto shadow-lg border bg-card">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Cookie emoji and content */}
            <div className="flex items-start gap-4 flex-1">
              <span className="text-3xl flex-shrink-0">🍪</span>
              <div className="flex-1">
                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Your data. Your choice.
                </h3>
                
                {/* Description */}
                <p className="text-sm text-muted-foreground">
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
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-3 flex-shrink-0">
              <Button 
                onClick={handleAccept}
                className="gap-2 min-w-[120px]"
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDisable}
                className="gap-2 min-w-[120px]"
              >
                <X className="h-4 w-4" />
                Disable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsent;
