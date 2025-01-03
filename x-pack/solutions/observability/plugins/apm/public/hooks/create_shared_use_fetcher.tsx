/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { APIEndpoint } from '../../server';
import type { APIClientRequestParamsOf, APIReturnType } from '../services/rest/create_call_apm_api';
import type { FetcherResult } from './use_fetcher';
import { useFetcher } from './use_fetcher';

interface SharedUseFetcher<TEndpoint extends APIEndpoint> {
  useFetcherResult: () => FetcherResult<APIReturnType<TEndpoint>> & {
    refetch: () => void;
  };
  Provider: React.FunctionComponent<
    {
      children: React.ReactElement;
      params: {};
    } & APIClientRequestParamsOf<TEndpoint>
  >;
}

export function createSharedUseFetcher<TEndpoint extends APIEndpoint>(
  endpoint: TEndpoint
): SharedUseFetcher<TEndpoint> {
  const Context = createContext<APIClientRequestParamsOf<APIEndpoint> | undefined>(undefined);

  const returnValue: SharedUseFetcher<APIEndpoint> = {
    useFetcherResult: () => {
      const context = useContext(Context);

      if (!context) {
        throw new Error('Context was not found');
      }

      const params = 'params' in context ? context.params : undefined;

      const result = useFetcher(
        (callApmApi) => {
          return callApmApi(endpoint, ...((params ? [{ params }] : []) as any));
        },
        [params]
      );

      return result as ReturnType<SharedUseFetcher<APIEndpoint>['useFetcherResult']>;
    },
    Provider: (props) => {
      const { children } = props;

      const params = props.params;

      const memoizedParams = useMemo(() => {
        return { params };
      }, [params]);
      return <Context.Provider value={memoizedParams}>{children}</Context.Provider>;
    },
  };

  return returnValue;
}
