// src/lib/real-websocket-client.ts

export interface DebuggerMessage {
  type: string;
  payload?: any;
  replyTo?: string; // For responses
}

type MessageHandler = (message: DebuggerMessage) => void;
type OpenHandler = () => void;
type CloseHandler = () => void;
type ErrorHandler = (error: string) => void;

export class RealWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: MessageHandler[] = [];
  private openHandlers: OpenHandler[] = [];
  private closeHandlers: CloseHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private nodes: string[] = []; // Store node IDs for breakpoint management

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('RealWebSocketClient: Connected to proxy');
        this.openHandlers.forEach(handler => handler());
        // After connecting, request initial data
        this.requestInitialData();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: DebuggerMessage = JSON.parse(event.data);
          console.log(`📥 Received: ${message.type}`, message.payload ? Object.keys(message.payload) : 'no payload');
          
          // Log specific message types with more detail
          if (message.type === 'error') {
            console.error('❌ Error from backend:', message.payload?.message);
          } else if (message.type === 'treeData') {
            const xmlLength = message.payload?.xml?.length || 0;
            console.log(`🌳 Tree data received: ${xmlLength} characters`);
            if (xmlLength === 0) {
              console.warn('⚠️ Empty tree XML - backend may not have a tree loaded');
            }
          } else if (message.type === 'statusUpdate') {
            console.log('📊 Status update received');
          } else if (message.type === 'blackboardUpdate') {
            console.log('📋 Blackboard update received');
          }
          
          this.messageHandlers.forEach(handler => handler(message));
        } catch (err) {
          console.error('❌ RealWebSocketClient: Failed to parse message', err, event.data);
          this.errorHandlers.forEach(handler => handler('Failed to parse message from proxy'));
        }
      };

      this.ws.onclose = () => {
        console.log('RealWebSocketClient: Disconnected from proxy');
        this.closeHandlers.forEach(handler => handler());
      };

      this.ws.onerror = (error) => {
        console.error('RealWebSocketClient: WebSocket error', error);
        this.errorHandlers.forEach(handler => handler('WebSocket connection error'));
      };
    } catch (err) {
      console.error('RealWebSocketClient: Failed to create WebSocket', err);
      this.errorHandlers.forEach(handler => handler('Failed to create WebSocket connection'));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: DebuggerMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`📤 Sending: ${message.type}`, message.payload ? Object.keys(message.payload) : 'no payload');
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ RealWebSocketClient: Cannot send message, WebSocket is not open', message);
    }
  }

  // Helper method to send a command with parameters
  sendCommand(type: string, params?: any) {
    const message: DebuggerMessage = { type };
    if (params) {
      message.payload = { params };
    }
    this.send(message);
  }

  // Request initial data (tree, status, blackboard) after connection
  private requestInitialData() {
    console.log('🔄 RealWebSocketClient: Requesting initial data');
    
    // Request tree first, then wait for response before requesting status/blackboard
    this.sendCommand('getTree');
    
    // Delay other requests to ensure tree is loaded first
    setTimeout(() => {
      console.log('🔄 Requesting status and blackboard after tree load delay');
      this.sendCommand('getStatus');
      this.sendCommand('getBlackboard');
    }, 1000);
    
    // Subscribe to breakpoint notifications
    this.sendCommand('subscribe', { topic: 'N' });
  }

  // Update the list of node IDs (used for breakpoint management)
  setNodes(nodeIds: string[]) {
    this.nodes = nodeIds;
  }

  // --- Event Handler Registration ---

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  onOpen(handler: OpenHandler) {
    this.openHandlers.push(handler);
  }

  onClose(handler: CloseHandler) {
    this.closeHandlers.push(handler);
  }

  onError(handler: ErrorHandler) {
    this.errorHandlers.push(handler);
  }
}