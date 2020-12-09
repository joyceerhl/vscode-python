// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as TypeMoq from 'typemoq';
import { mock } from 'ts-mockito';
import { assert } from 'chai';
import { CancellationToken } from 'vscode';
import { MockDocument } from '../startPage/mockDocument';
import { ExperimentService } from '../../client/common/experiments/service';
import { IExperimentService, IExtensionContext } from '../../client/common/types';
import { TensorBoardCodeLensProvider } from '../../client/tensorBoard/tensorBoardCodeLensProvider';

suite('TensorBoard code lens provider', () => {
    let extensionContext: TypeMoq.IMock<IExtensionContext>;
    let experimentService: IExperimentService;
    let codeLensProvider: TensorBoardCodeLensProvider;
    let token: TypeMoq.IMock<CancellationToken>;

    setup(() => {
        extensionContext = TypeMoq.Mock.ofType<IExtensionContext>();
        extensionContext.setup((e) => e.subscriptions).returns(() => []);
        experimentService = mock(ExperimentService);
        codeLensProvider = new TensorBoardCodeLensProvider(extensionContext.object, experimentService);
        token = TypeMoq.Mock.ofType<CancellationToken>();
    });

    test('Provides code lens for Python files', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const document = new MockDocument('import tensorboard', 'foo.py', async (_doc) => true);
        const codeActions = codeLensProvider.provideCodeLenses(document, token.object);
        assert.ok(codeActions.length > 0, 'Failed to provide code lens for file containing tensorboard import');
    });
    test('Provides code lens for Python ipynbs', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const document = new MockDocument('import tensorboard', 'foo.ipynb', async (_doc) => true);
        const codeActions = codeLensProvider.provideCodeLenses(document, token.object);
        assert.ok(codeActions.length > 0, 'Failed to provide code lens for ipynb containing tensorboard import');
    });
    test('Does not provide code lens if no matching import', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const document = new MockDocument('import tensorboard', 'foo.ipynb', async (_doc) => true);
        const codeActions = codeLensProvider.provideCodeLenses(document, token.object);
        assert.ok(codeActions.length === 0, 'Provided code lens for file without tensorboard import');
    });
});
