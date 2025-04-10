import { JwtVerifyOptions } from '@fastify/jwt';
import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    bcrypt: {
      hash: (password: string) => Promise<string>;
      compare: (password: string, hashedPassword: string) => Promise<boolean>;
    };
    jwt: {
      sign: (payload: any, options?: { expiresIn: string }) => string;
      verify: (token: string, options?: JwtVerifyOptions) => any;
    };
  }

  interface FastifyRequest {
    user?: {
      id: string;
      username: string;
    };
  }
} 