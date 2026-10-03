import { api } from "@/services/apiService";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

function stubFetch() {
  const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("apiService", () => {
  it("n'annonce pas de JSON pour une requête sans body (le serveur refuse un body JSON vide)", async () => {
    const fetch = stubFetch();

    await api.delete("game/g1");

    const headers = new Headers(fetch.mock.calls[0][1].headers);
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("envoie le body en JSON", async () => {
    const fetch = stubFetch();

    await api.patch("game/g1", { private: false });

    const [, options] = fetch.mock.calls[0];
    expect(new Headers(options.headers).get("Content-Type")).toBe("application/json");
    expect(options.body).toBe('{"private":false}');
  });
});
