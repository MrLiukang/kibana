/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEuiTheme } from '@elastic/eui';
import { ReportTypes } from '@kbn/exploratory-view-plugin/public';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import React from 'react';
import { ClientPluginsStart } from '../../../../../plugin';
import { useMonitorQueryFilters } from '../hooks/use_monitor_query_filters';
import { AVAILABILITY_LABEL } from './availability_panel';

interface AvailabilitySparklinesProps {
  from: string;
  to: string;
  id: string;
}

export const AvailabilitySparklines = (props: AvailabilitySparklinesProps) => {
  const {
    services: {
      exploratoryView: { ExploratoryViewEmbeddable },
    },
  } = useKibana<ClientPluginsStart>();
  const { queryIdFilter, locationFilter } = useMonitorQueryFilters();
  const { euiTheme } = useEuiTheme();

  if (!queryIdFilter) {
    return null;
  }

  return (
    <ExploratoryViewEmbeddable
      id={props.id}
      customHeight="70px"
      reportType={ReportTypes.KPI}
      axisTitlesVisibility={{ x: false, yRight: false, yLeft: false }}
      legendIsVisible={false}
      hideTicks={true}
      attributes={[
        {
          seriesType: 'area',
          time: props,
          name: AVAILABILITY_LABEL,
          dataType: 'synthetics',
          selectedMetricField: 'monitor_availability',
          reportDefinitions: queryIdFilter,
          filters: locationFilter,
          color: euiTheme.colors.vis.euiColorVis1,
        },
      ]}
    />
  );
};
