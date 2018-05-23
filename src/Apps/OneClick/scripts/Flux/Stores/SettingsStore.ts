import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { stringEquals } from "Common/Utilities/String";
import { SettingKey } from "OneClick/Constants";
import { SettingsActionsHub } from "OneClick/Flux/Actions/ActionsHub";

export class SettingsStore extends BaseStore<IDictionaryStringTo<any>, any, string> {
    private _workItemTypeName: string;

    constructor() {
        super();
        this.items = {};
    }

    public getItem<T>(key: SettingKey): T {
        return this.items[key.toLowerCase()] as T;
    }

    public getKey(): string {
        return "SettingsStore";
    }

    public setCurrentWorkItemType(workItemTypeName: string) {
        this._workItemTypeName = workItemTypeName;
    }

    public checkCurrentWorkItemType(workItemTypeName: string): boolean {
        return stringEquals(this._workItemTypeName, workItemTypeName, true);
    }

    public clear() {
        this.items = {};
    }

    protected initializeActionListeners() {
        SettingsActionsHub.InitializeSetting.addListener((data: {key: SettingKey, value: any}) => {
            if (data) {
                this.items[data.key.toLowerCase()] = data.value;
            }

            this.emitChanged();
        });

        SettingsActionsHub.UpdateSetting.addListener((data: {key: SettingKey, value: any}) => {
            if (data) {
                this.items[data.key.toLowerCase()] = data.value;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: SettingKey): string {
        return key;
    }
}
