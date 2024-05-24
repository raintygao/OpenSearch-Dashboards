/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { DataSourceOption } from '../components/data_source_menu/types';

export class DataSourceSelection {
  private selectedDataSource$ = new BehaviorSubject(new Map<string, DataSourceOption[]>());

  public selectDataSource = (componentId: string, dataSource: DataSourceOption[]) => {
    const newMap = new Map(this.selectedDataSource$.value);
    newMap.set(componentId, dataSource);
    this.selectedDataSource$.next(newMap);
  };

  public remove = (componentId: string) => {
    const newMap = new Map(this.selectedDataSource$.value);
    newMap.delete(componentId);
    this.selectedDataSource$.next(newMap);
  };

  public getSelectionValue = () => {
    return this.selectedDataSource$.value;
  };

  // Plugins can use returned subject to subscribe update.
  public getSelection$ = () => {
    return this.selectedDataSource$;
  };
}
