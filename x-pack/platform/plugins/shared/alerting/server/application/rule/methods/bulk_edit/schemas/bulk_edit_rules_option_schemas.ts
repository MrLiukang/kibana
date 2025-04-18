/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { schema } from '@kbn/config-schema';
import { notifyWhenSchema, actionRequestSchema, systemActionRequestSchema } from '../../../schemas';
import { rRuleRequestSchema } from '../../../../../../common/routes/r_rule';
import { validateDuration } from '../../../validation';
import { validateSnoozeSchedule } from '../validation';

export const scheduleIdsSchema = schema.maybe(schema.arrayOf(schema.string()));

export const bulkEditRuleSnoozeScheduleSchema = schema.object({
  id: schema.maybe(schema.string()),
  duration: schema.number(),
  rRule: rRuleRequestSchema,
});
const bulkEditRuleSnoozeScheduleSchemaWithValidation = schema.object(
  {
    id: schema.maybe(schema.string()),
    duration: schema.number(),
    rRule: rRuleRequestSchema,
  },
  { validate: validateSnoozeSchedule }
);

const bulkEditTagSchema = schema.object({
  operation: schema.oneOf([schema.literal('add'), schema.literal('delete'), schema.literal('set')]),
  field: schema.literal('tags'),
  value: schema.arrayOf(schema.string()),
});

const bulkEditActionsSchema = schema.object({
  operation: schema.oneOf([schema.literal('add'), schema.literal('set')]),
  field: schema.literal('actions'),
  value: schema.arrayOf(schema.oneOf([actionRequestSchema, systemActionRequestSchema])),
});

const bulkEditScheduleSchema = schema.object({
  operation: schema.literal('set'),
  field: schema.literal('schedule'),
  value: schema.object({ interval: schema.string({ validate: validateDuration }) }),
});

const bulkEditThrottleSchema = schema.object({
  operation: schema.literal('set'),
  field: schema.literal('throttle'),
  value: schema.nullable(schema.string()),
});

const bulkEditNotifyWhenSchema = schema.object({
  operation: schema.literal('set'),
  field: schema.literal('notifyWhen'),
  value: notifyWhenSchema,
});

const bulkEditSnoozeSchema = schema.object({
  operation: schema.oneOf([schema.literal('set')]),
  field: schema.literal('snoozeSchedule'),
  value: bulkEditRuleSnoozeScheduleSchemaWithValidation,
});

const bulkEditUnsnoozeSchema = schema.object({
  operation: schema.oneOf([schema.literal('delete')]),
  field: schema.literal('snoozeSchedule'),
  value: schema.maybe(scheduleIdsSchema),
});

const bulkEditApiKeySchema = schema.object({
  operation: schema.literal('set'),
  field: schema.literal('apiKey'),
});

export const bulkEditOperationSchema = schema.oneOf([
  bulkEditTagSchema,
  bulkEditActionsSchema,
  bulkEditScheduleSchema,
  bulkEditThrottleSchema,
  bulkEditNotifyWhenSchema,
  bulkEditSnoozeSchema,
  bulkEditUnsnoozeSchema,
  bulkEditApiKeySchema,
]);

export const bulkEditOperationsSchema = schema.arrayOf(bulkEditOperationSchema, { minSize: 1 });
