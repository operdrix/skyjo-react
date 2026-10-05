import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  closeApp,
  connectPlayer,
  createGuest,
  createPlayer,
  nextEvent,
  setupApp,
  type TestPlayer,
} from "../../test/helpers.ts";

let app: FastifyInstance;
let url: string;
let alice: TestPlayer;

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
  url = await app.listen({ port: 0, host: "127.0.0.1" });
});

afterAll(async () => {
  await closeApp(app);
});

describe("invités (jouer sans compte)", () => {
  it("donne une session à un invité avec le pseudo choisi", async () => {
    const { guest, pseudo } = await createGuest(app, "Lynx 42");

    expect(pseudo.statusCode).toBe(200);
    const session = await app.inject({ method: "GET", url: "/api/auth/get-session", cookies: guest.cookies });
    expect(session.json().user).toMatchObject({ id: guest.id, username: "Lynx 42", isAnonymous: true });
  });

  it("refuse à un invité un pseudo déjà pris, avec un message", async () => {
    const { pseudo } = await createGuest(app, "alice");

    expect(pseudo.statusCode).toBe(400);
    expect(pseudo.json().message).toEqual(expect.any(String));
  });

  it("laisse un invité rejoindre une partie et y jouer", async () => {
    const { guest } = await createGuest(app, "Renard 7");
    const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
    const gameId = created.json<{ gameId: string }>().gameId;

    const joined = await app.inject({
      method: "PATCH",
      url: `/api/game/join/${gameId}`,
      cookies: guest.cookies,
      payload: {},
    });
    expect(joined.statusCode).toBe(200);
    await app.inject({ method: "PATCH", url: `/api/game/start/${gameId}`, cookies: alice.cookies, payload: {} });

    const socket = connectPlayer(url, guest);
    await nextEvent(socket, "connect");
    expect(await socket.emitWithAck("player-joined-game", { room: gameId })).toEqual({ ok: true });
    expect(await socket.emitWithAck("play-move", { room: gameId, move: "reveal", cardIndex: 0 })).toEqual({ ok: true });
    socket.close();
  });

  it("refuse la création de partie à un invité", async () => {
    const { guest } = await createGuest(app, "Hibou 3");

    const created = await app.inject({ method: "POST", url: "/api/game", cookies: guest.cookies, payload: {} });

    expect(created.statusCode).toBe(403);
    expect(created.json().error).toEqual(expect.any(String));
  });

  it("refuse l'historique d'un invité", async () => {
    const { guest } = await createGuest(app, "Loutre 9");

    const history = await app.inject({ method: "GET", url: `/api/users/${guest.id}/games` });

    expect(history.statusCode).toBe(403);
  });
});
