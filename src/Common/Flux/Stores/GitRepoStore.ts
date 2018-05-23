import { GitRepoActionsHub } from "Common/Flux/Actions/ActionsHub";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { GitRepository } from "TFS/VersionControl/Contracts";

export class GitRepoStore extends BaseStore<GitRepository[], GitRepository, string> {
    private _itemsIdMap: IDictionaryStringTo<GitRepository>;
    private _itemsNameMap: IDictionaryStringTo<GitRepository>;

    constructor() {
        super();
        this._itemsIdMap = {};
        this._itemsNameMap = {};
    }

    public getItem(idOrName: string): GitRepository {
        const key = (idOrName || "").toLowerCase();
        return this._itemsIdMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return "GitRepoStore";
    }

    protected initializeActionListeners() {
        GitRepoActionsHub.InitializeGitRepos.addListener((repos: GitRepository[]) => {
            if (repos) {
                this.items = repos;
                this._itemsIdMap = {};
                this._itemsNameMap = {};

                for (const item of this.items) {
                    this._itemsIdMap[item.id.toLowerCase()] = item;
                    this._itemsNameMap[item.name.toLowerCase()] = item;
                }
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
