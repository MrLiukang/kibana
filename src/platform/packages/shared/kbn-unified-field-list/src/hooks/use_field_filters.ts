/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useMemo } from 'react';
import { htmlIdGenerator } from '@elastic/eui';
import { type DataViewField } from '@kbn/data-views-plugin/common';
import type { CoreStart } from '@kbn/core-lifecycle-browser';
import { getFieldIconType, fieldNameWildcardMatcher } from '@kbn/field-utils';
import { type FieldListFiltersProps } from '../components/field_list_filters';
import { type FieldListItem, GetCustomFieldType } from '../types';
import { useRestorableState } from '../restorable_state';

const htmlId = htmlIdGenerator('fieldList');

/**
 * Input params for useFieldFilters hook
 */
export interface FieldFiltersParams<T extends FieldListItem> {
  allFields: T[] | null;
  getCustomFieldType?: GetCustomFieldType<T>;
  onSupportedFieldFilter?: (field: T) => boolean;
  services: {
    core: Pick<CoreStart, 'docLinks'>;
  };
}

/**
 * Output of useFieldFilters hook
 */
export interface FieldFiltersResult<T extends FieldListItem> {
  fieldSearchHighlight: string;
  fieldListFiltersProps: FieldListFiltersProps<T>;
  onFilterField?: (field: T) => boolean;
}

/**
 * A hook for managing field search and filters state
 * @param allFields
 * @param getCustomFieldType
 * @param onSupportedFieldFilter
 * @param services
 * @public
 */
export function useFieldFilters<T extends FieldListItem = DataViewField>({
  allFields,
  getCustomFieldType,
  onSupportedFieldFilter,
  services,
}: FieldFiltersParams<T>): FieldFiltersResult<T> {
  const [selectedFieldTypes, setSelectedFieldTypes] = useRestorableState('selectedFieldTypes', []);
  const [nameFilter, setNameFilter] = useRestorableState('nameFilter', '');
  const screenReaderDescriptionId = useMemo(() => htmlId(), []);
  const docLinks = services.core.docLinks;

  return useMemo(() => {
    const fieldSearchHighlight = nameFilter.trim().toLowerCase();
    return {
      fieldSearchHighlight,
      fieldListFiltersProps: {
        docLinks,
        selectedFieldTypes,
        allFields,
        getCustomFieldType,
        onSupportedFieldFilter,
        onChangeFieldTypes: setSelectedFieldTypes,
        nameFilter,
        onChangeNameFilter: setNameFilter,
        screenReaderDescriptionId,
      },
      onFilterField:
        fieldSearchHighlight?.length || selectedFieldTypes.length > 0
          ? (field: T) => {
              if (fieldSearchHighlight && !fieldNameWildcardMatcher(field, fieldSearchHighlight)) {
                return false;
              }
              if (selectedFieldTypes.length > 0) {
                return selectedFieldTypes.includes(getFieldIconType(field, getCustomFieldType));
              }
              return true;
            }
          : undefined,
    };
  }, [
    docLinks,
    selectedFieldTypes,
    allFields,
    getCustomFieldType,
    onSupportedFieldFilter,
    setSelectedFieldTypes,
    nameFilter,
    setNameFilter,
    screenReaderDescriptionId,
  ]);
}
