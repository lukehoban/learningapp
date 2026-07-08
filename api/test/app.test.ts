import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

// No AI configured -> app always uses the offline generator.
const app = createApp({ aiConfig: {} });

describe("GET /api/health", () => {
  it("reports status and ai availability", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", ai: false });
  });
});

describe("POST /api/quiz", () => {
  it("returns an offline quiz for a valid request", async () => {
    const res = await request(app)
      .post("/api/quiz")
      .send({ topic: "math", grade: 3, count: 4, difficulty: "easy" });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe("offline");
    expect(res.body.questions).toHaveLength(4);
    expect(res.body.topic).toBe("math");
  });

  it("defaults count and difficulty when omitted", async () => {
    const res = await request(app)
      .post("/api/quiz")
      .send({ topic: "science", grade: 4 });
    expect(res.status).toBe(200);
    expect(res.body.questions).toHaveLength(5);
    expect(res.body.difficulty).toBe("medium");
  });

  it("rejects a missing topic", async () => {
    const res = await request(app).post("/api/quiz").send({ grade: 3 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/topic/);
  });

  it("rejects an out-of-range grade", async () => {
    const res = await request(app)
      .post("/api/quiz")
      .send({ topic: "math", grade: 20 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/grade/);
  });

  it("rejects too many questions", async () => {
    const res = await request(app)
      .post("/api/quiz")
      .send({ topic: "math", grade: 3, count: 99 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/count/);
  });

  it("rejects an invalid difficulty", async () => {
    const res = await request(app)
      .post("/api/quiz")
      .send({ topic: "math", grade: 3, difficulty: "impossible" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/difficulty/);
  });
});
