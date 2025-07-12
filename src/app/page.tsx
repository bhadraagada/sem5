import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/server/auth";
import { Calendar, Settings, Users } from "lucide-react";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.state !== "ACTIVE") {
    redirect("/pending");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                College Resource Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {session.user.name} ({session.user.role})
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Calendar
              </CardTitle>
              <CardDescription>
                View and manage resource bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Calendar</Button>
            </CardContent>
          </Card>

          {(session.user.role === "ORG_ADMIN" || session.user.role === "SUPER_ADMIN") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Approve users and manage permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Manage Users</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure your account and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                This is a multi-tenant resource management system for colleges.
                Here&apos;s what you can do based on your role:
              </p>

              <div className="mt-4 space-y-4">
                {session.user.role === "SUPER_ADMIN" && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-900">Super Admin</h3>
                    <p className="text-purple-700">
                      You have full system access and can manage all organizations.
                    </p>
                  </div>
                )}

                {session.user.role === "ORG_ADMIN" && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900">Organization Admin</h3>
                    <p className="text-blue-700">
                      You can approve new users, manage roles, and oversee all resources in your organization.
                    </p>
                  </div>
                )}

                {session.user.role === "DEPT_HOD" && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900">Department Head</h3>
                    <p className="text-green-700">
                      You can manage resources within your department and approve bookings.
                    </p>
                  </div>
                )}

                {(session.user.role === "DEPT_COORD" || session.user.role === "RESOURCE_MANAGER") && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-900">
                      {session.user.role === "DEPT_COORD" ? "Department Coordinator" : "Resource Manager"}
                    </h3>
                    <p className="text-yellow-700">
                      You can book resources and manage specific resources within your scope.
                    </p>
                  </div>
                )}

                {session.user.role === "CLUB_MEMBER" && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Club Member</h3>
                    <p className="text-gray-700">
                      You can view available resources and make booking requests.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
