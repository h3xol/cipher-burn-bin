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

  return null;
};

export default DatabaseSelector;