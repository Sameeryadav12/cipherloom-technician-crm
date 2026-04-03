import type { Request, Response } from "express";
import { created, ok, paginated } from "../../utils/api-response.js";
import type {
  CreateCustomerBody,
  ListCustomersQuery,
  UpdateCustomerBody
} from "./customer.schemas.js";
import * as customerService from "./customer.service.js";

export async function listCustomers(req: Request, res: Response) {
  const query = req.query as unknown as ListCustomersQuery;
  const data = await customerService.listCustomers(query);
  return paginated(res, data);
}

export async function getCustomerById(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const customer = await customerService.getCustomerById(id);
  return ok(res, { customer });
}

export async function createCustomer(req: Request, res: Response) {
  const body = req.body as CreateCustomerBody;
  const customer = await customerService.createCustomer(body);
  return created(res, { customer }, { message: "Customer created" });
}

export async function updateCustomer(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const body = req.body as UpdateCustomerBody;
  const customer = await customerService.updateCustomer(id, body);
  return ok(res, { customer }, { message: "Customer updated" });
}

export async function deleteCustomer(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  await customerService.deleteCustomer(id);
  return ok(res, { deleted: true }, { message: "Customer deleted" });
}
