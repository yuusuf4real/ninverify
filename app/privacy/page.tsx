export default function PrivacyPage() {
  return (
    <div className="container py-16">
      <div className="space-y-10">
        <header className="rounded-3xl border border-border/70 bg-white/90 p-8 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
            Privacy & Data Protection
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This policy explains how VerifyNIN collects, uses, and protects
            personal data when you create an account, fund your wallet, and
            verify NINs for banking, education, travel, and other purposes. We
            are committed to applicable data protection laws and regulations in
            Nigeria.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">
              Effective: March 3, 2026
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              Applies to VerifyNIN web + dashboard
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Scope and overview</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We collect only the data needed to verify NINs, process wallet
              payments, and provide receipts. Full NIN values are never stored
              in our database; we store masked NINs and the verification outcome
              instead.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Identity verification is performed via authorized third parties.
              </li>
              <li>
                We require explicit consent before any NIN verification request
                is sent.
              </li>
              <li>
                Transaction records are retained to support refunds, receipts,
                and audits.
              </li>
            </ul>
          </section>

          <aside className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Data controller</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              VerifyNIN is operated by its legal entity in Nigeria. Use the
              contacts below for privacy requests, complaints, or data
              protection inquiries.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Email:</span>{" "}
                privacy@verifynin.ng
              </p>
              <p>
                <span className="font-semibold text-foreground">DPO:</span>{" "}
                dpo@verifynin.ng
              </p>
              <p>
                <span className="font-semibold text-foreground">Phone:</span>{" "}
                +234 800 000 0000
              </p>
              <p>
                <span className="font-semibold text-foreground">Address:</span>{" "}
                Lagos, Nigeria
              </p>
            </div>
          </aside>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Information we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Account data: full name, email address, and phone number.</li>
              <li>
                Verification data: masked NIN, consent flag, verification
                status, and returned identity fields such as name, date of
                birth, and phone number.
              </li>
              <li>
                Transaction data: wallet balance, funding references, amounts,
                and refund records.
              </li>
              <li>
                Technical data: device identifiers, IP address, browser type,
                and log data required for security and fraud prevention.
              </li>
              <li>Support data: messages you send to our support team.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">How we use your data</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Create and secure your VerifyNIN account.</li>
              <li>
                Submit NIN checks to verification partners and return results.
              </li>
              <li>Process wallet funding, debits, and refunds.</li>
              <li>Generate receipts and transaction history.</li>
              <li>Prevent fraud, abuse, and unauthorized access.</li>
              <li>Comply with legal, regulatory, and audit obligations.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Legal bases</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Consent: required before any NIN verification is performed.
              </li>
              <li>
                Contract: to deliver verification, wallet, and receipt services.
              </li>
              <li>
                Legal obligation: to meet accounting, tax, and regulatory
                duties.
              </li>
              <li>
                Legitimate interests: service security, fraud prevention, and
                quality assurance.
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Sharing and processors</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Verification partners (e.g., YouVerify) to confirm NIN details
                with NIMC systems.
              </li>
              <li>
                Payment processors (e.g., Paystack) for wallet funding and
                refunds.
              </li>
              <li>Cloud hosting and database providers for secure storage.</li>
              <li>Regulators or law enforcement when legally required.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Data retention</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We retain data only for as long as needed to provide the service
              and meet legal obligations. Verification logs, transaction
              records, and receipts are kept for audit and dispute resolution.
              Raw verification responses are restricted and stored only when
              necessary for troubleshooting.
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Security safeguards</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We apply industry-standard safeguards including encryption in
              transit, access controls, monitoring, and least-privilege access.
              No security measure is perfect, but we continuously improve our
              controls.
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">International transfers</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Some service providers may process data outside Nigeria. When this
              occurs, we apply appropriate safeguards and contractual
              protections.
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Your rights</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Request access to or correction of your personal data.</li>
              <li>
                Request deletion, restriction, or portability where applicable.
              </li>
              <li>Withdraw consent for verification at any time.</li>
              <li>
                Lodge a complaint with the relevant data protection authority if
                concerns remain unresolved.
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card md:col-span-2">
            <h2 className="text-lg font-semibold">
              Children and sensitive data
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The service is intended for authorized users completing identity
              verification for various purposes. If a user is under 18, the
              account holder must have appropriate authorization or guardian
              consent. Do not submit NIN details without explicit permission.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              We will notify users of material updates to this policy. Continued
              use of the service after changes means you accept the revised
              policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
