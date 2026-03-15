"use client";

import { useState, useEffect } from "react";

import {
  CreditCard,
  CheckCircle,
  Lock,
  FileText,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface TicketCreationWizardProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  onComplete: (ticketId: string) => void;
  onCancel: () => void;
}

interface WizardData {
  category: string;
  subcategory: string;
  description: string;
  urgency: string;
  contactPreferences: string[];
  relatedTransaction?: string;
  relatedVerification?: string;
}

const CATEGORIES = [
  {
    id: "payment_issue",
    title: "Payment Issue",
    icon: CreditCard,
    description: "Money deducted, refunds, payment problems",
    color: "text-red-500",
  },
  {
    id: "verification_problem",
    title: "Verification Problem",
    icon: CheckCircle,
    description: "NIN verification failed or stuck",
    color: "text-blue-500",
  },
  {
    id: "account_access",
    title: "Account Access",
    icon: Lock,
    description: "Login issues, password problems",
    color: "text-orange-500",
  },
  {
    id: "technical_support",
    title: "Technical Support",
    icon: FileText,
    description: "App errors, technical problems",
    color: "text-purple-500",
  },
  {
    id: "general_inquiry",
    title: "Other Question",
    icon: HelpCircle,
    description: "General questions and help",
    color: "text-green-500",
  },
];

export function TicketCreationWizard({
  user,
  onComplete,
  onCancel,
}: TicketCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    category: "",
    subcategory: "",
    description: "",
    urgency: "medium",
    contactPreferences: ["email"],
  });

  const steps = [
    { id: "category", title: "Issue Category", component: CategoryStep },
    { id: "subcategory", title: "Issue Details", component: SubcategoryStep },
    { id: "context", title: "Context Collection", component: ContextStep },
    { id: "details", title: "Additional Details", component: DetailsStep },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!wizardData.category;
      case 1:
        return !!wizardData.subcategory;
      case 2:
        return true; // Context step is optional
      case 3:
        return wizardData.description.length > 10;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wizardData),
      });

      if (!response.ok) throw new Error("Failed to create ticket");

      const { ticketId } = await response.json();
      onComplete(ticketId);
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${
                  index <= currentStep
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }
              `}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                  w-16 h-0.5 mx-2
                  ${index < currentStep ? "bg-blue-500" : "bg-gray-200"}
                `}
                />
              )}
            </div>
          ))}
        </div>
        <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          <CurrentStepComponent
            data={wizardData}
            onChange={setWizardData}
            user={user}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handleBack}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? "Cancel" : "Back"}
        </Button>

        <Button onClick={handleNext} disabled={!canProceed() || loading}>
          {loading ? (
            "Creating..."
          ) : currentStep === steps.length - 1 ? (
            "Submit Ticket"
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
// Step Components
function CategoryStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (data: WizardData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-2">How can we help you today?</h3>
        <p className="text-gray-600">
          We&apos;re here to resolve your issue quickly and efficiently
        </p>
      </div>

      <div className="grid gap-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                data.category === category.id
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() =>
                onChange({ ...data, category: category.id, subcategory: "" })
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Icon className={`h-8 w-8 ${category.color}`} />
                  <div className="flex-1">
                    <h4 className="font-medium">{category.title}</h4>
                    <p className="text-sm text-gray-600">
                      {category.description}
                    </p>
                  </div>
                  {data.category === category.id && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SubcategoryStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (data: WizardData) => void;
}) {
  const getSubcategories = () => {
    switch (data.category) {
      case "payment_issue":
        return [
          {
            id: "money_deducted_not_in_wallet",
            title: "Money deducted but not in wallet",
            description:
              "We can check this automatically with your payment reference",
          },
          {
            id: "verification_failed_but_charged",
            title: "Verification failed but I was charged",
            description:
              "Failed verifications are automatically refunded within 24 hours",
          },
          {
            id: "refund_not_received",
            title: "I haven't received my refund",
            description: "Refunds typically take 3-5 business days to process",
          },
          {
            id: "payment_method_declined",
            title: "Payment method was declined",
            description: "We can help you try alternative payment methods",
          },
          {
            id: "other_payment_issue",
            title: "Other payment-related issue",
            description: "",
          },
        ];
      case "verification_problem":
        return [
          {
            id: "nin_not_found",
            title: "NIN not found or invalid",
            description: "Double-check your NIN and try again",
          },
          {
            id: "verification_stuck",
            title: "Verification is stuck or taking too long",
            description: "We can check the status for you",
          },
          {
            id: "document_receipt_issue",
            title: "Problem with verification document/receipt",
            description: "Issues downloading or accessing your verification",
          },
          {
            id: "other_verification_issue",
            title: "Other verification problem",
            description: "",
          },
        ];
      case "account_access":
        return [
          {
            id: "login_password_issue",
            title: "Login or password problem",
            description: "Can't access your account",
          },
          {
            id: "account_locked",
            title: "Account is locked or suspended",
            description: "Your account access has been restricted",
          },
          {
            id: "other_access_issue",
            title: "Other account access issue",
            description: "",
          },
        ];
      case "technical_support":
        return [
          {
            id: "app_error",
            title: "App error or bug",
            description: "Something isn't working correctly",
          },
          {
            id: "feature_request",
            title: "Feature request or suggestion",
            description: "Ideas for improving our service",
          },
          {
            id: "other_technical_issue",
            title: "Other technical issue",
            description: "",
          },
        ];
      case "general_inquiry":
        return [
          {
            id: "how_to_question",
            title: "How-to question",
            description: "Need help using our service",
          },
          {
            id: "billing_question",
            title: "Billing or pricing question",
            description: "Questions about costs and charges",
          },
          { id: "other_question", title: "Other question", description: "" },
        ];
      default:
        return [];
    }
  };

  const subcategories = getSubcategories();
  const selectedCategory = CATEGORIES.find((c) => c.id === data.category);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-2">
          {selectedCategory?.title} Details
        </h3>
        <p className="text-gray-600">
          Help us understand your specific problem
        </p>
      </div>

      <RadioGroup
        value={data.subcategory}
        onValueChange={(value) => onChange({ ...data, subcategory: value })}
        className="space-y-3"
      >
        {subcategories.map((sub) => (
          <div
            key={sub.id}
            className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50"
          >
            <RadioGroupItem value={sub.id} id={sub.id} className="mt-1" />
            <div className="flex-1">
              <Label htmlFor={sub.id} className="font-medium cursor-pointer">
                {sub.title}
              </Label>
              {sub.description && (
                <p className="text-sm text-gray-600 mt-1">
                  💡 {sub.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function ContextStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (data: WizardData) => void;
  user: { id: string; email: string; fullName: string };
}) {
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [, setRecentVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent user context
    const fetchContext = async () => {
      try {
        const [transactionsRes, verificationsRes] = await Promise.all([
          fetch("/api/wallet/transactions?limit=5"),
          fetch("/api/nin/verifications?limit=5"),
        ]);

        if (transactionsRes.ok) {
          const { transactions } = await transactionsRes.json();
          setRecentTransactions(transactions || []);
        }

        if (verificationsRes.ok) {
          const { verifications } = await verificationsRes.json();
          setRecentVerifications(verifications || []);
        }
      } catch (error) {
        console.error("Error fetching context:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading your recent activity...</p>
      </div>
    );
  }

  // Show relevant context based on category
  if (data.category === "payment_issue" && recentTransactions.length > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium mb-2">
            Let&apos;s find your payment
          </h3>
          <p className="text-gray-600">
            We found these recent transactions on your account
          </p>
        </div>

        <div className="space-y-3">
          {recentTransactions.map(
            (transaction: {
              id: string;
              amount: number;
              status: string;
              reference?: string;
              createdAt: string;
            }) => (
              <Card
                key={transaction.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  data.relatedTransaction === transaction.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() =>
                  onChange({
                    ...data,
                    relatedTransaction:
                      data.relatedTransaction === transaction.id
                        ? ""
                        : transaction.id,
                  })
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          ₦{(transaction.amount / 100).toLocaleString()}
                        </span>
                        <Badge
                          className={
                            transaction.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()} •
                        {transaction.reference &&
                          ` Ref: ${transaction.reference}`}
                      </p>
                    </div>
                    {data.relatedTransaction === transaction.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Don&apos;t see your payment?
          </p>
          <Button variant="outline" size="sm">
            Enter payment reference manually
          </Button>
        </div>
      </div>
    );
  }

  // Default context step
  return (
    <div className="text-center py-8">
      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">Ready to proceed</h3>
      <p className="text-gray-600">
        We have all the context we need for your{" "}
        {data.category.replace("_", " ")} issue.
      </p>
    </div>
  );
}

function DetailsStep({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (data: WizardData) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-2">Almost Done!</h3>
        <p className="text-gray-600">
          Please provide any additional details about your issue
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Describe your issue in detail *
          </Label>
          <Textarea
            id="description"
            placeholder="Please provide as much detail as possible about your issue. This helps us resolve it faster."
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            className="mt-2 min-h-[120px]"
          />
          <p className="text-xs text-gray-500 mt-1">
            {data.description.length}/500 characters
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium">
            How urgent is this issue?
          </Label>
          <RadioGroup
            value={data.urgency}
            onValueChange={(value) => onChange({ ...data, urgency: value })}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="urgent" id="urgent" />
              <Label htmlFor="urgent" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Very urgent - I need this resolved immediately
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="high" />
              <Label htmlFor="high" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Somewhat urgent - within a few hours would be good
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Not urgent - whenever you can get to it
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium">
            Preferred contact methods
          </Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email"
                checked={data.contactPreferences.includes("email")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const prefs = e.target.checked
                    ? [...data.contactPreferences, "email"]
                    : data.contactPreferences.filter((p) => p !== "email");
                  onChange({ ...data, contactPreferences: prefs });
                }}
              />
              <Label htmlFor="email">Email notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="app"
                checked={data.contactPreferences.includes("app")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const prefs = e.target.checked
                    ? [...data.contactPreferences, "app"]
                    : data.contactPreferences.filter((p) => p !== "app");
                  onChange({ ...data, contactPreferences: prefs });
                }}
              />
              <Label htmlFor="app">In-app notifications</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
