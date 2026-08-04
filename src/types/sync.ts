export type SyncMode = 'offline' | 'gdrive' | 'webrtc';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncConfig {
  mode: SyncMode;
  lastSyncedAt?: string;
  gdriveEmail?: string;
  autoSync: boolean;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: string;
  message?: string;
  isConnecting?: boolean;
}

export interface WebRTCOfferPayload {
  version: string;
  senderDeviceId: string;
  senderEmail: string;
  offerSdp: string;
  timestamp: string;
}

export interface WebRTCAnswerPayload {
  answerSdp: string;
  receiverDeviceId: string;
}

export interface WebRTCSyncMessage {
  type: 'VAULT_TRANSFER' | 'PING' | 'PONG' | 'ACK';
  encryptedPayload?: any; // EncryptedPayload
  userProfile?: any;
  timestamp: string;
}
