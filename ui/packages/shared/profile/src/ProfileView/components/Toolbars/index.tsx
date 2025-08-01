// Copyright 2022 The Parca Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {FC} from 'react';

import {Icon} from '@iconify/react';

import {QueryServiceClient} from '@parca/client';
import {Button} from '@parca/components';
import {ProfileType} from '@parca/parser';

import {CurrentPathFrame} from '../../../ProfileFlameGraph/FlameGraphArrow/utils';
import {ProfileSource} from '../../../ProfileSource';
import {useDashboard} from '../../context/DashboardContext';
import GroupByDropdown from '../ActionButtons/GroupByDropdown';
import InvertCallStack from '../InvertCallStack';
import ProfileFilters from '../ProfileFilters';
import ShareButton from '../ShareButton';
import ViewSelector from '../ViewSelector';
import MultiLevelDropdown from './MultiLevelDropdown';
import TableColumnsDropdown from './TableColumnsDropdown';

export interface VisualisationToolbarProps {
  groupBy: string[];
  toggleGroupBy: (key: string) => void;
  hasProfileSource: boolean;
  pprofdownloading?: boolean;
  profileSource?: ProfileSource;
  queryClient?: QueryServiceClient;
  onDownloadPProf: () => void;
  curPath: CurrentPathFrame[];
  setNewCurPath: (path: CurrentPathFrame[]) => void;
  profileType?: ProfileType;
  total: bigint;
  filtered: bigint;
  groupByLabels: string[];
  preferencesModal?: boolean;
  profileViewExternalSubActions?: React.ReactNode;
  setGroupByLabels: (labels: string[]) => void;
  showVisualizationSelector?: boolean;
  sandwichFunctionName?: string;
}

export interface TableToolbarProps {
  profileType?: ProfileType;
  total: bigint;
  filtered: bigint;
}

export interface FlameGraphToolbarProps {
  curPath: CurrentPathFrame[];
  setNewCurPath: (path: CurrentPathFrame[]) => void;
}

export interface SandwichFlameGraphToolbarProps {
  resetSandwichFunctionName: () => void;
  sandwichFunctionName?: string;
}

export const TableToolbar: FC<TableToolbarProps> = ({profileType, total, filtered}) => {
  return (
    <>
      <div className="flex w-full gap-2 items-end">
        <TableColumnsDropdown profileType={profileType} total={total} filtered={filtered} />
      </div>
    </>
  );
};

export const FlameGraphToolbar: FC<FlameGraphToolbarProps> = ({curPath, setNewCurPath}) => {
  return (
    <>
      <div className="flex w-full gap-2 items-end">
        <Button
          variant="neutral"
          className="gap-2 w-max h-fit"
          onClick={() => setNewCurPath([])}
          disabled={curPath.length === 0}
          id="h-reset-graph"
        >
          Reset graph
          <Icon icon="system-uicons:reset" width={20} />
        </Button>
      </div>
    </>
  );
};

export const SandwichFlameGraphToolbar: FC<SandwichFlameGraphToolbarProps> = ({
  resetSandwichFunctionName,
  sandwichFunctionName,
}) => {
  return (
    <>
      <div className="flex w-full gap-2 items-end justify-between">
        <Button
          color="neutral"
          onClick={() => resetSandwichFunctionName()}
          className="w-auto"
          variant="neutral"
          disabled={sandwichFunctionName === undefined || sandwichFunctionName.length === 0}
        >
          Reset view
        </Button>
      </div>
    </>
  );
};

const Divider = (): JSX.Element => (
  <div className="border-t mt-4 border-gray-200 dark:border-gray-700 h-[1px] w-full pb-4" />
);

export const VisualisationToolbar: FC<VisualisationToolbarProps> = ({
  groupBy,
  toggleGroupBy,
  groupByLabels,
  setGroupByLabels,
  profileType,
  profileSource,
  queryClient,
  onDownloadPProf,
  pprofdownloading,
  profileViewExternalSubActions,
  curPath,
  setNewCurPath,
  total,
  filtered,
  showVisualizationSelector = true,
}) => {
  const {dashboardItems} = useDashboard();

  const isTableViz = dashboardItems?.includes('table');
  const isTableVizOnly = dashboardItems?.length === 1 && isTableViz;
  const isGraphViz = dashboardItems?.includes('flamegraph');
  const isGraphVizOnly = dashboardItems?.length === 1 && isGraphViz;

  const req = profileSource?.QueryRequest();
  if (req !== null && req !== undefined) {
    req.groupBy = {
      fields: groupBy ?? [],
    };
  }

  return (
    <>
      <div className="flex w-full justify-between items-start gap-2">
        <div className="flex gap-2 items-start">
          {isGraphViz && (
            <>
              <GroupByDropdown
                groupBy={groupBy}
                labels={groupByLabels}
                setGroupByLabels={setGroupByLabels}
              />

              <InvertCallStack />
            </>
          )}

          <div className="flex mt-5">
            <ProfileFilters />

            {profileViewExternalSubActions != null ? profileViewExternalSubActions : null}
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <MultiLevelDropdown
            groupBy={groupBy}
            toggleGroupBy={toggleGroupBy}
            profileType={profileType}
            onSelect={() => {}}
            isTableVizOnly={isTableVizOnly}
          />

          <ShareButton
            profileSource={profileSource}
            queryClient={queryClient}
            queryRequest={req}
            onDownloadPProf={onDownloadPProf}
            pprofdownloading={pprofdownloading ?? false}
            profileViewExternalSubActions={profileViewExternalSubActions}
          />

          {showVisualizationSelector ? <ViewSelector profileSource={profileSource} /> : null}
        </div>
      </div>

      {isGraphVizOnly && (
        <>
          <Divider />
          <FlameGraphToolbar curPath={curPath} setNewCurPath={setNewCurPath} />
        </>
      )}
      {isTableVizOnly && (
        <>
          <Divider />
          <TableToolbar profileType={profileType} total={total} filtered={filtered} />
        </>
      )}
    </>
  );
};
