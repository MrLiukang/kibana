/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Client } from '@elastic/elasticsearch';
import { AGENTS_INDEX } from '@kbn/fleet-plugin/common';
import {
  alertsIndexPattern,
  eventsIndexPattern,
  METADATA_DATASTREAM,
  METADATA_UNITED_INDEX,
  metadataCurrentIndexPattern,
  metadataIndexPattern,
  policyIndexPattern,
  telemetryIndexPattern,
} from '@kbn/security-solution-plugin/common/endpoint/constants';

export function SecuritySolutionEndpointDataStreamHelpers() {
  function deleteDataStream(getService: (serviceName: 'es') => Client, index: string) {
    const client = getService('es');
    return client.transport.request(
      {
        method: 'DELETE',
        path: `_data_stream/${index}`,
      },
      {
        ignore: [404],
      }
    );
  }

  async function deleteAllDocsFromIndex(getService: (serviceName: 'es') => Client, index: string) {
    const client = getService('es');
    await client.deleteByQuery(
      {
        query: {
          match_all: {},
        },
        index,
        wait_for_completion: true,
        refresh: true,
      },
      {
        ignore: [404],
      }
    );
  }

  async function deleteIndex(getService: (serviceName: 'es') => Client, index: string) {
    const client = getService('es');
    await client.indices.delete({ index, ignore_unavailable: true });
  }

  async function deleteMetadataStream(getService: (serviceName: 'es') => Client) {
    await deleteDataStream(getService, metadataIndexPattern);
  }

  async function deleteAllDocsFromMetadataDatastream(getService: (serviceName: 'es') => Client) {
    await deleteAllDocsFromIndex(getService, METADATA_DATASTREAM);
  }

  async function deleteAllDocsFromMetadataCurrentIndex(getService: (serviceName: 'es') => Client) {
    await deleteAllDocsFromIndex(getService, metadataCurrentIndexPattern);
  }

  async function deleteAllDocsFromMetadataUnitedIndex(getService: (serviceName: 'es') => Client) {
    await deleteAllDocsFromIndex(getService, METADATA_UNITED_INDEX);
  }

  async function deleteEventsStream(getService: (serviceName: 'es') => Client) {
    await deleteDataStream(getService, eventsIndexPattern);
  }

  async function deleteAlertsStream(getService: (serviceName: 'es') => Client) {
    await deleteDataStream(getService, alertsIndexPattern);
  }

  async function deletePolicyStream(getService: (serviceName: 'es') => Client) {
    await deleteDataStream(getService, policyIndexPattern);
  }

  async function deleteTelemetryStream(getService: (serviceName: 'es') => Client) {
    await deleteDataStream(getService, telemetryIndexPattern);
  }

  function deleteAllDocsFromFleetAgents(getService: (serviceName: 'es') => Client) {
    return deleteAllDocsFromIndex(getService, AGENTS_INDEX);
  }

  function stopTransform(getService: (serviceName: 'es') => Client, transformId: string) {
    const client = getService('es');
    const stopRequest = {
      transform_id: transformId,
      force: true,
      wait_for_completion: true,
      allow_no_match: true,
    };
    return client.transform.stopTransform(stopRequest);
  }

  async function startTransform(getService: (serviceName: 'es') => Client, transformId: string) {
    const client = getService('es');
    const transformsResponse = await client.transform.getTransform({
      transform_id: `${transformId}*`,
    });
    return Promise.all(
      transformsResponse.transforms.map((transform) => {
        const t = transform as unknown as { id: string };
        return client.transform.startTransform({ transform_id: t.id });
      })
    );
  }

  function bulkIndex(getService: (serviceName: 'es') => Client, index: string, docs: unknown[]) {
    const operations = docs.flatMap((doc) => [{ create: { _index: index } }, doc]);
    const client = getService('es');

    return client.bulk({
      index,
      refresh: 'wait_for',
      operations,
    });
  }

  return {
    deleteDataStream,
    deleteAllDocsFromIndex,
    deleteIndex,
    deleteMetadataStream,
    deleteAllDocsFromMetadataDatastream,
    deleteAllDocsFromMetadataCurrentIndex,
    deleteAllDocsFromMetadataUnitedIndex,
    deleteEventsStream,
    deleteAlertsStream,
    deletePolicyStream,
    deleteTelemetryStream,
    deleteAllDocsFromFleetAgents,
    stopTransform,
    startTransform,
    bulkIndex,
  };
}
