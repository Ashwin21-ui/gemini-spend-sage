import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  description: string;
  reference_no: string;
  amount: number;
  type: "debit" | "credit";
  balance: number;
}

interface Statement {
  id: string;
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  statement_start_date: string;
  statement_end_date: string;
}

interface ExpandedState {
  [key: string]: boolean;
}

export default function Statements() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();

  const [statements, setStatements] = useState<Statement[]>([]);
  const [transactionsMap, setTransactionsMap] = useState<{
    [key: string]: Transaction[];
  }>({});
  const [expandedStates, setExpandedStates] = useState<ExpandedState>({});
  const [loading, setLoading] = useState(true);

  // Fetch statements
  useEffect(() => {
    const fetchStatements = async () => {
      if (!token) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/user-data/accounts`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setStatements(data.accounts || []);
        }
      } catch (error) {
        console.error("Failed to fetch statements:", error);
        toast({
          title: "Error",
          description: "Failed to load statements",
          variant: "destructive",
        });
      }
    };

    fetchStatements();
  }, [token, toast]);

  const toggleExpand = async (accountId: string) => {
    // If already expanded, just collapse
    if (expandedStates[accountId]) {
      setExpandedStates((prev) => ({
        ...prev,
        [accountId]: false,
      }));
      return;
    }

    // If not loaded, fetch transactions
    if (!transactionsMap[accountId]) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000"}/api/user-data/transactions/${accountId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setTransactionsMap((prev) => ({
            ...prev,
            [accountId]: data.transactions,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive",
        });
        return;
      }
    }

    setExpandedStates((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  useEffect(() => {
    setLoading(false);
  }, [statements]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat")}
            className="hover:bg-secondary/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bank Statements</h1>
            <p className="text-sm text-muted-foreground">
              View and explore your uploaded bank statements
            </p>
          </div>
        </div>

        {/* Statements List */}
        <div className="space-y-4">
          {statements.length > 0 ? (
            statements.map((statement) => (
              <div
                key={statement.id}
                className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
              >
                {/* Statement Header */}
                <button
                  onClick={() => toggleExpand(statement.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors gap-4"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg">{statement.bank_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Account: •••• {statement.account_number.slice(-4)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(statement.statement_start_date)} to{" "}
                      {formatDate(statement.statement_end_date)}
                    </p>
                  </div>
                  {expandedStates[statement.id] ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Transactions Table */}
                {expandedStates[statement.id] && transactionsMap[statement.id] && (
                  <div className="border-t border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-0 bg-secondary/20">
                          <TableHead className="h-10">Date</TableHead>
                          <TableHead className="h-10">Description</TableHead>
                          <TableHead className="h-10 text-right">Amount</TableHead>
                          <TableHead className="h-10 text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsMap[statement.id].length > 0 ? (
                          transactionsMap[statement.id].map((txn, idx) => (
                            <TableRow key={idx} className="border-0 hover:bg-secondary/5">
                              <TableCell className="py-3 text-sm">
                                {formatDate(txn.date)}
                              </TableCell>
                              <TableCell className="py-3 text-sm">
                                {txn.description}
                              </TableCell>
                              <TableCell
                                className={`py-3 text-sm text-right font-medium ${
                                  txn.type === "credit"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {txn.type === "credit" ? "+" : "-"}
                                {formatCurrency(Math.abs(txn.amount))}
                              </TableCell>
                              <TableCell className="py-3 text-sm text-right">
                                {formatCurrency(txn.balance)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Loading Transactions */}
                {expandedStates[statement.id] && !transactionsMap[statement.id] && (
                  <div className="border-t border-border py-8 px-6 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Loading transactions...
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No statements uploaded yet
              </p>
              <Button onClick={() => navigate("/upload")}>Upload Statement</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
