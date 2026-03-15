"use client";

import { useState } from "react";
import { CreditCard, Search, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useConfirmationModal,
  confirmationActions,
} from "@/components/ui/confirmation-modal";
import { formatCurrency } from "@/lib/format";

interface ReconciliationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserSearchResult {
  id: string;
  fullName: string;
  email: string;
  balance: number;
}

export function ReconciliationModal({
  open,
  onClose,
  onSuccess,
}: ReconciliationModalProps) {
  const { showConfirmation, ConfirmationModal } = useConfirmationModal();
  const [formData, setFormData] = useState({
    reference: "",
    userId: "",
    amount: "",
    description: "Manual reconciliation",
  });
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUserSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/admin/users?search=${encodeURIComponent(query)}&limit=5`,
      );
      if (!response.ok) throw new Error("Failed to search users");

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setFormData((prev) => ({ ...prev, userId: user.id }));
    setUserSearch(user.email);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!formData.reference.trim()) {
      setError("Payment reference is required");
      return;
    }
    if (!formData.userId) {
      setError("Please select a user");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const amount = formatCurrency(parseFloat(formData.amount));

    showConfirmation(
      confirmationActions.reconcileTransaction(amount),
      async () => {
        setLoading(true);
        setSuccess("");

        try {
          const response = await fetch("/api/admin/transactions/reconcile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: formData.reference.trim(),
              userId: formData.userId,
              amount: parseFloat(formData.amount),
              description: formData.description.trim(),
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to reconcile payment");
          }

          setSuccess("Payment reconciled successfully!");

          // Reset form
          setFormData({
            reference: "",
            userId: "",
            amount: "",
            description: "Manual reconciliation",
          });
          setSelectedUser(null);
          setUserSearch("");

          // Close modal after a short delay
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to reconcile payment",
          );
        } finally {
          setLoading(false);
        }
      },
    );
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        reference: "",
        userId: "",
        amount: "",
        description: "Manual reconciliation",
      });
      setSelectedUser(null);
      setUserSearch("");
      setSearchResults([]);
      setError("");
      setSuccess("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manual Payment Reconciliation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="text-emerald-800 font-medium">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Reference */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Payment Reference *
              </label>
              <Input
                placeholder="Enter Paystack reference or transaction ID"
                value={formData.reference}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500">
                The unique reference from the payment provider
              </p>
            </div>

            {/* User Search */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                User *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by email or name..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    handleUserSearch(e.target.value);
                    if (!e.target.value) {
                      setSelectedUser(null);
                      setFormData((prev) => ({ ...prev, userId: "" }));
                    }
                  }}
                  className="pl-10"
                  disabled={loading}
                  required
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card className="mt-2">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(user.balance)}
                              </p>
                              <p className="text-xs text-gray-500">Balance</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selected User */}
              {selectedUser && (
                <Card className="mt-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedUser.fullName}</p>
                        <p className="text-sm text-gray-500">
                          {selectedUser.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-800">
                          Selected
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          Balance: {formatCurrency(selectedUser.balance)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Amount (₦) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                disabled={loading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Description
              </label>
              <Input
                placeholder="Description for this reconciliation"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !formData.reference ||
                  !formData.userId ||
                  !formData.amount
                }
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                    Reconciling...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Reconcile Payment
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Manual Reconciliation
                </p>
                <p className="mt-1 text-xs text-blue-800">
                  Use this tool to manually credit a user&apos;s wallet when a
                  payment was successful but not automatically processed. Always
                  verify the payment with your payment provider first.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {ConfirmationModal}
      </DialogContent>
    </Dialog>
  );
}
