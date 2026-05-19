// ProviderIQ — Base Connector Implementation
// Powered by Inquantic.Ai

import type { ConnectorOptions, ConnectorResult } from '@provideriq/shared';

export abstract class BaseConnector {
  abstract name: string;

  abstract fetch(
    facilityName: string,
    city: string,
    state: string,
    options?: ConnectorOptions
  ): Promise<ConnectorResult>;

  protected async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`[Connector retry] ${this.name} attempt ${attempt} failed. Error: ${String(error)}`);
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  protected log(message: string, data?: unknown): void {
    console.log(`[Connector log] [${this.name}] ${message}`, data ? JSON.stringify(data) : '');
  }

  protected async handleRateLimit(delayMs = 1000): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
