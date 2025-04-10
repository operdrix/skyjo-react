declare module 'fastify-bcrypt' {
  import { FastifyPluginCallback } from 'fastify';

  interface FastifyBcryptOptions {
    saltWorkFactor?: number;
  }

  const fastifyBcrypt: FastifyPluginCallback<FastifyBcryptOptions>;
  export default fastifyBcrypt;
}

declare module 'fastify-socket.io' {
  import { FastifyPluginCallback } from 'fastify';
  import { ServerOptions } from 'socket.io';

  const socketioServer: FastifyPluginCallback<ServerOptions>;
  export default socketioServer;
}

declare module './websockets/websockets.js' {
  import { FastifyInstance } from 'fastify';

  export function websockets(app: FastifyInstance): void;
} 