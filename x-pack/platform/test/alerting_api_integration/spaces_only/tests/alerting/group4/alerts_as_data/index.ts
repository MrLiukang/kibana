/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FtrProviderContext } from '../../../../../common/ftr_provider_context';

export default function alertsAsDataTests({ loadTestFile }: FtrProviderContext) {
  describe('alerts_as_data', () => {
    loadTestFile(require.resolve('./install_resources'));
    loadTestFile(require.resolve('./alerts_as_data'));
    loadTestFile(require.resolve('./alerts_as_data_flapping'));
    loadTestFile(require.resolve('./alerts_as_data_conflicts'));
    loadTestFile(require.resolve('./alerts_as_data_alert_delay'));
    loadTestFile(require.resolve('./alerts_as_data_dynamic_templates.ts'));
  });
}
