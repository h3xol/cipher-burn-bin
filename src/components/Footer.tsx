import { Github, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CipherBin. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open("https://discord.gg/yourserver", "_blank")}
            >
              <MessageSquare className="h-4 w-4" />
              Discord
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open("https://github.com/h3xol/", "_blank")}
            >
              <Github className="h-4 w-4" />
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;