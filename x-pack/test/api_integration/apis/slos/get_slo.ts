/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { cleanup } from '@kbn/infra-forge';
import expect from 'expect';
import type { CreateSLOInput } from '@kbn/slo-schema';

import { FtrProviderContext } from '../../ftr_provider_context';
import { loadTestData } from './helper/load_test_data';
import { SloEsClient } from './helper/es';
import { sloData } from './fixtures/create_slo';

export const expectSummary = (summary: Record<string, any>) => {
  expect(summary).toEqual({
    sliValue: expect.any(Number),
    errorBudget: {
      initial: expect.any(Number),
      consumed: expect.any(Number),
      remaining: expect.any(Number),
      isEstimated: expect.any(Boolean),
    },
    status: expect.any(String),
    fiveMinuteBurnRate: expect.any(Number),
    oneDayBurnRate: expect.any(Number),
    oneHourBurnRate: expect.any(Number),
  });
};

export default function ({ getService }: FtrProviderContext) {
  describe('GetSLOs', function () {
    this.tags('skipCloud');

    const supertestAPI = getService('supertest');
    const esClient = getService('es');
    const logger = getService('log');
    const retry = getService('retry');
    const slo = getService('slo');
    // const transform = getService('transform');
    const sloEsClient = new SloEsClient(esClient);

    // const onFailure = async () => {
    //   const allTransforms = await transform.api.getTransformList();
    //   for (const tf of allTransforms.transforms) {
    //     await transform.api.scheduleTransform(tf.id);
    //   }
    // };

    let createSLOInput: CreateSLOInput;

    const createSLO = async (requestOverrides?: Record<string, any>) => {
      return await slo.create({
        ...createSLOInput,
        ...requestOverrides,
      });
    };

    before(async () => {
      await slo.createUser();
      await slo.deleteAllSLOs();
      await sloEsClient.deleteTestSourceData();
      await loadTestData(getService);
    });

    beforeEach(async () => {
      createSLOInput = sloData;
    });

    afterEach(async () => {
      await retry.tryForTime(60 * 1000, async () => {
        await slo.deleteAllSLOs();
      });
    });

    after(async () => {
      await cleanup({ esClient, logger });
      await sloEsClient.deleteTestSourceData();
    });

    it('gets slo by id and calculates SLI - occurrences rolling', async () => {
      const response = await createSLO({
        groupBy: '*',
      });
      const id = response.body.id;

      await retry.tryForTime(300 * 1000, async () => {
        const getResponse = await supertestAPI
          .get(`/api/observability/slos/${id}`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        expect(getResponse.body).toEqual({
          name: 'Test SLO for api integration',
          description: 'Fixture for api integration tests',
          indicator: {
            type: 'sli.kql.custom',
            params: {
              index: 'kbn-data-forge*',
              filter: `system.network.name: eth1`,
              good: 'container.cpu.user.pct < 1',
              total: 'container.cpu.user.pct: *',
              timestampField: '@timestamp',
            },
          },
          budgetingMethod: 'occurrences',
          timeWindow: { duration: '7d', type: 'rolling' },
          objective: { target: 0.99 },
          tags: ['test'],
          groupBy: '*',
          groupings: {},
          id,
          settings: { syncDelay: '1m', frequency: '1m', preventInitialBackfill: false },
          revision: 1,
          enabled: true,
          createdAt: getResponse.body.createdAt,
          updatedAt: getResponse.body.updatedAt,
          version: 2,
          instanceId: '*',
          meta: {},
          summary: expect.any(Object),
        });
        expectSummary(getResponse.body.summary);
      });
    });

    it('gets slo by id and calculates SLI - occurrences calendarAligned', async () => {
      const response = await createSLO({
        groupBy: '*',
        timeWindow: {
          duration: '1w',
          type: 'calendarAligned',
        },
      });
      const id = response.body.id;

      await retry.tryForTime(300 * 1000, async () => {
        const getResponse = await supertestAPI
          .get(`/api/observability/slos/${id}`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        // expect summary transform to be created
        expect(getResponse.body).toEqual({
          name: 'Test SLO for api integration',
          description: 'Fixture for api integration tests',
          indicator: {
            type: 'sli.kql.custom',
            params: {
              index: 'kbn-data-forge*',
              filter: `system.network.name: eth1`,
              good: 'container.cpu.user.pct < 1',
              total: 'container.cpu.user.pct: *',
              timestampField: '@timestamp',
            },
          },
          budgetingMethod: 'occurrences',
          timeWindow: { duration: '1w', type: 'calendarAligned' },
          objective: { target: 0.99 },
          tags: ['test'],
          groupBy: '*',
          groupings: {},
          id,
          settings: { syncDelay: '1m', frequency: '1m', preventInitialBackfill: false },
          revision: 1,
          enabled: true,
          createdAt: getResponse.body.createdAt,
          updatedAt: getResponse.body.updatedAt,
          version: 2,
          instanceId: '*',
          meta: {},
          summary: expect.any(Object),
        });
        expectSummary(getResponse.body.summary);
      });
    });

    it('gets slo by id and calculates SLI - timeslices rolling', async () => {
      const response = await createSLO({
        groupBy: '*',
        timeWindow: {
          duration: '7d',
          type: 'rolling',
        },
        budgetingMethod: 'timeslices',
        objective: {
          target: 0.99,
          timesliceTarget: 0.95,
          timesliceWindow: '1m',
        },
      });
      const id = response.body.id;

      await retry.tryForTime(300 * 1000, async () => {
        const getResponse = await supertestAPI
          .get(`/api/observability/slos/${id}`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        // expect summary transform to be created
        expect(getResponse.body).toEqual({
          name: 'Test SLO for api integration',
          description: 'Fixture for api integration tests',
          indicator: {
            type: 'sli.kql.custom',
            params: {
              index: 'kbn-data-forge*',
              filter: `system.network.name: eth1`,
              good: 'container.cpu.user.pct < 1',
              total: 'container.cpu.user.pct: *',
              timestampField: '@timestamp',
            },
          },
          budgetingMethod: 'timeslices',
          timeWindow: { duration: '7d', type: 'rolling' },
          objective: {
            target: 0.99,
            timesliceTarget: 0.95,
            timesliceWindow: '1m',
          },
          tags: ['test'],
          groupBy: '*',
          groupings: {},
          id,
          settings: { syncDelay: '1m', frequency: '1m', preventInitialBackfill: false },
          revision: 1,
          enabled: true,
          createdAt: getResponse.body.createdAt,
          updatedAt: getResponse.body.updatedAt,
          version: 2,
          instanceId: '*',
          meta: {},
          summary: expect.any(Object),
        });
        expectSummary(getResponse.body.summary);
      });
    });

    it('gets slo by id and calculates SLI - timeslices calendarAligned', async () => {
      const response = await createSLO({
        groupBy: '*',
        timeWindow: {
          duration: '1w',
          type: 'calendarAligned',
        },
        budgetingMethod: 'timeslices',
        objective: {
          target: 0.99,
          timesliceTarget: 0.95,
          timesliceWindow: '10m',
        },
      });
      const id = response.body.id;

      await retry.tryForTime(300 * 1000, async () => {
        const getResponse = await supertestAPI
          .get(`/api/observability/slos/${id}`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        expect(getResponse.body).toEqual({
          name: 'Test SLO for api integration',
          description: 'Fixture for api integration tests',
          indicator: {
            type: 'sli.kql.custom',
            params: {
              index: 'kbn-data-forge*',
              filter: `system.network.name: eth1`,
              good: 'container.cpu.user.pct < 1',
              total: 'container.cpu.user.pct: *',
              timestampField: '@timestamp',
            },
          },
          budgetingMethod: 'timeslices',
          timeWindow: { duration: '1w', type: 'calendarAligned' },
          objective: {
            target: 0.99,
            timesliceTarget: 0.95,
            timesliceWindow: '10m',
          },
          tags: ['test'],
          groupBy: '*',
          groupings: {},
          id,
          settings: { syncDelay: '1m', frequency: '1m', preventInitialBackfill: false },
          revision: 1,
          enabled: true,
          createdAt: getResponse.body.createdAt,
          updatedAt: getResponse.body.updatedAt,
          version: 2,
          instanceId: '*',
          meta: {},
          summary: expect.any(Object),
        });
        expectSummary(getResponse.body.summary);
      });
    });

    it('gets slos by query', async () => {
      await createSLO();
      await createSLO({ name: 'test int' });

      await retry.tryForTime(360 * 1000, async () => {
        const response = await supertestAPI
          .get(`/api/observability/slos`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        expect(response.body.results.length).toEqual(2);

        const searchResponse = await supertestAPI
          .get(`/api/observability/slos?kqlQuery=slo.name%3Aapi*`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        expect(searchResponse.body.results.length).toEqual(1);

        const searchResponse2 = await supertestAPI
          .get(`/api/observability/slos?kqlQuery=slo.name%3Aint`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        expect(searchResponse2.body.results.length).toEqual(1);

        const searchResponse3 = await supertestAPI
          .get(`/api/observability/slos?kqlQuery=slo.name%3Aint*`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        expect(searchResponse3.body.results.length).toEqual(2);

        const searchResponse4 = await supertestAPI
          .get(`/api/observability/slos?kqlQuery=int*`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        expect(searchResponse4.body.results.length).toEqual(2);
      });
    });

    // not possible for now to reliably fix this
    // it.skip('gets slos instances', async () => {
    //   const createResponse = await createSLO();
    //   const id = createResponse.body.id;
    //
    //   await retry.tryForTime(
    //     400 * 1000,
    //     async () => {
    //       const response = await supertestAPI
    //         .get(`/api/observability/slos`)
    //         .set('kbn-xsrf', 'true')
    //         .send()
    //         .expect(200);
    //       const res = response.body.results;
    //       expect(res.length).toEqual(3);
    //       const groups = res.map((r: any) => r.groupings.tags);
    //
    //       expect(groups.sort()).toEqual(['1', '2', '3']);
    //
    //       const instanceResponse = await supertestAPI
    //         .get(`/internal/observability/slos/${id}/_instances`)
    //         .set('kbn-xsrf', 'true')
    //         .send()
    //         .expect(200);
    //
    //       // expect 3 instances to be created
    //       expect(instanceResponse.body.groupBy).toEqual('tags');
    //       expect(instanceResponse.body.instances.sort()).toEqual(['1', '2', '3']);
    //     },
    //     onFailure,
    //     10 * 1000
    //   );
    // });

    it('gets slo definitions', async () => {
      const createResponse = await createSLO();
      const id = createResponse.body.id;
      const secondCreateResponse = await createSLO({ name: 'test name int' });
      const secondId = secondCreateResponse.body.id;
      const response = await slo.getDefinitions();

      expect(response.body).toEqual({
        page: 1,
        perPage: 100,
        results: [
          {
            budgetingMethod: 'occurrences',
            createdAt: response.body.results[0].createdAt,
            description: 'Fixture for api integration tests',
            enabled: true,
            groupBy: 'tags',
            id,
            indicator: {
              params: {
                filter: 'system.network.name: eth1',
                good: 'container.cpu.user.pct < 1',
                index: 'kbn-data-forge*',
                timestampField: '@timestamp',
                total: 'container.cpu.user.pct: *',
              },
              type: 'sli.kql.custom',
            },
            name: 'Test SLO for api integration',
            objective: {
              target: 0.99,
            },
            revision: 1,
            settings: {
              frequency: '1m',
              syncDelay: '1m',
              preventInitialBackfill: false,
            },
            tags: ['test'],
            timeWindow: {
              duration: '7d',
              type: 'rolling',
            },
            updatedAt: response.body.results[0].updatedAt,
            version: 2,
          },
          {
            budgetingMethod: 'occurrences',
            createdAt: response.body.results[1].createdAt,
            description: 'Fixture for api integration tests',
            enabled: true,
            groupBy: 'tags',
            id: secondId,
            indicator: {
              params: {
                filter: 'system.network.name: eth1',
                good: 'container.cpu.user.pct < 1',
                index: 'kbn-data-forge*',
                timestampField: '@timestamp',
                total: 'container.cpu.user.pct: *',
              },
              type: 'sli.kql.custom',
            },
            name: 'test name int',
            objective: {
              target: 0.99,
            },
            revision: 1,
            settings: {
              frequency: '1m',
              syncDelay: '1m',
              preventInitialBackfill: false,
            },
            tags: ['test'],
            timeWindow: {
              duration: '7d',
              type: 'rolling',
            },
            updatedAt: response.body.results[1].updatedAt,
            version: 2,
          },
        ],
        total: 2,
      });

      // can search by name
      const searchResponse = await slo.getDefinitions({ search: 'api' });

      expect(searchResponse.body.total).toEqual(1);

      const searchResponse2 = await supertestAPI
        .get(`/api/observability/slos/_definitions?search=int`)
        .set('kbn-xsrf', 'true')
        .send()
        .expect(200);

      expect(searchResponse2.body.total).toEqual(1);

      const searchResponse3 = await supertestAPI
        .get(`/api/observability/slos/_definitions?search=int*`)
        .set('kbn-xsrf', 'true')
        .send()
        .expect(200);

      expect(searchResponse3.body.total).toEqual(2);
    });
  });
}
