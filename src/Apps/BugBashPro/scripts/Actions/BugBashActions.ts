import { BugBashActionsHub } from "BugBashPro/Actions/ActionsHub";
import { ErrorKeys, UrlActions } from "BugBashPro/Constants";
import { BugBashDataService } from "BugBashPro/DataServices/BugBashDataService";
import { IBugBash, ISortState } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { ErrorMessageActions } from "Common/Flux/Actions/ErrorMessageActions";
import { navigate } from "Common/Utilities/Navigation";
import { stringEquals } from "Common/Utilities/String";
import { IFilterState } from "VSSUI/Utilities/Filter";

export namespace BugBashActions {
    export function fireStoreChange() {
        BugBashActionsHub.FireStoreChange.invoke(null);
    }

    export function applyFilter(filterState: IFilterState) {
        BugBashActionsHub.ApplyFilter.invoke(filterState);
    }

    export function clearSortAndFilter() {
        BugBashActionsHub.ClearSortAndFilter.invoke(null);
    }

    export function applySort(sortState: ISortState) {
        BugBashActionsHub.ApplySort.invoke(sortState);
    }

    export function clean() {
        BugBashActionsHub.Clean.invoke(null);
    }

    export function initializeAllBugBashes() {
        if (StoresHub.bugBashStore.isLoaded()) {
            BugBashActionsHub.InitializeAllBugBashes.invoke(null);
        }
        else {
            refreshAllBugBashes(false);
        }
    }

    export async function refreshAllBugBashes(clearError: boolean = true) {
        if (!StoresHub.bugBashStore.isLoading()) {
            StoresHub.bugBashStore.setLoading(true);
            const bugBashModels = await BugBashDataService.loadBugBashes();
            BugBashActionsHub.InitializeAllBugBashes.invoke(bugBashModels);
            StoresHub.bugBashStore.setLoading(false);

            if (clearError) {
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.DirectoryPageError);
            }
        }
    }

    export function initializeBugBash(bugBashId: string) {
        if (StoresHub.bugBashStore.isLoaded(bugBashId)) {
            BugBashActionsHub.InitializeBugBash.invoke(null);
        }
        else {
            refreshBugBash(bugBashId, false);
        }
    }

    export async function refreshBugBash(bugBashId: string, removeUnknownBugBash: boolean = true) {
        if (!StoresHub.bugBashStore.isLoading(bugBashId)) {
            let error = false;
            StoresHub.bugBashStore.setLoading(true, bugBashId);
            const bugBashModel = await BugBashDataService.loadBugBash(bugBashId);

            if (bugBashModel && stringEquals(VSS.getWebContext().project.id, bugBashModel.projectId, true)) {
                BugBashActionsHub.InitializeBugBash.invoke(bugBashModel);
                StoresHub.bugBashStore.setLoading(false, bugBashId);

                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashError);
            }
            else if (bugBashModel && !stringEquals(VSS.getWebContext().project.id, bugBashModel.projectId, true)) {
                StoresHub.bugBashStore.setLoading(false, bugBashId);
                ErrorMessageActions.showErrorMessage(`Bug Bash "${bugBashId}" is out of scope of current project.`, ErrorKeys.DirectoryPageError);
                error = true;
            }
            else {
                if (removeUnknownBugBash) {
                    BugBashActionsHub.DeleteBugBash.invoke(bugBashId);
                }

                StoresHub.bugBashStore.setLoading(false, bugBashId);
                ErrorMessageActions.showErrorMessage(`Bug Bash "${bugBashId}" does not exist.`, ErrorKeys.DirectoryPageError);
                error = true;
            }

            if (error) {
                navigate({ view: UrlActions.ACTION_ALL }, true);
            }
        }
    }

    export async function updateBugBash(bugBashModel: IBugBash) {
        if (!StoresHub.bugBashStore.isLoading(bugBashModel.id)) {
            StoresHub.bugBashStore.setLoading(true, bugBashModel.id);

            try {
                const updatedBugBashModel = await BugBashDataService.updateBugBash(bugBashModel);
                BugBashActionsHub.UpdateBugBash.invoke(updatedBugBashModel);
                StoresHub.bugBashStore.setLoading(false, bugBashModel.id);

                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashError);
            }
            catch (e) {
                StoresHub.bugBashStore.setLoading(false, bugBashModel.id);
                ErrorMessageActions.showErrorMessage(e, ErrorKeys.DirectoryPageError);
            }
        }
    }

    export async function createBugBash(bugBashModel: IBugBash) {
        if (!StoresHub.bugBashStore.isLoading()) {
            StoresHub.bugBashStore.setLoading(true);

            try {
                const createdBugBashModel = await BugBashDataService.createBugBash(bugBashModel);

                BugBashActionsHub.CreateBugBash.invoke(createdBugBashModel);
                StoresHub.bugBashStore.setLoading(false);

                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashError);

                navigate({ view: UrlActions.ACTION_EDIT, id: createdBugBashModel.id }, true);
            }
            catch (e) {
                StoresHub.bugBashStore.setLoading(false);
                ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashError);
            }
        }
    }

    export async function deleteBugBash(bugBashId: string) {
        if (!StoresHub.bugBashStore.isLoading(bugBashId)) {
            StoresHub.bugBashStore.setLoading(true, bugBashId);

            await BugBashDataService.deleteBugBash(bugBashId);

            BugBashActionsHub.DeleteBugBash.invoke(bugBashId);
            StoresHub.bugBashStore.setLoading(false, bugBashId);
        }
    }
}
