/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ChartsPluginStart } from '@kbn/charts-plugin/public';
import type { EsqlService } from './esql';
import type { InvestigateAppRepositoryClient } from '../api';

export interface InvestigateAppServices {
  esql: EsqlService;
  charts: ChartsPluginStart;
  investigateAppRepositoryClient: InvestigateAppRepositoryClient;
}
