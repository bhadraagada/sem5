import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Clock, Mail } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account has been created successfully and is awaiting approval from an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex">
              <Mail className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  What happens next?
                </p>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  We&apos;ve notified the administrators about your registration.
                  You&apos;ll receive an email once your account is approved.
                </p>
              </div>
            </div>
          </div>

          <SignOutButton className="w-full" />

          <p className="text-xs text-gray-500 text-center">
            If you have any questions, please contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
