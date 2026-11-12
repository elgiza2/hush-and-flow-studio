import { describe, expect, it, vi } from "vitest";
const handler = vi.hoisted(() => ({ fn: null as null | ((args: { data: { confirmation: string; password: string } }) => Promise<unknown>) }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ inputValidator: () => ({ handler: (fn: typeof handler.fn) => { handler.fn = fn; return fn; } }) }) }));
vi.mock("@tanstack/react-start/server", () => ({ getRequest: () => new Request("http://localhost:8080") }));
const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), remove: vi.fn(), cleanup: vi.fn() }));
vi.mock("@/lib/ceyo/auth.server", () => ({ authenticate: mocks.authenticate }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.cleanup, auth: { admin: { deleteUser: mocks.remove } } } }));
import "./account.functions";
describe("verified account deletion", () => {
 it("does not delete any data if the password does not verify", async () => {
  mocks.authenticate.mockResolvedValue({ userId: "owner", db: { auth: { getUser: async () => ({data:{user:{email:"test@example.com"}}}), signInWithPassword: async () => ({data:{user:null},error:{message:"Wrong password"}}) } } });
  if (!handler.fn) throw new Error("Missing handler");
  await expect(handler.fn({data:{confirmation:"DELETE",password:"test-password"}})).rejects.toThrow("Incorrect password");
  expect(mocks.cleanup).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
 });
 it("never starts deleting data for a signed-out request", async () => {
  mocks.authenticate.mockRejectedValue(new Error("Please sign in"));
  if (!handler.fn) throw new Error("Missing handler");
  await expect(handler.fn({data:{confirmation:"DELETE",password:"test-password"}})).rejects.toThrow("sign in");
  expect(mocks.cleanup).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
 });
});
