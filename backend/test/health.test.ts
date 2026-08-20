import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /api/v1/health/live", () => {
  it("répond 200 sans dépendre de la base ou de Firebase", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/health/live");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("Routes protégées", () => {
  it("refuse une requête sans jeton Authorization", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/consultations");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("unauthorized");
  });
});
