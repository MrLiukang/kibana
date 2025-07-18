/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { TheHiveConnector } from './thehive';
import { actionsConfigMock } from '@kbn/actions-plugin/server/actions_config.mock';
import { THEHIVE_CONNECTOR_ID } from '../../../common/thehive/constants';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import { actionsMock } from '@kbn/actions-plugin/server/mocks';
import {
  TheHiveIncidentResponseSchema,
  TheHiveUpdateIncidentResponseSchema,
  TheHiveAddCommentResponseSchema,
  TheHiveCreateAlertResponseSchema,
  PushToServiceIncidentSchema,
} from '../../../common/thehive/schema';
import type { ExecutorSubActionCreateAlertParams, Incident } from '../../../common/thehive/types';
import { ConnectorUsageCollector } from '@kbn/actions-plugin/server/types';

const mockTime = new Date('2024-04-03T09:10:30.000');

describe('TheHiveConnector', () => {
  const logger = loggingSystemMock.createLogger();

  const connector = new TheHiveConnector(
    {
      configurationUtilities: actionsConfigMock.create(),
      connector: { id: '1', type: THEHIVE_CONNECTOR_ID },
      config: { url: 'https://example.com', organisation: null },
      secrets: { apiKey: 'test123' },
      logger,
      services: actionsMock.createServices(),
    },
    PushToServiceIncidentSchema
  );

  let mockRequest: jest.Mock;
  let mockError: jest.Mock;
  let connectorUsageCollector: ConnectorUsageCollector;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockTime);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockError = jest.fn().mockImplementation(() => {
      throw new Error('API Error');
    });
    jest.clearAllMocks();
    connectorUsageCollector = new ConnectorUsageCollector({
      logger,
      connectorId: 'test-connector-id',
    });
  });

  describe('createIncident', () => {
    const mockResponse = {
      data: {
        _id: '~172064',
        _type: 'Case',
        _createdBy: 'user1@thehive.local',
        _createdAt: 1712128153041,
        number: 67,
        title: 'title',
        description: 'description',
        severity: 1,
        severityLabel: 'LOW',
        startDate: 1712128153029,
        tags: ['tag1', 'tag2'],
        flag: false,
        tlp: 2,
        tlpLabel: 'AMBER',
        pap: 2,
        papLabel: 'AMBER',
        status: 'New',
        stage: 'New',
        assignee: 'user1@thehive.local',
        customFields: [],
        userPermissions: [
          'manageCase/create',
          'manageAlert/update',
          'manageProcedure',
          'managePage',
          'manageObservable',
          'manageCase/delete',
          'manageAlert/create',
          'manageCaseReport',
          'manageAlert/delete',
          'accessTheHiveFS',
          'manageKnowledgeBase',
          'manageAction',
          'manageShare',
          'manageAnalyse',
          'manageFunction/invoke',
          'manageTask',
          'manageCase/merge',
          'manageCustomEvent',
          'manageAlert/import',
          'manageCase/changeOwnership',
          'manageComment',
          'manageAlert/reopen',
          'manageCase/update',
          'manageCase/reopen',
        ],
        extraData: {},
        newDate: 1712128153029,
        timeToDetect: 0,
      },
    };

    beforeEach(() => {
      mockRequest = jest.fn().mockResolvedValue(mockResponse);
      // @ts-ignore
      connector.request = mockRequest;
      jest.clearAllMocks();
    });

    const incident: Incident = {
      title: 'title',
      description: 'description',
      severity: 1,
      tlp: 2,
      tags: ['tag1', 'tag2'],
    };

    it('TheHive API call is successful with correct parameters', async () => {
      const response = await connector.createIncident(incident, connectorUsageCollector);
      expect(mockRequest).toBeCalledTimes(1);
      expect(mockRequest).toHaveBeenCalledWith(
        {
          url: 'https://example.com/api/v1/case',
          method: 'post',
          responseSchema: TheHiveIncidentResponseSchema,
          data: incident,
          headers: {
            Authorization: 'Bearer test123',
            'X-Organisation': null,
          },
        },
        connectorUsageCollector
      );
      expect(response).toEqual({
        id: '~172064',
        url: 'https://example.com/cases/~172064/details',
        title: 'title',
        pushedDate: '2024-04-03T07:09:13.041Z',
      });
    });

    it('errors during API calls are properly handled', async () => {
      // @ts-ignore
      connector.request = mockError;

      await expect(connector.createIncident(incident, connectorUsageCollector)).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('updateIncident', () => {
    const mockResponse = {
      data: null,
    };

    beforeEach(() => {
      mockRequest = jest.fn().mockResolvedValue(mockResponse);
      // @ts-ignore
      connector.request = mockRequest;
      jest.clearAllMocks();
    });

    const incident: Incident = {
      title: 'new title',
      description: 'new description',
      severity: 3,
      tlp: 1,
      tags: ['tag3'],
    };

    it('TheHive API call is successful with correct parameters', async () => {
      const response = await connector.updateIncident(
        { incidentId: '~172064', incident },
        connectorUsageCollector
      );
      expect(mockRequest).toBeCalledTimes(1);
      expect(mockRequest).toHaveBeenCalledWith(
        {
          url: 'https://example.com/api/v1/case/~172064',
          method: 'patch',
          responseSchema: TheHiveUpdateIncidentResponseSchema,
          data: incident,
          headers: {
            Authorization: 'Bearer test123',
            'X-Organisation': null,
          },
        },
        connectorUsageCollector
      );
      expect(response).toEqual({
        id: '~172064',
        url: 'https://example.com/cases/~172064/details',
        title: 'new title',
        pushedDate: mockTime.toISOString(),
      });
    });

    it('errors during API calls are properly handled', async () => {
      // @ts-ignore
      connector.request = mockError;

      await expect(
        connector.updateIncident({ incidentId: '~172064', incident }, connectorUsageCollector)
      ).rejects.toThrow('API Error');
    });
  });

  describe('addComment', () => {
    const mockResponse = {
      data: {
        _id: '~41156688',
        _type: 'Comment',
        createdBy: 'user1@thehive.local',
        createdAt: 1712158280100,
        message: 'test comment',
        isEdited: false,
        extraData: {},
      },
    };

    beforeEach(() => {
      mockRequest = jest.fn().mockResolvedValue(mockResponse);
      // @ts-ignore
      connector.request = mockRequest;
      jest.clearAllMocks();
    });

    it('TheHive API call is successful with correct parameters', async () => {
      await connector.addComment(
        {
          incidentId: '~172064',
          comment: 'test comment',
        },
        connectorUsageCollector
      );
      expect(mockRequest).toBeCalledTimes(1);
      expect(mockRequest).toHaveBeenCalledWith(
        {
          url: 'https://example.com/api/v1/case/~172064/comment',
          method: 'post',
          responseSchema: TheHiveAddCommentResponseSchema,
          data: { message: 'test comment' },
          headers: {
            Authorization: 'Bearer test123',
            'X-Organisation': null,
          },
        },
        connectorUsageCollector
      );
    });

    it('errors during API calls are properly handled', async () => {
      // @ts-ignore
      connector.request = mockError;

      await expect(
        connector.addComment(
          { incidentId: '~172064', comment: 'test comment' },
          connectorUsageCollector
        )
      ).rejects.toThrow('API Error');
    });
  });

  describe('getIncident', () => {
    const mockResponse = {
      data: {
        _id: '~172064',
        _type: 'Case',
        _createdBy: 'user1@thehive.local',
        _createdAt: 1712128153041,
        number: 67,
        title: 'title',
        description: 'description',
        severity: 1,
        severityLabel: 'LOW',
        startDate: 1712128153029,
        tags: ['tag1', 'tag2'],
        flag: false,
        tlp: 2,
        tlpLabel: 'AMBER',
        pap: 2,
        papLabel: 'AMBER',
        status: 'New',
        stage: 'New',
        assignee: 'user1@thehive.local',
        customFields: [],
        userPermissions: [
          'manageCase/create',
          'manageAlert/update',
          'manageProcedure',
          'managePage',
          'manageObservable',
          'manageCase/delete',
          'manageAlert/create',
          'manageCaseReport',
          'manageAlert/delete',
          'accessTheHiveFS',
          'manageKnowledgeBase',
          'manageAction',
          'manageShare',
          'manageAnalyse',
          'manageFunction/invoke',
          'manageTask',
          'manageCase/merge',
          'manageCustomEvent',
          'manageAlert/import',
          'manageCase/changeOwnership',
          'manageComment',
          'manageAlert/reopen',
          'manageCase/update',
          'manageCase/reopen',
        ],
        extraData: {},
        newDate: 1712128153029,
        timeToDetect: 0,
      },
    };

    beforeEach(() => {
      mockRequest = jest.fn().mockResolvedValue(mockResponse);
      // @ts-ignore
      connector.request = mockRequest;
      jest.clearAllMocks();
    });

    it('TheHive API call is successful with correct parameters', async () => {
      const response = await connector.getIncident({ id: '~172064' }, connectorUsageCollector);
      expect(mockRequest).toBeCalledTimes(1);
      expect(mockRequest).toHaveBeenCalledWith(
        {
          url: 'https://example.com/api/v1/case/~172064',
          responseSchema: TheHiveIncidentResponseSchema,
          headers: {
            Authorization: 'Bearer test123',
            'X-Organisation': null,
          },
        },
        connectorUsageCollector
      );
      expect(response).toEqual(mockResponse.data);
    });

    it('errors during API calls are properly handled', async () => {
      // @ts-ignore
      connector.request = mockError;

      await expect(
        connector.getIncident({ id: '~172064' }, connectorUsageCollector)
      ).rejects.toThrow('API Error');
    });
  });

  describe('createAlert', () => {
    const mockResponse = {
      data: {
        _id: '~41128088',
        _type: 'Alert',
        _createdBy: 'user1@thehive.local',
        _createdAt: 1712161128982,
        type: 'alert type',
        source: 'alert source',
        sourceRef: 'test123',
        title: 'title',
        description: 'description',
        severity: 1,
        severityLabel: 'LOW',
        date: 1712161128964,
        tags: ['tag1', 'tag2'],
        tlp: 2,
        tlpLabel: 'AMBER',
        pap: 2,
        papLabel: 'AMBER',
        follow: true,
        customFields: [],
        observableCount: 1,
        status: 'New',
        stage: 'New',
        extraData: {},
        newDate: 1712161128967,
        timeToDetect: 0,
      },
    };

    beforeEach(() => {
      mockRequest = jest.fn().mockResolvedValue(mockResponse);
      // @ts-ignore
      connector.request = mockRequest;
      jest.clearAllMocks();
    });

    const alert: ExecutorSubActionCreateAlertParams = {
      title: 'title',
      description: 'description',
      type: 'alert type',
      source: 'alert source',
      sourceRef: 'test123',
      severity: 1,
      isRuleSeverity: false,
      tlp: 2,
      tags: ['tag1', 'tag2'],
      body: JSON.stringify(
        {
          observables: [
            {
              dataType: 'url',
              data: 'http://example.com',
              tags: ['url'],
            },
          ],
          procedures: [
            {
              patternId: 'T1132',
              occurDate: 1640000000000,
              tactic: 'command-and-control',
            },
          ],
        },
        null,
        2
      ),
    };

    const { body, isRuleSeverity, ...restOfAlert } = alert;
    const expectedAlertBody = { ...JSON.parse(body || '{}'), ...restOfAlert };

    it('TheHive API call is successful with correct parameters', async () => {
      await connector.createAlert(alert, connectorUsageCollector);
      expect(mockRequest).toBeCalledTimes(1);
      expect(mockRequest).toHaveBeenCalledWith(
        {
          url: 'https://example.com/api/v1/alert',
          method: 'post',
          responseSchema: TheHiveCreateAlertResponseSchema,
          data: expectedAlertBody,
          headers: {
            Authorization: 'Bearer test123',
            'X-Organisation': null,
          },
        },
        connectorUsageCollector
      );
    });

    it('errors during API calls are properly handled', async () => {
      // @ts-ignore
      connector.request = mockError;

      await expect(
        connector.createAlert(expectedAlertBody, connectorUsageCollector)
      ).rejects.toThrow('API Error');
    });
  });
});
