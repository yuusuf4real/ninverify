"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Camera,
  FileText,
  Check,
  Fingerprint,
  ArrowRight,
  Info,
} from "lucide-react";

interface DataLayerSelectorProps {
  sessionToken: string;
  onSubmit: (nin: string, dataLayer: string, amount: number) => void;
  onBack: () => void;
}

type DataLayer = "demographic" | "biometric" | "full";

const dataLayers = [
  {
    id: "demographic" as DataLayer,
    title: "Demographic Data",
    description: "Basic identity information",
    icon: User,
    fields: ["Full Name", "Date of Birth", "Phone Number", "Gender"],
    price: 50000, // ₦500.00 in kobo
    displayPrice: "500.00",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "biometric" as DataLayer,
    title: "Biometric Data",
    description: "Identity with photo verification",
    icon: Camera,
    fields: [
      "Full Name",
      "Date of Birth",
      "Phone Number",
      "Gender",
      "Photo",
      "Signature",
    ],
    price: 75000, // ₦750.00 in kobo
    displayPrice: "750.00",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    id: "full" as DataLayer,
    title: "Complete Profile",
    description: "All available information",
    icon: FileText,
    fields: [
      "Full Name",
      "Date of Birth",
      "Phone Number",
      "Gender",
      "Photo",
      "Signature",
      "Full Address",
      "LGA",
      "State",
    ],
    price: 100000, // ₦1,000.00 in kobo
    displayPrice: "1,000.00",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
];

export function DataLayerSelector({
  sessionToken,
  onSubmit,
  onBack,
}: DataLayerSelectorProps) {
  const [nin, setNin] = useState("");
  const [selectedLayer, setSelectedLayer] = useState<DataLayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Format NIN input
  const handleNinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    const formatted = digits.replace(
      /(\d{3})(\d{4})(\d{0,4})/,
      (_, p1, p2, p3) => {
        if (p3) return `${p1} ${p2} ${p3}`;
        if (p2) return `${p1} ${p2}`;
        return p1;
      },
    );
    setNin(formatted);
  };

  const handleSubmit = async () => {
    if (!selectedLayer || nin.replace(/\s/g, "").length !== 11) {
      setError("Please enter a valid 11-digit NIN and select a data layer");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/v2/verification/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          nin: nin.replace(/\s/g, ""),
          dataLayer: selectedLayer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Submission failed");
      }

      const selectedLayerInfo = dataLayers.find(
        (layer) => layer.id === selectedLayer,
      );
      onSubmit(
        data.maskedNin,
        selectedLayer,
        selectedLayerInfo?.price || 50000,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const normalizedNin = nin.replace(/\s/g, "");
  const isNinValid = normalizedNin.length === 11;
  const canSubmit = isNinValid && selectedLayer && !loading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Fingerprint className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Enter NIN & Select Data</h2>
        <p className="text-muted-foreground">
          Enter the NIN you want to verify and choose what information you need
        </p>
      </div>

      {/* NIN Input */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="nin-input"
                className="text-sm font-semibold mb-2 block"
              >
                National Identity Number (NIN)
              </label>
              <Input
                id="nin-input"
                value={nin}
                onChange={(e) => handleNinChange(e.target.value)}
                placeholder="123 4567 8901"
                maxLength={13}
                className="h-14 text-lg tracking-wider text-center"
                disabled={loading}
              />
              <div className="flex items-center justify-between text-xs mt-2">
                <span
                  className={
                    isNinValid
                      ? "text-emerald-600 font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {normalizedNin.length}/11 digits
                </span>
                {isNinValid && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Check className="h-3 w-3" />
                    <span className="font-medium">Valid format</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Layer Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">
          Choose Information Level
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          {dataLayers.map((layer) => (
            <motion.div
              key={layer.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  selectedLayer === layer.id
                    ? `${layer.borderColor} border-2 ${layer.bgColor}`
                    : "border-border/50 hover:border-border"
                }`}
                onClick={() => setSelectedLayer(layer.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${layer.color} text-white`}
                      >
                        <layer.icon className="h-6 w-6" />
                      </div>
                      {selectedLayer === layer.id && (
                        <div className="p-1 rounded-full bg-primary text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Title & Price */}
                    <div>
                      <h4 className="font-bold text-lg">{layer.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {layer.description}
                      </p>
                      <p className="text-2xl font-bold text-primary mt-2">
                        ₦{layer.displayPrice}
                      </p>
                    </div>

                    {/* Fields */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Includes:
                      </p>
                      <div className="space-y-1">
                        {layer.fields.map((field, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">
                Payment & Verification Process
              </p>
              <p>
                After selecting your data layer, you&apos;ll be redirected to
                secure payment. Once payment is confirmed, we&apos;ll verify the
                NIN with NIMC and display only the information you selected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              Proceed to Payment
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
