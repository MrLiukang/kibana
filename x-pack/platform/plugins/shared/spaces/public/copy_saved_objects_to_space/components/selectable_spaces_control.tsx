/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiSelectableOption } from '@elastic/eui';
import { EuiIconTip, EuiLoadingSpinner, EuiSelectable, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';
import React, { lazy, Suspense } from 'react';

import { FormattedMessage } from '@kbn/i18n-react';

import { SPACE_SEARCH_COUNT_THRESHOLD } from '../../../common';
import { getSpaceAvatarComponent } from '../../space_avatar';
import type { SpacesDataEntry } from '../../types';

// No need to wrap LazySpaceAvatar in an error boundary, because it is one of the first chunks loaded when opening Kibana.
const LazySpaceAvatar = lazy(() =>
  getSpaceAvatarComponent().then((component) => ({ default: component }))
);

interface Props {
  spaces: SpacesDataEntry[];
  selectedSpaceIds: string[];
  disabledSpaceIds: Set<string>;
  onChange: (selectedSpaceIds: string[]) => void;
  disabled?: boolean;
}

type SpaceOption = EuiSelectableOption & { ['data-space-id']: string };

export const SelectableSpacesControl = (props: Props) => {
  const { euiTheme } = useEuiTheme();
  if (props.spaces.length === 0) {
    return <EuiLoadingSpinner />;
  }

  const disabledIndicator = (
    <EuiIconTip
      content={
        <FormattedMessage
          id="xpack.spaces.management.copyToSpace.selectSpacesControl.disabledTooltip"
          defaultMessage="The object or a related object already exists in this space."
        />
      }
      position="left"
      type="info"
    />
  );

  const options = props.spaces.map<SpaceOption>((space) => {
    const disabled = props.disabledSpaceIds.has(space.id);
    return {
      label: space.name,
      prepend: <LazySpaceAvatar space={space} size={'s'} />, // wrapped in a Suspense below
      append: disabled ? disabledIndicator : null,
      checked: props.selectedSpaceIds.includes(space.id) ? 'on' : undefined,
      disabled,
      ['data-space-id']: space.id,
      ['data-test-subj']: `cts-space-selector-row-${space.id}`,
    };
  });

  function updateSelectedSpaces(selectedOptions: SpaceOption[]) {
    if (props.disabled) return;

    const selectedSpaceIds = selectedOptions
      .filter((opt) => opt.checked)
      .map((opt) => opt['data-space-id']);

    props.onChange(selectedSpaceIds);
  }

  return (
    <Suspense fallback={<EuiLoadingSpinner />}>
      <EuiSelectable
        options={options}
        onChange={(newOptions) => updateSelectedSpaces(newOptions as SpaceOption[])}
        listProps={{
          bordered: true,
          rowHeight: 40,
          css: css`
            margin-top: ${euiTheme.size.xs};
          `,
          'data-test-subj': 'cts-form-space-selector',
        }}
        searchable={options.length > SPACE_SEARCH_COUNT_THRESHOLD}
      >
        {(list, search) => {
          return (
            <>
              {search}
              {list}
            </>
          );
        }}
      </EuiSelectable>
    </Suspense>
  );
};
