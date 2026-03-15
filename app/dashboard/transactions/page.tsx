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
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Masked NIN</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
                    {new Date(tx.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize">{tx.type}</TableCell>
                  <TableCell>{tx.description ?? "-"}</TableCell>
                  <TableCell>{tx.ninMasked ?? "-"}</TableCell>
                  <TableCell>
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
                  <TableCell className="text-right">
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
