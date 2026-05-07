import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { registerSocketHandlers } from './socketHandlers';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve built client in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`BattlePlane server running on port ${PORT}`);
});
