// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { inject, injectable } from 'inversify';
import {
    CancellationToken,
    CodeAction,
    CodeActionContext,
    CodeActionKind,
    CodeActionProvider,
    languages,
    Range,
    Selection,
    TextDocument
} from 'vscode';
import { IExtensionSingleActivationService } from '../activation/types';
import { Commands, PYTHON } from '../common/constants';
import { NativeTensorBoardEntrypoints } from '../common/experiments/groups';
import { IExtensionContext, IExperimentService } from '../common/types';
import { noop } from '../common/utils/misc';
import { getDocumentLines } from '../telemetry/importTracker';
import { ImportRegEx } from './tensorBoardImportTracker';

@injectable()
export class TensorBoardCodeActionProvider implements CodeActionProvider, IExtensionSingleActivationService {
    constructor(
        @inject(IExtensionContext) private extensionContext: IExtensionContext,
        @inject(IExperimentService) private experimentService: IExperimentService
    ) {}

    public async activate() {
        if (await this.experimentService.inExperiment(NativeTensorBoardEntrypoints.codeActions)) {
            this.extensionContext.subscriptions.push(languages.registerCodeActionsProvider(PYTHON, this));
        }
    }

    public provideCodeActions(
        document: TextDocument,
        _range: Range | Selection,
        _context: CodeActionContext,
        _token: CancellationToken
    ) {
        if (containsTensorBoardImport(getDocumentLines(document))) {
            const title = 'Launch native TensorBoard session';
            const nativeTensorBoardSession = new CodeAction(title, CodeActionKind.Empty);
            nativeTensorBoardSession.command = {
                title,
                command: Commands.LaunchTensorBoard
            };
            return [nativeTensorBoardSession];
        }
        return [];
    }
}

export function containsTensorBoardImport(lines: (string | undefined)[]) {
    try {
        for (const s of lines) {
            const matches = s ? ImportRegEx.exec(s) : null;
            if (matches === null || matches.groups === undefined) {
                continue;
            }
            let componentsToCheck: string[] = [];
            if (matches.groups.fromImport && matches.groups.fromImportTarget) {
                // from x.y.z import u, v, w
                componentsToCheck = matches.groups.fromImport
                    .split('.')
                    .concat(matches.groups.fromImportTarget.split(','));
            } else if (matches.groups.importImport) {
                // import package1, package2, ...
                componentsToCheck = matches.groups.importImport.split(',');
            }
            for (const component of componentsToCheck) {
                if (component && component.trim() === 'tensorboard') {
                    return true;
                }
            }
        }
    } catch {
        // Don't care about failures.
        noop();
    }
    return false;
}
