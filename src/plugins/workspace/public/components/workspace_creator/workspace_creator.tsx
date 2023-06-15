/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';

import { WorkspaceForm, WorkspaceFormData } from './workspace_form';

export const WorkspaceCreator = () => {
  const {
    services: { application, workspaces, notifications },
  } = useOpenSearchDashboards();

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormData) => {
      let result;
      try {
        result = await workspaces?.client.create(data);
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.create.failed', {
            defaultMessage: 'Failed to create workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return;
      }
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.create.success', {
            defaultMessage: 'Create workspace successfully',
          }),
        });
        return;
      }
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.create.failed', {
          defaultMessage: 'Failed to create workspace',
        }),
        text: result?.error,
      });
    },
    [notifications?.toasts, workspaces?.client]
  );

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody panelled>
        <EuiPageHeader restrictWidth pageTitle="Create Workspace" />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
          style={{ width: '100%', maxWidth: 1000 }}
        >
          {application && (
            <WorkspaceForm application={application} onSubmit={handleWorkspaceFormSubmit} />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
