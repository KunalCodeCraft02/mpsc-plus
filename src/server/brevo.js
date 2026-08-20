import { HttpError } from "./auth";

/**
 * Brevo transactional email — server only.
 *
 * Nothing in this file may ever be imported from client code: the API key is
 * read from a non-public environment variable and the request is made from the
 * Node.js runtime, so the key never reaches the browser, the Capacitor WebView
 * or the APK. Native `fetch` is used so no extra dependency is required.
 */
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function brevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "MPSC Pulse";
  if (!apiKey || !senderEmail) {
    throw new Error("Brevo email server configuration is required");
  }
  return { apiKey, senderEmail, senderName };
}

async function sendEmail({ to, name, subject, htmlContent, textContent }) {
  const { apiKey, senderEmail, senderName } = brevoConfig();

  let response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to, ...(name ? { name } : {}) }],
        subject,
        htmlContent,
        textContent,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpError(502, "Could not reach the email service. Please try again.");
  }

  if (!response.ok) {
    // Log the status only — never the API key, the recipient or the code.
    const detail = await response.text().catch(() => "");
    console.error("[brevo] send failed", response.status, detail.slice(0, 300));
    throw new HttpError(502, "We could not send the verification email. Please try again.");
  }
}

const BRAND = "#5b34e0";

function otpHtml({ code, minutes, heading, intro }) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#eaf0f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:${BRAND};padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.2px;">MPSC Pulse</span>
          <span style="color:#d9d0ff;font-size:12px;display:block;margin-top:2px;">Pulse of MPSC</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 10px;font-size:19px;font-weight:700;">${heading}</h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#475569;">${intro}</p>
          <div style="text-align:center;margin:0 0 20px;">
            <div style="display:inline-block;padding:14px 26px;border-radius:12px;background:#f1ecff;border:1px solid #d9d0ff;font-size:30px;font-weight:700;letter-spacing:8px;color:${BRAND};">${code}</div>
          </div>
          <p style="margin:0 0 8px;font-size:13px;line-height:21px;color:#475569;">
            This code expires in <strong>${minutes} minutes</strong> and can be used only once.
          </p>
          <p style="margin:0;font-size:13px;line-height:21px;color:#b4232a;">
            <strong>Security notice:</strong> never share this code with anyone. MPSC Pulse staff will never ask you for it.
          </p>
          <p style="margin:20px 0 0;font-size:12px;line-height:20px;color:#94a3b8;">
            If you did not request this code you can safely ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;background:#f8fafc;font-size:11.5px;color:#94a3b8;">
          This is an automated message from MPSC Pulse. Please do not reply.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function otpText({ code, minutes, heading, intro }) {
  return [
    `MPSC Pulse — ${heading}`,
    "",
    intro,
    "",
    `Verification code: ${code}`,
    `This code expires in ${minutes} minutes and can be used only once.`,
    "",
    "Security notice: never share this code with anyone.",
    "If you did not request this code you can safely ignore this email.",
  ].join("\n");
}

/** Deliver a signup / password-reset verification code through Brevo. */
export async function sendOtpEmail({ to, name, code, minutes, purpose }) {
  const reset = purpose === "RESET";
  const heading = reset ? "Password Reset Verification" : "Email Verification";
  const intro = reset
    ? "Use the code below to reset your MPSC Pulse password."
    : "Use the code below to verify your email address and finish creating your MPSC Pulse account.";

  await sendEmail({
    to,
    name,
    subject: `${code} is your MPSC Pulse verification code`,
    htmlContent: otpHtml({ code, minutes, heading, intro }),
    textContent: otpText({ code, minutes, heading, intro }),
  });
}
