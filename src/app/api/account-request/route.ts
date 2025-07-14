/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { sendEmail } from "@/lib/email";

// Validation schema for account request
const accountRequestSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  
  // Academic/Professional Information
  userType: z.enum(["STUDENT", "FACULTY", "STAFF", "RESEARCHER", "GUEST"]),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
  year: z.string().optional(),
  semester: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  course: z.string().optional(),
  designation: z.string().optional(),
  
  // Access Request Details
  reasonForAccess: z.string().min(10, "Please provide a detailed reason for access"),
  intendedUse: z.string().min(10, "Please describe how you intend to use the system"),
  requestedRole: z.enum(["CLUB_MEMBER", "DEPT_COORD", "RESOURCE_MANAGER"]).optional().default("CLUB_MEMBER"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    
    // Validate request data
    const validatedData = accountRequestSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // For now, we'll use a default tenant
    const defaultTenant = await db.tenant.findFirst();
    
    if (!defaultTenant) {
      return NextResponse.json(
        { error: "No tenant found. Please contact support." },
        { status: 500 }
      );
    }
    
    // Validate user type specific fields
    if (validatedData.userType === "STUDENT" && !validatedData.studentId) {
      return NextResponse.json(
        { error: "Student ID is required for students" },
        { status: 400 }
      );
    }
    
    if ((validatedData.userType === "FACULTY" || validatedData.userType === "STAFF") && !validatedData.employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required for faculty and staff" },
        { status: 400 }
      );
    }
    
    // Create a simplified account request record
    // For now, we'll just store the form data as JSON to be processed later
    const requestData = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phoneNumber: validatedData.phoneNumber,
      userType: validatedData.userType,
      studentId: validatedData.studentId,
      employeeId: validatedData.employeeId,
      year: validatedData.year,
      semester: validatedData.semester,
      department: validatedData.department,
      course: validatedData.course,
      designation: validatedData.designation,
      reasonForAccess: validatedData.reasonForAccess,
      intendedUse: validatedData.intendedUse,
      requestedRole: validatedData.requestedRole,
      status: "PENDING",
      tenantId: defaultTenant.id,
      submittedAt: new Date().toISOString(),
    };
    
    // For now, just log the request data
    console.log("📝 Account request submitted:", requestData);
    
    // Send notification email to admins
    try {
      const admins = await db.user.findMany({
        where: {
          tenantId: defaultTenant.id,
          role: { in: ["SUPER_ADMIN", "ORG_ADMIN"] },
          state: "ACTIVE",
        },
      });
      
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: "New Account Request Pending Review",
            text: `A new account request has been submitted by ${validatedData.firstName} ${validatedData.lastName} (${validatedData.email}) for ${validatedData.userType} access. Please review in the admin dashboard.`,
            html: `
              <h2>New Account Request</h2>
              <p>A new account request has been submitted and requires your review:</p>
              <ul>
                <li><strong>Name:</strong> ${validatedData.firstName} ${validatedData.lastName}</li>
                <li><strong>Email:</strong> ${validatedData.email}</li>
                <li><strong>User Type:</strong> ${validatedData.userType}</li>
                <li><strong>Department:</strong> ${validatedData.department}</li>
                <li><strong>Reason:</strong> ${validatedData.reasonForAccess}</li>
              </ul>
              <p>Please log in to the admin dashboard to review this request.</p>
            `,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
      // Don't fail the request if email fails
    }
    
    // Send confirmation email to user
    try {
      await sendEmail({
        to: validatedData.email,
        subject: "Account Request Submitted Successfully",
        text: `Your account request has been submitted successfully and is pending review. You will receive an email once your request has been processed.`,
        html: `
          <h2>Account Request Submitted</h2>
          <p>Dear ${validatedData.firstName},</p>
          <p>Your account request has been submitted successfully and is currently pending review by our administrators.</p>
          <p><strong>Request Details:</strong></p>
          <ul>
            <li><strong>User Type:</strong> ${validatedData.userType}</li>
            <li><strong>Department:</strong> ${validatedData.department}</li>
            <li><strong>Requested Role:</strong> ${validatedData.requestedRole}</li>
          </ul>
          <p>You will receive an email notification once your request has been reviewed and processed.</p>
          <p>If you have any questions, please contact support.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send user confirmation:", emailError);
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: "Account request submitted successfully",
      requestId: `req_${Date.now()}`,
    });
    
  } catch (error) {
    console.error("Account request submission error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
