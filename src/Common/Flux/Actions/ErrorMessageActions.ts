import { ErrorMessageActionsHub } from "Common/Flux/Actions/ActionsHub";

export namespace ErrorMessageActions {
    export function showErrorMessage(errorMessage: string, errorKey: string) {
        ErrorMessageActionsHub.PushErrorMessage.invoke({ errorMessage: errorMessage, errorKey: errorKey });
    }

    export function dismissErrorMessage(errorKey: string) {
        return ErrorMessageActionsHub.DismissErrorMessage.invoke(errorKey);
    }

    export function dismissAllErrorMessages() {
        return ErrorMessageActionsHub.DismissAllErrorMessages.invoke(null);
    }
}
