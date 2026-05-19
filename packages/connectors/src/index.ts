// ProviderIQ — Connector Orchestrator
// Powered by Inquantic.Ai

import { ABDMConnector } from './abdm.connector.js';
import { GoogleMapsConnector } from './google-maps.connector.js';
import { NABHConnector } from './nabh.connector.js';
import type { ConnectorResult } from '@provideriq/shared';

export class ConnectorOrchestrator {
  private abdm = new ABDMConnector();
  private nabh = new NABHConnector();
  private gmaps = new GoogleMapsConnector();

  async runAll(
    facilityName: string,
    city: string,
    state: string
  ): Promise<ConnectorResult[]> {
    console.log(`[Orchestrator] Triggering connector parallel capture for: ${facilityName}`);

    const tasks = [
      this.abdm.fetch(facilityName, city, state),
      this.nabh.fetch(facilityName, city, state),
      this.gmaps.fetch(facilityName, city, state),
    ];

    return Promise.all(tasks);
  }
}

export * from './base.connector.js';
export * from './abdm.connector.js';
export * from './nabh.connector.js';
export * from './google-maps.connector.js';
export default ConnectorOrchestrator;
