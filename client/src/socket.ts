import { io, Socket } from 'socket.io-client';

const socket: Socket = io({ autoConnect: true });

export default socket;
