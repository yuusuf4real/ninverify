import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="container py-16">
      <div className="space-y-10">
        <header className="rounded-3xl border border-border/70 bg-white/90 p-8 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
            Help & Support
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">Support</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We&apos;re here to keep your NIN verification workflow smooth. Reach out with
            account issues, billing questions, or verification concerns and we&apos;ll guide
            you through the next steps.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">Primary: Email support</span>
            <span className="rounded-full bg-muted px-3 py-1">Coverage: WAT</span>
          </div>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Homepage
            </Link>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Contact support</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Email is the fastest way to get help. Please include your account email
              and any relevant transaction references.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Email:</span>{" "}
                support@verifynin.ng
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Security guidance</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Never send your full NIN or password by email or chat.</li>
              <li>Only share the masked NIN shown in your transaction history.</li>
              <li>Our team will never ask for your OTP or Paystack PIN.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Compliance requests</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              For data access, deletion, or data protection-related requests, email our
              Data Protection Officer with your account email and a brief description of
              the request.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">DPO:</span>{" "}
              dpo@verifynin.ng
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
