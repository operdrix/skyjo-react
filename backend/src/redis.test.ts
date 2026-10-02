import { afterEach, describe, expect, it, vi } from "vitest";

const failingClient = {
  on: vi.fn(),
  connect: vi.fn(async () => {}),
  setEx: vi.fn(async () => { throw new Error("Redis indisponible"); }),
  exists: vi.fn(async () => { throw new Error("Redis indisponible"); }),
  quit: vi.fn(async () => {}),
};

vi.mock("redis", () => ({ createClient: () => failingClient }));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("blacklist des jetons", () => {
  it("garde le jeton en mémoire quand Redis échoue", async () => {
    vi.stubEnv("REDIS_URL", "redis://test");
    const { addToBlacklist, initRedis, isBlacklisted } = await import("./redis.ts");
    await initRedis();

    await addToBlacklist("jeton-revoque", 60);

    expect(await isBlacklisted("jeton-revoque")).toBe(true);
    expect(await isBlacklisted("autre-jeton")).toBe(false);
  });
});
