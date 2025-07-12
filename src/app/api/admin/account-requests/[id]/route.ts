import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "clarify"]),
  comment: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    const userRole = session.user.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as unknown;
    const { action, comment } = actionSchema.parse(body);
    const requestId = params.id;

    // In a real app, you would:
    // 1. Find the account request by ID
    // 2. Update the status
    // 3. If approved, create/activate the user account
    // 4. Send notification email

    console.log(`📝 Account request ${requestId} ${action} by ${session.user.name}`, {
      action,
      comment,
      reviewedBy: session.user.id,
      reviewedAt: new Date().toISOString(),
    });

    // Mock request data for email (in real app, fetch from DB)
    const mockRequest = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@student.college.edu",
      userType: "STUDENT",
      department: "Computer Science",
    };

    // Send notification email to user
    try {
      let emailSubject = "";
      let emailContent = "";

      switch (action) {
        case "approve":
          emailSubject = "Account Request Approved";
          emailContent = `
            <h2>Account Request Approved</h2>
            <p>Dear ${mockRequest.firstName},</p>
            <p>Great news! Your account request has been approved.</p>
            <p>You can now sign in to the system using your Google account (${mockRequest.email}).</p>
            ${comment ? `<p><strong>Admin Note:</strong> ${comment}</p>` : ""}
            <p>Welcome to the College Resource Management System!</p>
          `;
          break;
        case "reject":
          emailSubject = "Account Request Declined";
          emailContent = `
            <h2>Account Request Declined</h2>
            <p>Dear ${mockRequest.firstName},</p>
            <p>We regret to inform you that your account request has been declined.</p>
            ${comment ? `<p><strong>Reason:</strong> ${comment}</p>` : ""}
            <p>If you have any questions or would like to submit a new request, please contact support.</p>
          `;
          break;
        case "clarify":
          emailSubject = "Account Request - Additional Information Required";
          emailContent = `
            <h2>Additional Information Required</h2>
            <p>Dear ${mockRequest.firstName},</p>
            <p>Your account request is under review, but we need some additional information.</p>
            ${comment ? `<p><strong>Required Information:</strong> ${comment}</p>` : ""}
            <p>Please provide the requested information by replying to this email or submitting a new request.</p>
          `;
          break;
      }

      await sendEmail({
        to: mockRequest.email,
        subject: emailSubject,
        text: emailContent.replace(/<[^>]*>/g, ""), // Strip HTML for text version
        html: emailContent,
      });
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`,
    });

  } catch (error) {
    console.error("Failed to process account request:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
