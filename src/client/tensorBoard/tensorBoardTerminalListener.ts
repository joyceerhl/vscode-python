import { inject, injectable } from 'inversify';
import { Disposable, Terminal, TerminalDataWriteEvent, window } from 'vscode';
import stripAnsi from 'strip-ansi';
import { IExtensionSingleActivationService } from '../activation/types';
import { TensorBoardLaunchSource } from './constants';
import { IDisposableRegistry, IExperimentService } from '../common/types';
import { TensorBoardPrompt } from './tensorBoardPrompt';
import { NativeTensorBoard } from '../common/experiments/groups';
import { isTestExecution } from '../common/constants';

@injectable()
export class TensorBoardTerminalListener implements IExtensionSingleActivationService {
    private disposable: Disposable | undefined;

    private terminalBuffers: WeakMap<Terminal, string[]>;

    constructor(
        @inject(IDisposableRegistry) private disposableRegistry: IDisposableRegistry,
        @inject(TensorBoardPrompt) private prompt: TensorBoardPrompt,
        @inject(IExperimentService) private experimentService: IExperimentService,
    ) {
        this.terminalBuffers = new WeakMap<Terminal, string[]>();
    }

    public async activate(): Promise<void> {
        this.activateInternal().ignoreErrors();
    }

    private async activateInternal() {
        if (isTestExecution() || (await this.experimentService.inExperiment(NativeTensorBoard.experiment))) {
            this.disposable = window.onDidWriteTerminalData(
                (e) => this.handleTerminalInput(e).ignoreErrors(),
                this,
                this.disposableRegistry,
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
    private async handleTerminalInput(e: TerminalDataWriteEvent) {
        if (!window.activeTerminal || window.activeTerminal !== e.terminal) {
            return;
        }

        const { data, terminal } = e;

        // At any given time, this array contains the current line being built
        let buffer = this.terminalBuffers.get(terminal) || [];
        let match = false;
        if (/\x08/.test(data)) {
            // Assumption here is that backspaces only get written to terminal output
            // one character at a time
            console.log('Matched backspace character');
            if (buffer.length > 0) {
                // Handle user backspace
                buffer.pop();
            }
            // If there's nothing in the buffer, backspace is a noop
        } else {
            // `data` here could be a single character, multiple characters,
            // or a multiline string
            const lines = data.splitLines({ trim: true, removeEmptyEntries: false });
            // Combine with any existing buffered characters
            lines[0] = buffer.join('') + lines[0];
            for (const line of lines) {
                // This is admittedly aggressive, it matches if the line contains
                // any mention of tensorboard (e.g. user is in a directory with
                // tensorboard in the name or pip installs tensorboard) for increased
                // discoverability
                if (stripAnsi(line).includes('tensorboard')) {
                    match = true;
                    break;
                }
            }
            // Hold on to the last fragment for building the next line
            buffer = [lines[lines.length - 1]];
        }

        if (match) {
            this.prompt.showNativeTensorBoardPrompt(TensorBoardLaunchSource.terminal).ignoreErrors();
            // Once we notify the user of a match, no need to keep listening for writes
            this.disposable?.dispose();
        }

        this.terminalBuffers.set(terminal, buffer);
    }
}
