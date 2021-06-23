import { NotebookDocument, DocumentSelector, TextDocument } from 'vscode';
import { IVSCodeNotebook } from '../../common/application/types';
import { NotebookConcatDocument } from './notebookConcatDocument';

export class InteractiveWindowConcatDocument extends NotebookConcatDocument {
    constructor(
        notebook: NotebookDocument,
        private readonly input: TextDocument,
        notebookApi: IVSCodeNotebook,
        selector: DocumentSelector,
    ) {
        super(notebook, notebookApi, selector);
    }
}
