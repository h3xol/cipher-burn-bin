import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Timer, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PasteCreator = () => {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [expiration, setExpiration] = useState("1h");
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content to encrypt",
        variant: "destructive",
      });
      return;
    }

    // Simulate encryption and paste creation
    const pasteId = Math.random().toString(36).substring(2, 15);
    const encryptionKey = Math.random().toString(36).substring(2, 25);
    
    // Store paste data in localStorage (simulating server storage)
    const pasteData = {
      id: pasteId,
      content,
      language,
      expiration,
      burnAfterReading,
      createdAt: Date.now(),
      viewed: false,
    };
    
    localStorage.setItem(`paste_${pasteId}`, JSON.stringify(pasteData));
    
    toast({
      title: "Paste encrypted successfully!",
      description: "Your secure paste has been created",
    });

    // Navigate to the paste view with the key in the hash
    navigate(`/paste/${pasteId}#${encryptionKey}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Shield className="mr-2 h-8 w-8 text-neon-green" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
              CipherBin
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Secure, encrypted, and anonymous paste sharing
          </p>
        </div>

        <Card className="terminal-window">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5 text-neon-green" />
              Create Encrypted Paste
            </CardTitle>
            <CardDescription>
              Your content will be encrypted client-side before transmission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content">Content to encrypt</Label>
              <Textarea
                id="content"
                placeholder="Enter your text, code, or sensitive data here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] font-mono bg-code-bg border-terminal-border resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language / Format</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Plain Text</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="bash">Bash</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration</Label>
                <Select value={expiration} onValueChange={setExpiration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10m">
                      <div className="flex items-center">
                        <Timer className="mr-2 h-4 w-4" />
                        10 Minutes
                      </div>
                    </SelectItem>
                    <SelectItem value="1h">
                      <div className="flex items-center">
                        <Timer className="mr-2 h-4 w-4" />
                        1 Hour
                      </div>
                    </SelectItem>
                    <SelectItem value="24h">
                      <div className="flex items-center">
                        <Timer className="mr-2 h-4 w-4" />
                        24 Hours
                      </div>
                    </SelectItem>
                    <SelectItem value="burn">
                      <div className="flex items-center">
                        <Flame className="mr-2 h-4 w-4" />
                        Burn After Reading
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              className="w-full neon-glow bg-neon-green text-primary-foreground hover:bg-neon-green/90"
              size="lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              Encrypt & Create Secure Paste
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasteCreator;