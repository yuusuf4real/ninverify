# Support System UX Specifications & Wireframes

## User Interface Design Patterns

### 1. Ticket Creation Flow - Progressive Disclosure

#### Step 1: Issue Category Selection
```
┌─────────────────────────────────────────────────────────────┐
│                    How can we help you?                     │
│                                                             │
│  We're here to resolve your issue quickly and efficiently  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │     💳      │  │     ✅      │  │     🔐      │        │
│  │   Payment   │  │Verification │  │   Account   │        │
│  │    Issue    │  │   Problem   │  │   Access    │        │
│  │             │  │             │  │             │        │
│  │ Most common │  │ NIN related │  │Login issues │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                         │
│  │     📄      │  │     ❓      │                         │
│  │ Document/   │  │    Other    │                         │
│  │  Receipt    │  │  Question   │                         │
│  │             │  │             │                         │
│  │ Downloads   │  │ General help│                         │
│  └─────────────┘  └─────────────┘                         │
│                                                             │
│                    [Continue] [Cancel]                     │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2: Contextual Sub-categorization
```
Payment Issue Selected:
┌─────────────────────────────────────────────────────────────┐
│                   Payment Issue Details                     │
│                                                             │
│  Help us understand your payment problem:                  │
│                                                             │
│  ○ Money was deducted but not showing in my wallet         │
│    💡 We can check this automatically with your payment    │
│       reference                                             │
│                                                             │
│  ○ Verification failed but I was still charged             │
│    💡 Don't worry, failed verifications are automatically  │
│       refunded within 24 hours                             │
│                                                             │
│  ○ I haven't received my refund                            │
│    💡 Refunds typically take 3-5 business days to process  │
│                                                             │
│  ○ Payment method was declined or failed                   │
│    💡 We can help you try alternative payment methods      │
│                                                             │
│  ○ Other payment-related issue                             │
│                                                             │
│                    [Back] [Continue]                       │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: Smart Context Collection
```
Money deducted but not in wallet:
┌─────────────────────────────────────────────────────────────┐
│                 Let's find your payment                     │
│                                                             │
│  We found these recent transactions on your account:       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ ₦1,000 - Jan 15, 2024, 2:30 PM                  │   │
│  │    Paystack Ref: ps_abc123                         │   │
│  │    Status: Completed ✓                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠️ ₦500 - Jan 16, 2024, 10:15 AM                   │   │
│  │    Paystack Ref: ps_def456                         │   │
│  │    Status: Payment Successful, Wallet Not Updated  │   │
│  │    [🔍 This looks like the issue]                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Is this the payment you're asking about?                  │
│  [Yes, that's it] [No, different payment]                 │
│                                                             │
│  Or enter your payment reference manually:                 │
│  [________________________] [Verify Payment]              │
│                                                             │
│                    [Back] [Continue]                       │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Additional Details & Submission
```
┌─────────────────────────────────────────────────────────────┐
│                    Almost Done!                             │
│                                                             │
│  Payment Details Confirmed:                                │
│  • Amount: ₦500                                            │
│  • Reference: ps_def456                                    │
│  • Date: Jan 16, 2024, 10:15 AM                           │
│                                                             │
│  Please provide any additional details:                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ I made the payment this morning but it's been 3    │   │
│  │ hours and the money still hasn't appeared in my    │   │
│  │ wallet. I need to make a verification urgently.    │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  How urgent is this issue?                                 │
│  ○ Very urgent - I need this resolved immediately          │
│  ○ Somewhat urgent - within a few hours would be good     │
│  ○ Not urgent - whenever you can get to it                │
│                                                             │
│  Preferred contact method:                                 │
│  ☑️ Email notifications                                    │
│  ☑️ In-app notifications                                   │
│  ☐ WhatsApp updates (+234 xxx xxxx)                       │
│                                                             │
│                [Back] [Submit Ticket]                      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Ticket Confirmation & Tracking

#### Immediate Confirmation
```
┌─────────────────────────────────────────────────────────────┐
│                    ✅ Ticket Created!                       │
│                                                             │
│  Your support ticket has been created successfully.        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Ticket #TK-2024-001                                │   │
│  │ Payment Issue - Money Not in Wallet               │   │
│  │                                                     │   │
│  │ 🕐 Expected Response: Within 4 hours              │   │
│  │ 👤 Assigned to: Financial Support Team            │   │
│  │ 📧 Updates will be sent to: user@email.com        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  What happens next?                                        │
│  1. Our team will review your payment reference           │
│  2. We'll verify the transaction with Paystack            │
│  3. If confirmed, we'll credit your wallet immediately    │
│  4. You'll receive an email confirmation                  │
│                                                             │
│  In the meantime, you can:                                │
│  • Check our FAQ for similar issues                       │
│  • Track your ticket status in real-time                  │
│  • Add more information if needed                         │
│                                                             │
│        [View Ticket] [Back to Dashboard] [FAQ]            │
└─────────────────────────────────────────────────────────────┘
```

#### User Ticket Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│                    My Support Tickets                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 #TK-2024-001 - Payment Issue                    │   │
│  │    Money deducted but not in wallet                │   │
│  │                                                     │   │
│  │    📅 Created: 2 hours ago                         │   │
│  │    👤 Agent: Sarah M. (Financial Team)             │   │
│  │    ⏱️ Status: In Progress                          │   │
│  │    📊 Priority: High                               │   │
│  │                                                     │   │
│  │    💬 Last Update: "We've verified your payment    │   │
│  │    with Paystack and are processing the credit     │   │
│  │    now. You should see the funds in 10-15 mins."  │   │
│  │                                                     │   │
│  │    [View Full Conversation] [Add Message]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 #TK-2024-002 - Verification Problem             │   │
│  │    NIN verification failed                          │   │
│  │                                                     │   │
│  │    📅 Resolved: Yesterday                          │   │
│  │    ⭐ Resolution: Refund processed successfully     │   │
│  │                                                     │   │
│  │    [View Resolution] [Rate This Support] [Reopen]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                    [Create New Ticket]                     │
└─────────────────────────────────────────────────────────────┘
```

### 3. Ticket Detail View (Conversation Interface)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Tickets    Ticket #TK-2024-001    🟡 In Progress │
│                                                             │
│ Payment Issue - Money deducted but not in wallet           │
│ Created: Jan 16, 2024, 10:30 AM • Priority: High          │
│ Agent: Sarah M. (Financial Team) • SLA: 4 hours            │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👤 You - 2 hours ago                               │   │
│ │ I made a payment of ₦500 this morning but it's     │   │
│ │ been 3 hours and the money still hasn't appeared   │   │
│ │ in my wallet. I need to make a verification         │   │
│ │ urgently.                                           │   │
│ │                                                     │   │
│ │ Payment Reference: ps_def456                        │   │
│ │ Amount: ₦500                                        │   │
│ │ Time: Jan 16, 2024, 10:15 AM                       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🤖 System - 2 hours ago                            │   │
│ │ Thank you for contacting support. We've received    │   │
│ │ your ticket and assigned it to our Financial       │   │
│ │ Support Team. Expected response time: 4 hours.     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👩‍💼 Sarah M. - 1 hour ago                          │   │
│ │ Hi! I'm Sarah from the Financial Support Team.     │   │
│ │ I've located your payment and can see it was       │   │
│ │ successful on Paystack's end. Let me verify this   │   │
│ │ with our system and credit your wallet.            │   │
│ │                                                     │   │
│ │ I'll update you within the next 15 minutes.        │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 👩‍💼 Sarah M. - 30 minutes ago                      │   │
│ │ Great news! I've verified your payment with        │   │
│ │ Paystack and processed the credit to your wallet.  │   │
│ │ You should see ₦500 in your account within 10-15   │   │
│ │ minutes.                                            │   │
│ │                                                     │   │
│ │ Is there anything else I can help you with today?  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Type your message...                                │   │
│ │                                                     │   │
│ │                                                     │   │
│ │ [📎 Attach File]              [Send Message] 📤    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [Mark as Resolved] [Escalate] [Request Call] [Close]       │
└─────────────────────────────────────────────────────────────┘
```

### 4. Admin Interface - Ticket Management

#### Kanban Board View
```
┌─────────────────────────────────────────────────────────────┐
│ Support Tickets Dashboard                    🔄 Auto-refresh │
│                                                             │
│ Filters: [All] [Payment] [Verification] [Account] [Other]   │
│ Sort: [Priority] [Date] [Agent] [SLA]    View: [Kanban] [List] │
│                                                             │
│ ┌─── New (12) ───┬─ Assigned (8) ─┬─ In Progress (15) ─┬─ Resolved (45) ─┐
│ │ 🔴 TK-001      │ 🟡 TK-005     │ 🟡 TK-009        │ 🟢 TK-013       │
│ │ Payment Issue  │ Verification  │ Account Locked    │ Document Req.    │
│ │ 💳 Critical    │ ✅ Medium     │ 🔐 High          │ 📄 Low          │
│ │ 2h ago         │ Sarah M.      │ John D.          │ Completed        │
│ │ SLA: ⚠️ 2h left│ 6h left       │ 4h left          │ ⭐⭐⭐⭐⭐        │
│ │                │               │                  │                  │
│ │ 🟡 TK-002      │ 🟡 TK-006     │ 🟡 TK-010        │ 🟢 TK-014       │
│ │ Verification   │ Refund Req.   │ Payment Issue    │ General Q.       │
│ │ ✅ High        │ 💳 High       │ 💳 Medium        │ ❓ Low           │
│ │ 30m ago        │ Mike R.       │ Sarah M.         │ Completed        │
│ │ SLA: ✅ 3h left│ 2h left       │ 8h left          │ ⭐⭐⭐⭐          │
│ │                │               │                  │                  │
│ │ [+] Bulk       │ [+] Bulk      │ [+] Bulk         │ [+] Export       │
│ │ Actions        │ Actions       │ Actions          │ Reports          │
│ └────────────────┴───────────────┴──────────────────┴──────────────────┘
│                                                             │
│ Quick Stats: 📊 Avg Response: 2.3h | Resolution: 18.5h     │
│ SLA Performance: ✅ 94% on-time | 🎯 Target: 95%           │
└─────────────────────────────────────────────────────────────┘
```

#### Ticket Detail (Admin View)
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard    #TK-2024-001    [Assign] [Escalate] │
│                                                             │
│ ┌─ Ticket Info ─────────────────┬─ User Context ─────────┐ │
│ │ Status: 🟡 In Progress        │ 👤 John Doe            │ │
│ │ Priority: 🔴 Critical         │ 📧 john@email.com      │ │
│ │ Category: 💳 Payment Issue    │ 📱 +234 xxx xxxx       │ │
│ │ Agent: Sarah M.               │ 💰 Wallet: ₦1,500      │ │
│ │ Created: 2h ago               │ 🏆 Tier: Premium       │ │
│ │ SLA: ⚠️ 2h remaining          │ 📊 Tickets: 3 total    │ │
│ │ Source: Web App               │ ⭐ Satisfaction: 4.5/5  │ │
│ └───────────────────────────────┴─────────────────────────┘ │
│                                                             │
│ ┌─ Related Context ─────────────────────────────────────┐   │
│ │ 💳 Recent Transaction: ps_def456 - ₦500 (Successful) │   │
│ │ ✅ Last Verification: Jan 15 (Success)               │   │
│ │ 📧 Previous Tickets: None in last 30 days            │   │
│ │ 🔍 System Check: Payment verified, wallet not updated│   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ Conversation ────────────────────────────────────────┐   │
│ │ [Same conversation interface as user view]            │   │
│ │ ...                                                   │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ Admin Actions ──────────────────────────────────────┐   │
│ │ Quick Actions:                                        │   │
│ │ [💰 Credit Wallet] [🔄 Verify Payment] [📞 Call User]│   │
│ │ [📧 Send Email] [⬆️ Escalate] [✅ Mark Resolved]      │   │
│ │                                                       │   │
│ │ Internal Notes:                                       │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Payment verified with Paystack. Processing     │   │   │
│ │ │ wallet credit now. User seems frustrated but   │   │   │
│ │ │ understanding. Premium customer - prioritize.  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │ [Save Note]                                           │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. TicketCreationWizard Component
```typescript
interface TicketCreationWizardProps {
  user: User;
  onComplete: (ticket: Ticket) => void;
  onCancel: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType<StepProps>;
  validation: (data: any) => boolean;
  canSkip?: boolean;
}

const steps: WizardStep[] = [
  {
    id: 'category',
    title: 'Issue Category',
    component: CategorySelection,
    validation: (data) => !!data.category
  },
  {
    id: 'subcategory',
    title: 'Issue Details',
    component: SubcategorySelection,
    validation: (data) => !!data.subcategory
  },
  {
    id: 'context',
    title: 'Context Collection',
    component: ContextCollection,
    validation: (data) => data.contextComplete
  },
  {
    id: 'details',
    title: 'Additional Details',
    component: DetailsForm,
    validation: (data) => data.description?.length > 10,
    canSkip: true
  }
];
```

### 2. TicketCard Component
```typescript
interface TicketCardProps {
  ticket: Ticket;
  view: 'user' | 'admin';
  onAction: (action: string, ticket: Ticket) => void;
  showContext?: boolean;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  view,
  onAction,
  showContext = false
}) => {
  const statusColor = getStatusColor(ticket.status);
  const priorityIcon = getPriorityIcon(ticket.priority);
  const timeAgo = formatTimeAgo(ticket.createdAt);
  
  return (
    <Card className={`border-l-4 border-l-${statusColor}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">
              {priorityIcon} #{ticket.id} - {ticket.subject}
            </h3>
            <p className="text-sm text-muted-foreground">
              {ticket.category} • {timeAgo}
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </CardHeader>
      
      {showContext && (
        <CardContent>
          <TicketContext ticket={ticket} />
        </CardContent>
      )}
      
      <CardFooter>
        <TicketActions
          ticket={ticket}
          view={view}
          onAction={onAction}
        />
      </CardFooter>
    </Card>
  );
};
```

### 3. ConversationInterface Component
```typescript
interface ConversationInterfaceProps {
  ticket: Ticket;
  messages: TicketMessage[];
  currentUser: User;
  onSendMessage: (message: string, attachments?: File[]) => void;
  onAction: (action: TicketAction) => void;
  isAdmin?: boolean;
}

const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  ticket,
  messages,
  currentUser,
  onSendMessage,
  onAction,
  isAdmin = false
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUser.id}
            isAdmin={message.senderType === 'agent'}
            isSystem={message.senderType === 'system'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <MessageComposer
          value={newMessage}
          onChange={setNewMessage}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          onSend={() => {
            onSendMessage(newMessage, attachments);
            setNewMessage('');
            setAttachments([]);
          }}
          placeholder="Type your message..."
          disabled={ticket.status === 'closed'}
        />
        
        {isAdmin && (
          <AdminActions
            ticket={ticket}
            onAction={onAction}
          />
        )}
      </div>
    </div>
  );
};
```

This comprehensive UX specification provides the foundation for building a world-class support ticket system that prioritizes user experience, operational efficiency, and business outcomes.