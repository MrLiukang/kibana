/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiIconTip,
  EuiTitle,
  useEuiFontSize,
  useEuiTheme,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React from 'react';
import styled from '@emotion/styled';
import type { ServiceAnomalyStats } from '../../../../../common/anomaly_detection';
import { getSeverity } from '../../../../../common/anomaly_detection';
import {
  getServiceHealthStatus,
  getServiceHealthStatusColor,
} from '../../../../../common/service_health_status';
import { TRANSACTION_REQUEST } from '../../../../../common/transaction_types';
import { asDuration, asInteger } from '../../../../../common/utils/formatters';
import { MLSingleMetricLink } from '../../../shared/links/machine_learning_links/mlsingle_metric_link';
import { popoverWidth } from '../cytoscape_options';

const HealthStatusTitle = styled(EuiTitle)`
  display: inline;
  text-transform: uppercase;
`;

const VerticallyCentered = styled.div`
  display: flex;
  align-items: center;
`;

const SubduedText = styled.span`
  color: ${({ theme }) => theme.euiTheme.colors.textSubdued};
`;

const EnableText = styled.section`
  color: ${({ theme }) => theme.euiTheme.colors.textSubdued};
  line-height: 1.4;
  font-size: ${() => useEuiFontSize('s').fontSize};
  width: ${popoverWidth}px;
`;

export const ContentLine = styled.section`
  line-height: 2;
`;

interface Props {
  serviceName: string;
  serviceAnomalyStats: ServiceAnomalyStats | undefined;
}
export function AnomalyDetection({ serviceName, serviceAnomalyStats }: Props) {
  const { euiTheme } = useEuiTheme();

  const anomalyScore = serviceAnomalyStats?.anomalyScore;
  const severity = getSeverity(anomalyScore);
  const actualValue = serviceAnomalyStats?.actualValue;
  const mlJobId = serviceAnomalyStats?.jobId;
  const transactionType = serviceAnomalyStats?.transactionType ?? TRANSACTION_REQUEST;
  const hasAnomalyDetectionScore = anomalyScore !== undefined;

  const healthStatus = getServiceHealthStatus({ severity });

  return (
    <>
      <section>
        <HealthStatusTitle size="xxs">
          <h3>{ANOMALY_DETECTION_TITLE}</h3>
        </HealthStatusTitle>
        &nbsp;
        <EuiIconTip type="info" content={ANOMALY_DETECTION_TOOLTIP} />
        {!mlJobId && <EnableText>{ANOMALY_DETECTION_DISABLED_TEXT}</EnableText>}
      </section>
      {hasAnomalyDetectionScore && (
        <ContentLine>
          <EuiFlexGroup>
            <EuiFlexItem>
              <VerticallyCentered>
                <EuiHealth color={getServiceHealthStatusColor(euiTheme, healthStatus)} />
                <SubduedText>{ANOMALY_DETECTION_SCORE_METRIC}</SubduedText>
              </VerticallyCentered>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <div>
                {getDisplayedAnomalyScore(anomalyScore as number)}
                {actualValue && <SubduedText>&nbsp;({asDuration(actualValue)})</SubduedText>}
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        </ContentLine>
      )}
      {mlJobId && !hasAnomalyDetectionScore && (
        <EnableText>{ANOMALY_DETECTION_NO_DATA_TEXT}</EnableText>
      )}
      {mlJobId && (
        <ContentLine>
          <MLSingleMetricLink
            external
            jobId={mlJobId}
            serviceName={serviceName}
            transactionType={transactionType}
          >
            {ANOMALY_DETECTION_LINK}
          </MLSingleMetricLink>
        </ContentLine>
      )}
    </>
  );
}

function getDisplayedAnomalyScore(score: number) {
  if (score > 0 && score < 1) {
    return '< 1';
  }
  return asInteger(score);
}

const ANOMALY_DETECTION_TITLE = i18n.translate(
  'xpack.apm.serviceMap.anomalyDetectionPopoverTitle',
  { defaultMessage: 'Anomaly Detection' }
);

const ANOMALY_DETECTION_TOOLTIP = i18n.translate(
  'xpack.apm.serviceMap.anomalyDetectionPopoverTooltip',
  {
    defaultMessage:
      'Service health indicators are powered by the anomaly detection feature in machine learning',
  }
);

const ANOMALY_DETECTION_SCORE_METRIC = i18n.translate(
  'xpack.apm.serviceMap.anomalyDetectionPopoverScoreMetric',
  { defaultMessage: 'Score (max.)' }
);

const ANOMALY_DETECTION_LINK = i18n.translate('xpack.apm.serviceMap.anomalyDetectionPopoverLink', {
  defaultMessage: 'View anomalies',
});

const ANOMALY_DETECTION_DISABLED_TEXT = i18n.translate(
  'xpack.apm.serviceMap.anomalyDetectionPopoverDisabled',
  {
    defaultMessage:
      'Display service health indicators by enabling anomaly detection in APM settings.',
  }
);

const ANOMALY_DETECTION_NO_DATA_TEXT = i18n.translate(
  'xpack.apm.serviceMap.anomalyDetectionPopoverNoData',
  {
    defaultMessage: `We couldn't find an anomaly score within the selected time range. See details in the anomaly explorer.`,
  }
);
