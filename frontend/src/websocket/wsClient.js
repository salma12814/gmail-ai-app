export class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.listeners = {};
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connecté');
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const { type } = data;
          
          if (this.listeners[type]) {
            this.listeners[type].forEach(cb => cb(data));
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket erreur:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket fermé');
          this.reconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  send(type, data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  reconnect() {
    setTimeout(() => {
      console.log('🔄 Reconnexion WebSocket...');
      this.connect().catch(console.error);
    }, 3000);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const wsClient = new WebSocketClient('ws://localhost:8081/ws/emails');
