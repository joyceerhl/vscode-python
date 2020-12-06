import { inject, injectable } from 'inversify';
import { CancellationToken, CodeLens, Command, languages, Position, Range, TextDocument } from 'vscode';
import { IExtensionSingleActivationService } from '../activation/types';
import { Commands, PYTHON } from '../common/constants';
import { NativeTensorBoardEntrypoints } from '../common/experiments/groups';
import { IExperimentService, IExtensionContext } from '../common/types';
import { containsTensorBoardImport } from './tensorBoardCodeActionProvider';

@injectable()
export class TensorBoardCodeLensProvider implements IExtensionSingleActivationService {
    constructor(
        @inject(IExtensionContext) private extensionContext: IExtensionContext,
        @inject(IExperimentService) private experimentService: IExperimentService
    ) {}

    public async activate() {
        if (await this.experimentService.inExperiment(NativeTensorBoardEntrypoints.codeLenses)) {
            this.extensionContext.subscriptions.push(languages.registerCodeLensProvider(PYTHON, this));
        }
    }

    public provideCodeLenses(document: TextDocument, _token: CancellationToken): CodeLens[] {
        const command: Command = {
            title: 'Launch Native TensorBoard Session',
            command: Commands.LaunchTensorBoard
        };
        const codelenses: CodeLens[] = [];
        for (let index = 0; index < document.lineCount; index += 1) {
            const line = document.lineAt(index);
            if (containsTensorBoardImport([line.text])) {
                const range = new Range(new Position(line.lineNumber, 0), new Position(line.lineNumber, 1));
                codelenses.push(new CodeLens(range, command));
            }
        }
        return codelenses;
    }
}
