'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Cloud, HardDrive, Share2, Check, AlertCircle, LogOut, QrCode, Key, ArrowRight, Settings } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SyncMode } from '@/types/sync';
import { UserProfile, VaultData } from '@/types/vault';
import {
  authenticateGoogleDrive,
  downloadVaultFromDrive,
  uploadVaultToDrive,
  getStoredDriveToken,
  disconnectGoogleDrive,
  getSavedClientId,
  saveClientId,
} from '@/services/googleDriveService';
import { WebRTCSyncHost, WebRTCSyncClient } from '@/services/webrtcSyncService';
import { mergeVaultData } from '@/services/syncMergeService';
import { encryptData, decryptData } from '@/crypto/cipher';
import { generateSalt, arrayBufferToBase64 } from '@/crypto/pbkdf2';
import { EncryptedPayload } from '@/types/crypto';

interface SyncModalProps {
  userProfile: UserProfile;
  vaultData: VaultData;
  masterPasswordKey?: CryptoKey;
  onClose: () => void;
  onUpdateSyncMode: (mode: SyncMode) => void;
  onVaultUpdated: (updatedVault: VaultData, encryptedPayload: EncryptedPayload) => void;
}

export default function SyncModal({
  userProfile,
  vaultData,
  masterPasswordKey,
  onClose,
  onUpdateSyncMode,
  onVaultUpdated,
}: SyncModalProps) {
  const [selectedMode, setSelectedMode] = useState<SyncMode>(userProfile.syncMode || 'offline');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [clientId, setClientId] = useState('');
  const [showClientIdInput, setShowClientIdInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Estados do WebRTC P2P
  const [p2pRole, setP2pRole] = useState<'none' | 'host' | 'client'>('none');
  const [qrCodeData, setQrCodeData] = useState('');
  const [p2pInputCode, setP2pInputCode] = useState('');
  const [p2pStatus, setP2pStatus] = useState('');
  const [p2pHost, setP2pHost] = useState<WebRTCSyncHost | null>(null);

  useEffect(() => {
    const token = getStoredDriveToken();
    setIsDriveConnected(!!token);
    setClientId(getSavedClientId());
  }, []);

  // Limpa o host P2P ao fechar
  useEffect(() => {
    return () => {
      if (p2pHost) {
        p2pHost.close();
      }
    };
  }, [p2pHost]);

  const handleSelectMode = (mode: SyncMode) => {
    setSelectedMode(mode);
    onUpdateSyncMode(mode);
    setStatusMessage('');
    setErrorMessage('');
  };

  const handleSaveClientId = () => {
    saveClientId(clientId);
    setShowClientIdInput(false);
    setStatusMessage('Google Client ID salvo com sucesso.');
  };

  const handleConnectGoogleDrive = async () => {
    setErrorMessage('');
    setStatusMessage('Conectando ao Google Drive...');
    setIsSyncing(true);

    try {
      const token = await authenticateGoogleDrive(clientId);
      if (token) {
        setIsDriveConnected(true);
        setStatusMessage('Conectado com sucesso ao Google Drive!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar ao Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogleDrive = () => {
    disconnectGoogleDrive();
    setIsDriveConnected(false);
    setStatusMessage('Desconectado do Google Drive.');
  };

  // Sincronizar com o Google Drive (Upload ou Download/Merge)
  const handleSyncWithDrive = async () => {
    if (!masterPasswordKey) {
      setErrorMessage('Sessão inválida. Faça login novamente.');
      return;
    }

    setErrorMessage('');
    setStatusMessage('Sincronizando com o Google Drive...');
    setIsSyncing(true);

    try {
      const token = getStoredDriveToken();
      if (!token) {
        throw new Error('Conecte sua conta do Google Drive primeiro.');
      }

      // 1. Tenta baixar versão remota
      const remote = await downloadVaultFromDrive(token);

      if (remote && remote.payload) {
        // Decripta cofre remoto
        let remoteVault: VaultData;
        try {
          remoteVault = await decryptData<VaultData>(remote.payload, masterPasswordKey);
        } catch {
          throw new Error('Não foi possível descriptografar o cofre do Google Drive. A senha mestra pode ser diferente.');
        }

        // Realiza fusão
        const mergedVault = mergeVaultData(vaultData, remoteVault);
        const salt = remote.payload.salt || arrayBufferToBase64(generateSalt());
        const encryptedMerged = await encryptData(mergedVault, masterPasswordKey, salt);

        // Upload da fusão atualizada
        await uploadVaultToDrive(encryptedMerged, token);

        onVaultUpdated(mergedVault, encryptedMerged);
        setStatusMessage('Cofre sincronizado e atualizado com o Google Drive com sucesso!');
      } else {
        // Se não existir arquivo remoto, faz upload do atual
        const salt = arrayBufferToBase64(generateSalt());
        const encryptedLocal = await encryptData(vaultData, masterPasswordKey, salt);
        await uploadVaultToDrive(encryptedLocal, token);
        setStatusMessage('Seu cofre foi enviado para o Google Drive!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro durante a sincronização com o Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  };

  // P2P - Iniciar Host (Exibir QR Code para o Celular)
  const handleStartP2PHost = async () => {
    setErrorMessage('');
    setP2pRole('host');
    setP2pStatus('Gerando oferta P2P...');

    const host = new WebRTCSyncHost({
      onStatusChange: (status) => setP2pStatus(status),
      onPayloadReceived: async (payload) => {
        if (!masterPasswordKey) return;
        try {
          const remoteVault = await decryptData<VaultData>(payload, masterPasswordKey);
          const merged = mergeVaultData(vaultData, remoteVault);
          const salt = payload.salt || arrayBufferToBase64(generateSalt());
          const encryptedMerged = await encryptData(merged, masterPasswordKey, salt);
          onVaultUpdated(merged, encryptedMerged);
          setP2pStatus('Cofre recebido e mesclado com sucesso!');
        } catch {
          setErrorMessage('Erro ao decriptar cofre recebido via P2P.');
        }
      },
    });

    setP2pHost(host);

    try {
      const offerCode = await host.createOffer();
      setQrCodeData(offerCode);
      setP2pStatus('Aguardando escaneamento do QR Code no outro aparelho...');
    } catch (err: any) {
      setErrorMessage('Falha ao inicializar WebRTC P2P.');
    }
  };

  // P2P - Enviar Cofre via Host
  const handleP2PSendLocalVault = async () => {
    if (!p2pHost || !masterPasswordKey) return;
    try {
      const salt = arrayBufferToBase64(generateSalt());
      const encrypted = await encryptData(vaultData, masterPasswordKey, salt);
      p2pHost.sendEncryptedPayload(encrypted);
      setP2pStatus('Cofre enviado via P2P!');
    } catch (err: any) {
      setErrorMessage('Erro ao enviar cofre via P2P.');
    }
  };

  // P2P - Confirmar Código de Resposta no Host
  const handleConfirmP2PAnswer = async () => {
    if (!p2pHost || !p2pInputCode.trim()) return;
    try {
      await p2pHost.handleAnswer(p2pInputCode.trim());
      setP2pStatus('Pareamento P2P estabelecido!');
      handleP2PSendLocalVault();
    } catch (err: any) {
      setErrorMessage('Erro ao conectar P2P com o código de resposta.');
    }
  };

  // P2P - Cliente aceitar oferta
  const handleP2PClientAccept = async () => {
    if (!p2pInputCode.trim()) return;
    setErrorMessage('');

    const client = new WebRTCSyncClient({
      onStatusChange: (status) => setP2pStatus(status),
      onPayloadReceived: async (payload) => {
        if (!masterPasswordKey) return;
        try {
          const remoteVault = await decryptData<VaultData>(payload, masterPasswordKey);
          const merged = mergeVaultData(vaultData, remoteVault);
          const salt = payload.salt || arrayBufferToBase64(generateSalt());
          const encryptedMerged = await encryptData(merged, masterPasswordKey, salt);
          onVaultUpdated(merged, encryptedMerged);
          setP2pStatus('Cofre sincronizado via P2P com sucesso!');
        } catch {
          setErrorMessage('Erro ao decriptar cofre P2P.');
        }
      },
    });

    try {
      const answerCode = await client.acceptOfferAndCreateAnswer(p2pInputCode.trim());
      setQrCodeData(answerCode);
      setP2pStatus('Resposta gerada! Exiba o QR Code para o PC ou copie o código abaixo.');
    } catch (err: any) {
      setErrorMessage('Código de oferta P2P inválido.');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="glass-panel animate-fade-in modal-box" style={{ maxWidth: '580px', padding: 0 }}>
        
        {/* STICKY HEADER */}
        <div className="modal-header" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <RefreshCw size={20} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Sincronização Multi-Dispositivo</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mantenha suas senhas atualizadas entre PC e Celular</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* System Messages */}
          {statusMessage && (
            <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid var(--accent-cyan)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sync Mode Selector Cards */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Selecione o Modo de Sincronização
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              
              {/* Option 1: Offline */}
              <button
                type="button"
                onClick={() => handleSelectMode('offline')}
                style={{
                  padding: '0.85rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedMode === 'offline' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                  background: selectedMode === 'offline' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <HardDrive size={22} style={{ color: selectedMode === 'offline' ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Apenas Local</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>100% no dispositivo</span>
              </button>

              {/* Option 2: Google Drive */}
              <button
                type="button"
                onClick={() => handleSelectMode('gdrive')}
                style={{
                  padding: '0.85rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedMode === 'gdrive' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                  background: selectedMode === 'gdrive' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Cloud size={22} style={{ color: selectedMode === 'gdrive' ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Google Drive</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nuvem Pessoal</span>
              </button>

              {/* Option 3: WebRTC P2P */}
              <button
                type="button"
                onClick={() => handleSelectMode('webrtc')}
                style={{
                  padding: '0.85rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedMode === 'webrtc' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                  background: selectedMode === 'webrtc' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Share2 size={22} style={{ color: selectedMode === 'webrtc' ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Direto P2P</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Via QR Code</span>
              </button>

            </div>
          </div>

          {/* GOOGLE DRIVE PANEL */}
          {selectedMode === 'gdrive' && (
            <div className="glass-card animate-fade-in" style={{ padding: '1.25rem', border: '1px solid var(--border-glow)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cloud size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Sincronização com Google Drive</span>
                </div>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    onClick={() => setShowClientIdInput(!showClientIdInput)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                  >
                    <Settings size={14} /> Custom Client ID (Dev)
                  </button>
                )}
              </div>

              {/* Client ID Custom Config */}
              {showClientIdInput && (
                <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    Google OAuth Client ID (Opcional)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ex: 123456789-abc.apps.googleusercontent.com"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={handleSaveClientId} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      Salvar
                    </button>
                  </div>
                </div>
              )}

              {/* Connection Status & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDriveConnected ? 'var(--color-success)' : 'var(--color-danger)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {isDriveConnected ? 'Conectado ao Google Drive' : 'Não Conectado'}
                  </span>
                </div>

                {isDriveConnected ? (
                  <button type="button" className="btn btn-secondary" onClick={handleDisconnectGoogleDrive} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <LogOut size={13} /> Desconectar
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={handleConnectGoogleDrive} disabled={isSyncing} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    Conectar Google
                  </button>
                )}
              </div>

              {isDriveConnected && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSyncWithDrive}
                  disabled={isSyncing}
                  style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Cofre Agora'}
                </button>
              )}
            </div>
          )}

          {/* WEBRTC P2P PANEL */}
          {selectedMode === 'webrtc' && (
            <div className="glass-card animate-fade-in" style={{ padding: '1.25rem', border: '1px solid var(--border-glow)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pareamento P2P via QR Code</span>
              </div>

              {p2pStatus && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                  {p2pStatus}
                </div>
              )}

              {p2pRole === 'none' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStartP2PHost}
                    style={{ padding: '0.75rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <QrCode size={20} />
                    <span>Gerar QR Code (PC)</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setP2pRole('client')}
                    style={{ padding: '0.75rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Key size={20} />
                    <span>Inserir Código (Celular)</span>
                  </button>
                </div>
              ) : p2pRole === 'host' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  {qrCodeData && (
                    <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <QRCodeSVG value={qrCodeData} size={180} />
                    </div>
                  )}

                  <div style={{ width: '100%' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Insira a Resposta do Celular (se manual):
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="input-field font-mono"
                        placeholder="Cole a resposta..."
                        value={p2pInputCode}
                        onChange={(e) => setP2pInputCode(e.target.value)}
                        style={{ fontSize: '0.78rem' }}
                      />
                      <button type="button" className="btn btn-primary" onClick={handleConfirmP2PAnswer}>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Cole o Código da Oferta gerado no PC:
                    </label>
                    <textarea
                      className="input-field font-mono"
                      rows={3}
                      placeholder="Cole aqui a oferta P2P do PC..."
                      value={p2pInputCode}
                      onChange={(e) => setP2pInputCode(e.target.value)}
                      style={{ fontSize: '0.75rem' }}
                    />
                  </div>

                  <button type="button" className="btn btn-primary" onClick={handleP2PClientAccept} style={{ width: '100%', padding: '0.65rem' }}>
                    Conectar e Gerar Resposta
                  </button>

                  {qrCodeData && (
                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                        Exiba este QR Code de Resposta para a câmera do PC:
                      </span>
                      <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', display: 'inline-block' }}>
                        <QRCodeSVG value={qrCodeData} size={150} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* STICKY FOOTER */}
        <div className="modal-footer" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
}
