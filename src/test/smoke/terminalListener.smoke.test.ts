import * as vscode from 'vscode';
import * as fse from 'fs-extra';
import * as path from 'path';
import { JUPYTER_EXTENSION_ID } from '../../client/common/constants';
import { StopWatch } from '../../client/common/utils/stopWatch';
import { setAutoSaveDelayInWorkspaceRoot } from '../common';
import { IS_SMOKE_TEST } from '../constants';
import { initializeTest, closeActiveWindows, initialize } from '../initialize';
import { verifyExtensionIsAvailable } from './common';
import { createTemporaryFile } from '../utils/fs';
import { traceVerbose } from '../../client/common/logger';
import { IFileSystem } from '../../client/common/platform/types';
import { Deferred, createDeferred } from '../../client/common/utils/async';
import * as internalScripts from '../../client/common/process/internal/scripts';

suite('Smoke Test: TensorBoard terminal listener', () => {
    const requirementsTxtFile = path.join(path.resolve('.'), 'requirements.txt');
    suiteSetup(async function () {
        if (!IS_SMOKE_TEST) {
            return this.skip();
        }
        await verifyExtensionIsAvailable(JUPYTER_EXTENSION_ID);
        await initialize();
        await setAutoSaveDelayInWorkspaceRoot(1);
        const requirements = `
    absl-py==0.11.0
    backcall==0.2.0
    cachetools==4.2.0
    certifi==2020.12.5
    chardet==4.0.0
    colorama==0.4.4
    decorator==4.4.2
    flatbuffers==1.12
    google-auth==1.24.0
    google-auth-oauthlib==0.4.2
    grpcio==1.32.0
    idna==2.10
    ipykernel==5.4.2
    ipython==7.19.0
    ipython-genutils==0.2.0
    jedi==0.18.0
    jupyter-client==6.1.7
    jupyter-core==4.7.0
    Markdown==3.3.3
    numpy==1.18.0
    oauthlib==3.1.0
    parso==0.8.1
    pickleshare==0.7.5
    prompt-toolkit==3.0.9
    protobuf==3.14.0
    pyasn1==0.4.8
    pyasn1-modules==0.2.8
    Pygments==2.7.3
    python-dateutil==2.8.1
    pywin32==300
    pyzmq==20.0.0
    requests==2.25.1
    requests-oauthlib==1.3.0
    rsa==4.6
    six==1.15.0
    tensorboard==2.4.0
    tensorboard-plugin-wit==1.7.0
    tornado==6.1
    traitlets==5.0.5
    urllib3==1.26.2
    wcwidth==0.2.5
    Werkzeug==1.0.1
            `;
        fse.writeFileSync(requirementsTxtFile, requirements);
        return undefined;
    });
    setup(initializeTest);
    suiteTeardown(closeActiveWindows);
    teardown(closeActiveWindows);
    test('Without terminal listener', async () => {
        const stopwatch = new StopWatch();
        await spewOutputToTerminal();
        console.log(`Elapsed time without terminal listener is ${stopwatch.elapsedTime}`);
    });
    test('With terminal listener', async () => {
        // Opt into tensorboard support
        const experimentsConfig = vscode.workspace.getConfiguration('python', null);
        await experimentsConfig.update('experiments.optInto', ['nativeTensorBoard'], true);
        const stopwatch = new StopWatch();
        await spewOutputToTerminal();
        console.log(`Elapsed time with terminal listener is ${stopwatch.elapsedTime}`);
    });
});

enum State {
    notStarted = 0,
    started = 1,
    completed = 2,
    errored = 4,
}

class ExecutionState implements vscode.Disposable {
    public state: State = State.notStarted;

    private _completed: Deferred<void> = createDeferred();

    private disposable?: vscode.Disposable;

    constructor(
        public readonly lockFile: string,
        private readonly fs: IFileSystem,
        private readonly command: string[],
    ) {
        this.registerStateUpdate();
        this._completed.promise.finally(() => this.dispose()).ignoreErrors();
    }

    public get completed(): Promise<void> {
        return this._completed.promise;
    }

    public dispose() {
        if (this.disposable) {
            this.disposable.dispose();
            this.disposable = undefined;
        }
    }

    private registerStateUpdate() {
        const timeout = setInterval(async () => {
            const state = await this.getLockFileState(this.lockFile);
            if (state !== this.state) {
                traceVerbose(`Command state changed to ${state}. ${this.command.join(' ')}`);
            }
            this.state = state;
            if (state & State.errored) {
                const errorContents = await this.fs.readFile(`${this.lockFile}.error`).catch(() => '');
                this._completed.reject(
                    new Error(
                        `Command failed with errors, check the terminal for details. Command: ${this.command.join(
                            ' ',
                        )}\n${errorContents}`,
                    ),
                );
            } else if (state & State.completed) {
                this._completed.resolve();
            }
        }, 100);

        this.disposable = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dispose: () => clearInterval(timeout as any),
        };
    }

    private async getLockFileState(file: string): Promise<State> {
        const source = await this.fs.readFile(file);
        let state: State = State.notStarted;
        if (source.includes('START')) {
            state |= State.started;
        }
        if (source.includes('END')) {
            state |= State.completed;
        }
        if (source.includes('FAIL')) {
            state |= State.completed | State.errored;
        }
        return state;
    }
}

async function sendCommandAndWait(terminal: vscode.Terminal, command: string, args: string[]) {
    const { filePath, cleanupCallback } = await createTemporaryFile('.log', path.resolve('.'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = new ExecutionState(filePath, fse as any, [command]);
    try {
        const sendArgs = internalScripts.shell_exec(command, filePath, args);
        const text = `${command.fileToCommandArgument()} ${sendArgs.map((each) => each.toCommandArgument()).join(' ')}`;
        terminal.sendText(text, true);
        await state.completed;
    } finally {
        cleanupCallback();
        state.dispose();
    }
}

async function spewOutputToTerminal() {
    // Assumption: terminal listener isn't going to be a problem except
    // when the user's workflow is terminal-bound
    // Idea: one common scenario for Python extension users is to install
    // a bunch of packages. See how slow this gets with terminal listening
    // turned on
    const terminal = vscode.window.createTerminal();
    const venvCreate = ['-m', 'venv', '.venv'];
    await sendCommandAndWait(terminal, 'python', venvCreate);
    await sendCommandAndWait(terminal, 'python', ['-m', 'pip', 'install', '-r', 'requirements.txt']);
}
