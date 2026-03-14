/**
 * Support Ticket System Utilities
 * 
 * Smart routing, SLA management, and issue detection
 * Based on research-backed patterns for optimal UX
 */

import { nanoid } from "nanoid";

export type TicketCategory = 
  | "payment_issue" 
  | "verification_problem" 
  | "account_access" 
  | "technical_support" 
  | "general_inquiry";

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "assigned" | "in_progress" | "resolved" | "closed";
export type SLATier = "critical" | "high" | "medium" | "low";
export type Department = "general" | "technical" | "financial" | "management";

export interface TicketContext {
  userId: string;
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    reference?: string;
    createdAt: Date;
  }>;
  recentVerifications: Array<{
    id: string;
    status: string;
    createdAt: Date;
  }>;
  userTier: "basic" | "premium" | "enterprise";
  previousTickets: number;
  accountAge: number; // days
}

export interface IssueDetectionResult {
  category: TicketCategory;
  subcategory: string;
  priority: TicketPriority;
  slaTier: SLATier;
  department: Department;
  confidence: number;
  suggestedSolution?: string;
  relatedContext?: {
    transactionId?: string;
    verificationId?: string;
    paymentReference?: string;
  };
}

/**
 * Smart issue detection based on keywords and user context
 */
export function detectIssueType(
  description: string,
  category: TicketCategory,
  userContext: TicketContext
): IssueDetectionResult {
  const lowerDesc = description.toLowerCase();
  
  // Payment issue detection
  if (category === "payment_issue") {
    const paymentKeywords = {
      notInWallet: ["deducted", "charged", "not showing", "missing", "wallet"],
      failedButCharged: ["failed", "charged", "verification failed", "still charged"],
      refundNotReceived: ["refund", "not received", "refund missing", "money back"],
      paymentDeclined: ["declined", "failed payment", "card declined", "payment error"]
    };
    
    let subcategory = "other_payment_issue";
    let priority: TicketPriority = "medium";
    
    if (paymentKeywords.notInWallet.some(keyword => lowerDesc.includes(keyword))) {
      subcategory = "money_deducted_not_in_wallet";
      priority = "high";
      
      // Check for recent successful payments
      const recentPayment = userContext.recentTransactions.find(tx => 
        tx.status === "completed" && 
        Date.now() - tx.createdAt.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      );
      
      if (recentPayment) {
        return {
          category,
          subcategory,
          priority: userContext.userTier === "premium" ? "urgent" : "high",
          slaTier: "high",
          department: "financial",
          confidence: 0.9,
          suggestedSolution: "Check payment reconciliation system",
          relatedContext: {
            transactionId: recentPayment.id,
            paymentReference: recentPayment.reference
          }
        };
      }
    }
    
    if (paymentKeywords.failedButCharged.some(keyword => lowerDesc.includes(keyword))) {
      subcategory = "verification_failed_but_charged";
      priority = "high";
    }
    
    if (paymentKeywords.refundNotReceived.some(keyword => lowerDesc.includes(keyword))) {
      subcategory = "refund_not_received";
      priority = "medium";
    }
    
    return {
      category,
      subcategory,
      priority: userContext.userTier === "premium" ? upgradePriority(priority) : priority,
      slaTier: priority === "high" ? "high" : priority === "medium" ? "medium" : "low",
      department: "financial",
      confidence: 0.8
    };
  }
  
  // Verification problem detection
  if (category === "verification_problem") {
    const verificationKeywords = {
      ninNotFound: ["nin not found", "invalid nin", "nin invalid"],
      documentIssues: ["document", "receipt", "download", "pdf"],
      verificationStuck: ["stuck", "pending", "taking long", "not working"]
    };
    
    let subcategory = "other_verification_issue";
    let priority: TicketPriority = "medium";
    
    if (verificationKeywords.ninNotFound.some(keyword => lowerDesc.includes(keyword))) {
      subcategory = "nin_not_found";
      priority = "low"; // User error, educational response needed
    }
    
    if (verificationKeywords.documentIssues.some(keyword => lowerDesc.includes(keyword))) {
      subcategory = "document_receipt_issue";
      priority = "medium";
    }
    
    return {
      category,
      subcategory,
      priority,
      slaTier: priority,
      department: "technical",
      confidence: 0.7
    };
  }
  
  // Account access issues
  if (category === "account_access") {
    return {
      category,
      subcategory: "login_password_issue",
      priority: "medium",
      slaTier: "medium",
      department: "technical",
      confidence: 0.6
    };
  }
  
  // Default case
  return {
    category,
    subcategory: "general_inquiry",
    priority: "low",
    slaTier: "low",
    department: "general",
    confidence: 0.5
  };
}

/**
 * Calculate SLA deadlines based on priority and tier
 */
export function calculateSLADeadlines(
  priority: TicketPriority,
  slaTier: SLATier,
  createdAt: Date = new Date()
): {
  firstResponseDue: Date;
  resolutionDue: Date;
} {
  const slaMatrix = {
    critical: { response: 1, resolution: 4 }, // 1 hour response, 4 hour resolution
    high: { response: 4, resolution: 24 },     // 4 hour response, 24 hour resolution
    medium: { response: 24, resolution: 72 },  // 24 hour response, 72 hour resolution
    low: { response: 72, resolution: 168 }     // 72 hour response, 1 week resolution
  };
  
  const sla = slaMatrix[slaTier];
  
  const firstResponseDue = new Date(createdAt);
  firstResponseDue.setHours(firstResponseDue.getHours() + sla.response);
  
  const resolutionDue = new Date(createdAt);
  resolutionDue.setHours(resolutionDue.getHours() + sla.resolution);
  
  return { firstResponseDue, resolutionDue };
}

/**
 * Generate smart ticket subject based on category and context
 */
export function generateTicketSubject(
  category: TicketCategory,
  subcategory: string,
  context?: {
    amount?: number;
    reference?: string;
    ninMasked?: string;
  }
): string {
  const subjects = {
    payment_issue: {
      money_deducted_not_in_wallet: `Payment of ${context?.amount ? `₦${context.amount/100}` : 'money'} not showing in wallet`,
      verification_failed_but_charged: "Verification failed but payment was charged",
      refund_not_received: "Refund not received",
      other_payment_issue: "Payment issue"
    },
    verification_problem: {
      nin_not_found: "NIN verification failed - NIN not found",
      document_receipt_issue: "Issue with verification document/receipt",
      other_verification_issue: "NIN verification problem"
    },
    account_access: {
      login_password_issue: "Account login/password issue"
    },
    technical_support: {
      default: "Technical support request"
    },
    general_inquiry: {
      default: "General inquiry"
    }
  };
  
  const categorySubjects = subjects[category] as Record<string, string>;
  return categorySubjects?.[subcategory] || categorySubjects?.default || "Support request";
}

/**
 * Route ticket to appropriate department and agent
 */
export function routeTicket(
  category: TicketCategory,
  priority: TicketPriority,
  userContext: TicketContext
): {
  department: Department;
  suggestedAgent?: string;
  escalate: boolean;
} {
  // High-value customer escalation
  const shouldEscalate = userContext.userTier === "premium" && 
                        (priority === "urgent" || priority === "high");
  
  const routing = {
    payment_issue: {
      department: "financial" as Department,
      escalate: shouldEscalate
    },
    verification_problem: {
      department: "technical" as Department,
      escalate: false
    },
    account_access: {
      department: "technical" as Department,
      escalate: false
    },
    technical_support: {
      department: "technical" as Department,
      escalate: shouldEscalate
    },
    general_inquiry: {
      department: "general" as Department,
      escalate: false
    }
  };
  
  return routing[category];
}

/**
 * Generate system message for ticket creation
 */
export function generateSystemMessage(
  category: TicketCategory,
  priority: TicketPriority,
  slaDeadlines: { firstResponseDue: Date; resolutionDue: Date }
): string {
  const responseTime = formatDuration(Date.now(), slaDeadlines.firstResponseDue.getTime());
  
  const messages = {
    payment_issue: `Thank you for contacting our Financial Support Team. We understand payment issues can be stressful, and we're here to help resolve this quickly. Expected response time: ${responseTime}.`,
    verification_problem: `Thank you for reaching out about your NIN verification. Our Technical Support Team will review your case and provide assistance. Expected response time: ${responseTime}.`,
    account_access: `Thank you for contacting support regarding your account access. Our team will help you regain access to your account. Expected response time: ${responseTime}.`,
    technical_support: `Thank you for your technical support request. Our team will investigate and provide a solution. Expected response time: ${responseTime}.`,
    general_inquiry: `Thank you for your inquiry. Our support team will review your question and provide assistance. Expected response time: ${responseTime}.`
  };
  
  return messages[category] || messages.general_inquiry;
}

/**
 * Helper functions
 */
function upgradePriority(priority: TicketPriority): TicketPriority {
  const upgrade = {
    low: "medium" as TicketPriority,
    medium: "high" as TicketPriority,
    high: "urgent" as TicketPriority,
    urgent: "urgent" as TicketPriority
  };
  return upgrade[priority];
}

function formatDuration(from: number, to: number): string {
  const diff = to - from;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return "within 1 hour";
  if (hours === 1) return "within 1 hour";
  if (hours < 24) return `within ${hours} hours`;
  
  const days = Math.floor(hours / 24);
  return `within ${days} day${days > 1 ? 's' : ''}`;
}

/**
 * Create ticket ID with readable format
 */
export function generateTicketId(): string {
  const year = new Date().getFullYear();
  const randomId = nanoid(6).toUpperCase();
  return `TK-${year}-${randomId}`;
}