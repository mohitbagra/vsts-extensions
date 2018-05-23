import { LongTextActionsHub } from "BugBashPro/Actions/ActionsHub";
import { ILongText } from "BugBashPro/Interfaces";
import { LongText } from "BugBashPro/ViewModels/LongText";
import { BaseStore } from "Common/Flux/Stores/BaseStore";

export class LongTextStore extends BaseStore<IDictionaryStringTo<LongText>, LongText, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(id: string): LongText {
        if (id) {
            return this.items[id.toLowerCase()];
        }
        return null;
    }

    public getKey(): string {
        return "LongTextStore";
    }

    protected initializeActionListeners() {
        LongTextActionsHub.FireStoreChange.addListener(() => {
            this.emitChanged();
        });

        LongTextActionsHub.Clean.addListener(() => {
            this.items = {};
            this.emitChanged();
        });

        LongTextActionsHub.AddOrUpdateLongText.addListener((longTextModel: ILongText) => {
            if (longTextModel) {
                this.items[longTextModel.id.toLowerCase()] = new LongText(longTextModel);
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
       return key;
    }
}
