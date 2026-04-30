import { Button } from "@/components/ui/button";
import { Sparkles, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="text-center px-6 max-w-lg mx-auto">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-black text-primary/20 leading-none mb-2">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          This page doesn't exist — but your next listing post does.
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          The page you were looking for has moved or never existed. Head back to your dashboard and keep creating.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setLocation("/dashboard")}
            size="lg"
            className="px-6"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button
            onClick={() => setLocation("/generate")}
            variant="outline"
            size="lg"
            className="px-6"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create a Post
          </Button>
        </div>

        {/* Back link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go back
        </button>
      </div>
    </div>
  );
}
