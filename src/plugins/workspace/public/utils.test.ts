/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  featureMatchesConfig,
  getSelectedFeatureQuantities,
  isAppAccessibleInWorkspace,
} from './utils';
import { PublicAppInfo, WorkspaceAccessibility } from '../../../core/public';
import { AppNavLinkStatus } from '../../../core/public';

describe('workspace utils: featureMatchesConfig', () => {
  it('feature configured with `*` should match any features', () => {
    const match = featureMatchesConfig(['*']);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
    expect(
      match({ id: 'discover', category: { id: 'opensearchDashboards', label: 'Library' } })
    ).toBe(true);
  });

  it('should NOT match the config if feature id not matches', () => {
    const match = featureMatchesConfig(['discover', 'dashboards', 'visualize']);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
  });

  it('should match the config if feature id matches', () => {
    const match = featureMatchesConfig(['discover', 'dashboards', 'visualize']);
    expect(
      match({ id: 'discover', category: { id: 'opensearchDashboards', label: 'Library' } })
    ).toBe(true);
  });

  it('should match the config if feature category matches', () => {
    const match = featureMatchesConfig(['discover', 'dashboards', '@management', 'visualize']);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
  });

  it('should match any features but not the excluded feature id', () => {
    const match = featureMatchesConfig(['*', '!discover']);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
    expect(
      match({ id: 'discover', category: { id: 'opensearchDashboards', label: 'Library' } })
    ).toBe(false);
  });

  it('should match any features but not the excluded feature category', () => {
    const match = featureMatchesConfig(['*', '!@management']);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
    expect(match({ id: 'integrations', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
    expect(
      match({ id: 'discover', category: { id: 'opensearchDashboards', label: 'Library' } })
    ).toBe(true);
  });

  it('should NOT match the excluded feature category', () => {
    const match = featureMatchesConfig(['!@management']);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
    expect(match({ id: 'integrations', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
  });

  it('should match features of a category but NOT the excluded feature', () => {
    const match = featureMatchesConfig(['@management', '!dev_tools']);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
    expect(match({ id: 'integrations', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
  });

  it('a config presents later in the config array should override the previous config', () => {
    // though `dev_tools` is excluded, but this config will override by '@management' as dev_tools has category 'management'
    const match = featureMatchesConfig(['!dev_tools', '@management']);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
    expect(match({ id: 'integrations', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
  });
});

describe('workspace utils: getSelectedFeatureQuantities', () => {
  const defaultApplications = [
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
  ] as PublicAppInfo[];
  it('should support * rules', () => {
    const { total, selected } = getSelectedFeatureQuantities(['*'], defaultApplications);
    expect(total).toBe(2);
    expect(selected).toBe(2);
  });

  it('should get quantity of selected app', () => {
    const { total, selected } = getSelectedFeatureQuantities(
      ['dev_tools', '!@management'],
      defaultApplications
    );
    expect(total).toBe(2);
    expect(selected).toBe(0);
  });
});

describe('workspace utils: isAppAccessibleInWorkspace', () => {
  it('any app is accessible when workspace has no features configured', () => {
    expect(
      isAppAccessibleInWorkspace(
        { id: 'any_app', title: 'Any app', mount: jest.fn() },
        { id: 'workspace_id', name: 'workspace name' }
      )
    ).toBe(true);
  });

  it('An app is accessible when the workspace has the app configured', () => {
    expect(
      isAppAccessibleInWorkspace(
        { id: 'dev_tools', title: 'Any app', mount: jest.fn() },
        { id: 'workspace_id', name: 'workspace name', features: ['dev_tools'] }
      )
    ).toBe(true);
  });

  it('An app is not accessible when the workspace does not have the app configured', () => {
    expect(
      isAppAccessibleInWorkspace(
        { id: 'dev_tools', title: 'Any app', mount: jest.fn() },
        { id: 'workspace_id', name: 'workspace name', features: [] }
      )
    ).toBe(false);
  });

  it('An app is accessible if the nav link is hidden', () => {
    expect(
      isAppAccessibleInWorkspace(
        {
          id: 'dev_tools',
          title: 'Any app',
          mount: jest.fn(),
          navLinkStatus: AppNavLinkStatus.hidden,
        },
        { id: 'workspace_id', name: 'workspace name', features: [] }
      )
    ).toBe(true);
  });

  it('An app is accessible if it is chromeless', () => {
    expect(
      isAppAccessibleInWorkspace(
        {
          id: 'dev_tools',
          title: 'Any app',
          mount: jest.fn(),
          chromeless: true,
        },
        { id: 'workspace_id', name: 'workspace name', features: [] }
      )
    ).toBe(true);
  });

  it('An app is not accessible if its workspaceAccessibility is no', () => {
    expect(
      isAppAccessibleInWorkspace(
        {
          id: 'home',
          title: 'Any app',
          mount: jest.fn(),
          workspaceAccessibility: WorkspaceAccessibility.NO,
        },
        { id: 'workspace_id', name: 'workspace name', features: [] }
      )
    ).toBe(false);
  });
});
