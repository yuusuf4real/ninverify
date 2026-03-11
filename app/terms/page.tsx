export default function TermsPage() {
  return (
    <div className="container py-16">
      <div className="space-y-10">
        <header className="rounded-3xl border border-border/70 bg-white/90 p-8 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
            Service Terms
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            These terms govern your access to VerifyNIN and the services used to fund
            your wallet, verify NINs, and generate official verification documents. By using the
            platform, you agree to these terms.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">Effective: March 3, 2026</span>
            <span className="rounded-full bg-muted px-3 py-1">Governing law: Nigeria</span>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Eligibility and accounts</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>You must be 18+ or have valid authorization to use this service.</li>
              <li>Provide accurate, current information when creating an account.</li>
              <li>
                You are responsible for safeguarding your login credentials and wallet
                access.
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Service description</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              VerifyNIN provides NIN verification for banking, education, travel, employment,
              and other official purposes. Verification results are returned from authorized partners and
              depend on the accuracy and availability of NIMC records.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              VerifyNIN is an independent service and is not endorsed by any government agency.
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Consent and authorized use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                You must obtain explicit consent from the candidate before verifying a
                NIN.
              </li>
              <li>Do not submit NINs you are not authorized to verify.</li>
              <li>
                You agree to comply with applicable data protection laws, NIMC policies,
                and other relevant regulations.
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Wallet, pricing, and refunds</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Wallet funding is processed through Paystack.</li>
              <li>
                The current verification fee is NGN 500 per NIN check (subject to
                change).
              </li>
              <li>Failed verifications trigger an automatic wallet refund.</li>
              <li>
                Refund timing for card or bank reversals follows Paystack timelines and
                your bank policies.
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Prohibited activities</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Using the service to commit fraud or identity theft.</li>
              <li>Attempting to bypass security or rate limits.</li>
              <li>Uploading malware or interfering with platform availability.</li>
              <li>Misrepresenting your identity or authority to verify NINs.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Third-party services</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We rely on third-party providers for identity verification, payment
              processing, analytics, and hosting. Their terms and privacy policies also
              apply when you interact with those services.
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Availability and changes</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We aim for high availability but do not guarantee uninterrupted service.
              We may modify, suspend, or discontinue features with reasonable notice
              where possible.
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card">
            <h2 className="text-lg font-semibold">Liability and disclaimers</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The service is provided &quot;as is.&quot; We do not warrant that verification
              results will be accepted by third parties. To the maximum extent allowed
              by law, VerifyNIN is not liable for indirect or consequential damages.
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/80 p-6 shadow-card md:col-span-2">
            <h2 className="text-lg font-semibold">Termination, disputes, and contact</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We may suspend or terminate accounts for violations of these terms,
              suspected fraud, or security concerns. You may stop using the service at
              any time. Disputes shall be governed by the laws of the Federal Republic
              of Nigeria and resolved in Nigerian courts.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Support:</span>{" "}
                support@verifynin.ng
              </p>
              <p>
                <span className="font-semibold text-foreground">Billing:</span>{" "}
                billing@verifynin.ng
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
