import { ErrorMessageActionsHub } from "Common/Flux/Actions/ActionsHub";
import { BaseStore } from "Common/Flux/Stores/BaseStore";

export class ErrorMessageStore extends BaseStore<IDictionaryStringTo<string>, string, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getKey(): string {
        return "ErrorMessageStore";
    }

    public getItem(key: string): string {
        return this.items[key];
    }

    protected initializeActionListeners() {
        ErrorMessageActionsHub.PushErrorMessage.addListener((error: {errorMessage: string, errorKey: string}) => {
            this.items[error.errorKey] = error.errorMessage;
            this.emitChanged();
        });

        ErrorMessageActionsHub.DismissErrorMessage.addListener((errorKey: string) => {
            delete this.items[errorKey];
            this.emitChanged();
        });

        ErrorMessageActionsHub.DismissAllErrorMessages.addListener(() => {
            this.items = {};
            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
