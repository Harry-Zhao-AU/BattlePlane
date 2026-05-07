import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EVENTS, GamePhase } from '@battleplane/shared';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import RoomLink from './RoomLink';

export default function LobbyScreen() {
  const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
  const store = useGameStore();
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (urlRoomId && !store.roomId) {
      // Pre-fill room id when joining via link
      store.setRoomId(urlRoomId);
    }
  }, []);

  const isJoining = !!urlRoomId;

  const handleCreate = () => {
    const name = nameInput.trim() || 'Player';
    store.setMyName(name);
    socket.emit(EVENTS.ROOM_CREATE, { playerName: name });
  };

  const handleJoin = () => {
    const name = nameInput.trim() || 'Player';
    store.setMyName(name);
    socket.emit(EVENTS.ROOM_JOIN, { roomId: urlRoomId, playerName: name });
  };

  const waiting = store.phase === GamePhase.WAITING && store.roomId;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-xl">
        <h1 className="text-4xl font-bold text-center text-cyan-400 mb-1 tracking-tight">
          BattlePlane
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8">炸飞机 · Online Multiplayer</p>

        {store.errorMsg && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-2 mb-4 text-sm">
            {store.errorMsg}
          </div>
        )}

        {!waiting && (
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-1">Your name</label>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
              placeholder="Enter your name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') isJoining ? handleJoin() : handleCreate(); }}
              maxLength={20}
            />
          </div>
        )}

        {!waiting && !isJoining && (
          <button
            onClick={handleCreate}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl text-lg transition-colors"
          >
            Create Room
          </button>
        )}

        {!waiting && isJoining && (
          <button
            onClick={handleJoin}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl text-lg transition-colors"
          >
            Join Room
          </button>
        )}

        {waiting && store.roomId && (
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Share this link with your opponent:</p>
            <RoomLink roomId={store.roomId} />
            <div className="flex items-center justify-center gap-3 text-slate-400 mt-4">
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              Waiting for opponent to join...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
