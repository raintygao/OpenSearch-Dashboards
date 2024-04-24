/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorkspaceList, WorkspaceListProps } from './index';
import { coreMock } from '../../../../../core/public/mocks';
import { render, fireEvent, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { switchWorkspace, navigateToWorkspaceUpdatePage } from '../utils/workspace';
import { PublicAppInfo } from '../../../../../core/public';

import { of, BehaviorSubject } from 'rxjs';

import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';

jest.mock('../utils/workspace');

jest.mock('../delete_workspace_modal', () => ({
  DeleteWorkspaceModal: ({ onClose }: { onClose: () => void }) => (
    <div aria-label="mock delete workspace modal">
      <button onClick={onClose} aria-label="mock delete workspace modal button" />
    </div>
  ),
}));

const workspaceConfigurableApps: PublicAppInfo[] = [];
const defaultProps: WorkspaceListProps = {
  workspaceConfigurableApps$: new BehaviorSubject(workspaceConfigurableApps),
};

function getWrapWorkspaceListInContext(
  workspaceList = [
    { id: 'id1', name: 'name1' },
    { id: 'id2', name: 'name2' },
  ],
  props = defaultProps
) {
  const coreStartMock = coreMock.createStart();

  const services = {
    ...coreStartMock,
    workspaces: {
      workspaceList$: of(workspaceList),
    },
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <WorkspaceList {...props} />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}

describe('WorkspaceList', () => {
  it('should render title and table normally', () => {
    const { getByText, getByRole, container } = render(<WorkspaceList />);
    expect(getByText('Workspaces')).toBeInTheDocument();
    expect(getByRole('table')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
  it('should render data in table based on workspace list data', async () => {
    const { getByText } = render(getWrapWorkspaceListInContext());
    expect(getByText('name1')).toBeInTheDocument();
    expect(getByText('name2')).toBeInTheDocument();
  });
  it('should be able to apply debounce search after input', async () => {
    const list = [
      { id: 'id1', name: 'name1' },
      { id: 'id2', name: 'name2' },
      { id: 'id3', name: 'name3' },
      { id: 'id4', name: 'name4' },
      { id: 'id5', name: 'name5' },
      { id: 'id6', name: 'name6' },
    ];
    const { getByText, getByRole, queryByText } = render(getWrapWorkspaceListInContext(list));
    expect(getByText('name1')).toBeInTheDocument();
    expect(queryByText('name6')).not.toBeInTheDocument();
    const input = getByRole('searchbox');
    fireEvent.change(input, {
      target: { value: 'nam' },
    });
    fireEvent.change(input, {
      target: { value: 'name6' },
    });
    expect(queryByText('name6')).not.toBeInTheDocument();
  });

  it('should be able to switch workspace after clicking name', async () => {
    const { getByText } = render(getWrapWorkspaceListInContext());
    const nameLink = getByText('name1');
    fireEvent.click(nameLink);
    expect(switchWorkspace).toBeCalled();
  });

  it('should be able to update workspace after clicking name', async () => {
    const { getAllByTestId } = render(getWrapWorkspaceListInContext());
    const editIcon = getAllByTestId('workspace-list-edit-icon')[0];
    fireEvent.click(editIcon);
    expect(navigateToWorkspaceUpdatePage).toBeCalled();
  });

  it('should be able to call delete modal after clicking delete button', async () => {
    const { getAllByTestId } = render(getWrapWorkspaceListInContext());
    const deleteIcon = getAllByTestId('workspace-list-delete-icon')[0];
    fireEvent.click(deleteIcon);
    expect(screen.queryByLabelText('mock delete workspace modal')).toBeInTheDocument();
    const modalCancelButton = screen.getByLabelText('mock delete workspace modal button');
    fireEvent.click(modalCancelButton);
    expect(screen.queryByLabelText('mock delete workspace modal')).not.toBeInTheDocument();
  });

  it('should be able to pagination when clicking pagination button', async () => {
    const list = [
      { id: 'id1', name: 'name1' },
      { id: 'id2', name: 'name2' },
      { id: 'id3', name: 'name3' },
      { id: 'id4', name: 'name4' },
      { id: 'id5', name: 'name5' },
      { id: 'id6', name: 'name6' },
    ];
    const { getByTestId, getByText, queryByText } = render(getWrapWorkspaceListInContext(list));
    expect(getByText('name1')).toBeInTheDocument();
    expect(queryByText('name6')).not.toBeInTheDocument();
    const paginationButton = getByTestId('pagination-button-next');
    fireEvent.click(paginationButton);
    expect(queryByText('name1')).not.toBeInTheDocument();
    expect(getByText('name6')).toBeInTheDocument();
  });

  it('should be able to display features selection quantity based on features and configurableApps', async () => {
    const list = [{ id: 'id1', name: 'name1', features: ['*', '!@management'] }];
    const props = ({
      workspaceConfigurableApps$: of([
        {
          appRoute: '/app/dashboards',
          id: 'dashboards',
          title: 'Dashboards',
          category: {
            id: 'opensearchDashboards',
            label: 'OpenSearch Dashboards',
            euiIconType: 'inputOutput',
            order: 1000,
          },
          status: 0,
          navLinkStatus: 1,
        },
        {
          appRoute: '/app/dev_tools',
          id: 'dev_tools',
          title: 'Dev Tools',
          category: {
            id: 'management',
            label: 'Management',
            order: 5000,
            euiIconType: 'managementApp',
          },
          status: 0,
          navLinkStatus: 1,
        },
        {
          appRoute: '/app/management',
          id: 'management',
          title: 'Dashboards Management',
          order: 9030,
          icon: '/ui/logos/opensearch_mark.svg',
          category: {
            id: 'management',
            label: 'Management',
            order: 5000,
            euiIconType: 'managementApp',
          },
          status: 0,
          navLinkStatus: 1,
        },
      ]),
    } as unknown) as WorkspaceListProps;
    const { queryByText } = render(getWrapWorkspaceListInContext(list, props));
    expect(queryByText('1/3')).toBeInTheDocument();
  });
});
