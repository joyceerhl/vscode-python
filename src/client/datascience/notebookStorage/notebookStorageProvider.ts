// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { EventEmitter, Uri } from 'vscode';
import { CancellationToken } from 'vscode-jsonrpc';
import { IDisposable, IDisposableRegistry } from '../../common/types';
import { generateNewNotebookUri } from '../common';
import { INotebookModel, INotebookStorage } from '../types';
import { getNextUntitledCounter } from './nativeEditorStorage';
import { VSCodeNotebookModel } from './vscNotebookModel';

// tslint:disable-next-line:no-require-imports no-var-requires

export const INotebookStorageProvider = Symbol.for('INotebookStorageProvider');
export interface INotebookStorageProvider extends INotebookStorage {
    createNew(contents?: string, forVSCodeNotebook?: boolean): Promise<INotebookModel>;
}
@injectable()
export class NotebookStorageProvider implements INotebookStorageProvider {
    public get onSavedAs() {
        return this._savedAs.event;
    }
    private static untitledCounter = 1;
    private readonly _savedAs = new EventEmitter<{ new: Uri; old: Uri }>();
    private readonly storageAndModels = new Map<string, Promise<INotebookModel>>();
    private models = new Set<INotebookModel>();
    private readonly disposables: IDisposable[] = [];
    constructor(
        @inject(INotebookStorage) private readonly storage: INotebookStorage,
        @inject(IDisposableRegistry) disposables: IDisposableRegistry
    ) {
        disposables.push(this);
    }
    public async save(model: INotebookModel, cancellation: CancellationToken) {
        await this.storage.save(model, cancellation);
    }
    public async saveAs(model: INotebookModel, targetResource: Uri) {
        const oldUri = model.file;
        await this.storage.saveAs(model, targetResource);
        if (model instanceof VSCodeNotebookModel) {
            return;
        }
        this.trackModel(model);
        this.storageAndModels.delete(oldUri.toString());
        this.storageAndModels.set(targetResource.toString(), Promise.resolve(model));
    }
    public generateBackupId(model: INotebookModel): string {
        return this.storage.generateBackupId(model);
    }
    public backup(model: INotebookModel, cancellation: CancellationToken, backupId?: string) {
        return this.storage.backup(model, cancellation, backupId);
    }
    public revert(model: INotebookModel, cancellation: CancellationToken) {
        return this.storage.revert(model, cancellation);
    }
    public deleteBackup(model: INotebookModel, backupId?: string) {
        return this.storage.deleteBackup(model, backupId);
    }
    public getOrCreateModel(
        file: Uri,
        contents?: string,
        backupId?: string,
        forVSCodeNotebook?: boolean
    ): Promise<INotebookModel>;
    public getOrCreateModel(
        file: Uri,
        contents?: string,
        // tslint:disable-next-line: unified-signatures
        skipDirtyContents?: boolean,
        forVSCodeNotebook?: boolean
    ): Promise<INotebookModel>;

    public getOrCreateModel(
        file: Uri,
        contents?: string,
        // tslint:disable-next-line: no-any
        options?: any,
        forVSCodeNotebook?: boolean
    ): Promise<INotebookModel> {
        const key = file.toString();
        if (!this.storageAndModels.has(key)) {
            // Every time we load a new untitled file, up the counter past the max value for this counter
            NotebookStorageProvider.untitledCounter = getNextUntitledCounter(
                file,
                NotebookStorageProvider.untitledCounter
            );
            const promise = this.storage.getOrCreateModel(file, contents, options, forVSCodeNotebook);
            this.storageAndModels.set(key, promise.then(this.trackModel.bind(this)));
        }
        return this.storageAndModels.get(key)!;
    }
    public dispose() {
        while (this.disposables.length) {
            this.disposables.shift()?.dispose(); // NOSONAR
        }
    }

    public async createNew(contents?: string, forVSCodeNotebooks?: boolean): Promise<INotebookModel> {
        // Create a new URI for the dummy file using our root workspace path
        const uri = this.getNextNewNotebookUri(forVSCodeNotebooks);

        // Always skip loading from the hot exit file. When creating a new file we want a new file.
        return this.getOrCreateModel(uri, contents, true);
    }

    private getNextNewNotebookUri(forVSCodeNotebooks?: boolean): Uri {
        return generateNewNotebookUri(NotebookStorageProvider.untitledCounter, undefined, forVSCodeNotebooks);
    }

    private trackModel(model: INotebookModel): INotebookModel {
        this.disposables.push(model);
        this.models.add(model);
        // When a model is no longer used, ensure we remove it from the cache.
        model.onDidDispose(
            () => {
                this.models.delete(model);
                this.storageAndModels.delete(model.file.toString());
            },
            this,
            this.disposables
        );
        return model;
    }
}
