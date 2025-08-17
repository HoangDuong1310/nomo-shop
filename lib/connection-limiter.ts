// Rate limiting middleware để tránh quá nhiều connections
class ConnectionLimiter {
  private activeConnections = 0;
  private readonly maxConnections = 2;
  private waitQueue: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.activeConnections--;
    const next = this.waitQueue.shift();
    if (next) {
      this.activeConnections++;
      next();
    }
  }
}

const connectionLimiter = new ConnectionLimiter();

export { connectionLimiter };
