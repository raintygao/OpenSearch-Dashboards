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

import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSmallButtonIcon, EuiButton } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import dompurify from 'dompurify';
import React, { useCallback, useState } from 'react';
import { IndexPattern, getServices } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { fetchSourceTypeDataCell } from '../data_grid/data_grid_table_cell_value';
import { DocViewer } from '../doc_viewer/doc_viewer';
import { DocViewerLinks } from '../doc_viewer_links/doc_viewer_links';
import { TableCell } from './table_cell';

export interface TableRowProps {
  row: OpenSearchSearchHit;
  columns: string[];
  indexPattern: IndexPattern;
  onRemoveColumn?: (column: string) => void;
  onAddColumn?: (column: string) => void;
  onFilter?: DocViewFilterFn;
  onClose?: () => void;
  isShortDots: boolean;
}

const TableRowUI = ({
  row,
  columns,
  indexPattern,
  onRemoveColumn,
  onAddColumn,
  onFilter,
  onClose,
  isShortDots,
  query,
}: TableRowProps) => {
  const services = getServices();

  const flattened = indexPattern.flattenHit(row);
  const [isExpanded, setIsExpanded] = useState(false);
  const handleExpanding = useCallback(() => setIsExpanded((prevState) => !prevState), [
    setIsExpanded,
  ]);

  const createNotebook = async (name: string) => {
    const id = await services.http.post<string>('/api/observability/notebooks/note/savedNotebook', {
      body: JSON.stringify({
        name,
      }),
    });
    if (!id) {
      throw new Error('create notebook error');
    }
    return id;
  };

  const setParagraphs = async (id: string, paragraphs: any) => {
    const response = await services.http.post(
      '/api/observability/notebooks/savedNotebook/set_paragraphs',
      {
        body: JSON.stringify({
          noteId: id,
          paragraphs,
        }),
      }
    );
    const { id: objectId } = response;
    if (!objectId) {
      throw new Error('set paragraphs error');
    }
    return objectId;
  };

  const handleInvestigation = async () => {
    console.log('handleInvestigation', columns, row);

    const id = await createNotebook('Discover log investigation');
    const md = JSON.stringify(row._source)
      .replace(/^\{|\}$/g, '') // 移除最外层的花括号
      .replace(/"/g, '') // 移除所有引号
      .replace(/,(\s*\n)/g, '$1')
      .replace(/(\w+):/g, (match, key) => {
        return `**${key}**:`;
      })
      .replace(/\s+/g, ' ')
      .trim();
    const paragraphs = [
      {
        id: 'paragraph_87c634a8-c4c9-4806-9dea-a3cbaebfd33a',
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        dataSourceMDSId: query.dataset.dataSource?.id,
        dataSourceMDSLabel: query.dataset.dataSource?.title,
        input: {
          inputText: '%ppl\n' + query.query,
          inputType: 'MARKDOWN',
        },
        output: [
          {
            result: query.query,
            outputType: 'QUERY',
            execution_time: '0 ms',
          },
        ],
      },
      {
        id: 'paragraph_87c634a8-c4c9-4806-9dea-a3cbaebfd36a',
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        dataSourceMDSId: query.dataset.dataSource?.id,
        dataSourceMDSLabel: query.dataset.dataSource?.title,
        input: {
          inputText: '%md\n' + md,
          inputType: 'MARKDOWN',
        },
        output: [
          {
            result: md,
            outputType: 'MARKDOWN',
            execution_time: '0 ms',
          },
        ],
      },
    ];
    await setParagraphs(id, paragraphs);

    const path = id;
    console.log('path', path);
    services.application.navigateToApp('observability-notebooks#', {
      path,
    });
  };

  const tableRow = (
    <tr key={row._id} className={row.isAnchor ? 'osdDocTable__row--highlight' : ''}>
      <td data-test-subj="docTableExpandToggleColumn" className="osdDocTableCell__toggleDetails">
        <EuiSmallButtonIcon
          color="text"
          onClick={handleExpanding}
          iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
          aria-label={i18n.translate('discover.defaultTable.docTableExpandToggleColumnLabel', {
            defaultMessage: `Toggle row details`,
          })}
          data-test-subj="docTableExpandToggleColumn"
        />
      </td>
      {columns.map((colName) => {
        const fieldInfo = indexPattern.fields.getByName(colName);
        const fieldMapping = flattened[colName];

        if (typeof row === 'undefined') {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <span>-</span>
            </td>
          );
        }

        if (fieldInfo?.type === '_source') {
          return (
            <td
              key={colName}
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord osdDocTableCell__source"
              data-test-subj="docTableField"
            >
              <div className="truncate-by-height">
                {fetchSourceTypeDataCell(indexPattern, row, colName, false, isShortDots)}
              </div>
            </td>
          );
        }

        const formattedValue = indexPattern.formatField(row, colName);

        if (typeof formattedValue === 'undefined') {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className="osdDocTableCell eui-textBreakAll eui-textBreakWord"
            >
              <span>-</span>
            </td>
          );
        }

        const sanitizedCellValue = dompurify.sanitize(formattedValue);

        if (!fieldInfo?.filterable) {
          return (
            <td
              key={colName}
              data-test-subj="docTableField"
              className={`osdDocTableCell ${
                indexPattern.timeFieldName === colName
                  ? 'eui-textNoWrap'
                  : 'eui-textBreakAll eui-textBreakWord'
              }`}
            >
              <div className="truncate-by-height">
                {/* eslint-disable-next-line react/no-danger */}
                <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
              </div>
            </td>
          );
        }

        return (
          <TableCell
            key={colName}
            columnId={colName}
            onFilter={onFilter}
            isTimeField={indexPattern.timeFieldName === colName}
            fieldMapping={fieldMapping}
            sanitizedCellValue={sanitizedCellValue}
          />
        );
      })}
    </tr>
  );

  const expandedTableRow = (
    <tr key={'x' + row._id}>
      <td
        className="osdDocTable__detailsParent"
        colSpan={columns.length + 1}
        data-test-subj="osdDocTableDetailsParent"
      >
        <EuiFlexGroup gutterSize="m" alignItems="center">
          <EuiFlexItem
            grow={false}
            className="osdDocTable__detailsIconContainer"
            data-test-subj="osdDocTableDetailsIconContainer"
          >
            <EuiIcon type="folderOpen" />
          </EuiFlexItem>
          <EuiFlexItem>
            <h4
              className="euiTitle euiTitle--xxsmall"
              i18n-id="discover.docTable.tableRow.detailHeading"
              i18n-default-message="Expanded document"
            >
              Expanded document
            </h4>
          </EuiFlexItem>
          <EuiFlexItem>
            <DocViewerLinks hit={row} indexPattern={indexPattern} columns={columns} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton onClick={handleInvestigation} size="s">
              Investigation
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem>
            <DocViewer
              hit={row}
              columns={columns}
              indexPattern={indexPattern}
              onRemoveColumn={(columnName: string) => {
                onRemoveColumn?.(columnName);
                onClose?.();
              }}
              onAddColumn={(columnName: string) => {
                onAddColumn?.(columnName);
                onClose?.();
              }}
              filter={(mapping, value, mode) => {
                onFilter?.(mapping, value, mode);
                onClose?.();
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </td>
    </tr>
  );

  return (
    <>
      {tableRow}
      {isExpanded && expandedTableRow}
    </>
  );
};

export const TableRow = React.memo(TableRowUI);
