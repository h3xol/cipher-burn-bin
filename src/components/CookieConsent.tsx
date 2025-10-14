import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie } from "lucide-react";

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cookie className="h-5 w-5" />
            Cookie & Storage Notice
          </CardTitle>
          <CardDescription>
            We use local storage to save your theme preference.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            This site stores your theme preference (dark/light mode) locally in your browser. 
            No personal data is collected or shared with third parties.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleAccept} className="flex-1">
            Accept
          </Button>
          <Button onClick={handleDecline} variant="outline" className="flex-1">
            Decline
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CookieConsent;
