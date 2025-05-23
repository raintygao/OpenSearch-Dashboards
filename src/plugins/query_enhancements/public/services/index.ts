/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart } from '../../../../../src/core/public';
import { DataStorage } from '../../../data/common';
import { DataPublicPluginStart } from '../../../data/public';
import { createGetterSetter } from '../../../opensearch_dashboards_utils/common';
import { UiActionsStart } from '../../../ui_actions/public';

export const [getStorage, setStorage] = createGetterSetter<DataStorage>('storage');
export const [getData, setData] = createGetterSetter<DataPublicPluginStart>('data');
export const [getUiActions, setUiActions] = createGetterSetter<UiActionsStart>('UIActions');
export const [getApplication, setApplication] = createGetterSetter<ApplicationStart>('application');
