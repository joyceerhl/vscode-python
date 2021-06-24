import {
    Event,
    Location,
    NotebookConcatTextDocument,
    NotebookDocument,
    workspace,
    Uri,
    TextDocument,
    Range,
    Position,
    Disposable,
    EventEmitter,
} from 'vscode';
import { IVSCodeNotebook } from '../../common/application/types';
import { PYTHON_LANGUAGE } from '../../common/constants';

export class InteractiveConcatTextDocument implements NotebookConcatTextDocument {
    private _concatTextDocument: NotebookConcatTextDocument;

    private _lineCounts: [number, number] = [0, 0];

    public get isClosed(): boolean {
        return this._notebook.isClosed;
    }

    public get uri(): Uri {
        return this._notebook.uri;
    }

    public dispose(): void {
        this._disposables.map((d) => d.dispose());
    }

    public get onDidChange(): Event<void> {
        return this._didChange.event;
    }

    public readonly version = 0;

    private _disposables: Disposable[] = [];

    private _didChange = new EventEmitter<void>();


    constructor(private _notebook: NotebookDocument, private _input: TextDocument, notebookApi: IVSCodeNotebook) {
        this._concatTextDocument = notebookApi.createConcatTextDocument(_notebook, { language: PYTHON_LANGUAGE });
        this._concatTextDocument.onDidChange(() => {
            // not performant, NotebookConcatTextDocument should provide lineCount
            this._updateLineCount();
        });
        this._disposables.push(workspace.onDidChangeTextDocument((e) => {
            if (e.document === this._input) {
                this._updateLineCount();
                this._didChange.fire();
            }
        }));
        this._disposables.push(this._didChange);
        this._updateLineCount();
    }

    private _updateLineCount() {
        let concatLineCnt = 0;
        for (let i = 0; i < this._notebook.cellCount; i += 1) {
            const cell = this._notebook.cellAt(i);
            if (cell.document.languageId === PYTHON_LANGUAGE) {
                concatLineCnt += this._notebook.cellAt(i).document.lineCount + 1;
            }
        }
        this._lineCounts = [
            concatLineCnt > 0 ? concatLineCnt - 1 : 0, // NotebookConcatTextDocument.lineCount
            this._input.lineCount,
        ];
    }

    getText(range?: Range): string {
        if (!range) {
            let result = '';
            result += `${this._concatTextDocument.getText()}\n${this._input.getText()}`;
            return result;
        }
        if (range.isEmpty) {
            return '';
        }
        const start = this.locationAt(range.start);
        const end = this.locationAt(range.end);
        const startDocument = workspace.textDocuments.find(
            (document) => document.uri.toString() === start.uri.toString(),
        );
        const endDocument = workspace.textDocuments.find((document) => document.uri.toString() === end.uri.toString());
        if (!startDocument || !endDocument) {
            return '';
        }
        if (startDocument === endDocument) {
            return startDocument.getText(start.range);
        }
        const a = startDocument.getText(new Range(start.range.start, new Position(startDocument.lineCount, 0)));
        const b = endDocument.getText(new Range(new Position(0, 0), end.range.end));
        return `${a}\n${b}`;
    }

    offsetAt(position: Position): number {
        const { line } = position;
        if (line >= this._lineCounts[0]) {
            // input box
            const lineOffset = Math.max(0, line - this._lineCounts[0] - 1);
            return this._input.offsetAt(new Position(lineOffset, position.character));
        }
        // concat
        return this._concatTextDocument.offsetAt(position);
    }

    // turning an offset on the final concatenatd document to position
    positionAt(locationOrOffset: Location | number): Position {
        if (typeof locationOrOffset === 'number') {
            const concatTextLen = this._concatTextDocument.getText().length;
            if (locationOrOffset >= concatTextLen) {
                // in the input box
                const offset = Math.max(0, locationOrOffset - concatTextLen - 1);
                return this._input.positionAt(offset);
            }
            const position = this._concatTextDocument.positionAt(locationOrOffset);
            return new Position(this._lineCounts[0] + 1 + position.line, position.character);
        }
        if (locationOrOffset.uri.toString() === this._input.uri.toString()) {
            // range in the input box
            return new Position(
                this._lineCounts[0] + 1 + locationOrOffset.range.start.line,
                locationOrOffset.range.start.character,
            );
        }
        return this._concatTextDocument.positionAt(locationOrOffset);
    }

    locationAt(positionOrRange: Range | Position): Location {
        if (positionOrRange instanceof Position) {
            positionOrRange = new Range(positionOrRange, positionOrRange);
        }
        const start = positionOrRange.start.line;
        if (start >= this._lineCounts[0]) {
            // this is the inputbox
            const offset = Math.max(0, start - this._lineCounts[0] - 1);
            const startPosition = new Position(offset, positionOrRange.start.character);
            const endOffset = Math.max(0, positionOrRange.end.line - this._lineCounts[0] - 1);
            const endPosition = new Position(endOffset, positionOrRange.end.character);
            return new Location(this._input.uri, new Range(startPosition, endPosition));
        }
        // this is the NotebookConcatTextDocument
        return this._concatTextDocument.locationAt(positionOrRange);
    }

    contains(uri: Uri): boolean {
        if (this._input.uri.toString() === uri.toString()) {
            return true;
        }
        return this._concatTextDocument.contains(uri);
    }

    // eslint-disable-next-line class-methods-use-this
    validateRange(range: Range): Range {
        return range;
    }

    // eslint-disable-next-line class-methods-use-this
    validatePosition(position: Position): Position {
        return position;
    }
}
