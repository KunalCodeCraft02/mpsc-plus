"use client";

import Link from "next/link";
import { MessageCircleQuestion, ShieldCheck, CreditCard, BookOpen, CircleHelp, Mail, ArrowRight } from "lucide-react";
import { StudentShell } from "@/components/layout/StudentShell";
import { Card, SectionHeader, Badge, Button } from "@/components/ui";

const faq = [
  {
    title: "Why is my payment pending?",
    body: "Razorpay may still be processing the payment. Please wait a few moments and then check your payment status from this page.",
  },
  {
    title: "Payment deducted but course not unlocked?",
    body: "Your payment may still be verifying. Please wait while we confirm the transaction and then refresh the course page.",
  },
  {
    title: "I am unable to access a paid course.",
    body: "Check whether your purchase was completed successfully and contact support if the course remains locked after verification.",
  },
  {
    title: "I have a login or OTP problem.",
    body: "Please recheck your email, mobile number and OTP expiry window. If the issue continues, use the support contact below.",
  },
];

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || "";

export default function SupportPage() {
  return (
    <StudentShell title="Help & Support" wide>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <SectionHeader title="Payment Help" icon={CreditCard} />
            <div className="space-y-3 text-[13.5px] text-slate-700">
              <p>We use Razorpay-secured checkout for all paid course purchases.</p>
              <p className="font-semibold text-ink">If your money is deducted but the course is still locked, your payment may still be processing.</p>
              <p>Please wait while we verify the payment, then refresh the course page or contact our support team.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button as={Link} href="/courses" variant="outline" rightIcon={ArrowRight}>Browse courses</Button>
              {supportEmail ? <Button as={Link} href={`mailto:${supportEmail}`}>Contact Support</Button> : null}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Course Access Help" icon={BookOpen} />
            <div className="space-y-3 text-[13.5px] text-slate-700">
              <p>Paid courses are unlocked only after successful payment confirmation.</p>
              <p>Access is verified on the server every time protected content is requested, so a local browser change cannot grant access.</p>
            </div>
          </Card>

          <Card>
            <SectionHeader title="FAQs" icon={MessageCircleQuestion} />
            <div className="space-y-3">
              {faq.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <p className="mb-1 text-[13px] font-bold text-ink">{item.title}</p>
                  <p className="text-[12.8px] leading-relaxed text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeader title="Need help?" icon={ShieldCheck} />
            <div className="space-y-3 text-[13.5px] text-slate-700">
              <p>For payment, login, OTP, or access issues, reach out with your email, mobile number and course name.</p>
              {supportEmail ? (
                <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-brand-700">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${supportEmail}`} className="font-semibold">{supportEmail}</a>
                </div>
              ) : (
                <p className="rounded-xl bg-slate-100 p-3 text-[12.8px] text-slate-600">
                  No public support email is configured yet. Please set SUPPORT_EMAIL / NEXT_PUBLIC_SUPPORT_EMAIL in the deployment environment.
                </p>
              )}
              <Badge tone="warning">Payment verification may take a few moments</Badge>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Quick checks" icon={CircleHelp} />
            <ul className="space-y-2 text-[12.8px] text-slate-600">
              <li>• Confirm the email used to log in</li>
              <li>• Check whether the course is already purchased</li>
              <li>• Refresh the course page after payment</li>
              <li>• Retry only after the payment status is marked as failed or cancelled</li>
            </ul>
          </Card>
        </div>
      </div>
    </StudentShell>
  );
}
