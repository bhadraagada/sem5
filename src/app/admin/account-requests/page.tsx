"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building, 
  GraduationCap,
  Briefcase,
  FileText 
} from "lucide-react";

interface AccountRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: "STUDENT" | "FACULTY" | "STAFF" | "RESEARCHER" | "GUEST";
  studentId?: string;
  employeeId?: string;
  year?: string;
  semester?: string;
  department: string;
  course?: string;
  designation?: string;
  reasonForAccess: string;
  intendedUse: string;
  requestedRole: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REQUIRES_CLARIFICATION";
  submittedAt: string;
}

export default function AccountRequestsPage() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    void fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/account-requests");
      if (response.ok) {
        const data = await response.json() as { requests?: AccountRequest[] };
        setRequests(data.requests ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: "approve" | "reject" | "clarify") => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/account-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: reviewComment,
        }),
      });

      if (response.ok) {
        await fetchRequests();
        setSelectedRequest(null);
        setReviewComment("");
      } else {
        alert("Failed to process request");
      }
    } catch {
      alert("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      UNDER_REVIEW: { color: "bg-blue-100 text-blue-800", icon: Clock },
      APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
      REQUIRES_CLARIFICATION: { color: "bg-orange-100 text-orange-800", icon: FileText },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge className={`${config?.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "STUDENT":
        return <GraduationCap className="h-4 w-4" />;
      case "FACULTY":
      case "STAFF":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading account requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedRequest(null)}
            className="mb-4"
          >
            ← Back to Requests
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Review Account Request
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900">{selectedRequest.firstName} {selectedRequest.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedRequest.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedRequest.phoneNumber}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getUserTypeIcon(selectedRequest.userType)}
                  Academic/Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">User Type</label>
                  <p className="text-gray-900">{selectedRequest.userType}</p>
                </div>
                {selectedRequest.studentId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Student ID</label>
                    <p className="text-gray-900">{selectedRequest.studentId}</p>
                  </div>
                )}
                {selectedRequest.employeeId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Employee ID</label>
                    <p className="text-gray-900">{selectedRequest.employeeId}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {selectedRequest.department}
                  </p>
                </div>
                {selectedRequest.year && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Academic Year</label>
                    <p className="text-gray-900">{selectedRequest.year}</p>
                  </div>
                )}
                {selectedRequest.course && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Course</label>
                    <p className="text-gray-900">{selectedRequest.course}</p>
                  </div>
                )}
                {selectedRequest.designation && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Designation</label>
                    <p className="text-gray-900">{selectedRequest.designation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Request Details & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Access Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested Role</label>
                  <p className="text-gray-900">{selectedRequest.requestedRole}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reason for Access</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.reasonForAccess}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Intended Use</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.intendedUse}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Submitted</label>
                  <p className="text-gray-900">{new Date(selectedRequest.submittedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Comment
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add a comment about your decision..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction(selectedRequest.id, "approve")}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  
                  <Button
                    onClick={() => handleAction(selectedRequest.id, "reject")}
                    disabled={actionLoading}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  
                  <Button
                    onClick={() => handleAction(selectedRequest.id, "clarify")}
                    disabled={actionLoading}
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Request Clarification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Requests</h1>
        <p className="text-gray-600">Review and manage pending account requests</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600">There are no account requests to review at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getUserTypeIcon(request.userType)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.firstName} {request.lastName}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="text-gray-900 truncate">{request.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <p className="text-gray-900">{request.userType}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Department:</span>
                        <p className="text-gray-900">{request.department}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Submitted:</span>
                        <p className="text-gray-900">{new Date(request.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <span className="text-gray-600 text-sm">Reason:</span>
                      <p className="text-gray-900 text-sm line-clamp-2">{request.reasonForAccess}</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setSelectedRequest(request)}
                    variant="outline"
                    className="ml-4"
                  >
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
