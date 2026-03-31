import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Source {
  chunk_index: number;
  date_range: string;
  semantic_score: number;
  keyword_score: number;
  final_score: number;
  transaction_count: number;
  amounts: number[];
  dates: string[];
}

interface SourcesCardProps {
  sources: Source[];
}

export const SourcesCard: React.FC<SourcesCardProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  const totalTransactions = sources.reduce((sum, s) => sum + s.transaction_count, 0);
  const maxScore = Math.max(...sources.map((s) => s.final_score));

  return (
    <Card className="mt-4 bg-secondary/5 border-secondary/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="text-sm font-semibold text-secondary">
            📎 Sources Used
          </div>
          <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
            {totalTransactions} transactions
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-secondary/20 divide-y divide-secondary/20">
          {sources.map((source, idx) => (
            <div
              key={idx}
              className="p-4 space-y-3 bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Statement Chunk {source.chunk_index + 1}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    📅 {source.date_range}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                    {(source.final_score * 100).toFixed(0)}% Match
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-primary/10 p-2 rounded">
                  <p className="text-muted-foreground">Semantic</p>
                  <p className="font-semibold text-primary">
                    {(source.semantic_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-secondary/10 p-2 rounded">
                  <p className="text-muted-foreground">Keyword</p>
                  <p className="font-semibold text-secondary">
                    {(source.keyword_score * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="bg-background/50 p-2 rounded border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  💰 Transactions ({source.transaction_count})
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {source.amounts.map((amount, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs"
                    >
                      <span className="text-muted-foreground">
                        {source.dates[i]}
                      </span>
                      <span className="font-semibold text-foreground">
                        ${Math.abs(amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {source.amounts.length > 5 && (
                    <p className="text-xs text-muted-foreground pt-1 italic">
                      + {source.amounts.length - 5} more...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="p-4 bg-background/50">
            <p className="text-xs text-muted-foreground">
              ℹ️ These sources show which bank statement data informed this answer.
              Higher match percentage = more relevant to your query.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
