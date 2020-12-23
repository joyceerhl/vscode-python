import { assert } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { IExtensionSingleActivationService } from '../../client/activation/types';
import { sleep } from '../../client/common/utils/async';
import { TensorBoardPrompt } from '../../client/tensorBoard/tensorBoardPrompt';
import { TensorBoardTerminalListener } from '../../client/tensorBoard/tensorBoardTerminalListener';
import { isWindows } from '../core';
import { initialize } from '../initialize';

const terminalWriteTimeout = 7000;

suite('TensorBoard terminal listener', async () => {
    let showNativeTensorBoardPrompt: sinon.SinonSpy;
    let terminal: vscode.Terminal;

    setup(async () => {
        const { serviceManager } = await initialize();
        // Stub the prompt show method so we can verify that it was called
        const prompt = serviceManager.get<TensorBoardPrompt>(TensorBoardPrompt);
        showNativeTensorBoardPrompt = sinon.stub(prompt, 'showNativeTensorBoardPrompt');
        serviceManager.rebindInstance(TensorBoardPrompt, prompt);
        const terminalListener = serviceManager.get<IExtensionSingleActivationService>(TensorBoardTerminalListener);
        // Wait for activation so that we register our handler for onDidWriteTerminalData
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (terminalListener as any).activateInternal();
        // Create the terminal and sleep for a bit since the terminal sometimes takes a while to show up
        terminal = vscode.window.createTerminal('pty');
        terminal.show(false);
        await sleep(terminalWriteTimeout);
    });

    teardown(async () => {
        showNativeTensorBoardPrompt.restore();
        terminal.dispose();
    });

    test('Paste tensorboard launch command', async () => {
        // Simulate user pasting in a launch command all at once
        // or filling it in using terminal command history
        terminal.sendText('tensorboard --logdir logs/fit', true);
        await sleep(terminalWriteTimeout);
        assert.ok(showNativeTensorBoardPrompt.called);
    });

    test('Type in tensorboard launch command', async () => {
        // onDidWriteTerminalData fires with each character
        // that a user types into the terminal. Simulate this
        // by sending one character at a time
        for (const ch of 'tensorboard\n') {
            terminal.sendText(ch, false);
        }
        await sleep(terminalWriteTimeout);
        assert.ok(showNativeTensorBoardPrompt.called);
    });

    test('Multiline terminal write', async () => {
        terminal.sendText('foo\ntensorboard --logdir logs/fit\nbar', false);
        await sleep(terminalWriteTimeout);
        assert.ok(showNativeTensorBoardPrompt.called);
    });

    test('Prompt not shown if no matching command', async () => {
        terminal.sendText('tensorboar', true);
        await sleep(terminalWriteTimeout);
        assert.ok(showNativeTensorBoardPrompt.notCalled);
    });

    test('Backspaces are correctly handled', async function () {
        // We appear to be unable to handle backspaces on Linux as no corresponding
        // \b character is written to the raw data stream when the user presses the
        // backspace key. This behavior may be shell-dependent but is certainly the
        // case with bash and sh. So onDidWriteTerminalData does not fire with the
        // backspace character when the user enters a backspace, and we as the extension
        // have no way of detecting that the user just hit a backspace, so we cannot
        // update our buffer accordingly. In such situations `tensorboard` terminal
        // command detection is totally best-effort.
        if (!isWindows) {
            this.skip();
        }
        terminal.sendText('tensor', false);
        await sleep(terminalWriteTimeout);
        terminal.sendText('\b', false);
        await sleep(terminalWriteTimeout);
        terminal.sendText('rboard', true);
        await sleep(terminalWriteTimeout);
        assert.ok(showNativeTensorBoardPrompt.called);
    });
});
