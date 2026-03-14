# Component Architecture Guide

## Overview

The JAMB Verification System follows atomic design principles with a clear component hierarchy. This guide explains how components are organized, how to create new ones, and best practices for maintaining consistency.

## Component Hierarchy

```
components/
├── atoms/              # Basic UI elements
├── molecules/          # Composite components
├── organisms/          # Complex features
├── sections/           # Page sections
└── ui/                 # shadcn/ui base components
```

### Atoms
Basic UI elements that can't be broken down further.

**Example: Section Title**
```typescript
// components/atoms/section-title.tsx
interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h2 className={cn("text-2xl font-bold text-gray-900", className)}>
      {children}
    </h2>
  );
}
```

### Molecules
Composite components that combine atoms and have a single responsibility.

**Example: Metric Card**
```typescript
// components/molecules/metric-card.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  color = 'primary',
  loading = false 
}: MetricCardProps) {
  const colorClasses = {
    primary: 'bg-primary/5 text-primary',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    error: 'bg-red-50 text-red-600'
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center text-sm",
              trend >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-full", colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
}
```

### Organisms
Complex components that combine molecules and atoms to form distinct sections of an interface.

**Example: User Management Client**
```typescript
// components/organisms/user-management-client.tsx
"use client";

interface UserManagementClientProps {
  initialUsers?: User[];
  initialPagination?: PaginationData;
}

export function UserManagementClient({ 
  initialUsers = [], 
  initialPagination 
}: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    page: 1,
    limit: 50
  });

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams({
        ...filters,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      }).toString();

      const response = await fetch(`/api/admin/users?${queryString}`);
      const data = await response.json();
      
      setUsers(data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}?action=suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast.success('User suspended successfully');
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => fetchUsers()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <UserFilters 
        filters={filters} 
        onChange={setFilters}
        loading={loading}
      />

      {/* User Table */}
      <UserTable
        users={users}
        loading={loading}
        onViewUser={setSelectedUser}
        onSuspendUser={handleSuspendUser}
      />

      {/* Pagination */}
      <UserPagination
        pagination={pagination}
        onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
```

## Component Patterns

### 1. Client Components with Server Data

Most admin components follow this pattern for handling server state:

```typescript
"use client";

export function DataComponent() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/endpoint');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} onRetry={fetchData} />;

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### 2. Form Components

Consistent form handling with react-hook-form and Zod validation:

```typescript
const formSchema = z.object({
  field1: z.string().min(1, "Field is required"),
  field2: z.string().email("Invalid email format")
});

type FormData = z.infer<typeof formSchema>;

export function FormComponent() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field1: '',
      field2: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Submission failed');
      
      toast.success('Success!');
      form.reset();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="field1">Field 1</Label>
        <Input
          id="field1"
          {...form.register('field1')}
          className={form.formState.errors.field1 ? 'border-red-500' : ''}
        />
        {form.formState.errors.field1 && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.field1.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}
```

### 3. Modal Components

Reusable modal pattern for detailed views and forms:

```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto', sizeClasses[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Usage
<Modal
  open={showModal}
  onClose={() => setShowModal(false)}
  title="User Details"
  size="xl"
>
  <UserDetailContent userId={selectedUserId} />
</Modal>
```

### 4. Table Components

Data table pattern with sorting, filtering, and pagination:

```typescript
interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
}

export function DataTable<T>({ 
  data, 
  columns, 
  loading = false,
  onSort,
  sortKey,
  sortDirection
}: DataTableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (!onSort) return;
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={5} />;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={String(column.key)}
                className={column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortKey === column.key && (
                    sortDirection === 'asc' ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {column.render 
                    ? column.render(row[column.key], row)
                    : String(row[column.key])
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Styling Guidelines

### Consistent Class Patterns

```typescript
// Card styling
const cardClasses = "rounded-3xl border border-border/50 bg-card p-6";

// Button variants
const buttonVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-background hover:bg-accent"
};

// Status colors
const statusColors = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800"
};

// Responsive grid patterns
const gridClasses = "grid gap-6 md:grid-cols-2 lg:grid-cols-4";
```

### Component Styling

```typescript
// Use cn() utility for conditional classes
import { cn } from "@/lib/utils";

const className = cn(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' && "primary-classes"
);

// Consistent spacing
const spacing = {
  section: "space-y-6",
  card: "p-6",
  form: "space-y-4",
  button: "px-4 py-2"
};
```

## State Management

### Local State
```typescript
// Component state
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Form state with react-hook-form
const form = useForm<FormData>({
  resolver: zodResolver(schema)
});
```

### URL State for Filters
```typescript
const searchParams = useSearchParams();
const router = useRouter();

const updateFilters = useCallback((newFilters: FilterType) => {
  const params = new URLSearchParams(searchParams);
  
  Object.entries(newFilters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }
  });
  
  router.push(`?${params.toString()}`);
}, [searchParams, router]);
```

### Server State with SWR
```typescript
import useSWR from 'swr';

const { data, error, mutate } = useSWR(
  '/api/endpoint',
  fetcher,
  {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: false
  }
);
```

## Error Handling

### Consistent Error Display
```typescript
// Error boundary component
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryProvider fallback={fallback}>
      {children}
    </ErrorBoundaryProvider>
  );
}

// Error display component
export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-red-800 mb-4">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}
```

### Loading States
```typescript
// Skeleton loader component
export function TableSkeleton({ columns, rows }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading spinner
export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-gray-300 border-t-primary",
      sizeClasses[size]
    )} />
  );
}
```

## Best Practices

### 1. Component Naming
- Use PascalCase for component names
- Be descriptive and specific
- Include the component type in the name (e.g., `UserManagementClient`, `MetricCard`)

### 2. Props Interface
- Always define TypeScript interfaces for props
- Use optional props with default values
- Group related props in objects when appropriate

### 3. File Organization
- One component per file
- Export component as default when it's the main export
- Co-locate related types and utilities

### 4. Performance
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Debounce user inputs for search and filters
- Use pagination for large datasets

### 5. Accessibility
- Include proper ARIA labels
- Ensure keyboard navigation works
- Use semantic HTML elements
- Provide alternative text for images

### 6. Testing
- Write unit tests for complex logic
- Test user interactions
- Mock external dependencies
- Use React Testing Library for component tests