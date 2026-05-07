import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { GamePhase } from '@battleplane/shared';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import LobbyScreen from './components/LobbyScreen';
import PlacementScreen from './components/PlacementScreen';
import BattleScreen from './components/BattleScreen';
import EndScreen from './components/EndScreen';

function GameRouter() {
  useSocket();
  const phase = useGameStore(s => s.phase);

  if (phase === GamePhase.PLACING) return <PlacementScreen />;
  if (phase === GamePhase.BATTLING) return <BattleScreen />;
  if (phase === GamePhase.ENDED) return <EndScreen />;
  return <LobbyScreen />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameRouter />} />
        <Route path="/room/:roomId" element={<GameRouter />} />
      </Routes>
    </BrowserRouter>
  );
}
