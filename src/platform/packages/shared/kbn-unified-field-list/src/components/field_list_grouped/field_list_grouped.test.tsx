/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { stubLogstashDataView as dataView } from '@kbn/data-views-plugin/common/data_view.stub';
import { EuiText, EuiLoadingSpinner, EuiThemeProvider } from '@elastic/eui';
import { mountWithIntl } from '@kbn/test-jest-helpers';
import { DataViewField } from '@kbn/data-views-plugin/common';
import { I18nProvider } from '@kbn/i18n-react';
import { ReactWrapper } from 'enzyme';
import { dataViewPluginMocks } from '@kbn/data-views-plugin/public/mocks';
import { coreMock } from '@kbn/core/public/mocks';
import FieldListGrouped, { type FieldListGroupedProps } from './field_list_grouped';
import { FieldListFilters } from '../field_list_filters';
import { ExistenceFetchStatus } from '../../types';
import { FieldsAccordion } from './fields_accordion';
import { NoFieldsCallout } from './no_fields_callout';
import { useGroupedFields, type GroupedFieldsParams } from '../../hooks/use_grouped_fields';
import { screen, within } from '@testing-library/react';
import { render } from '@elastic/eui/lib/test/rtl';
import userEvent from '@testing-library/user-event';

const DESCRIPTION_ID = 'fieldListGrouped__ariaDescription';

jest.mock('lodash', () => {
  const original = jest.requireActual('lodash');

  return {
    ...original,
    debounce: (fn: unknown) => fn,
  };
});

describe('UnifiedFieldList FieldListGrouped + useGroupedFields()', () => {
  let defaultProps: FieldListGroupedProps<DataViewField>;
  let mockedServices: GroupedFieldsParams<DataViewField>['services'];
  const allFields = dataView.fields;
  // 5 times more fields. Added fields will be treated as Unmapped as they are not a part of the data view.
  const manyFields = [...new Array(5)].flatMap((_, index) =>
    allFields.map((field) => {
      return new DataViewField({ ...field.toSpec(), name: `${field.name}${index || ''}` });
    })
  );

  beforeEach(() => {
    const dataViews = dataViewPluginMocks.createStartContract();
    mockedServices = {
      dataViews,
      core: coreMock.createStart(),
    };

    dataViews.get.mockImplementation(async (id: string) => {
      return dataView;
    });

    defaultProps = {
      fieldGroups: {},
      fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
      scrollToTopResetCounter: 0,
      fieldsExistInIndex: true,
      screenReaderDescriptionId: 'testId',
      renderFieldItem: jest.fn(({ field, itemIndex, groupIndex }) => (
        <EuiText
          data-test-subj="testFieldItem"
          data-name={`${field.name}-${groupIndex}-${itemIndex}`}
        >
          {field.name}
        </EuiText>
      )),
    };
  });

  interface WrapperProps {
    listProps: Omit<FieldListGroupedProps<DataViewField>, 'fieldGroups'>;
    hookParams: Omit<GroupedFieldsParams<DataViewField>, 'services'>;
  }

  async function mountWithRTL({ listProps, hookParams }: WrapperProps) {
    const Wrapper: React.FC<WrapperProps> = (props) => {
      const {
        fieldListFiltersProps,
        fieldListGroupedProps: { fieldGroups },
      } = useGroupedFields({
        ...props.hookParams,
        services: mockedServices,
      });

      return (
        <>
          <FieldListFilters {...fieldListFiltersProps} />
          <FieldListGrouped {...props.listProps} fieldGroups={fieldGroups} />
        </>
      );
    };

    await act(async () => {
      render(
        <I18nProvider>
          <Wrapper hookParams={hookParams} listProps={listProps} />
        </I18nProvider>
      );
    });
  }

  const mountComponent = async (component: React.ReactElement) =>
    await mountWithIntl(<EuiThemeProvider>{component}</EuiThemeProvider>);

  async function mountGroupedList({ listProps, hookParams }: WrapperProps): Promise<ReactWrapper> {
    const Wrapper: React.FC<WrapperProps> = (props) => {
      const {
        fieldListFiltersProps,
        fieldListGroupedProps: { fieldGroups },
      } = useGroupedFields({
        ...props.hookParams,
        services: mockedServices,
      });

      return (
        <EuiThemeProvider>
          <FieldListFilters {...fieldListFiltersProps} />
          <FieldListGrouped {...props.listProps} fieldGroups={fieldGroups} />
        </EuiThemeProvider>
      );
    };

    let wrapper: ReactWrapper;
    await act(async () => {
      wrapper = await mountWithIntl(<Wrapper hookParams={hookParams} listProps={listProps} />);
      // wait for lazy modules if any
      await new Promise((resolve) => setTimeout(resolve, 0));
      await wrapper.update();
    });

    return wrapper!;
  }

  it('renders correctly in empty state', async () => {
    const wrapper = await mountComponent(
      <FieldListGrouped
        {...defaultProps}
        fieldGroups={{}}
        fieldsExistenceStatus={ExistenceFetchStatus.unknown}
      />
    );

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe('');
  });

  it('renders correctly in loading state', async () => {
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.unknown,
      },
      hookParams: {
        dataViewId: dataView.id ?? null,
        allFields,
      },
    });

    expect(wrapper.find(FieldListGrouped).prop('fieldsExistenceStatus')).toBe(
      ExistenceFetchStatus.unknown
    );
    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe('');
    expect(wrapper.find(FieldsAccordion)).toHaveLength(2);
    expect(wrapper.find(EuiLoadingSpinner)).toHaveLength(2);
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('hasLoaded'))
    ).toStrictEqual([false, false]);
    expect(wrapper.find(NoFieldsCallout)).toHaveLength(0);

    await act(async () => {
      await wrapper.setProps({
        listProps: {
          ...defaultProps,
          fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
        },
      });
      await wrapper.update();
    });

    expect(wrapper.find(FieldListGrouped).prop('fieldsExistenceStatus')).toBe(
      ExistenceFetchStatus.succeeded
    );
    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '25 available fields. 3 meta fields.'
    );
    expect(wrapper.find(FieldsAccordion)).toHaveLength(2);
    expect(wrapper.find(EuiLoadingSpinner)).toHaveLength(0);
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('hasLoaded'))
    ).toStrictEqual([true, true]);
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('paginatedFields').length)
    ).toStrictEqual([25, 0]);
    expect(wrapper.find(NoFieldsCallout)).toHaveLength(0);
  });

  it('renders correctly in failed state', async () => {
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.failed,
      },
      hookParams: {
        dataViewId: dataView.id!,
        allFields,
      },
    });

    expect(wrapper.find(FieldListGrouped).prop('fieldsExistenceStatus')).toBe(
      ExistenceFetchStatus.failed
    );
    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '25 available fields. 3 meta fields.'
    );
    expect(wrapper.find(FieldsAccordion)).toHaveLength(2);
    expect(wrapper.find(EuiLoadingSpinner)).toHaveLength(0);
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('hasLoaded'))
    ).toStrictEqual([true, true]);
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('showExistenceFetchError'))
    ).toStrictEqual([true, true]);
  });

  it('renders correctly in no fields state', async () => {
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistInIndex: false,
        fieldsExistenceStatus: ExistenceFetchStatus.failed,
      },
      hookParams: {
        dataViewId: dataView.id!,
        allFields: [],
      },
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '0 available fields. 0 meta fields.'
    );
    expect(wrapper.find(FieldsAccordion)).toHaveLength(2);
    expect(wrapper.find(EuiLoadingSpinner)).toHaveLength(0);
    expect(
      wrapper.find(NoFieldsCallout).map((callout) => callout.prop('fieldsExistInIndex'))
    ).toStrictEqual([false, false]);
  });

  it('renders correctly for text-based queries (no data view)', async () => {
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
      },
      hookParams: {
        dataViewId: null,
        allFields,
        onSelectedFieldFilter: (field) => field.name === 'bytes',
      },
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '1 selected field. 28 available fields.'
    );
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('paginatedFields').length)
    ).toStrictEqual([1, 28]);
  });

  it('renders correctly when Meta gets open', async () => {
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
      },
      hookParams: {
        dataViewId: dataView.id!,
        allFields,
      },
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '25 available fields. 3 meta fields.'
    );
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('paginatedFields').length)
    ).toStrictEqual([25, 0]);

    await act(async () => {
      await wrapper
        .find('[data-test-subj="fieldListGroupedMetaFields"]')
        .find('button')
        .first()
        .simulate('click');
      await wrapper.update();
    });

    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('paginatedFields').length)
    ).toStrictEqual([25, 3]);
  });

  it('renders correctly when paginated', async () => {
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
      },
      hookParams: {
        dataViewId: dataView.id!,
        allFields: manyFields,
      },
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '25 available fields. 112 unmapped fields. 3 meta fields.'
    );
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('paginatedFields').length)
    ).toStrictEqual([25, 0, 0]);

    await act(async () => {
      await wrapper
        .find('[data-test-subj="fieldListGroupedUnmappedFields"]')
        .find('button')
        .first()
        .simulate('click');
      await wrapper.update();
    });

    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('paginatedFields').length)
    ).toStrictEqual([25, 50, 0]);

    await act(async () => {
      await wrapper
        .find('[data-test-subj="fieldListGroupedMetaFields"]')
        .find('button')
        .first()
        .simulate('click');
      await wrapper.update();
    });

    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('paginatedFields').length)
    ).toStrictEqual([25, 88, 0]);
  });

  it('renders correctly when fields are searched and filtered', async () => {
    const hookParams = {
      dataViewId: dataView.id!,
      allFields: manyFields,
    };

    await mountWithRTL({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
      },
      hookParams,
    });

    expect(screen.getByTestId(DESCRIPTION_ID)).toHaveTextContent(
      '25 available fields. 112 unmapped fields. 3 meta fields.'
    );

    await userEvent.type(screen.getByTestId('fieldListFiltersFieldSearch'), '@');

    expect(screen.getByTestId(DESCRIPTION_ID)).toHaveTextContent(
      '2 available fields. 8 unmapped fields. 0 meta fields.'
    );

    await userEvent.clear(screen.getByTestId('fieldListFiltersFieldSearch'));
    await userEvent.type(screen.getByTestId('fieldListFiltersFieldSearch'), '_');

    expect(screen.getByTestId(DESCRIPTION_ID)).toHaveTextContent(
      '3 available fields. 24 unmapped fields. 3 meta fields.'
    );

    await userEvent.click(screen.getByTestId('fieldListFiltersFieldTypeFilterToggle'));
    await userEvent.click(screen.getByTestId('typeFilter-date'));

    expect(screen.getByTestId(DESCRIPTION_ID)).toHaveTextContent(
      '1 available field. 4 unmapped fields. 0 meta fields.'
    );
  }, 10000);

  it('renders correctly when non-supported fields are filtered out', async () => {
    const hookParams = {
      dataViewId: dataView.id!,
      allFields: manyFields,
    };
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
      },
      hookParams,
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '25 available fields. 112 unmapped fields. 3 meta fields.'
    );

    await act(async () => {
      await wrapper.setProps({
        hookParams: {
          ...hookParams,
          onSupportedFieldFilter: (field: DataViewField) => field.aggregatable,
        },
      });
      await wrapper.update();
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '23 available fields. 104 unmapped fields. 3 meta fields.'
    );
  });

  it('renders correctly when selected fields are present', async () => {
    const hookParams = {
      dataViewId: dataView.id!,
      allFields: manyFields,
    };
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
      },
      hookParams,
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '25 available fields. 112 unmapped fields. 3 meta fields.'
    );

    await act(async () => {
      await wrapper.setProps({
        hookParams: {
          ...hookParams,
          onSelectedFieldFilter: (field: DataViewField) =>
            ['@timestamp', 'bytes'].includes(field.name),
        },
      });
      await wrapper.update();
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '2 selected fields. 25 available fields. 112 unmapped fields. 3 meta fields.'
    );
  });

  it('renders correctly when popular fields limit and custom selected fields are present', async () => {
    const hookParams = {
      dataViewId: dataView.id!,
      allFields: manyFields,
      popularFieldsLimit: 10,
      sortedSelectedFields: [manyFields[0], manyFields[1]],
    };
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
      },
      hookParams,
    });

    expect(wrapper.find(`#${defaultProps.screenReaderDescriptionId}`).first().text()).toBe(
      '2 selected fields. 10 popular fields. 25 available fields. 112 unmapped fields. 3 meta fields.'
    );
  });

  describe('Skip Link Functionality', () => {
    it('renders the skip link when there is a next section', async () => {
      await mountWithRTL({
        listProps: {
          ...defaultProps,
          fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
        },
        hookParams: {
          dataViewId: dataView.id!,
          allFields,
        },
      });

      // Check that the first accordion (Available Fields) has a skip link
      const availableFieldsAccordion = screen.getByTestId('fieldListGroupedAvailableFields');
      const skipLinks = within(availableFieldsAccordion).getAllByRole('link', {
        name: /go to meta fields/i,
      });

      // Since we have multiple sections, we should have at least one skip link
      expect(skipLinks.length).toBe(1);
    });

    it('does not render a skip link in the last section', async () => {
      await mountWithRTL({
        listProps: {
          ...defaultProps,
          fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
        },
        hookParams: {
          dataViewId: dataView.id!,
          allFields,
        },
      });

      // Find the last accordion (should be Meta Fields)
      const metaFieldsAccordion = screen.getByTestId('fieldListGroupedMetaFields');

      // The last section shouldn't have a skip link
      const skipLinksInLastAccordion = within(metaFieldsAccordion).queryAllByRole('link', {
        name: /go to/i,
      });

      expect(skipLinksInLastAccordion.length).toBe(0);
    });

    it('sets focus on the next section when skip link is clicked', async () => {
      const user = userEvent.setup();

      await mountWithRTL({
        listProps: {
          ...defaultProps,
          fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
        },
        hookParams: {
          dataViewId: dataView.id!,
          allFields,
        },
      });

      // Find the skip link in the Available Fields accordion
      const availableFieldsAccordion = screen.getByTestId('fieldListGroupedAvailableFields');
      const skipLink = within(availableFieldsAccordion).getByRole('link', {
        name: /go to meta fields/i,
      });

      // Click the skip link
      await user.click(skipLink);

      // Verify that the Meta Fields accordion is now focused
      const metaFieldsButton = screen.getByRole('button', { name: /meta fields/i });
      expect(metaFieldsButton).toHaveFocus();
    });
  });

  it('persists sections state in local storage', async () => {
    const wrapper = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
        localStorageKeyPrefix: 'test',
      },
      hookParams: {
        dataViewId: dataView.id!,
        allFields: manyFields,
      },
    });

    // only Available is open
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('initialIsOpen'))
    ).toStrictEqual([true, false, false]);

    await act(async () => {
      await wrapper
        .find('[data-test-subj="fieldListGroupedMetaFields"]')
        .find('button')
        .first()
        .simulate('click');
      await wrapper.update();
    });

    // now Empty is open too
    expect(
      wrapper.find(FieldsAccordion).map((accordion) => accordion.prop('initialIsOpen'))
    ).toStrictEqual([true, false, true]);

    const wrapper2 = await mountGroupedList({
      listProps: {
        ...defaultProps,
        fieldsExistenceStatus: ExistenceFetchStatus.succeeded,
        localStorageKeyPrefix: 'test',
      },
      hookParams: {
        dataViewId: dataView.id!,
        allFields: manyFields,
      },
    });

    // both Available and Empty are open for the second instance
    expect(
      wrapper2.find(FieldsAccordion).map((accordion) => accordion.prop('initialIsOpen'))
    ).toStrictEqual([true, false, true]);
  });
});
