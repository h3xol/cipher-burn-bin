import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Database, Settings, Check, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getDatabaseProvider, 
  setDatabaseProvider, 
  configurePostgres, 
  getPostgresConfig,
  type DatabaseProvider 
} from "@/lib/database";

const DatabaseSelector = () => {
  const [provider, setProvider] = useState<DatabaseProvider>(getDatabaseProvider());
  const [postgresUrl, setPostgresUrl] = useState(getPostgresConfig() || 'http://localhost:3001/api');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleProviderChange = (newProvider: DatabaseProvider) => {
    if (newProvider === 'postgres' && !getPostgresConfig()) {
      toast({
        title: "Configuration Required",
        description: "Please configure PostgreSQL API URL first",
        variant: "destructive",
      });
      return;
    }

    setDatabaseProvider(newProvider);
    toast({
      title: "Database Provider Changed",
      description: `Switched to ${newProvider === 'supabase' ? 'Supabase' : 'PostgreSQL'}`,
    });
  };

  const handlePostgresConfig = () => {
    if (!postgresUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid PostgreSQL API URL",
        variant: "destructive",
      });
      return;
    }

    configurePostgres(postgresUrl);
    toast({
      title: "PostgreSQL Configured",
      description: "PostgreSQL API URL has been saved",
    });
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Database className="h-4 w-4" />
            {provider === 'supabase' ? 'Supabase' : 'PostgreSQL'}
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Configuration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Database Provider</Label>
              <RadioGroup 
                value={provider} 
                onValueChange={(value) => setProvider(value as DatabaseProvider)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="supabase" id="supabase" />
                  <div className="flex-1">
                    <Label htmlFor="supabase" className="font-medium">Supabase</Label>
                    <p className="text-sm text-muted-foreground">
                      Managed backend with built-in features
                    </p>
                  </div>
                  {provider === 'supabase' && <Check className="h-4 w-4 text-green-500" />}
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="postgres" id="postgres" />
                  <div className="flex-1">
                    <Label htmlFor="postgres" className="font-medium">PostgreSQL</Label>
                    <p className="text-sm text-muted-foreground">
                      Self-hosted PostgreSQL database
                    </p>
                  </div>
                  {provider === 'postgres' && <Check className="h-4 w-4 text-green-500" />}
                </div>
              </RadioGroup>
            </div>

            {provider === 'postgres' && (
              <div className="space-y-3">
                <Label htmlFor="postgres-url">PostgreSQL API URL</Label>
                <Input
                  id="postgres-url"
                  placeholder="http://localhost:3001/api"
                  value={postgresUrl}
                  onChange={(e) => setPostgresUrl(e.target.value)}
                />
                <Button onClick={handlePostgresConfig} className="w-full">
                  <Server className="mr-2 h-4 w-4" />
                  Save PostgreSQL Config
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => handleProviderChange(provider)}
                className="flex-1"
                disabled={provider === getDatabaseProvider()}
              >
                Apply Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseSelector;