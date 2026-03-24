export const HEXCHAIN_ABI = [
  { type: 'receive', stateMutability: 'payable' },

  // ── Constants ──────────────────────────────
  { type: 'function', name: 'BLOCKHASH_LIMIT',    inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'CHOICES_COUNT',      inputs: [], outputs: [{ name: '', type: 'uint8' }],   stateMutability: 'view' },
  { type: 'function', name: 'COMMIT_WINDOW',      inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'ENTRY_FEE',          inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'LOCK_OFFSET',        inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'MAX_PLAYERS',        inputs: [], outputs: [{ name: '', type: 'uint8' }],   stateMutability: 'view' },
  { type: 'function', name: 'REVEAL_WINDOW',      inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'EYE_COMMIT_WINDOW',  inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'EYE_REVEAL_WINDOW',  inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'PRIZE_SHARE_1',      inputs: [], outputs: [{ name: '', type: 'uint8' }],   stateMutability: 'view' },
  { type: 'function', name: 'PRIZE_SHARE_2',      inputs: [], outputs: [{ name: '', type: 'uint8' }],   stateMutability: 'view' },
  { type: 'function', name: 'PRIZE_SHARE_3',      inputs: [], outputs: [{ name: '', type: 'uint8' }],   stateMutability: 'view' },

  // ── State ───────────────────────────────────
  { type: 'function', name: 'currentRoundId', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  {
    type: 'function', name: 'commitments',
    inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'address' }],
    outputs: [
      { name: 'commitHash',    type: 'uint256' },
      { name: 'eyeCommitHash', type: 'bytes32' },
      { name: 'pickedMask',    type: 'uint16' },
      { name: 'survivingMask', type: 'uint16' },
      { name: 'eyeOrder',      type: 'uint8' },
      { name: 'revealed',      type: 'bool' },
      { name: 'eyeRevealed',   type: 'bool' },
      { name: 'score',         type: 'uint64' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'rounds',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'revealHash',    type: 'bytes32' },
      { name: 'startBlock',    type: 'uint64' },
      { name: 'lockBlock',     type: 'uint64' },
      { name: 'revealBlock',   type: 'uint64' },
      { name: 'eyeLockBlock',  type: 'uint64' },
      { name: 'eyeRevealBlock',type: 'uint64' },
      { name: 'playerCount',   type: 'uint16' },
      { name: 'state',         type: 'uint8' },
      { name: 'prizePool',     type: 'uint256' },
    ],
    stateMutability: 'view',
  },

  // ── Game Actions ────────────────────────────
  {
    type: 'function', name: 'createRound',
    inputs: [], outputs: [{ name: 'roundId', type: 'uint256' }], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'commit',
    inputs: [
      { name: 'roundId',    type: 'uint256' },
      { name: 'commitHash', type: 'uint256' },
    ],
    outputs: [], stateMutability: 'payable',
  },
  {
    type: 'function', name: 'lockRound',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'openEyeGame',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'eyeCommit',
    inputs: [
      { name: 'roundId',       type: 'uint256' },
      { name: 'eyeCommitHash', type: 'bytes32' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'lockEyeRound',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'eyeReveal',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'order',   type: 'uint8' },
      { name: 'salt',    type: 'bytes32' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'settle',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ── View Helpers ────────────────────────────
  {
    type: 'function', name: 'getRoundInfo',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [
      { name: 'state',         type: 'uint8' },
      { name: 'startBlock',    type: 'uint64' },
      { name: 'lockBlock',     type: 'uint64' },
      { name: 'revealBlock',   type: 'uint64' },
      { name: 'eyeLockBlock',  type: 'uint64' },
      { name: 'eyeRevealBlock',type: 'uint64' },
      { name: 'playerCount',   type: 'uint16' },
      { name: 'prizePool',     type: 'uint256' },
      { name: 'revealHash',    type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getPlayerInfo',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'player',  type: 'address' },
    ],
    outputs: [
      { name: 'hasCommitted',  type: 'bool' },
      { name: 'revealed',      type: 'bool' },
      { name: 'eyeRevealed',   type: 'bool' },
      { name: 'eyeOrder',      type: 'uint8' },
      { name: 'survivingMask', type: 'uint16' },
      { name: 'score',         type: 'uint64' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getNibbleMult',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint8[16]' }],
    stateMutability: 'view',
  },
  // ── Events ──────────────────────────────────
  {
    type: 'event', name: 'RoundCreated',
    inputs: [
      { name: 'roundId',    type: 'uint256', indexed: true },
      { name: 'startBlock', type: 'uint256', indexed: false },
      { name: 'lockBlock',  type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'Committed',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'player',  type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'RoundLocked',
    inputs: [
      { name: 'roundId',    type: 'uint256', indexed: true },
      { name: 'revealHash', type: 'bytes32', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'Revealed',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'player',  type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'EyeGameOpened',
    inputs: [
      { name: 'roundId',      type: 'uint256', indexed: true },
      { name: 'eyeLockBlock', type: 'uint64',  indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'EyeCommitted',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'player',  type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'EyeGameLocked',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'EyeRevealed',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'player',  type: 'address', indexed: true },
      { name: 'order',   type: 'uint8',   indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'Settled',
    inputs: [
      { name: 'roundId', type: 'uint256',    indexed: true },
      { name: 'top3',    type: 'address[3]', indexed: false },
      { name: 'scores',  type: 'uint64[3]',  indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event', name: 'PrizeSent',
    inputs: [
      { name: 'roundId',   type: 'uint256', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount',    type: 'uint256', indexed: false },
      { name: 'rank',      type: 'uint8',   indexed: false },
    ],
    anonymous: false,
  },
  // ── Errors ──────────────────────────────────
  { type: 'error', name: 'AlreadyCommitted',       inputs: [] },
  { type: 'error', name: 'AlreadyRevealed',        inputs: [] },
  { type: 'error', name: 'AlreadyEyeCommitted',    inputs: [] },
  { type: 'error', name: 'AlreadyEyeRevealed',     inputs: [] },
  { type: 'error', name: 'CommitWindowClosed',     inputs: [] },
  { type: 'error', name: 'EyeCommitWindowClosed',  inputs: [] },
  { type: 'error', name: 'EyeRevealWindowClosed',  inputs: [] },
  { type: 'error', name: 'HashExpired',            inputs: [] },
  { type: 'error', name: 'HashNotAvailable',       inputs: [] },
  { type: 'error', name: 'InvalidEyeOrder',        inputs: [] },
  { type: 'error', name: 'MaxPlayersReached',      inputs: [] },
  { type: 'error', name: 'NotCommitted',           inputs: [] },
  { type: 'error', name: 'NothingToSettle',        inputs: [] },
  { type: 'error', name: 'RevealWindowClosed',     inputs: [] },
  { type: 'error', name: 'RoundNotEyeLocked',      inputs: [] },
  { type: 'error', name: 'RoundNotEyeOpen',        inputs: [] },
  { type: 'error', name: 'RoundNotLocked',         inputs: [] },
  { type: 'error', name: 'RoundNotOpen',           inputs: [] },
  { type: 'error', name: 'TooEarlyToLock',         inputs: [] },
  { type: 'error', name: 'TooEarlyToLockEye',      inputs: [] },
  { type: 'error', name: 'TooEarlyToOpenEye',      inputs: [] },
  { type: 'error', name: 'TooEarlyToSettle',       inputs: [] },
  { type: 'error', name: 'TransferFailed',         inputs: [] },
  { type: 'error', name: 'WrongEntryFee',          inputs: [] },
  { type: 'error', name: 'NotOperator',            inputs: [] },
] as const
