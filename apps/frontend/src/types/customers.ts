import type { Customer, PaginatedResponse } from "@/types/api";

export type CustomerListItem = Customer;

export type CustomerFormValues = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  notes: string;
};

export type CustomerListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CustomerListResponse = PaginatedResponse<CustomerListItem>;

