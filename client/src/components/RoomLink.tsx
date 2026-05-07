import React, { useState } from 'react';

interface RoomLinkProps {
  roomId: string;
}

export default function RoomLink({ roomId }: RoomLinkProps) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/room/${roomId}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2">
      <span className="text-slate-300 text-sm truncate flex-1">{url}</span>
      <button
        onClick={copy}
        className="text-cyan-400 text-sm hover:text-cyan-300 font-semibold shrink-0"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
