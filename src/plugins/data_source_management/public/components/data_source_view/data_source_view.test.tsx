/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { DataSourceView } from './data_source_view';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import { getSingleDataSourceResponse, mockResponseForSavedObjectsCalls } from '../../mocks';
import { render } from '@testing-library/react';
import * as utils from '../utils';
import { DataSourceSelection } from '../../service/data_source_selection_service';

describe('DataSourceView', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  let dataSourceSelection: DataSourceSelection;
  const { toasts } = notificationServiceMock.createStartContract();

  beforeEach(() => {
    jest.clearAllMocks();
    client = {
      get: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'get', getSingleDataSourceResponse);
    dataSourceSelection = new DataSourceSelection();
  });

  it('should render normally with local cluster not hidden', () => {
    spyOn(utils, 'getDataSourceById').and.returnValue([{ id: 'test1', label: 'test1' }]);
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1', label: 'test1' }]}
        hideLocalCluster={false}
        onSelectedDataSources={jest.fn()}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
  it('When selected option is local cluster and hide local Cluster is true, should return error', () => {
    const onSelectedDataSources = jest.fn();
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: '' }]}
        hideLocalCluster={true}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSources}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(component).toMatchSnapshot();
    expect(onSelectedDataSources).toBeCalledWith([]);
  });
  it('Should return error when provided datasource has been filtered out', async () => {
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1', label: 'test1' }]}
        hideLocalCluster={false}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        dataSourceFilter={(ds) => {
          return false;
        }}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(component).toMatchSnapshot();
  });
  it('Should render successfully when provided datasource has not been filtered out', async () => {
    spyOn(utils, 'getDataSourceById').and.returnValue([{ id: 'test1', label: 'test1' }]);
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        hideLocalCluster={false}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        dataSourceFilter={(ds) => {
          return true;
        }}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
    expect(utils.getDataSourceById).toBeCalledTimes(1);
  });
  it('should call getDataSourceById when only pass id with no label', async () => {
    spyOn(utils, 'getDataSourceById').and.returnValue([{ id: 'test1', label: 'test1' }]);
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        savedObjectsClient={client}
        notifications={toasts}
        hideLocalCluster={false}
        onSelectedDataSources={jest.fn()}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(component).toMatchSnapshot();
    expect(utils.getDataSourceById).toBeCalledTimes(1);
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
  it('should call notification warning when there is data source fetch error', async () => {
    spyOn(utils, 'getDataSourceById').and.throwError('Data source is not available');
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        savedObjectsClient={client}
        notifications={toasts}
        hideLocalCluster={false}
        onSelectedDataSources={jest.fn()}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(component).toMatchSnapshot();
    expect(toasts.add).toBeCalledTimes(1);
    expect(utils.getDataSourceById).toBeCalledTimes(1);
  });

  it('should show popover when click on data source view button', async () => {
    const onSelectedDataSource = jest.fn();
    spyOn(utils, 'getDataSourceById').and.returnValue([{ id: 'test1', label: 'test1' }]);
    spyOn(utils, 'handleDataSourceFetchError').and.returnValue('');
    const container = render(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        selectedOption={[{ id: 'test1' }]}
        onSelectedDataSources={onSelectedDataSource}
        hideLocalCluster={false}
        fullWidth={false}
        dataSourceSelection={dataSourceSelection}
      />
    );
    const button = await container.findByTestId('dataSourceViewButton');
    button.click();
    expect(container).toMatchSnapshot();
  });

  it('should render no data source when no data source filtered out and hide local cluster', async () => {
    const onSelectedDataSource = jest.fn();
    render(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        hideLocalCluster={true}
        fullWidth={false}
        selectedOption={[{ id: '' }]}
        dataSourceFilter={(ds) => false}
        dataSourceSelection={dataSourceSelection}
      />
    );
    expect(onSelectedDataSource).toBeCalledWith([]);
  });
});
