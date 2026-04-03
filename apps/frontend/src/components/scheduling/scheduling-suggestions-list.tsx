import { SchedulingSuggestionCard } from "./scheduling-suggestion-card";
import type { SchedulingRequest, SchedulingSuggestion } from "@/types/scheduling";

type SchedulingSuggestionsListProps = {
  suggestions: SchedulingSuggestion[];
  lastRequest: SchedulingRequest | null;
  executionBusy: boolean;
  onOpenApply: (suggestion: SchedulingSuggestion) => void;
  onSelectSuggestion?: (suggestion: SchedulingSuggestion) => void;
};

export function SchedulingSuggestionsList({
  suggestions,
  lastRequest,
  executionBusy,
  onOpenApply,
  onSelectSuggestion
}: SchedulingSuggestionsListProps) {
  const ranked = [...suggestions]
    .map((s, idx) => ({ suggestion: s, rank: s.rank ?? idx + 1 }))
    .sort((a, b) => a.rank - b.rank);

  const bestRank = ranked[0]?.rank ?? 1;

  return (
    <div className="space-y-3">
      {ranked.map(({ suggestion, rank }, idx) => (
        <SchedulingSuggestionCard
          key={`${suggestion.technician.id}-${suggestion.slot.start}-${idx}`}
          suggestion={suggestion}
          rank={rank}
          isBest={rank === bestRank}
          lastRequest={lastRequest}
          executionBusy={executionBusy}
          onOpenApply={onOpenApply}
          onSelect={onSelectSuggestion}
        />
      ))}
    </div>
  );
}
