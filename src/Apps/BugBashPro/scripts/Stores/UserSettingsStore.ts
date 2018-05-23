import { SettingsActionsHub } from "BugBashPro/Actions/ActionsHub";
import { IUserSettings } from "BugBashPro/Interfaces";
import { BaseStore } from "Common/Flux/Stores/BaseStore";

export class UserSettingsStore extends BaseStore<IDictionaryStringTo<IUserSettings>, IUserSettings, string> {
    public getItem(id: string): IUserSettings {
        if (!this.items) {
            return null;
        }

        return this.items[(id || "").toLowerCase()];
    }

    public getKey(): string {
        return "UserSettingsStore";
    }

    protected initializeActionListeners() {
        SettingsActionsHub.InitializeUserSettings.addListener((settings: IUserSettings[]) => {
            if (settings) {
                if (!this.items) {
                    this.items = {};
                }
                for (const setting of settings) {
                    this.items[setting.id.toLowerCase()] = setting;
                }
            }

            this.emitChanged();
        });

        SettingsActionsHub.UpdateUserSettings.addListener((settings: IUserSettings) => {
            if (settings) {
                if (!this.items) {
                    this.items = {};
                }
                this.items[settings.id.toLowerCase()] = settings;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
