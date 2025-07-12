import { SignInButton } from "@/components/auth/sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to College Resources</CardTitle>
          <CardDescription>
            Sign in with your Google account to access the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInButton />
          <p className="text-sm text-muted-foreground text-center">
            New users will be in pending status until approved by an administrator
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
