/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { fatalErrorsServiceMock, notificationServiceMock } from '../../../../../core/public/mocks';
import {
  getDataSourcesWithFieldsResponse,
  mockResponseForSavedObjectsCalls,
  mockManagementPlugin,
} from '../../mocks';
import { ShallowWrapper, mount, shallow } from 'enzyme';
import { DataSourceMultiSelectable } from './data_source_multi_selectable';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { DataSourceSelection } from '../../service/data_source_selection_service';

describe('DataSourceMultiSelectable', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  const uiSettings = mockedContext.uiSettings;
  const dataSourceSelection = new DataSourceSelection();

  beforeEach(() => {
    jest.clearAllMocks();

    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
  });

  it('should render normally with local cluster not hidden', () => {
    component = shallow(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        hideLocalCluster={false}
        fullWidth={false}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should render normally with local cluster hidden', () => {
    component = shallow(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        hideLocalCluster={true}
        fullWidth={false}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should show toasts when exception happens', async () => {
    const errorClient = {
      find: () => {
        return new Promise((resolve, reject) => {
          reject('error');
        });
      },
    } as any;

    component = shallow(
      <DataSourceMultiSelectable
        savedObjectsClient={errorClient}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        hideLocalCluster={true}
        fullWidth={false}
        dataSourceSelection={dataSourceSelection}
      />
    );
    await nextTick();
    expect(toasts.add).toBeCalledTimes(1);
    expect(toasts.add).toBeCalledWith({
      color: 'danger',
      text: expect.any(Function),
      title: 'Failed to fetch data sources',
    });
  });

  it('should callback when onChange happens', async () => {
    const callbackMock = jest.fn();
    const container = render(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={callbackMock}
        hideLocalCluster={true}
        fullWidth={false}
        dataSourceSelection={dataSourceSelection}
      />
    );
    const button = await container.findByTestId('dataSourceFilterGroupButton');
    button.click();
    fireEvent.click(screen.getByText('Deselect all'));

    expect(callbackMock).toBeCalledWith([]);
  });

  it('should return correct state when ui Settings provided', async () => {
    spyOn(uiSettings, 'get').and.returnValue('test1');
    component = shallow(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        hideLocalCluster={true}
        fullWidth={false}
        uiSettings={uiSettings}
        dataSourceSelection={dataSourceSelection}
      />
    );
    await component.instance().componentDidMount!();
    expect(uiSettings.get).toBeCalledWith('defaultDataSource', null);
    expect(component.state('defaultDataSource')).toEqual('test1');
    expect(component.state('selectedOptions')).toHaveLength(3);
  });

  it('should return correct state when ui Settings provided and hide cluster is false', async () => {
    spyOn(uiSettings, 'get').and.returnValue('test1');
    component = shallow(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
        dataSourceSelection={dataSourceSelection}
      />
    );
    await component.instance().componentDidMount!();
    expect(uiSettings.get).toBeCalledWith('defaultDataSource', null);
    expect(component.state('defaultDataSource')).toEqual('test1');
    expect(component.state('selectedOptions')).toHaveLength(4);
  });

  it('should handle no available data source error when selected option is empty and hide localcluster', async () => {
    mockResponseForSavedObjectsCalls(client, 'find', {});
    const wrapper = mount(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        hideLocalCluster={true}
        fullWidth={false}
        uiSettings={uiSettings}
        dataSourceSelection={dataSourceSelection}
      />
    );
    await wrapper.instance().componentDidMount!();
    expect(wrapper.state('selectedOptions')).toHaveLength(0);
    expect(wrapper.state('showEmptyState')).toBe(true);
  });

  it('should not handle no available data source error when selected option is empty and not hide localcluster', async () => {
    mockResponseForSavedObjectsCalls(client, 'find', {});
    const wrapper = mount(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
        dataSourceSelection={dataSourceSelection}
      />
    );
    await wrapper.instance().componentDidMount!();
    expect(wrapper.state('selectedOptions')).toHaveLength(1);
    expect(wrapper.state('showEmptyState')).toBe(false);
  });
});
