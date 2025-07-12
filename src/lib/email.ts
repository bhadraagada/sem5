import { db } from "@/server/db";

interface NewUser {
  id: string;
  email: string;
  name: string | null;
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send email using configured email service
 * TODO: Replace with actual email service (Resend, SendGrid, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For now, just log the email - replace with actual email service
    console.log(`📧 Email would be sent:`, {
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    // TODO: Replace with actual email sending logic
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@yourcollege.edu',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html || options.text,
    // });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Send notification to org admins when a new user signs up
 */
export async function sendOrgAdminNotification(
  tenantId: string,
  newUser: NewUser,
) {
  try {
    // Find all org admins for this tenant
    const orgAdmins = await db.user.findMany({
      where: {
        tenantId,
        role: "ORG_ADMIN",
        state: "ACTIVE",
      },
    });

    // In a real app, you would use a service like Resend, SendGrid, or AWS SES
    // For now, we'll just log the notification
    console.log(`📧 New user signup notification:`, {
      newUser: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      orgAdmins: orgAdmins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        name: admin.name,
      })),
    });

    // TODO: Replace with actual email sending logic
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@yourcollege.edu',
    //   to: orgAdmins.map(admin => admin.email),
    //   subject: 'New User Awaiting Approval',
    //   html: `
    //     <h2>New User Registration</h2>
    //     <p>A new user has signed up and is awaiting approval:</p>
    //     <ul>
    //       <li><strong>Name:</strong> ${newUser.name}</li>
    //       <li><strong>Email:</strong> ${newUser.email}</li>
    //     </ul>
    //     <p>Please log in to approve or reject this user.</p>
    //   `,
    // });

    return true;
  } catch (error) {
    console.error("Failed to send org admin notification:", error);
    return false;
  }
}

/**
 * Send notification to user when their account is approved
 */
export async function sendUserApprovalNotification(
  userEmail: string,
  userName: string | null,
) {
  try {
    console.log(`📧 User approval notification sent to:`, {
      email: userEmail,
      name: userName,
    });

    // TODO: Replace with actual email sending logic
    return true;
  } catch (error) {
    console.error("Failed to send user approval notification:", error);
    return false;
  }
}
