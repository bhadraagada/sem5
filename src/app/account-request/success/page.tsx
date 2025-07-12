import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccountRequestSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Request Submitted Successfully!</CardTitle>
            <CardDescription className="text-lg">
              Your account access request has been received and is now under review.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Clock className="h-6 w-6 text-blue-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
                  <ol className="list-decimal list-inside space-y-2 text-blue-700">
                    <li>Your request will be reviewed by the department administrators</li>
                    <li>Additional documents may be requested if needed</li>
                    <li>You&apos;ll receive an email notification once your request is processed</li>
                    <li>Upon approval, you&apos;ll gain access to the resource management system</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-yellow-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700">
                    <li>Keep your supporting documents ready for upload if requested</li>
                    <li>Review processing typically takes 2-3 business days</li>
                    <li>You&apos;ll receive updates via the email address you provided</li>
                    <li>Contact the IT department if you don&apos;t hear back within 5 business days</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/signin" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
              
              <Link href="/account-request" className="flex-1">
                <Button className="w-full">
                  Submit Another Request
                </Button>
              </Link>
            </div>

            <div className="text-center text-sm text-gray-600 pt-4 border-t">
              <p>
                Need help? Contact the IT Support team at{" "}
                <a href="mailto:support@college.edu" className="text-blue-600 hover:underline">
                  support@college.edu
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
