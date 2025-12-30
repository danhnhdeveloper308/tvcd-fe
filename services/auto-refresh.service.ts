'use client';

class AutoRefreshService {
  private intervalId: NodeJS.Timeout | null = null;
  private refreshCallback: (() => Promise<void>) | null = null;

  // Start auto refresh cho TV mode
  startAutoRefresh(intervalMs: number = 30000, callback: () => Promise<void>) {
    
    this.refreshCallback = callback;
    
    // Clear any existing interval
    this.stop();
    
    // Start new interval
    this.intervalId = setInterval(async () => {
      try {
        await this.refreshCallback?.();
      } catch (error) {
        console.error('❌ Auto-refresh failed:', error);
      }
    }, intervalMs);

    // Also run immediately
    setTimeout(() => {
      this.refreshCallback?.();
    }, 1000);
  }

  // Stop auto refresh
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.refreshCallback = null;
  }

  // Check if running
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Singleton instance
const autoRefreshService = new AutoRefreshService();

export default autoRefreshService;