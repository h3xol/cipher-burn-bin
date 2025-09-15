import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Shield, Lock, Timer, Flame, Key, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CryptoJS from "crypto-js";

const PasteCreator = () => {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [expiration, setExpiration] = useState("1h");
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
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

    setIsSubmitting(true);
    
    try {
      // Generate encryption key and encrypt content
      const encryptionKey = CryptoJS.lib.WordArray.random(256/8).toString();
      const encryptedContent = CryptoJS.AES.encrypt(content, encryptionKey).toString();
      
      // Hash password if provided
      let passwordHash = null;
      if (password.trim()) {
        passwordHash = CryptoJS.SHA256(password).toString();
      }
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('pastes')
        .insert({
          content: encryptedContent,
          language,
          expiration: expiration === 'burn' ? 'burn' : expiration,
          burn_after_reading: expiration === 'burn',
          password_hash: passwordHash
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create shareable URL
      const url = `${window.location.origin}/paste/${data.id}#${encryptionKey}`;
      setPasteUrl(url);
      
      toast({
        title: "Paste encrypted successfully!",
        description: "Your secure paste has been created",
      });
    } catch (error) {
      console.error('Error creating paste:', error);
      toast({
        title: "Error",
        description: "Failed to create paste. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pasteUrl);
    toast({
      title: "Copied!",
      description: "Paste URL copied to clipboard",
    });
  };

  const createAnother = () => {
    setContent("");
    setPassword("");
    setPasteUrl("");
  };

  if (pasteUrl) {
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
              Your secure paste has been created!
            </p>
          </div>

          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="flex items-center text-neon-green">
                <Shield className="mr-2 h-5 w-5" />
                Paste Created Successfully
              </CardTitle>
              <CardDescription>
                Share this link with anyone who needs access to your encrypted content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Your Secure Paste URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={pasteUrl}
                    readOnly
                    className="font-mono bg-code-bg border-terminal-border"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                    className="border-terminal-border hover:bg-neon-green/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  ⚠️ Save this URL - it contains the decryption key and cannot be recovered once lost
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={createAnother}
                  variant="outline"
                  className="border-terminal-border hover:bg-neon-green/10"
                >
                  Create Another Paste
                </Button>
                <Button
                  onClick={() => window.open(pasteUrl, '_blank')}
                  className="neon-glow bg-neon-green text-primary-foreground hover:bg-neon-green/90"
                >
                  View Paste
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Key className="mr-2 h-4 w-4" />
                Password Protection (Optional)
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a password to protect this paste (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-code-bg border-terminal-border"
              />
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security with a password
              </p>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full neon-glow bg-neon-green text-primary-foreground hover:bg-neon-green/90"
              size="lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              {isSubmitting ? "Creating..." : "Encrypt & Create Secure Paste"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasteCreator;