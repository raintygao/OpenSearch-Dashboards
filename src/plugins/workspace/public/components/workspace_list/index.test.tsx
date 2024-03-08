/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorkspaceList } from './index';
import { coreMock } from '../../../../../core/public/mocks';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { switchWorkspace, updateWorkspace } from '../utils/workspace';

import { of } from 'rxjs';

import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';

jest.mock('../utils/workspace');

function getWrapWorkspaceListInContext(
  workspaceList = [
    { id: 'id1', name: 'name1' },
    { id: 'id2', name: 'name2' },
  ]
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
        <WorkspaceList />
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
  it('should be able to search after input', async () => {
    const { getByText, getByRole } = render(getWrapWorkspaceListInContext());
    expect(getByText('name1')).toBeInTheDocument();
    expect(getByText('name2')).toBeInTheDocument();
    const nameInput = getByRole('searchbox');
    fireEvent.input(nameInput, {
      target: { value: 'name1' },
    });
    await (() => {
      waitFor(() => {
        expect(getByText('name1')).toBeInTheDocument();
        expect(getByText('name2')).not.toBeInTheDocument();
      });
    });
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
    expect(updateWorkspace).toBeCalled();
  });

  it('should be able to call delete modal after clicking delete button', async () => {
    const { getAllByTestId } = render(getWrapWorkspaceListInContext());
    const deleteIcon = getAllByTestId('workspace-list-delete-icon')[0];
    fireEvent.click(deleteIcon);
    expect(screen.getByTestId('delete-workspace-modal-header')).toBeInTheDocument();
    const cancelButton = screen.getByTestId('delete-workspace-modal-cancel-button');
    fireEvent.click(cancelButton);
    expect(screen.queryByTestId('delete-workspace-modal-header')).not.toBeInTheDocument();
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
});
