/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Frequency } from '@kbn/rrule';
import { JOB_STATUS } from '@kbn/reporting-common';
import { BaseParamsV2, ReportApiJSON, ScheduledReportApiJSON } from '@kbn/reporting-common/types';
import type { ReportMock } from './types';

const buildMockReport = (baseObj: ReportMock): ReportApiJSON => ({
  index: '.reporting-2020.04.12',
  migration_version: '7.15.0',
  max_attempts: 1,
  timeout: 300000,
  created_by: 'elastic',
  kibana_id: '5b2de169-2785-441b-ae8c-186a1936b17d',
  kibana_name: 'spicy.local',
  ...baseObj,
  payload: {
    browserTimezone: 'America/Phoenix',
    layout: { dimensions: { height: 720, width: 1080 }, id: 'preserve_layout' },
    version: '7.14.0',
    isDeprecated: baseObj.payload.isDeprecated === true,
    ...baseObj.payload,
  },
});

export const mockJobs: ReportApiJSON[] = [
  buildMockReport({
    id: 'k90e51pk1ieucbae0c3t8wo2',
    attempts: 0,
    created_at: '2020-04-14T21:01:13.064Z',
    jobtype: 'printable_pdf_v2',
    meta: { layout: 'preserve_layout', objectType: 'canvas workpad' },
    payload: {
      spaceId: 'my-space',
      objectType: 'canvas workpad',
      title: 'My Canvas Workpad',
      locatorParams: [
        {
          id: 'MY_APP',
        },
      ],
    } as any,
    status: JOB_STATUS.PENDING,
  }),
  buildMockReport({
    id: 'k90e51pk1ieucbae0c3t8wo1',
    attempts: 1,
    created_at: '2020-04-14T21:01:13.064Z',
    jobtype: 'printable_pdf',
    meta: { layout: 'preserve_layout', objectType: 'canvas workpad' },
    payload: {
      objectType: 'canvas workpad',
      title: 'My Canvas Workpad',
    },
    started_at: '2020-04-14T21:01:14.526Z',
    status: JOB_STATUS.PROCESSING,
  }),
  buildMockReport({
    id: 'k90cmthd1gv8cbae0c2le8bo',
    attempts: 1,
    completed_at: '2020-04-14T20:19:14.748Z',
    created_at: '2020-04-14T20:19:02.977Z',
    jobtype: 'printable_pdf',
    meta: { layout: 'preserve_layout', objectType: 'canvas workpad' },
    output: { content_type: 'application/pdf', size: 80262 },
    payload: {
      objectType: 'canvas workpad',
      title: 'My Canvas Workpad',
    },
    started_at: '2020-04-14T20:19:04.073Z',
    status: JOB_STATUS.COMPLETED,
  }),
  buildMockReport({
    id: 'k906958e1d4wcbae0c9hip1a',
    attempts: 1,
    completed_at: '2020-04-14T17:21:08.223Z',
    created_at: '2020-04-14T17:20:27.326Z',
    jobtype: 'printable_pdf',
    meta: { layout: 'preserve_layout', objectType: 'canvas workpad' },
    output: {
      content_type: 'application/pdf',
      size: 49468,
      warnings: [
        'An error occurred when trying to read the page for visualization panel info. You may need to increase \'xpack.screenshotting.capture.timeouts.waitForElements\'. TimeoutError: waiting for selector "[data-shared-item],[data-shared-items-count]" failed: timeout 30000ms exceeded',
      ],
    },
    payload: {
      objectType: 'canvas workpad',
      title: 'My Canvas Workpad',
    },
    started_at: '2020-04-14T17:20:29.444Z',
    status: JOB_STATUS.WARNINGS,
  }),
  buildMockReport({
    id: 'k9067y2a1d4wcbae0cad38n0',
    attempts: 1,
    completed_at: '2020-04-14T17:19:53.244Z',
    created_at: '2020-04-14T17:19:31.379Z',
    jobtype: 'printable_pdf',
    meta: { layout: 'preserve_layout', objectType: 'canvas workpad' },
    output: { content_type: 'application/pdf', size: 80262 },
    payload: {
      objectType: 'canvas workpad',
      title: 'My Canvas Workpad',
    },
    started_at: '2020-04-14T17:19:39.883Z',
    status: JOB_STATUS.COMPLETED,
  }),
  buildMockReport({
    id: 'k9067s1m1d4wcbae0cdnvcms',
    attempts: 1,
    completed_at: '2020-04-14T17:19:36.822Z',
    created_at: '2020-04-14T17:19:23.578Z',
    jobtype: 'printable_pdf',
    meta: { layout: 'preserve_layout', objectType: 'canvas workpad' },
    output: { content_type: 'application/pdf', size: 80262 },
    payload: {
      objectType: 'canvas workpad',
      title: 'My Canvas Workpad',
    },
    started_at: '2020-04-14T17:19:25.247Z',
    status: JOB_STATUS.COMPLETED,
  }),
  buildMockReport({
    id: 'k9065q3s1d4wcbae0c00fxlh',
    attempts: 1,
    completed_at: '2020-04-14T17:18:03.910Z',
    created_at: '2020-04-14T17:17:47.752Z',
    jobtype: 'printable_pdf',
    meta: { layout: 'preserve_layout', objectType: 'canvas workpad' },
    output: { content_type: 'application/pdf', size: 80262 },
    payload: {
      objectType: 'canvas workpad',
      title: 'My Canvas Workpad',
    },
    started_at: '2020-04-14T17:17:50.379Z',
    status: JOB_STATUS.COMPLETED,
  }),
  buildMockReport({
    id: 'k905zdw11d34cbae0c3y6tzh',
    attempts: 1,
    completed_at: '2020-04-14T17:13:03.719Z',
    created_at: '2020-04-14T17:12:51.985Z',
    jobtype: 'printable_pdf',
    meta: { layout: 'preserve_layout', objectType: 'canvas workpad' },
    output: { content_type: 'application/pdf', size: 80262 },
    payload: {
      objectType: 'canvas workpad',
      title: 'My Canvas Workpad',
      isDeprecated: true,
    },
    started_at: '2020-04-14T17:12:52.431Z',
    status: JOB_STATUS.COMPLETED,
  }),
  buildMockReport({
    id: 'k8t4ylcb07mi9d006214ifyg',
    attempts: 1,
    completed_at: '2020-04-09T19:10:10.049Z',
    created_at: '2020-04-09T19:09:52.139Z',
    jobtype: 'PNG',
    meta: { layout: 'png', objectType: 'visualization' },
    output: { content_type: 'image/png', size: 123456789 },
    payload: {
      objectType: 'visualization',
      title: 'count',
      isDeprecated: true,
    },
    started_at: '2020-04-09T19:09:54.570Z',
    status: JOB_STATUS.COMPLETED,
  }),
];

export const mockScheduledReports: ScheduledReportApiJSON[] = [
  {
    created_at: '2025-06-10T12:41:45.136Z',
    created_by: 'Foo Bar',
    enabled: true,
    id: 'scheduled-report-1',
    jobtype: 'printable_pdf_v2',
    last_run: '2025-05-10T12:41:46.959Z',
    next_run: '2025-06-16T13:56:07.123Z',
    schedule: {
      rrule: { freq: Frequency.WEEKLY, tzid: 'UTC', interval: 1 },
    },
    title: 'Scheduled report 1',
    space_id: 'default',
    payload: {
      browserTimezone: 'UTC',
      title: 'test PDF allowed',
      layout: {
        id: 'preserve_layout',
      },
      objectType: 'dashboard',
      version: '7.14.0',
      locatorParams: [
        {
          id: 'canvas',
          version: '7.14.0',
          params: {
            dashboardId: '7adfa750-4c81-11e8-b3d7-01146121b73d',
            preserveSavedFilters: 'true',
            timeRange: {
              from: 'now-7d',
              to: 'now',
            },
            useHash: 'false',
            viewMode: 'view',
          },
        },
      ],
      isDeprecated: false,
    } as BaseParamsV2,
  },
  {
    created_at: '2025-06-16T12:41:45.136Z',
    created_by: 'Test abc',
    enabled: true,
    id: 'scheduled-report-2',
    jobtype: 'printable_pdf_v2',
    last_run: '2025-06-16T12:41:46.959Z',
    next_run: '2025-06-16T13:56:07.123Z',
    space_id: 'default',
    schedule: {
      rrule: { freq: Frequency.DAILY, tzid: 'UTC', interval: 1 },
    },
    title: 'Scheduled report 2',
  },
  {
    created_at: '2025-06-12T12:41:45.136Z',
    created_by: 'New',
    enabled: false,
    id: 'scheduled-report-3',
    jobtype: 'printable_pdf_v2',
    last_run: '2025-06-16T12:41:46.959Z',
    next_run: '2025-06-16T13:56:07.123Z',
    space_id: 'space-a',
    schedule: {
      rrule: { freq: Frequency.MONTHLY, tzid: 'UTC', interval: 2 },
    },
    title: 'Scheduled report 3',
  },
];
