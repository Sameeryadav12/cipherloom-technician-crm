import type { UserRole } from "@prisma/client";

export type SchedulingAuthContext = {
  userId: string;
  role: UserRole;
};

export type SchedulingSuggestion = {
  technician: {
    id: string;
    name: string;
    color: string | null;
    skills: string[];
  };
  slot: {
    start: Date;
    end: Date;
  };
  score: number;
  reason: string;
};

export type SchedulingSuggestResponse = {
  suggestions: SchedulingSuggestion[];
  searchWindow: {
    start: Date;
    end: Date;
  };
};

