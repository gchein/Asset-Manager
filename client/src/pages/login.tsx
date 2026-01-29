import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left: Branding */}
      <div className="flex-1 bg-sidebar text-sidebar-foreground flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="text-white h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">SolarOps</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
            Powering the <br/>
            <span className="text-primary">Future</span> of Solar.
          </h1>
          <p className="text-xl text-sidebar-foreground/70 max-w-lg leading-relaxed">
            The all-in-one platform for solar engineering, installation management, and roofing operations.
          </p>
        </div>

        <div className="z-10 text-sm text-sidebar-foreground/50">
          © 2024 SolarOps Inc. All rights reserved.
        </div>
      </div>

      {/* Right: Login */}
      <div className="lg:w-[600px] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
          </div>

          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
              <Button 
                size="lg" 
                className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                onClick={() => window.location.href = "/api/login"}
              >
                Sign in with Replit
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
