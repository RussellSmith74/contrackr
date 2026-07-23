import { createClient } from "@supabase/supabase-js";

// Notification types that are worth an email. Likes are intentionally excluded —
// too frequent, would spam inboxes.
const EMAILABLE_TYPES = new Set(["message", "bid", "comment", "review"]);

const SITE_URL = "https://contrakr.com";

interface NotificationRecord {
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: { link?: string } | null;
}

function emailTemplate({
  name,
  title,
  body,
  link,
}: {
  name: string | null;
  title: string;
  body: string | null;
  link: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
            <tr>
              <td style="background:#0A1628;padding:20px 28px;">
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Contrakr</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 6px;color:#0F172A;font-size:18px;font-weight:700;line-height:1.35;">${title}</p>
                ${body ? `<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">${body}</p>` : ""}
                <a href="${link}" style="display:inline-block;background:#1E6FFF;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">View on Contrakr</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid #F1F5F9;">
                <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.5;">
                  You're receiving this because you have an account on Contrakr${name ? `, ${name}` : ""}.
                  This is an automated message — please don't reply.
                  Manage your account at <a href="${SITE_URL}/settings" style="color:#64748B;">contrakr.com/settings</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(request: Request) {
  // Only accept calls carrying the shared secret (set on the Supabase webhook).
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.NOTIFICATION_WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: { record?: NotificationRecord } & Partial<NotificationRecord>;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  // Supabase webhooks send { type, table, record, old_record }. Fall back to a
  // flat body so the route is also easy to call directly.
  const record: NotificationRecord | undefined = payload.record ?? (payload as NotificationRecord);
  if (!record?.user_id || !EMAILABLE_TYPES.has(record.type)) {
    return Response.json({ skipped: "not emailable" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", record.user_id)
    .single();

  if (!profile?.email) {
    return Response.json({ skipped: "no email on file" });
  }

  const link = record.data?.link ? `${SITE_URL}${record.data.link}` : `${SITE_URL}/feed`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Contrakr <noreply@contrakr.com>",
      to: profile.email,
      subject: record.title,
      html: emailTemplate({
        name: profile.full_name,
        title: record.title,
        body: record.body,
        link,
      }),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: 502 });
  }

  return Response.json({ sent: true });
}
