# State Management Documentation

## Overview

This application uses **Zustand** for state management, following best practices for a security-sensitive, API-heavy NIN verification system.

## Architecture

### Store Structure

```
store/
├── verification-store.ts  # Verification flow state
├── admin-store.ts         # Admin panel state
├── ui-store.ts           # Global UI state
└── README.md             # This file
```

### Why Zustand?

1. **Lightweight** - ~1KB gzipped
2. **TypeScript-first** - Excellent type inference
3. **No boilerplate** - Simple API
4. **Performance** - Optimized re-renders with selectors
5. **DevTools** - Redux DevTools integration
6. **Persistence** - Built-in persistence middleware

## Stores

### 1. Verification Store (`verification-store.ts`)

Manages the complete NIN verification flow.

#### Features:

- ✅ Type-safe state management
- ✅ Session persistence (sessionStorage)
- ✅ Step navigation
- ✅ Automatic cleanup
- ✅ DevTools integration (development only)

#### Usage:

```typescript
import { useVerificationStore } from "@/store/verification-store";

function MyComponent() {
  // Get state
  const currentStep = useVerificationStore((state) => state.currentStep);
  const phoneNumber = useVerificationStore((state) => state.phoneNumber);

  // Get actions
  const setPhoneNumber = useVerificationStore((state) => state.setPhoneNumber);
  const goToNextStep = useVerificationStore((state) => state.goToNextStep);

  // Use them
  const handleSubmit = () => {
    setPhoneNumber("+2348012345678");
    goToNextStep();
  };
}
```

#### Optimized Selectors:

```typescript
import { useCurrentStep, usePhoneNumber } from "@/store/verification-store";

function MyComponent() {
  // Only re-renders when currentStep changes
  const currentStep = useCurrentStep();

  // Only re-renders when phoneNumber changes
  const phoneNumber = usePhoneNumber();
}
```

#### State Structure:

```typescript
{
  // Flow state
  currentStep: 'phone' | 'otp' | 'data-selection' | 'payment' | 'result',
  isLoading: boolean,
  error: string | null,

  // User data
  phoneNumber: string,
  sessionToken: string,
  sessionId: string,
  paymentData: PaymentData | null,
  verificationData: VerificationData | null,
  sessionInfo: SessionInfo | null,

  // Payment state
  paymentReference: string | null,
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | null,

  // Verification status
  verificationStatus: 'pending' | 'payment_completed' | 'processing' | 'completed' | 'failed' | null,
}
```

#### Key Actions:

- `setStep(step)` - Set current step
- `setPhoneNumber(phone)` - Set phone number
- `setSessionToken(token)` - Set session token (also persists to localStorage)
- `setPaymentData(data)` - Set payment data
- `goToNextStep()` - Navigate to next step
- `goToPreviousStep()` - Navigate to previous step
- `reset()` - Reset entire flow
- `resetFromStep(step)` - Reset from specific step onwards

---

### 2. Admin Store (`admin-store.ts`)

Manages admin panel state and operations.

#### Features:

- ✅ Authentication state
- ✅ Dashboard metrics
- ✅ User management
- ✅ Transaction tracking
- ✅ Support tickets
- ✅ Session monitoring

#### Usage:

```typescript
import { useAdminStore } from "@/store/admin-store";

function AdminDashboard() {
  const metrics = useAdminStore((state) => state.metrics);
  const setMetrics = useAdminStore((state) => state.setMetrics);

  useEffect(() => {
    fetchMetrics().then(setMetrics);
  }, []);
}
```

#### Optimized Selectors:

```typescript
import { useAdmin, useMetrics, useUsers } from "@/store/admin-store";

function AdminPanel() {
  const admin = useAdmin();
  const metrics = useMetrics();
  const users = useUsers();
}
```

---

### 3. UI Store (`ui-store.ts`)

Manages global UI state (toasts, modals, loading, theme).

#### Features:

- ✅ Toast notifications
- ✅ Modal management
- ✅ Global loading states
- ✅ Sidebar state
- ✅ Theme management

#### Usage:

**Toasts:**

```typescript
import { useToast } from "@/store/ui-store";

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success("Verification completed!");
  };

  const handleError = () => {
    toast.error("Something went wrong", 10000); // 10 seconds
  };
}
```

**Modals:**

```typescript
import { useModal } from "@/store/ui-store";

function MyComponent() {
  const modal = useModal();

  const openConfirmDialog = () => {
    modal.open({
      component: ConfirmDialog,
      props: { title: "Are you sure?" },
      onClose: () => console.log("Modal closed"),
    });
  };
}
```

**Loading:**

```typescript
import { useUIStore } from "@/store/ui-store";

function MyComponent() {
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);

  const handleSubmit = async () => {
    setGlobalLoading(true, "Processing...");
    await api.submit();
    setGlobalLoading(false);
  };
}
```

---

## Best Practices

### 1. Use Selectors for Performance

❌ **Bad** - Re-renders on any state change:

```typescript
const store = useVerificationStore();
```

✅ **Good** - Only re-renders when specific state changes:

```typescript
const currentStep = useVerificationStore((state) => state.currentStep);
const phoneNumber = useVerificationStore((state) => state.phoneNumber);
```

✅ **Better** - Use pre-defined selectors:

```typescript
import { useCurrentStep, usePhoneNumber } from "@/store/verification-store";

const currentStep = useCurrentStep();
const phoneNumber = usePhoneNumber();
```

### 2. Batch Updates

❌ **Bad** - Multiple re-renders:

```typescript
setPhoneNumber(phone);
setSessionToken(token);
setStep("otp");
```

✅ **Good** - Single re-render:

```typescript
useVerificationStore.setState({
  phoneNumber: phone,
  sessionToken: token,
  currentStep: "otp",
});
```

### 3. Avoid Storing Derived State

❌ **Bad**:

```typescript
{
  users: User[],
  activeUsers: User[], // Derived from users
}
```

✅ **Good**:

```typescript
{
  users: User[],
}

// Compute in component
const activeUsers = users.filter(u => u.status === 'active');
```

### 4. Use Actions for Complex Logic

✅ **Good**:

```typescript
// In store
resetFromStep: (step) => {
  // Complex logic here
  const resetData = computeResetData(step);
  set(resetData);
};

// In component
const resetFromStep = useVerificationStore((state) => state.resetFromStep);
resetFromStep("phone");
```

### 5. Persist Only Essential Data

```typescript
persist(
  (set, get) => ({
    /* store */
  }),
  {
    name: "verification-storage",
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) => ({
      // Only persist essential data
      currentStep: state.currentStep,
      sessionToken: state.sessionToken,
      // Don't persist loading states, errors, etc.
    }),
  },
);
```

---

## Security Considerations

### 1. Sensitive Data

- ✅ Session tokens are stored in sessionStorage (cleared on tab close)
- ✅ NIN data is never persisted to storage
- ✅ Payment data is cleared after completion
- ✅ DevTools only enabled in development

### 2. Data Cleanup

```typescript
// Always clean up when user leaves
useEffect(() => {
  return () => {
    if (shouldCleanup) {
      useVerificationStore.getState().reset();
    }
  };
}, []);
```

### 3. Token Management

```typescript
// Tokens are automatically synced to localStorage for callback pages
setSessionToken(token); // Also sets localStorage.setItem('sessionToken', token)

// Clear on reset
reset(); // Also clears localStorage and sessionStorage
```

---

## Testing

### Unit Testing

```typescript
import { renderHook, act } from "@testing-library/react";
import { useVerificationStore } from "@/store/verification-store";

test("should set phone number", () => {
  const { result } = renderHook(() => useVerificationStore());

  act(() => {
    result.current.setPhoneNumber("+2348012345678");
  });

  expect(result.current.phoneNumber).toBe("+2348012345678");
});
```

### Integration Testing

```typescript
import { render, screen } from '@testing-library/react';
import { useVerificationStore } from '@/store/verification-store';

test('verification flow', () => {
  // Reset store before test
  useVerificationStore.getState().reset();

  render(<VerificationFlow />);

  // Test flow...
});
```

---

## DevTools

### Enable Redux DevTools

1. Install [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
2. Open DevTools in development
3. Select "Redux" tab
4. View state changes in real-time

### Features:

- ✅ Time-travel debugging
- ✅ Action history
- ✅ State diff
- ✅ Action replay

---

## Migration Guide

### From useState to Zustand

**Before:**

```typescript
function VerificationFlow() {
  const [currentStep, setCurrentStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Pass props down multiple levels
  return <PhoneInput onSubmit={(phone) => {
    setPhoneNumber(phone);
    setCurrentStep('otp');
  }} />;
}
```

**After:**

```typescript
function VerificationFlow() {
  const currentStep = useCurrentStep();

  // No prop drilling needed
  return <PhoneInput />;
}

function PhoneInput() {
  const setPhoneNumber = useVerificationStore((state) => state.setPhoneNumber);
  const goToNextStep = useVerificationStore((state) => state.goToNextStep);

  const handleSubmit = (phone) => {
    setPhoneNumber(phone);
    goToNextStep();
  };
}
```

---

## Performance Tips

1. **Use shallow equality for objects:**

```typescript
import { shallow } from "zustand/shallow";

const { phoneNumber, sessionToken } = useVerificationStore(
  (state) => ({
    phoneNumber: state.phoneNumber,
    sessionToken: state.sessionToken,
  }),
  shallow,
);
```

2. **Memoize selectors:**

```typescript
const selectUserData = (state) => ({
  phone: state.phoneNumber,
  session: state.sessionToken,
});

const userData = useVerificationStore(selectUserData, shallow);
```

3. **Split large stores:**

- ✅ verification-store.ts (verification flow)
- ✅ admin-store.ts (admin operations)
- ✅ ui-store.ts (UI state)

---

## Troubleshooting

### Store not persisting

Check sessionStorage is enabled:

```typescript
if (typeof window !== "undefined") {
  console.log(sessionStorage.getItem("verification-storage"));
}
```

### Re-rendering too often

Use selectors:

```typescript
// ❌ Re-renders on any change
const store = useVerificationStore();

// ✅ Only re-renders when currentStep changes
const currentStep = useVerificationStore((state) => state.currentStep);
```

### DevTools not working

Ensure it's enabled in development:

```typescript
devtools(
  (set, get) => ({
    /* store */
  }),
  {
    name: "VerificationStore",
    enabled: process.env.NODE_ENV === "development", // ✅
  },
);
```

---

## Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
