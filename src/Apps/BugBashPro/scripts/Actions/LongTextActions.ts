import { LongTextActionsHub } from "BugBashPro/Actions/ActionsHub";
import { ErrorKeys } from "BugBashPro/Constants";
import { LongTextDataService } from "BugBashPro/DataServices/LongTextDataService";
import { ILongText } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { ErrorMessageActions } from "Common/Flux/Actions/ErrorMessageActions";

export namespace LongTextActions {
    export function fireStoreChange() {
        LongTextActionsHub.FireStoreChange.invoke(null);
    }

    export function clean() {
        LongTextActionsHub.Clean.invoke(null);
    }

    export function initializeLongText(id: string) {
        if (StoresHub.longTextStore.isLoaded(id)) {
            LongTextActionsHub.AddOrUpdateLongText.invoke(null);
        }
        else {
            refreshLongText(id, false);
        }
    }

    export async function refreshLongText(id: string, clearError: boolean = true) {
        if (!StoresHub.longTextStore.isLoading(id)) {
            StoresHub.longTextStore.setLoading(true, id);

            const longText = await LongTextDataService.loadLongText(id);

            LongTextActionsHub.AddOrUpdateLongText.invoke(longText);
            StoresHub.longTextStore.setLoading(false, id);

            if (clearError) {
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashDetailsError);
            }
        }
    }

    export async function addOrUpdateLongText(longText: ILongText) {
        if (!StoresHub.longTextStore.isLoading(longText.id)) {
            StoresHub.longTextStore.setLoading(true, longText.id);
            try {
                const savedLongText = await LongTextDataService.addOrUpdateLongText(longText);
                LongTextActionsHub.AddOrUpdateLongText.invoke(savedLongText);
                StoresHub.longTextStore.setLoading(false, longText.id);
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashDetailsError);
            }
            catch (e) {
                StoresHub.longTextStore.setLoading(false, longText.id);
                ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashDetailsError);
            }
        }
    }
}
