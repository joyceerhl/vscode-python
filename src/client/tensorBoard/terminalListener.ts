import { inject, injectable } from 'inversify';
import { Disposable, TerminalDataWriteEvent, window } from 'vscode';
import { IExtensionSingleActivationService } from '../activation/types';
import { IDisposableRegistry, IExperimentService } from '../common/types';
import { TensorBoardPrompt } from './tensorBoardPrompt';
import { NativeTensorBoard } from '../common/experiments/groups';
import { isTestExecution } from '../common/constants';
import { CircularList } from './circularList';
import { TensorBoardEntrypointTrigger } from './constants';

@injectable()
export class TensorBoardTerminalListener implements IExtensionSingleActivationService {
    private disposables: Disposable[] = [];

    private maxLength = 'tensorboard'.length;

    private buffer = new CircularList<string>(this.maxLength);

    constructor(
        @inject(IDisposableRegistry) private disposableRegistry: IDisposableRegistry,
        @inject(TensorBoardPrompt) private prompt: TensorBoardPrompt,
        @inject(IExperimentService) private experimentService: IExperimentService,
    ) {}

    public async activate(): Promise<void> {
        this.activateInternal().ignoreErrors();
    }

    private async activateInternal() {
        if (isTestExecution() || (await this.experimentService.inExperiment(NativeTensorBoard.experiment))) {
            this.disposables.push(
                window.onDidWriteTerminalData(
                    (e) => this.handleTerminalData(e).ignoreErrors(),
                    this,
                    this.disposableRegistry,
                ),
            );
            // Only track and parse the active terminal's data since we only care about user input
            this.disposables.push(
                window.onDidChangeActiveTerminal(
                    // eslint-disable-next-line no-return-assign
                    () => (this.buffer = new CircularList<string>(this.maxLength)),
                    this,
                    this.disposableRegistry,
                ),
            );
        }
    }

    // This function is called whenever any data is written to a VS Code integrated
    // terminal. It shows our tensorboard prompt when the user attempts to launch
    // tensorboard from the active terminal.
    // onDidWriteTerminalData emits raw data being written to the terminal output.
    // TerminalDataWriteEvent.data can be a individual single character as user is typing
    // something into terminal, so this function buffers characters and flushes them on a newline.
    // It can also be a series of characters if the user pastes a command into the terminal
    // or uses terminal history to fetch past commands.
    // It can also fire with multiple characters from terminal prompt characters or terminal output.
    private async handleTerminalData(e: TerminalDataWriteEvent) {
        if (!window.activeTerminal || window.activeTerminal !== e.terminal) {
            return;
        }

        for (const ch of e.data) {
            if (ch === ' ') {
                // Check buffer contents
                const tensorboard = 'tensorboard';
                let match = true;
                for (let i = 0; i < this.maxLength; i += 1) {
                    if (tensorboard[i] !== this.buffer.get(i)) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    this.prompt.showNativeTensorBoardPrompt(TensorBoardEntrypointTrigger.nbextension).ignoreErrors();
                    this.disposables.forEach((disp) => disp.dispose());
                    return;
                }
            }
            this.buffer.push(ch);
        }
    }
}
