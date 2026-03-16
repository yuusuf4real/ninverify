import { db } from "@/db/client";
import { getSession } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { desc } from "drizzle-orm";

export default async function TransactionsPage() {
  const session = await getSession();
  const transactions = session
    ? await db.query.walletTransactions.findMany({
        where: (walletTransactions, { eq }) =>
          eq(walletTransactions.userId, session.userId),
        orderBy: (walletTransactions) => [desc(walletTransactions.createdAt)],
        limit: 20,
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-white/90 p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
          History
        </p>
        <h1 className="font-heading text-3xl font-semibold">
          Wallet transactions
        </h1>
        <p className="text-sm text-muted-foreground">
          NIN values are masked for privacy. Refunds appear instantly on
          failure.
        </p>
      </div>

      <Card className="border-border/70 bg-white/90 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">
                Description
              </TableHead>
              <TableHead className="hidden lg:table-cell">Masked NIN</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No transactions yet.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{new Date(tx.createdAt).toLocaleString()}</p>
                      <div className="space-y-1 text-xs text-muted-foreground sm:hidden">
                        <p className="capitalize">
                          {tx.type} • {tx.status}
                        </p>
                        <p className="font-medium text-foreground">
                          {formatNaira(tx.amount)}
                        </p>
                        <p className="line-clamp-2">{tx.description ?? "-"}</p>
                        {tx.ninMasked && (
                          <p className="font-mono">NIN: {tx.ninMasked}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">
                    {tx.type}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tx.description ?? "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {tx.ninMasked ?? "-"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={
                        tx.status === "completed"
                          ? "success"
                          : tx.status === "refunded"
                            ? "warning"
                            : "default"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {formatNaira(tx.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
