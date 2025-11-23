import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Copy, Flame, Clock, FileText, Key, AlertTriangle, Download, FileIcon } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from "@/hooks/use-toast";
import { getDatabase } from "@/lib/database";
import { decryptBinary, decryptText, derivePasswordHash, EncryptedPayload } from "@/lib/encryption";

const parseEncryptedPayload = (value: string): EncryptedPayload | null => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && parsed.iv && parsed.salt && parsed.mac && parsed.version) {
      return parsed;
    }
  } catch (err) {
    console.error("Failed to parse encrypted payload", err);
  }
  return null;
};

const PasteViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paste, setPaste] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decryptedContent, setDecryptedContent] = useState("");
  const [decryptedFile, setDecryptedFile] = useState<Uint8Array | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadPaste = async () => {
      if (!id) {
        setError("Invalid paste ID");
        setLoading(false);
        return;
      }

      try {
        // Get paste from database
        const db = getDatabase();
        const { data, error: fetchError } = await db.getPaste(id);

        if (fetchError || !data) {
          setError("Paste not found or has expired");
          setLoading(false);
          return;
        }

        // Check if paste has expired
        if (data.expires_at && new Date() > new Date(data.expires_at)) {
          setError("This paste has expired");
          setLoading(false);
          return;
        }

        // Check burn after reading
        if (data.burn_after_reading && data.viewed) {
          setError("This paste has been destroyed after reading");
          setLoading(false);
          return;
        }

        setPaste(data);

        // Check if password is required
        if (data.password_hash) {
          setPasswordRequired(true);
          setLoading(false);
          return;
        }

        // Get encryption key from URL hash and decrypt
        const encryptionKey = window.location.hash.substring(1);
        if (!encryptionKey) {
          setError("No decryption key provided");
          setLoading(false);
          return;
        }

        await decryptPaste(data, encryptionKey);

      } catch (err) {
        console.error('Error loading paste:', err);
        setError("Failed to load paste");
        setLoading(false);
      }
    };

    loadPaste();
  }, [id]);

  const decryptPaste = async (pasteData: any, encryptionKey: string, userPassword?: string) => {
    try {
      setError("");
      setIsDecrypting(true);

      // Check password if required
      if (pasteData.password_hash && userPassword) {
        const derived = await derivePasswordHash(
          userPassword,
          pasteData.password_salt || undefined,
          pasteData.password_iterations || undefined,
        );
        if (derived.hashHex !== pasteData.password_hash) {
          setError("Incorrect password");
          setIsDecrypting(false);
          return;
        }
      }

      const payload = parseEncryptedPayload(pasteData.content);
      if (!payload) {
        setError("Encrypted payload is invalid or unsupported");
        setIsDecrypting(false);
        setLoading(false);
        return;
      }

      const storagePath = payload.storagePath || pasteData.file_name;

      if (pasteData.is_file) {
        const db = getDatabase();
        const { data: encryptedBlob, error: downloadError } = await db.downloadFile(
          'encrypted-files',
          storagePath,
        );

        if (downloadError || !encryptedBlob) {
          setError("Failed to download encrypted file");
          setIsDecrypting(false);
          setLoading(false);
          return;
        }

        const encryptedBytes = new Uint8Array(await encryptedBlob.arrayBuffer());
        const decryptedBytes = await decryptBinary(payload, encryptionKey, encryptedBytes);
        setDecryptedFile(decryptedBytes);
        setDecryptedContent("");
      } else {
        const decrypted = await decryptText(payload, encryptionKey);
        setDecryptedContent(decrypted);
        setDecryptedFile(null);
      }
      setPasswordRequired(false);

      // Update view status and handle burn after reading
      const db = getDatabase();
      if (pasteData.burn_after_reading) {
        // Mark as viewed first
        await db.updatePaste(pasteData.id, { viewed: true });
        
        // Delete the file from storage if it's a file
        if (pasteData.is_file && storagePath) {
          const { error: storageError } = await db.deleteFile('encrypted-files', storagePath);
          
          if (storageError) {
            console.error('Error deleting burned file:', storageError);
          }
        }
        
        // Then delete the database record
        const { error: deleteError } = await db.deletePaste(pasteData.id);

        if (deleteError) {
          console.error('Error deleting burned paste:', deleteError);
        } else {
          console.log('Paste burned after reading');
        }
      } else {
        // Just update view count for regular pastes
        await db.updatePaste(pasteData.id, { 
          view_count: (pasteData.view_count || 0) + 1 
        });
      }

      setLoading(false);
      setIsDecrypting(false);

    } catch (err) {
      console.error('Decryption error:', err);
      setError("Failed to decrypt content");
      setIsDecrypting(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter the password",
        variant: "destructive",
      });
      return;
    }
    setError("");

    const encryptionKey = window.location.hash.substring(1);
    if (!encryptionKey) {
      setError("No decryption key provided");
      return;
    }

    decryptPaste(paste, encryptionKey, password);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(decryptedContent);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const downloadFile = () => {
    if (!paste.is_file || !decryptedFile) return;

    try {
      const blob = new Blob([decryptedFile], { type: paste.file_type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract original filename by removing timestamp prefix
      const originalName = paste.file_name?.replace(/^\d+-/, '') || 'download';
      a.download = originalName;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "File download has begun",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const getExpirationBadge = (expiration: string, expiresAt: string) => {
    if (expiration === 'burn') {
      return <Badge variant="destructive"><Flame className="mr-1 h-3 w-3" />Burn After Reading</Badge>;
    }
    
    if (expiresAt) {
      const timeLeft = new Date(expiresAt).getTime() - Date.now();
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Expires in {hours}h {minutes}m</Badge>;
      }
    }
    
    return null;
  };

  if (loading || isDecrypting) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center">
              <Shield className="mr-2 h-8 w-8 text-neon-green animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                CipherBin
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              {isDecrypting ? "Decrypting your secure content..." : "Loading..."}
            </p>
          </div>
          
          <Card className="terminal-window">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {isDecrypting ? "Decrypting content..." : "Loading encrypted content..."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
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
              This {paste?.is_file ? 'file' : 'paste'} is password protected
            </p>
          </div>
          
          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5 text-neon-green" />
                Password Required
              </CardTitle>
              <CardDescription>
                Enter the password to decrypt and view this {paste?.is_file ? 'file' : 'paste'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter the password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-code-bg border-terminal-border"
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
              </div>
              
              {error && (
                <Alert className="border-destructive bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                onClick={handlePasswordSubmit}
                className="w-full neon-glow bg-neon-green text-primary-foreground hover:bg-neon-green/90"
              >
                <Key className="mr-2 h-4 w-4" />
                Decrypt {paste?.is_file ? 'File' : 'Paste'}
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-terminal-border hover:bg-neon-green/10"
              >
                Create New {paste?.is_file ? 'File Share' : 'Paste'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
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
          </div>
          
          <Card className="terminal-window">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-destructive">Error</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-terminal-border hover:bg-neon-green/10"
              >
                Create New Paste
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!paste) {
    return null;
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
            Secure, encrypted {paste.is_file ? 'file' : 'paste'} viewer
          </p>
        </div>

        <Card className="terminal-window">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                {paste.is_file ? (
                  <FileIcon className="mr-2 h-5 w-5 text-neon-green" />
                ) : (
                  <FileText className="mr-2 h-5 w-5 text-neon-green" />
                )}
                Encrypted {paste.is_file ? 'File' : 'Paste'}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">
                  {paste.is_file ? 'File' : paste.language}
                </Badge>
                {getExpirationBadge(paste.expiration, paste.expires_at)}
                {paste.password_hash && (
                  <Badge variant="outline">
                    <Key className="mr-1 h-3 w-3" />
                    Password Protected
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              Content decrypted successfully • Created {new Date(paste.created_at).toLocaleString()}
              {paste.is_file && (
                <span> • {(paste.file_size / 1024 / 1024).toFixed(2)} MB</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {paste.is_file ? 'File' : 'Content'}
              </h3>
              <div className="flex gap-2">
                {paste.is_file ? (
                  <Button
                    onClick={downloadFile}
                    variant="outline"
                    size="sm"
                    className="border-terminal-border hover:bg-neon-green/10"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                ) : (
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="border-terminal-border hover:bg-neon-green/10"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                )}
              </div>
            </div>
            
            {paste.is_file ? (
              <div className="p-8 border border-terminal-border rounded-lg bg-code-bg text-center">
                <FileIcon className="h-16 w-16 text-neon-green mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">
                  {paste.file_name?.replace(/^\d+-/, '') || 'Encrypted File'}
                </h4>
                <p className="text-muted-foreground mb-4">
                  Size: {(paste.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Click the download button above to save this encrypted file to your device
                </p>
                <Button
                  onClick={downloadFile}
                  className="neon-glow bg-neon-green text-primary-foreground hover:bg-neon-green/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border border-terminal-border">
                {paste.language === "text" ? (
                  <pre className="p-4 bg-code-bg text-foreground font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                    {decryptedContent}
                  </pre>
                ) : (
                  <SyntaxHighlighter
                    language={paste.language}
                    style={atomDark}
                    customStyle={{
                      margin: 0,
                      background: 'hsl(var(--code-bg))',
                      fontSize: '14px',
                    }}
                  >
                    {decryptedContent}
                  </SyntaxHighlighter>
                )}
              </div>
            )}

            {paste.burn_after_reading && (
              <Alert className="border-destructive bg-destructive/10">
                <Flame className="h-4 w-4" />
                <AlertDescription className="text-destructive">
                  This {paste.is_file ? 'file' : 'paste'} will be permanently deleted after viewing.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-terminal-border hover:bg-neon-green/10"
              >
                Create New {paste.is_file ? 'File Share' : 'Paste'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasteViewer;
