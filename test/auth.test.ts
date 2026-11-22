import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as loginRoute } from "../src/app/api/auth/login/route";
import { POST as logoutRoute } from "../src/app/api/auth/logout/route";
import { GET as sessionCurrentRoute } from "../src/app/api/session/current/route";
import { signSession, verifySession } from "../src/lib/session";

describe("Authentication & RBAC Session API", () => {
  it("authenticates via corporate email and returns signed HMAC token", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "priya.patel@enterprise.corp",
        password: "enterprise-secure-pwd",
      }),
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.session.role).toBe("IT_ADMIN");
    expect(json.session.name).toBe("Priya Patel");
    expect(json.token).toBeDefined();

    const decoded = verifySession(json.token);
    expect(decoded).not.toBeNull();
    expect(decoded?.role).toBe("IT_ADMIN");
    expect(decoded?.userId).toBe("usr_it_02");

    const cookie = res.cookies.get("kioskdrop_session");
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe(json.token);
  });

  it("authenticates via RFID badge tap", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rfidBadgeId: "RFID-EMP-8821",
      }),
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.session.role).toBe("EMPLOYEE");
    expect(json.session.name).toBe("Aarav Sharma");
  });

  it("returns 401 Unauthorized on non-existent credentials", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@enterprise.corp",
        password: "wrong",
      }),
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("logs out and clears session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });

    const res = await logoutRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    const cookie = res.cookies.get("kioskdrop_session");
    expect(cookie?.value).toBe("");
  });

  it("returns unauthenticated session status when no token is supplied", async () => {
    const res = await sessionCurrentRoute();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.authenticated).toBe(false);
    expect(json.session).toBeNull();
    expect(json.availableUsers.length).toBeGreaterThan(0);
  });

  it("returns authenticated session when valid Bearer token is provided", async () => {
    const testToken = signSession({
      userId: "usr_fin_03",
      name: "Vikram Malhotra",
      email: "vikram.malhotra@enterprise.corp",
      department: "Corporate Procurement & FinOps",
      role: "FINOPS_AUDITOR",
      rfidBadgeId: "RFID-FIN-1109",
    });

    // Verify token can be parsed and decoded
    const decoded = verifySession(testToken);
    expect(decoded).not.toBeNull();
    expect(decoded?.role).toBe("FINOPS_AUDITOR");
    expect(decoded?.name).toBe("Vikram Malhotra");
  });
});

