import { assert } from 'chai';
import * as path from 'path';
import * as sinon from 'sinon';
import { IWorkspaceService } from '../../client/common/application/types';
import { TensorBoardFileWatcher } from '../../client/tensorBoard/tensorBoardFileWatcher';
import { TensorBoardPrompt } from '../../client/tensorBoard/tensorBoardPrompt';
import { initialize } from '../initialize';

suite('TensorBoard file system watcher', async () => {
    let showNativeTensorBoardPrompt: sinon.SinonSpy;

    setup(function () {
        if (process.env.VSC_RUN_TFEVENTFILES_WORKSPACE_TESTS !== '1') {
            this.skip();
        }
    });

    async function testSetup() {
        const { serviceManager } = await initialize();
        // Stub the prompt show method so we can verify that it was called
        const prompt = serviceManager.get<TensorBoardPrompt>(TensorBoardPrompt);
        showNativeTensorBoardPrompt = sinon.stub(prompt, 'showNativeTensorBoardPrompt');
        serviceManager.rebindInstance(TensorBoardPrompt, prompt);
        const fileWatcher = serviceManager.get<TensorBoardFileWatcher>(TensorBoardFileWatcher);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (fileWatcher as any).activateInternal();
    }

    teardown(async () => {
        sinon.restore();
    });

    test('tfeventfile in workspace root results in prompt being shown', async function () {
        if (path.basename(path.resolve('.')) !== 'tensorBoard1') {
            this.skip();
        }
        await testSetup();
        assert.ok(showNativeTensorBoardPrompt.called);
    });

    test('tfeventfile one directory down results in prompt being shown', async function () {
        if (path.basename(path.resolve('.')) !== 'tensorBoard2') {
            this.skip();
        }
        await testSetup();
        assert.ok(showNativeTensorBoardPrompt.called);
    });

    test('tfeventfile two directories down does not result in prompt being called', async function () {
        if (path.basename(path.resolve('.')) !== 'tensorBoard3') {
            this.skip();
        }
        await testSetup();
        assert.ok(showNativeTensorBoardPrompt.notCalled);
    });

    test('No workspace folder open', async function () {
        const { serviceManager } = await initialize();
        // Stub the prompt show method so we can verify that it was called
        const prompt = serviceManager.get<TensorBoardPrompt>(TensorBoardPrompt);
        showNativeTensorBoardPrompt = sinon.stub(prompt, 'showNativeTensorBoardPrompt');
        serviceManager.rebindInstance(TensorBoardPrompt, prompt);
        // Pretend there are no open folders
        const workspaceService = serviceManager.get<IWorkspaceService>(IWorkspaceService);
        sinon.stub(workspaceService, 'workspaceFolders').get(() => undefined);
        serviceManager.rebindInstance(IWorkspaceService, workspaceService);
        const fileWatcher = serviceManager.get<TensorBoardFileWatcher>(TensorBoardFileWatcher);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (fileWatcher as any).activateInternal();
        assert.ok(showNativeTensorBoardPrompt.notCalled);
    });
});
