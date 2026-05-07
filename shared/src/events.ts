export const EVENTS = {
  // Client → Server
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  PLACEMENT_SUBMIT: 'placement:submit',
  BATTLE_ATTACK: 'battle:attack',
  ROOM_REMATCH: 'room:rematch',

  // Server → Client
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_OPPONENT_JOINED: 'room:opponent_joined',
  ROOM_OPPONENT_LEFT: 'room:opponent_left',
  GAME_PHASE_CHANGE: 'game:phase_change',
  PLACEMENT_ACK: 'placement:ack',
  GAME_BOTH_READY: 'game:both_ready',
  BATTLE_RESULT: 'battle:result',
  GAME_REMATCH_START: 'game:rematch_start',
  ROOM_REMATCH_WAITING: 'room:rematch_waiting',
  ERROR: 'error',
} as const;
