import { SettingsActionsHub } from "BugBashPro/Actions/ActionsHub";
import { IBugBashSettings } from "BugBashPro/Interfaces";
import { BaseStore } from "Common/Flux/Stores/BaseStore";

export class BugBashSettingsStore extends BaseStore<IBugBashSettings, IBugBashSettings, void> {
    public getItem(_id: void): IBugBashSettings {
         return this.items;
    }

    public getKey(): string {
        return "BugBashSettingsStore";
    }

    protected convertItemKeyToString(_key: void): string {
        return null;
    }

    protected initializeActionListeners() {
        SettingsActionsHub.InitializeBugBashSettings.addListener((settings: IBugBashSettings) => {
            if (settings) {
                this.items = settings;
            }

            this.emitChanged();
        });

        SettingsActionsHub.UpdateBugBashSettings.addListener((settings: IBugBashSettings) => {
            if (settings) {
                this.items = settings;
            }

            this.emitChanged();
        });
    }
}
