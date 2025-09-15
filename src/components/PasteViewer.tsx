import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Shield, AlertTriangle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PasteData {
  id: string;
  content: string;
  language: string;
  expiration: string;
  burnAfterReading: boolean;
  createdAt: number;
  viewed: boolean;
}

const PasteViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pasteData, setPasteData] = useState<PasteData | null>(null);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    // Get encryption key from URL hash
    const encryptionKey = window.location.hash.substring(1);
    if (!encryptionKey) {
      setError("No decryption key found in URL");
      return;
    }

    // Simulate decryption by getting data from localStorage
    const storedData = localStorage.getItem(`paste_${id}`);
    if (!storedData) {
      setError("Paste not found or has expired");
      return;
    }

    try {
      const data: PasteData = JSON.parse(storedData);
      
      // Check if paste has expired
      const now = Date.now();
      const created = data.createdAt;
      const expirationMs = getExpirationMs(data.expiration);
      
      if (data.expiration !== "burn" && expirationMs && (now - created) > expirationMs) {
        localStorage.removeItem(`paste_${id}`);
        setError("This paste has expired and been automatically deleted");
        return;
      }

      // Check if it's burn after reading and already viewed
      if (data.burnAfterReading && data.viewed) {
        localStorage.removeItem(`paste_${id}`);
        setError("This paste was set to burn after reading and has already been viewed");
        return;
      }

      setPasteData(data);
      
      // Mark as viewed if burn after reading
      if (data.burnAfterReading) {
        const updatedData = { ...data, viewed: true };
        localStorage.setItem(`paste_${id}`, JSON.stringify(updatedData));
      }
      
    } catch (err) {
      setError("Failed to decrypt paste data");
    }
  }, [id]);

  useEffect(() => {
    if (!pasteData || pasteData.expiration === "burn") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const created = pasteData.createdAt;
      const expirationMs = getExpirationMs(pasteData.expiration);
      
      if (!expirationMs) return;
      
      const timeLeft = expirationMs - (now - created);
      
      if (timeLeft <= 0) {
        localStorage.removeItem(`paste_${id}`);
        setError("This paste has expired");
        return;
      }
      
      setTimeRemaining(formatTimeRemaining(timeLeft));
    }, 1000);

    return () => clearInterval(interval);
  }, [pasteData, id]);

  const getExpirationMs = (expiration: string): number | null => {
    switch (expiration) {
      case "10m": return 10 * 60 * 1000;
      case "1h": return 60 * 60 * 1000;
      case "24h": return 24 * 60 * 60 * 1000;
      default: return null;
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const handleDecrypt = () => {
    setIsDecrypted(true);
    toast({
      title: "Content decrypted",
      description: "Your secure content is now visible",
    });
    
    // If burn after reading, delete the paste
    if (pasteData?.burnAfterReading) {
      setTimeout(() => {
        localStorage.removeItem(`paste_${id}`);
        toast({
          title: "Paste destroyed",
          description: "This paste has been permanently deleted",
          variant: "destructive",
        });
      }, 100);
    }
  };

  const handleCopy = async () => {
    if (!pasteData?.content) return;
    
    try {
      await navigator.clipboard.writeText(pasteData.content);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied successfully",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <Button 
            onClick={() => navigate("/")}
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-lg">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!pasteData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="animate-pulse">
              <Shield className="mx-auto h-12 w-12 text-neon-green mb-4" />
              <p className="text-lg">Decrypting paste...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <Button 
          onClick={() => navigate("/")}
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Create New Paste
        </Button>

        <Card className="terminal-window">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-neon-green" />
                  Encrypted Paste
                </CardTitle>
                <CardDescription>
                  Content is encrypted and secure
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{pasteData.language}</Badge>
                {pasteData.burnAfterReading && (
                  <Badge variant="destructive">Burn After Reading</Badge>
                )}
                {timeRemaining && (
                  <Badge variant="outline" className="text-neon-cyan">
                    {timeRemaining}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isDecrypted ? (
              <div className="text-center py-12">
                <EyeOff className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Content is encrypted</h3>
                <p className="text-muted-foreground mb-6">
                  Click the button below to decrypt and view the content
                </p>
                {pasteData.burnAfterReading && (
                  <Alert className="mb-6 max-w-md mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Warning: This paste will be permanently deleted after viewing
                    </AlertDescription>
                  </Alert>
                )}
                <Button 
                  onClick={handleDecrypt}
                  className="neon-glow bg-neon-green text-primary-foreground hover:bg-neon-green/90"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Decrypt & View Content
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Decrypted Content</h3>
                  <Button 
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                
                <div className="rounded-lg overflow-hidden border border-terminal-border">
                  {pasteData.language === "text" ? (
                    <pre className="p-4 bg-code-bg text-foreground font-mono text-sm whitespace-pre-wrap">
                      {pasteData.content}
                    </pre>
                  ) : (
                    <SyntaxHighlighter
                      language={pasteData.language}
                      style={tomorrow}
                      customStyle={{
                        margin: 0,
                        background: 'hsl(var(--code-bg))',
                        fontSize: '14px',
                      }}
                    >
                      {pasteData.content}
                    </SyntaxHighlighter>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasteViewer;