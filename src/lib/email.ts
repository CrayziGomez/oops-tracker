import { BrevoClient } from "@getbrevo/brevo";

const apiKey = process.env.OOPS_BREV_KEY || "";
const client = new BrevoClient({ apiKey });

const senderName = process.env.BREVO_SENDER_NAME || "OOPS Tracker";
const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@oops.2bso.com";

export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
}: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}) {
  if (!apiKey) {
    console.warn("OOPS_BREV_KEY is not set. Email will not be sent.");
    return null;
  }

  try {
    const response = await client.transactionalEmails.sendTransacEmail({
      subject,
      sender: { name: senderName, email: senderEmail },
      to,
      htmlContent,
      textContent: textContent || undefined,
    });
    
    console.log("Email sent successfully. Message ID:", response.messageId);
    return response;
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    throw error;
  }
}

/**
 * Helper to send an invitation email to a new user.
 */
export async function sendInvitationEmail(email: string, projectName: string, inviteUrl: string) {
  return sendEmail({
    to: [{ email }],
    subject: `Invitation to join ${projectName} on OOPS`,
    htmlContent: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h1>You've been invited!</h1>
        <p>You have been invited to join the project <strong>${projectName}</strong> on the OOPS Issue Tracker.</p>
        <p>Click the button below to accept the invitation and set up your account:</p>
        <div style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
        </div>
        <p style="font-size: 0.9em; color: #666;">If you did not expect this invitation, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Helper to notify a user about an issue update.
 */
export async function sendIssueNotification({
  to,
  issueTitle,
  action,
  issueUrl,
}: {
  to: string;
  issueTitle: string;
  action: string;
  issueUrl: string;
}) {
  return sendEmail({
    to: [{ email: to }],
    subject: `[OOPS] Issue Update: ${issueTitle}`,
    htmlContent: `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h3>Issue Update</h3>
        <p>The issue <strong>"${issueTitle}"</strong> has been <strong>${action}</strong>.</p>
        <div style="margin: 20px 0;">
          <a href="${issueUrl}" style="color: #0070f3; text-decoration: underline;">View Issue Details</a>
        </div>
      </div>
    `,
  });
}
