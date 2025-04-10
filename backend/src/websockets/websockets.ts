import { FastifyInstance } from 'fastify';
import { Server, Socket } from 'socket.io';

export function websockets(app: FastifyInstance): void {
  const io: Server = app.io;

  io.on('connection', (socket: Socket) => {
    console.log('Nouvelle connexion WebSocket', socket.id);

    socket.on('disconnect', () => {
      console.log('Déconnexion WebSocket', socket.id);
    });

    // Implémentez ici vos gestionnaires d'événements WebSocket
  });
} 