import { BugBashClientActionsHub, BugBashItemActionsHub } from "BugBashPro/Actions/ActionsHub";
import { BugBashItemCommentActions } from "BugBashPro/Actions/BugBashItemCommentActions";
import { BugBashFieldNames, ErrorKeys } from "BugBashPro/Constants";
import { BugBashItemDataService } from "BugBashPro/DataServices/BugBashItemDataService";
import { IBugBashItem, ISortState } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { ErrorMessageActions } from "Common/Flux/Actions/ErrorMessageActions";
import { isNullOrWhiteSpace } from "Common/Utilities/String";
import { IFilterState } from "VSSUI/Utilities/Filter";

export namespace BugBashItemActions {
    export function fireStoreChange() {
        BugBashItemActionsHub.FireStoreChange.invoke(null);
    }

    export function applyFilter(filterState: IFilterState) {
        BugBashItemActionsHub.ApplyFilter.invoke(filterState);
    }

    export function clearSortAndFilter() {
        BugBashItemActionsHub.ClearSortAndFilter.invoke(null);
    }

    export function applySort(sortState: ISortState) {
        BugBashItemActionsHub.ApplySort.invoke(sortState);
    }

    export function clean() {
        BugBashItemActionsHub.Clean.invoke(null);
    }

    export function initializeItems(bugBashId: string) {
        if (StoresHub.bugBashItemStore.isLoaded()) {
            BugBashItemActionsHub.InitializeBugBashItems.invoke(null);
        }
        else {
            refreshItems(bugBashId, false);
        }
    }

    export async function refreshItems(bugBashId: string, cleanErrorAndComments: boolean = true) {
        if (!StoresHub.bugBashItemStore.isLoading()) {
            if (StoresHub.bugBashStore.itemExists(bugBashId)) {
                const defaultTeam = StoresHub.bugBashStore.getItem(bugBashId).getFieldValue<string>(BugBashFieldNames.DefaultTeam, true);
                StoresHub.bugBashItemStore.setDefaultTeam(defaultTeam);
            }

            StoresHub.bugBashItemStore.setLoading(true);

            const bugBashItemModels = await BugBashItemDataService.loadBugBashItems(bugBashId);

            BugBashItemActionsHub.InitializeBugBashItems.invoke(bugBashItemModels);
            StoresHub.bugBashItemStore.setLoading(false);

            if (cleanErrorAndComments) {
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashItemError);

                // clear all comments
                BugBashItemCommentActions.clean();
            }
        }
    }

    export async function refreshItem(bugBashId: string, bugBashItemId: string) {
        if (!StoresHub.bugBashItemStore.isLoading(bugBashItemId)) {
            StoresHub.bugBashItemStore.setLoading(true, bugBashItemId);

            try {
                const bugBashItemModel = await BugBashItemDataService.loadBugBashItem(bugBashId, bugBashItemId);
                BugBashItemActionsHub.InitializeBugBashItem.invoke(bugBashItemModel);
                StoresHub.bugBashItemStore.setLoading(false, bugBashItemId);

                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashItemError);

                // refresh comments for this bug bash item
                if (bugBashItemModel.workItemId <= 0 || bugBashItemModel.workItemId == null) {
                    BugBashItemCommentActions.refreshComments(bugBashItemId);
                }
            }
            catch (e) {
                StoresHub.bugBashItemStore.setLoading(false, bugBashItemId);
                ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashItemError);
            }
        }
    }

    export async function updateBugBashItem(bugBashId: string, bugBashItemModel: IBugBashItem, newComment?: string) {
        if (!StoresHub.bugBashItemStore.isLoading(bugBashItemModel.id)) {
            StoresHub.bugBashItemStore.setLoading(true, bugBashItemModel.id);

            try {
                const updatedBugBashItemModel = await BugBashItemDataService.updateBugBashItem(bugBashId, bugBashItemModel);
                if (!isNullOrWhiteSpace(newComment)) {
                    BugBashItemCommentActions.createComment(updatedBugBashItemModel.id, newComment);
                }

                BugBashItemActionsHub.UpdateBugBashItem.invoke(updatedBugBashItemModel);
                StoresHub.bugBashItemStore.setLoading(false, bugBashItemModel.id);
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashItemError);
                BugBashClientActionsHub.SelectedBugBashItemChanged.invoke(updatedBugBashItemModel.id);
            }
            catch (e) {
                StoresHub.bugBashItemStore.setLoading(false, bugBashItemModel.id);
                ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashItemError);
            }
        }
    }

    export async function createBugBashItem(bugBashId: string, bugBashItemModel: IBugBashItem, newComment?: string) {
        if (!StoresHub.bugBashItemStore.isLoading()) {
            try {
                const createdBugBashItemModel = await BugBashItemDataService.createBugBashItem(bugBashId, bugBashItemModel, newComment);
                if (!isNullOrWhiteSpace(newComment) && !createdBugBashItemModel.workItemId) {
                    BugBashItemCommentActions.createComment(createdBugBashItemModel.id, newComment);
                }

                BugBashItemActionsHub.CreateBugBashItem.invoke(createdBugBashItemModel);

                BugBashClientActionsHub.SelectedBugBashItemChanged.invoke(createdBugBashItemModel.id);
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashItemError);
            }
            catch (e) {
                ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashItemError);
            }
        }
    }

    export async function deleteBugBashItem(bugBashId: string, bugBashItemId: string) {
        if (!StoresHub.bugBashItemStore.isLoading(bugBashItemId)) {
            StoresHub.bugBashItemStore.setLoading(true, bugBashItemId);

            await BugBashItemDataService.deleteBugBashItem(bugBashId, bugBashItemId);

            BugBashItemActionsHub.DeleteBugBashItem.invoke(bugBashItemId);
            StoresHub.bugBashItemStore.setLoading(false, bugBashItemId);
        }
    }

    export async function acceptBugBashItem(bugBashItemModel: IBugBashItem) {
        if (!StoresHub.bugBashItemStore.isLoading(bugBashItemModel.id)) {
            StoresHub.bugBashItemStore.setLoading(true, bugBashItemModel.id);

            try {
                const acceptedBugBashItemModel = await BugBashItemDataService.acceptItem(bugBashItemModel);

                BugBashItemActionsHub.UpdateBugBashItem.invoke(acceptedBugBashItemModel);
                StoresHub.bugBashItemStore.setLoading(false, bugBashItemModel.id);

                BugBashClientActionsHub.SelectedBugBashItemChanged.invoke(acceptedBugBashItemModel.id);
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashItemError);
            }
            catch (e) {
                StoresHub.bugBashItemStore.setLoading(false, bugBashItemModel.id);
                ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashItemError);
            }
        }
    }
}
