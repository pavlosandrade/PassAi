import { EncryptedPayload } from '@/types/crypto';

export interface WebRTCConnectionOptions {
  onStatusChange?: (status: string) => void;
  onPayloadReceived?: (payload: EncryptedPayload) => void;
  onError?: (error: Error) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Compacta a oferta ou resposta WebRTC para caber em um QR Code.
 */
export function compressSdpPayload(sdp: string): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(sdp))));
  } catch {
    return btoa(sdp);
  }
}

/**
 * Descompacta o payload do QR Code.
 */
export function decompressSdpPayload(compressed: string): string {
  try {
    const json = decodeURIComponent(escape(atob(compressed)));
    return JSON.parse(json);
  } catch {
    return atob(compressed);
  }
}

/**
 * Gerenciador de conexão WebRTC P2P para transferência de cofre entre dispositivos.
 */
export class WebRTCSyncHost {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private options: WebRTCConnectionOptions;

  constructor(options: WebRTCConnectionOptions) {
    this.options = options;
  }

  /**
   * Inicia o host e gera a oferta SDP.
   */
  async createOffer(): Promise<string> {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.dataChannel = this.peerConnection.createDataChannel('passai_sync_channel');

    this.setupDataChannelListeners(this.dataChannel);

    this.peerConnection.onicecandidate = (event) => {
      if (!event.candidate && this.peerConnection?.localDescription) {
        // Todos os ICE candidates foram coletados
        if (this.options.onStatusChange) {
          this.options.onStatusChange('Aguardando escaneamento do QR Code...');
        }
      }
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Aguarda um pequeno intervalo para acumular ICE candidates iniciais
    await new Promise((r) => setTimeout(r, 800));

    const fullSdp = this.peerConnection.localDescription?.sdp || offer.sdp || '';
    return compressSdpPayload(fullSdp);
  }

  /**
   * Recebe a resposta SDP do outro dispositivo e estabelece a conexão.
   */
  async handleAnswer(compressedAnswer: string): Promise<void> {
    if (!this.peerConnection) throw new Error('Conexão P2P não inicializada.');

    const answerSdp = decompressSdpPayload(compressedAnswer);
    const answerDesc = new RTCSessionDescription({ type: 'answer', sdp: answerSdp });
    await this.peerConnection.setRemoteDescription(answerDesc);
  }

  /**
   * Envia o cofre encriptado pelo canal P2P de dados.
   */
  sendEncryptedPayload(payload: EncryptedPayload): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Canal de dados P2P não está aberto.');
    }

    const message = JSON.stringify({
      type: 'VAULT_TRANSFER',
      payload,
      timestamp: new Date().toISOString(),
    });

    this.dataChannel.send(message);
    if (this.options.onStatusChange) {
      this.options.onStatusChange('Cofre enviado com sucesso via P2P!');
    }
  }

  private setupDataChannelListeners(channel: RTCDataChannel) {
    channel.onopen = () => {
      if (this.options.onStatusChange) {
        this.options.onStatusChange('Conectado via P2P! Transferindo dados...');
      }
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'VAULT_TRANSFER' && data.payload) {
          if (this.options.onPayloadReceived) {
            this.options.onPayloadReceived(data.payload);
          }
        }
      } catch (err: any) {
        console.error('Erro ao processar mensagem P2P:', err);
      }
    };

    channel.onerror = (err) => {
      if (this.options.onError) {
        this.options.onError(new Error('Erro na conexão P2P.'));
      }
    };
  }

  close(): void {
    if (this.dataChannel) this.dataChannel.close();
    if (this.peerConnection) this.peerConnection.close();
    this.peerConnection = null;
    this.dataChannel = null;
  }
}

/**
 * Cliente WebRTC (dispositivo leitor).
 */
export class WebRTCSyncClient {
  private peerConnection: RTCPeerConnection | null = null;
  private options: WebRTCConnectionOptions;

  constructor(options: WebRTCConnectionOptions) {
    this.options = options;
  }

  async acceptOfferAndCreateAnswer(compressedOffer: string): Promise<string> {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onopen = () => {
        if (this.options.onStatusChange) {
          this.options.onStatusChange('Conexão P2P aberta!');
        }
      };

      channel.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'VAULT_TRANSFER' && data.payload) {
            if (this.options.onPayloadReceived) {
              this.options.onPayloadReceived(data.payload);
            }
          }
        } catch (err) {
          console.error('Erro na leitura P2P:', err);
        }
      };
    };

    const offerSdp = decompressSdpPayload(compressedOffer);
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: offerSdp })
    );

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await new Promise((r) => setTimeout(r, 800));

    const fullSdp = this.peerConnection.localDescription?.sdp || answer.sdp || '';
    return compressSdpPayload(fullSdp);
  }

  close(): void {
    if (this.peerConnection) this.peerConnection.close();
    this.peerConnection = null;
  }
}
