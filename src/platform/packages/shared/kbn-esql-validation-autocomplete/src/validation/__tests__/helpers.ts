/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import { EditorError, ESQLMessage } from '@kbn/esql-ast';
import { ESQLCallbacks } from '../../shared/types';
import { getCallbackMocks } from '../../__tests__/helpers';
import { ValidationOptions } from '../types';
import { validateQuery } from '../validation';

/** Validation test API factory, can be called at the start of each unit test. */
export type Setup = typeof setup;

/**
 * Sets up an API for ES|QL query validation testing.
 *
 * @returns API for testing validation logic.
 */
export const setup = async () => {
  const callbacks = getCallbackMocks();

  const validate = async (
    query: string,
    opts: ValidationOptions = {},
    cb: ESQLCallbacks = callbacks
  ) => {
    return await validateQuery(query, opts, cb);
  };

  const assertErrors = (errors: unknown[], expectedErrors: string[], query?: string) => {
    const errorMessages: string[] = [];
    for (const error of errors) {
      if (error && typeof error === 'object') {
        const message =
          typeof (error as ESQLMessage).text === 'string'
            ? (error as ESQLMessage).text
            : typeof (error as EditorError).message === 'string'
            ? (error as EditorError).message
            : String(error);
        errorMessages.push(message);
      } else {
        errorMessages.push(String(error));
      }
    }

    try {
      expect(errorMessages.sort()).toStrictEqual(expectedErrors.sort());
    } catch (error) {
      throw Error(`${query}\n
      Received:
      '${errorMessages.sort()}'
      Expected:
      ${expectedErrors.sort()}`);
    }
  };

  const expectErrors = async (
    query: string,
    expectedErrors: string[],
    expectedWarnings?: string[],
    opts: ValidationOptions = {},
    cb: ESQLCallbacks = callbacks
  ) => {
    const { errors, warnings } = await validateQuery(query, opts, cb);
    assertErrors(errors, expectedErrors, query);
    if (expectedWarnings) {
      assertErrors(warnings, expectedWarnings, query);
    }
  };

  return {
    callbacks,
    validate,
    expectErrors,
  };
};
