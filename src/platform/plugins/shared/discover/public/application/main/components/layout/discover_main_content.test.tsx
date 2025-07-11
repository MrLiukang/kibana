/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { BehaviorSubject, of } from 'rxjs';
import { EuiHorizontalRule } from '@elastic/eui';
import { act } from 'react-dom/test-utils';
import { mountWithIntl } from '@kbn/test-jest-helpers';
import type { DataView } from '@kbn/data-plugin/common';
import { dataViewMock, esHitsMock } from '@kbn/discover-utils/src/__mocks__';
import type {
  DataDocuments$,
  DataMain$,
  DataTotalHits$,
} from '../../state_management/discover_data_state_container';
import { createDiscoverServicesMock } from '../../../../__mocks__/services';
import type { SidebarToggleState } from '../../../types';
import { FetchStatus } from '../../../types';
import { buildDataTableRecord } from '@kbn/discover-utils';
import type { DiscoverMainContentProps } from './discover_main_content';
import { DiscoverMainContent } from './discover_main_content';
import type { SavedSearch } from '@kbn/saved-search-plugin/public';
import { VIEW_MODE } from '@kbn/saved-search-plugin/public';
import { DocumentViewModeToggle } from '../../../../components/view_mode_toggle';
import { searchSourceInstanceMock } from '@kbn/data-plugin/common/search/search_source/mocks';
import { DiscoverDocuments } from './discover_documents';
import { FieldStatisticsTab } from '../field_stats_table';
import { PatternAnalysisTab } from '../pattern_analysis';
import { getDiscoverStateMock } from '../../../../__mocks__/discover_state.mock';
import { PanelsToggle } from '../../../../components/panels_toggle';
import type { Storage } from '@kbn/kibana-utils-plugin/public';
import { createDataViewDataSource } from '../../../../../common/data_sources';
import { DiscoverTestProvider } from '../../../../__mocks__/test_provider';

const mountComponent = async ({
  hideChart = false,
  isEsqlMode = false,
  isChartAvailable,
  viewMode = VIEW_MODE.DOCUMENT_LEVEL,
  storage,
}: {
  hideChart?: boolean;
  isEsqlMode?: boolean;
  isChartAvailable?: boolean;
  viewMode?: VIEW_MODE;
  storage?: Storage;
  savedSearch?: SavedSearch;
} = {}) => {
  let services = createDiscoverServicesMock();

  (services.data.query.queryString.getDefaultQuery as jest.Mock).mockReturnValue({
    language: 'kuery',
    query: '',
  });
  (searchSourceInstanceMock.fetch$ as jest.Mock).mockImplementation(
    jest.fn().mockReturnValue(of({ rawResponse: { hits: { total: 2 } } }))
  );

  if (storage) {
    services = { ...services, storage };
  }

  const main$ = new BehaviorSubject({
    fetchStatus: FetchStatus.COMPLETE,
    foundDocuments: true,
  }) as DataMain$;

  const documents$ = new BehaviorSubject({
    fetchStatus: FetchStatus.COMPLETE,
    result: esHitsMock.map((esHit) => buildDataTableRecord(esHit, dataViewMock)),
  }) as DataDocuments$;

  const totalHits$ = new BehaviorSubject({
    fetchStatus: FetchStatus.COMPLETE,
    result: Number(esHitsMock.length),
  }) as DataTotalHits$;

  const stateContainer = getDiscoverStateMock({ isTimeBased: true });
  const savedSearchData$ = {
    main$,
    documents$,
    totalHits$,
  };
  stateContainer.dataState.data$ = savedSearchData$;
  const dataView = stateContainer.savedSearchState
    .getState()
    .searchSource.getField('index') as DataView;
  stateContainer.appState.update({
    dataSource: createDataViewDataSource({ dataViewId: dataView.id! }),
    interval: 'auto',
    hideChart,
    columns: [],
  });

  if (isEsqlMode) {
    stateContainer.appState.update({ query: { esql: 'from * ' } });
  }

  const props: DiscoverMainContentProps = {
    dataView,
    stateContainer,
    onFieldEdited: jest.fn(),
    columns: [],
    viewMode,
    onAddFilter: jest.fn(),
    isChartAvailable,
    panelsToggle: (
      <PanelsToggle
        stateContainer={stateContainer}
        sidebarToggleState$={
          new BehaviorSubject<SidebarToggleState>({
            isCollapsed: true,
            toggle: () => {},
          })
        }
        isChartAvailable={undefined}
        renderedFor="root"
      />
    ),
  };

  const component = mountWithIntl(
    <DiscoverTestProvider services={services} stateContainer={stateContainer}>
      <DiscoverMainContent {...props} />
    </DiscoverTestProvider>
  );

  await act(async () => {
    component.update();
  });

  return component;
};

describe('Discover main content component', () => {
  describe('DocumentViewModeToggle', () => {
    it('should show DocumentViewModeToggle when not in ES|QL mode', async () => {
      const component = await mountComponent();
      expect(component.find(DiscoverDocuments).prop('viewModeToggle')).toBeDefined();
    });

    it('should include DocumentViewModeToggle when in ES|QL mode', async () => {
      const component = await mountComponent({ isEsqlMode: true });
      expect(component.find(DiscoverDocuments).prop('viewModeToggle')).toBeDefined();
    });

    it('should show DocumentViewModeToggle for Field Statistics', async () => {
      const component = await mountComponent({ viewMode: VIEW_MODE.AGGREGATED_LEVEL });
      expect(component.find(DocumentViewModeToggle).exists()).toBe(true);
    });

    it('should include PanelsToggle when chart is available', async () => {
      const component = await mountComponent({ isChartAvailable: true });
      expect(component.find(PanelsToggle).prop('isChartAvailable')).toBe(true);
      expect(component.find(PanelsToggle).prop('renderedFor')).toBe('tabs');
      expect(component.find(EuiHorizontalRule).exists()).toBe(true);
    });

    it('should include PanelsToggle when chart is available and hidden', async () => {
      const component = await mountComponent({ isChartAvailable: true, hideChart: true });
      expect(component.find(PanelsToggle).prop('isChartAvailable')).toBe(true);
      expect(component.find(PanelsToggle).prop('renderedFor')).toBe('tabs');
      expect(component.find(EuiHorizontalRule).exists()).toBe(false);
    });

    it('should include PanelsToggle when chart is not available', async () => {
      const component = await mountComponent({ isChartAvailable: false });
      expect(component.find(PanelsToggle).prop('isChartAvailable')).toBe(false);
      expect(component.find(PanelsToggle).prop('renderedFor')).toBe('tabs');
      expect(component.find(EuiHorizontalRule).exists()).toBe(false);
    });
  });

  describe('Document view', () => {
    it('should show DiscoverDocuments when VIEW_MODE is DOCUMENT_LEVEL', async () => {
      const component = await mountComponent();
      expect(component.find(DiscoverDocuments).exists()).toBe(true);
      expect(component.find(PatternAnalysisTab).exists()).toBe(false);
      expect(component.find(FieldStatisticsTab).exists()).toBe(false);
    });

    it('should show FieldStatisticsTab when VIEW_MODE is AGGREGATED_LEVEL', async () => {
      const component = await mountComponent({ viewMode: VIEW_MODE.AGGREGATED_LEVEL });
      expect(component.find(DiscoverDocuments).exists()).toBe(false);
      expect(component.find(PatternAnalysisTab).exists()).toBe(false);
      expect(component.find(FieldStatisticsTab).exists()).toBe(true);
    });

    it('should show PatternAnalysisTab when VIEW_MODE is PATTERN_LEVEL', async () => {
      const component = await mountComponent({ viewMode: VIEW_MODE.PATTERN_LEVEL });
      expect(component.find(DiscoverDocuments).exists()).toBe(false);
      expect(component.find(PatternAnalysisTab).exists()).toBe(true);
      expect(component.find(FieldStatisticsTab).exists()).toBe(false);
    });
  });
});
