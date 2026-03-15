import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { getSession } from "@/lib/auth";
import { PrintButton } from "@/components/organisms/print-button";
import {
  CheckCircle2,
  Calendar,
  Phone,
  User,
  MapPin,
  Shield,
} from "lucide-react";
import Image from "next/image";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return notFound();
  }

  const verification = await db.query.ninVerifications.findFirst({
    where: (table, { eq, and }) =>
      and(eq(table.id, id), eq(table.userId, session.userId)),
  });

  if (!verification) {
    return notFound();
  }

  // Extract data from rawResponse
  const rawData = verification.rawResponse as Record<string, unknown> | null;
  const details = (rawData?.data as Record<string, unknown>) || {};
  const address = (details.address as Record<string, unknown>) || {};

  const fullName = verification.fullName || "-";
  const dateOfBirth = verification.dateOfBirth || "-";
  const phone = verification.phone || "-";
  const gender = (details.gender as string) || "-";
  const imageUrl = (details.image as string) || null;
  const addressLine =
    [
      address.addressLine as string,
      address.town as string,
      address.lga as string,
      address.state as string,
    ]
      .filter(Boolean)
      .join(", ") || "-";

  const verificationDate = verification.createdAt
    ? new Date(verification.createdAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Header - Hidden on print */}
      <div className="rounded-3xl border border-border/70 bg-white/90 p-6 shadow-card print:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
          Verification Document
        </p>
        <h1 className="font-heading text-3xl font-semibold">
          NIN Verification Result
        </h1>
        <p className="text-sm text-muted-foreground">
          Official verification document for banking, education, travel, and
          other purposes.
        </p>
      </div>

      {/* Professional Document - This will be the only thing visible when printing */}
      <div className="bg-white shadow-lg print:shadow-none print:block">
        {/* Document Header */}
        <div className="relative overflow-hidden border-b-4 border-primary bg-gradient-to-r from-primary/5 to-accent/5 p-8 print:border-b-2">
          <Image
            src="/images/naija.png"
            alt=""
            width={160}
            height={160}
            aria-hidden="true"
            unoptimized
            className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 opacity-10 print:opacity-20"
          />
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white shadow-md">
                  <Image
                    src="/images/logo-mark.svg"
                    alt="VerifyNIN logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <Image
                    src="/images/logo-wordmark.svg"
                    alt="VerifyNIN wordmark"
                    width={160}
                    height={42}
                    className="h-7 w-auto"
                  />
                  <p className="text-xs text-muted-foreground">
                    Official Verification Document
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                National Identity Number Verification Service
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Document ID: {verification.id}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-2">
                  Verified by
                </p>
                <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-md">
                  <Image
                    src="/images/nimc.png"
                    alt="NIMC - National Identity Management Commission"
                    width={140}
                    height={140}
                    priority
                    unoptimized
                    className="h-24 w-24 object-contain"
                  />
                </div>
                <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mt-2">
                  NIMC Official
                </p>
              </div>

              <div className="print:hidden mt-2">
                <PrintButton />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-emerald-50 px-8 py-4 print:bg-emerald-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 print:bg-emerald-200">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">
                VERIFICATION SUCCESSFUL
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <span>
                  This NIN has been verified against official identity records
                </span>
                <Image
                  src="/images/nimc.png"
                  alt="NIMC logo"
                  width={18}
                  height={18}
                  unoptimized
                  className="h-4 w-4 object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 print:p-12">
          {/* Candidate Information */}
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <User className="h-5 w-5 text-primary" />
              Candidate Information
            </h2>

            <div className="grid gap-6 md:grid-cols-[auto_1fr] print:grid-cols-[auto_1fr]">
              {/* Photo */}
              {imageUrl && (
                <div className="flex justify-center md:justify-start">
                  <div className="relative h-40 w-32 overflow-hidden rounded-lg border-2 border-border shadow-sm print:h-48 print:w-36">
                    <Image
                      src={imageUrl}
                      alt="Candidate Photo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-4 print:bg-gray-50">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </p>
                  <p className="text-base font-semibold text-foreground print:text-lg">
                    {fullName}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/30 p-4 print:bg-gray-50">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Date of Birth
                  </p>
                  <p className="text-base font-semibold text-foreground print:text-lg">
                    {dateOfBirth}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/30 p-4 print:bg-gray-50">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </p>
                  <p className="text-base font-semibold text-foreground print:text-lg">
                    {phone}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/30 p-4 print:bg-gray-50">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Gender
                  </p>
                  <p className="text-base font-semibold capitalize text-foreground print:text-lg">
                    {gender}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/30 p-4 print:bg-gray-50 sm:col-span-2 print:col-span-2">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Address
                  </p>
                  <p className="text-base font-semibold text-foreground print:text-lg">
                    {addressLine}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/30 p-4 print:bg-gray-50 sm:col-span-2 print:col-span-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    NIN (Masked for Privacy)
                  </p>
                  <p className="font-mono text-base font-semibold tracking-wider text-foreground print:text-lg">
                    {verification.ninMasked}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="mb-8 rounded-lg border border-border/70 bg-muted/20 p-6 print:bg-gray-50">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Verification Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Verification Date
                </p>
                <p className="mt-1 font-semibold">{verificationDate}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Verification Status
                </p>
                <p className="mt-1 font-semibold text-emerald-600">
                  {verification.status === "success" ? "VERIFIED" : "FAILED"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Provider Reference
                </p>
                <p className="mt-1 font-mono text-sm font-semibold">
                  {verification.providerReference || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Document ID
                </p>
                <p className="mt-1 font-mono text-sm font-semibold">
                  {verification.id}
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 print:bg-blue-50">
            <p className="text-sm font-semibold text-primary">
              Important Notice
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This document serves as proof of NIN verification. It has been
              verified against the National Identity Management Commission{" "}
              <Image
                src="/images/nimc.png"
                alt="NIMC logo"
                width={16}
                height={16}
                unoptimized
                className="inline-block h-4 w-4 align-text-bottom"
              />{" "}
              database. This document is valid for banking, education, travel,
              employment, and other official purposes. Keep this document safe
              and do not share with unauthorized persons.
            </p>
          </div>

          {/* Official Compliance Section */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-bold text-green-900">
                  Official Verification
                </p>
              </div>
              <p className="text-xs text-green-700">
                This verification document is accepted for banking, JAMB, WAEC,
                NECO, passport applications, employment verification, and other
                official purposes across Nigeria.
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src="/images/nimc.png"
                  alt="NIMC logo"
                  width={20}
                  height={20}
                  unoptimized
                  className="h-5 w-5 object-contain"
                />
                <p className="text-sm font-bold text-blue-900">Verified</p>
              </div>
              <p className="text-xs text-blue-700">
                Data verified directly from the official national identity
                database using authorized API access.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-border/70 pt-6 print:mt-12">
            <div className="text-center mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Verification Service Provided By
              </p>
              <p className="text-sm font-bold text-primary">VerifyNIN</p>
              <p className="text-xs text-muted-foreground">
                Authorized NIN Verification Service
              </p>
            </div>

            <div className="flex items-center justify-center gap-8 mb-4 text-xs text-muted-foreground">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <Image
                    src="/images/nimc.png"
                    alt="NIMC logo"
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5 object-contain"
                  />
                </div>
                <p className="text-[10px]">Verified Service</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <Image
                    src="/images/nimc.png"
                    alt="NIMC logo"
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5 object-contain"
                  />
                </div>
                <p className="text-[10px]">Verified Data</p>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Generated on{" "}
              {new Date().toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              For support, visit our website or contact support@verifynin.ng
            </p>
            <p className="mt-3 text-center text-xs font-semibold text-primary print:text-sm">
              This is an official verification document • Keep for your records
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
