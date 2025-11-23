import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Shield, Lock, Timer, Flame, Key, Copy, Upload, FileIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDatabase } from "@/lib/database";
import { EncryptedPayload, encryptBinary, encryptText, derivePasswordHash } from "@/lib/encryption";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PasteCreator = () => {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("text");
  const [expiration, setExpiration] = useState("1h");
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();

  const processFile = (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 15MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    setContent("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) {
      toast({
        title: "Error",
        description: "Please enter content or select a file",
        variant: "destructive",
      });
      return;
    }

    // Check text content size limit (500k characters)
    if (!selectedFile && content.length > 500000) {
      toast({
        title: "Text too large",
        description: "Text content must be less than 500k characters (~0.5 MB)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let encryptionKey = "";
      let fileName = '';
      let fileSize = 0;
      let fileType = '';
      let isFile = false;
      let contentForDatabase = "";

      const db = getDatabase();
      if (selectedFile) {
        // Handle file upload
        isFile = true;
        fileName = `${Date.now()}-${selectedFile.name}`;
        fileSize = selectedFile.size;
        fileType = selectedFile.type || 'application/octet-stream';

        // Read file as ArrayBuffer and encrypt with AES-GCM + HMAC
        const fileBuffer = new Uint8Array(await selectedFile.arrayBuffer());
        const encrypted = await encryptBinary(fileBuffer);
        encryptionKey = encrypted.key;

        // Upload encrypted file to storage only (keep DB lean)
        const encryptedBlob = new Blob([encrypted.ciphertext], { type: 'application/octet-stream' });
        const { error: storageError } = await db.uploadFile('encrypted-files', fileName, encryptedBlob);

        if (storageError) {
          console.error('Storage upload error:', storageError);
          throw new Error('Failed to upload file');
        }

        const payload: EncryptedPayload = {
          ...encrypted.payload,
          storagePath: fileName,
        };

        contentForDatabase = JSON.stringify(payload);
      } else {
        // Handle text content (ciphertext stored in DB)
        const encrypted = await encryptText(content);
        encryptionKey = encrypted.key;
        contentForDatabase = JSON.stringify(encrypted.payload);
      }
      
      // Hash password if provided
      let passwordHash = null;
      let passwordSalt = null;
      let passwordIterations: number | null = null;
      if (password.trim()) {
        const derived = await derivePasswordHash(password.trim());
        passwordHash = derived.hashHex;
        passwordSalt = derived.saltB64;
        passwordIterations = derived.iterations;
      }
      
      // Save to database
      const { data, error } = await db.insertPaste({
          content: contentForDatabase,
          language: isFile ? 'file' : language,
          expiration: burnAfterReading ? 'burn' : expiration,
          burn_after_reading: burnAfterReading,
          password_hash: passwordHash,
          password_salt: passwordSalt,
          password_iterations: passwordIterations,
          is_file: isFile,
          file_name: isFile ? fileName : null,
          file_size: isFile ? fileSize : null,
          file_type: isFile ? fileType : null,
        });
      
      if (error) throw error;
      
      // Create shareable URL
      const url = `${window.location.origin}/paste/${data.id}#${encryptionKey}`;
      setPasteUrl(url);
      
      toast({
        title: isFile ? "File encrypted successfully!" : "Paste encrypted successfully!",
        description: isFile ? "Your secure file has been uploaded" : "Your secure paste has been created",
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
      description: "URL copied to clipboard",
    });
  };

  const createAnother = () => {
    setContent("");
    setSelectedFile(null);
    setPassword("");
    setPasteUrl("");
    setBurnAfterReading(false);
    setExpiration("1h");
    setLanguage("text");
  };

  if (pasteUrl) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center">
              <Shield className="mr-2 h-8 w-8 text-neon-green" />
              <h1 className="text-4xl font-bold hacking-text">
                CipherBin
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Your secure {selectedFile ? 'file' : 'paste'} has been created!
            </p>
          </div>

          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="flex items-center text-neon-green">
                <Shield className="mr-2 h-5 w-5" />
                {selectedFile ? 'File' : 'Paste'} Created Successfully
              </CardTitle>
              <CardDescription>
                Share this link with anyone who needs access to your encrypted content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Your Secure {selectedFile ? 'File' : 'Paste'} URL</Label>
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
                  Save this URL - it contains the decryption key and cannot be recovered once lost
                </p>
              </div>
              <Alert className="border-terminal-border bg-code-bg">
                <AlertTitle>Keep this link safe</AlertTitle>
                <AlertDescription>
                  We never store the decryption key. Anyone with this URL can decrypt the {selectedFile ? 'file' : 'paste'}.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={createAnother}
                  variant="outline"
                  className="border-terminal-border hover:bg-neon-green/10"
                >
                  Create Another {selectedFile ? 'File Share' : 'Paste'}
                </Button>
                <Button
                  onClick={() => window.open(pasteUrl, '_blank')}
                  className="neon-glow bg-neon-green text-primary-foreground hover:bg-neon-green/90"
                >
                  View {selectedFile ? 'File' : 'Paste'}
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
            <h1 className="text-4xl font-bold hacking-text">
              CipherBin
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Secure, encrypted, and anonymous paste and file sharing
          </p>
        </div>

        <Card className="terminal-window">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5 text-neon-green" />
              Create Encrypted {selectedFile ? 'File Share' : 'Paste'}
            </CardTitle>
            <CardDescription>
              Your content will be encrypted client-side before transmission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Type Selection */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!selectedFile ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setContent('');
                  }}
                  className="flex items-center gap-2"
                >
                  Text
                </Button>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant={selectedFile ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4" />
                      File (max 15MB)
                    </span>
                  </Button>
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
              </div>
            </div>

            {/* Drag & Drop area for files */}
            <div
              className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
                isDragActive ? 'border-neon-green bg-neon-green/5' : 'border-terminal-border'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Drag & drop a file or click to browse</p>
                  <p className="text-xs text-muted-foreground">
                    Up to 15MB. Files are encrypted locally before upload.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-terminal-border hover:bg-neon-green/10"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  {selectedFile && (
                    <div className="flex items-center gap-2 rounded-md border border-terminal-border px-3 py-1 text-sm">
                      <FileIcon className="h-4 w-4 text-neon-green" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected File Display */}
            {selectedFile && (
              <div className="p-4 border border-terminal-border rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileIcon className="w-8 h-8 text-neon-green" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Text Content - only show if no file selected */}
            {!selectedFile && (
              <div className="space-y-2">
                <Label htmlFor="content">Content to encrypt (max 500k characters)</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your text, code, or sensitive data here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] font-mono bg-code-bg border-terminal-border resize-none"
                />
              </div>
            )}

            {/* Language Selection - only for text */}
            {!selectedFile && (
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
                  <Label htmlFor="expiration">Expiration Time</Label>
                  <Select 
                    value={expiration} 
                    onValueChange={setExpiration}
                    disabled={burnAfterReading}
                  >
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* For files, show expiration selection differently */}
            {selectedFile && (
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration Time</Label>
                <Select 
                  value={expiration} 
                  onValueChange={setExpiration}
                  disabled={burnAfterReading}
                >
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
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="burn" className="flex items-center text-base font-medium">
                    <Flame className="mr-2 h-4 w-4 text-orange-500" />
                    Burn After Reading
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete the {selectedFile ? 'file' : 'paste'} after it's viewed once
                  </p>
                </div>
                <Switch
                  id="burn"
                  checked={burnAfterReading}
                  onCheckedChange={setBurnAfterReading}
                />
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
                placeholder={`Enter a password to protect this ${selectedFile ? 'file' : 'paste'} (optional)`}
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
              disabled={isSubmitting || (!content.trim() && !selectedFile)}
              className="w-full neon-glow bg-neon-green text-primary-foreground hover:bg-neon-green/90"
              size="lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              {isSubmitting ? "Encrypting..." : selectedFile ? "Encrypt & Upload File" : "Encrypt & Create Secure Paste"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasteCreator;
