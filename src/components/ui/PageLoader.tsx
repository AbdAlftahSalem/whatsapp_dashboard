import * as React from "react";
import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "جاري التحميل..." }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
      </div>
      <p className="text-muted-foreground animate-pulse font-medium">{message}</p>
    </div>
  );
}
