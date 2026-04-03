export type TimeOffEntry = {
  id: string;
  technicianId: string;
  start: string;
  end: string;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
  technician?: {
    id: string;
    name: string;
    email?: string | null;
    isActive?: boolean;
  };
};

export type TimeOffFormValues = {
  start: string;
  end: string;
  reason: string;
};

export type TimeOffListParams = {
  technicianId?: string;
  page?: number;
  limit?: number;
  start?: string;
  end?: string;
};

