/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiButton, EuiHeaderLink, EuiButtonIcon, EuiText, EuiToolTip } from '@elastic/eui';
import { upperFirst } from 'lodash';
import React, { MouseEvent } from 'react';
import { TopNavControlData } from './top_nav_control_data';

export function TopNavControlItem(props: TopNavControlData) {
  if ('renderComponent' in props) return props.renderComponent;

  if ('text' in props) {
    const { text, ...rest } = props;
    return (
      <EuiText size="s" {...rest}>
        {text}
      </EuiText>
    );
  }

  if ('description' in props) {
    return (
      <EuiText className="descriptionHeaderControl" size="s">
        {props.description}
      </EuiText>
    );
  }

  function isDisabled(): boolean {
    if ('isDisabled' in props) {
      const val = typeof props.isDisabled === 'function' ? props.isDisabled() : props.isDisabled;
      return val || false;
    }
    return false;
  }

  function getTooltip(): string {
    if ('tooltip' in props) {
      const val = typeof props.tooltip === 'function' ? props.tooltip() : props.tooltip;
      return val || '';
    }
    return '';
  }

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if ('run' in props && !isDisabled()) props.run?.(e.currentTarget);
  }

  const elementProps = {
    isDisabled: isDisabled(),
    iconType: props.iconType,
    iconSide: props.iconSide,
    fill: props.fill,
    'data-test-subj': props.testId,
    className: props.className,
    'aria-label': props.ariaLabel,
    color: props.color,
  };

  if ('href' in props) {
    // @ts-ignore
    elementProps.href = props.href;
  } else {
    // @ts-ignore
    elementProps.onClick = handleClick;
  }

  let component;
  switch (props.type) {
    case 'icon':
      delete elementProps.iconSide;
      component = <EuiButtonIcon size="s" {...elementProps} />;
      break;

    case 'link':
      component = (
        <EuiHeaderLink size="s" {...elementProps} isLoading={props.isLoading}>
          {upperFirst(props.label || props.id!)}
        </EuiHeaderLink>
      );
      break;

    default:
      component = (
        <EuiButton size="s" {...elementProps} isLoading={props.isLoading}>
          {upperFirst(props.label || props.id!)}
        </EuiButton>
      );
  }

  const tooltip = getTooltip();
  if (tooltip) {
    return <EuiToolTip content={tooltip}>{component}</EuiToolTip>;
  }
  return component;
}
