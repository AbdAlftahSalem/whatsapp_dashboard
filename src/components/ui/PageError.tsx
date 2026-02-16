import * as React from "react";
import { XCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface PageErrorProps {
  error?: Error | unknown;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export function PageError({ 
  error, 
  onRetry, 
  title = "فشل تحميل البيانات", 
  message = "يرجى التحقق من اتصالك بالخادم والمحاولة مرة أخرى" 
}: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center relative">
        <XCircle className="w-8 h-8 text-destructive" />
        <div className="absolute inset-0 blur-2xl bg-destructive/20 rounded-full" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
        {error instanceof Error && (
          <p className="text-xs text-muted-foreground/50 font-mono mt-4 p-2 bg-muted rounded">
            {error.message}
          </p>
        )}
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2 group">
          <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
