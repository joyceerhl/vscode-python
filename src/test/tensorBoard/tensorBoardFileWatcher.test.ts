import { assert } from 'chai';
import * as sinon from 'sinon';
import { ConfigurationTarget } from 'vscode';
import { IWorkspaceService } from '../../client/common/application/types';
import { IConfigurationService } from '../../client/common/types';
import { TensorBoardFileWatcher } from '../../client/tensorBoard/tensorBoardFileWatcher';
import { TensorBoardPrompt } from '../../client/tensorBoard/tensorBoardPrompt';
import { initialize } from '../initialize';

suite('TensorBoard file system watcher', async () => {
    let showNativeTensorBoardPrompt: sinon.SinonSpy;

    setup(function () {
        if (!process.env.VSC_RUN_TFEVENTFILES_WORKSPACE_TESTS) {
            this.skip();
        }
    });

    async function testSetup() {
        const { serviceManager } = await initialize();
        // Opt into the experiment
        const configurationService = serviceManager.get<IConfigurationService>(IConfigurationService);
        await configurationService.updateSetting(
            'experiments.optInto',
            ['nativeTensorBoard'],
            undefined,
            ConfigurationTarget.Global,
        );
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
        console.log(`Current env var: `, process.env.VSC_RUN_TFEVENTFILES_WORKSPACE_TESTS);
        if (process.env.VSC_RUN_TFEVENTFILES_WORKSPACE_TESTS !== 'tensorBoard1') {
            this.skip();
        }
        await testSetup();
        assert.ok(showNativeTensorBoardPrompt.called);
    });

    test('tfeventfile one directory down results in prompt being shown', async function () {
        console.log(`Current env var: `, process.env.VSC_RUN_TFEVENTFILES_WORKSPACE_TESTS);
        if (process.env.VSC_RUN_TFEVENTFILES_WORKSPACE_TESTS !== 'tensorBoard2') {
            this.skip();
        }
        await testSetup();
        assert.ok(showNativeTensorBoardPrompt.called);
    });

    test('tfeventfile two directories down does not result in prompt being called', async function () {
        console.log(`Current env var: `, process.env.VSC_RUN_TFEVENTFILES_WORKSPACE_TESTS);
        if (process.env.VSC_RUN_TFEVENTFILES_WORKSPACE_TESTS !== 'tensorBoard3') {
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
