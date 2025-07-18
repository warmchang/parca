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

import React from 'react';
import ProfileFlameGraph from '../';
import {Provider} from 'react-redux';
import {createStore} from '@parca/store';
import {Flamegraph} from '@parca/client';
import parca1mGraphData from './benchdata/parca-1m.json';

const {store: reduxStore} = createStore();

const parca1mGraph = parca1mGraphData as Flamegraph;

export default function ({callback = () => {}}): React.ReactElement {
  return (
    <div ref={callback}>
      <Provider store={reduxStore}>
        <ProfileFlameGraph
          graph={parca1mGraph}
          sampleUnit={parca1mGraph.unit}
          curPath={[]}
          setNewCurPath={() => {}}
        />
      </Provider>
    </div>
  );
}
