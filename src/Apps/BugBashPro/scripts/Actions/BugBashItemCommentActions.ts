import { BugBashItemCommentActionsHub } from "BugBashPro/Actions/ActionsHub";
import {
    BugBashItemCommentDataService
} from "BugBashPro/DataServices/BugBashItemCommentDataService";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { isNullOrWhiteSpace } from "Common/Utilities/String";

export namespace BugBashItemCommentActions {
    export function clean() {
        BugBashItemCommentActionsHub.Clean.invoke(null);
    }

    export function initializeComments(bugBashItemId: string) {
        if (StoresHub.bugBashItemCommentStore.isLoaded(bugBashItemId)) {
            BugBashItemCommentActionsHub.InitializeComments.invoke(null);
        }
        else {
            refreshComments(bugBashItemId);
        }
    }

    export async function refreshComments(bugBashItemId: string) {
        if (!StoresHub.bugBashItemCommentStore.isLoading(bugBashItemId)) {
            StoresHub.bugBashItemCommentStore.setLoading(true, bugBashItemId);

            const comments = await BugBashItemCommentDataService.loadComments(bugBashItemId);

            BugBashItemCommentActionsHub.InitializeComments.invoke({bugBashItemId: bugBashItemId, comments: comments});
            StoresHub.bugBashItemCommentStore.setLoading(false, bugBashItemId);
        }
    }

    export async function createComment(bugBashItemId: string, commentString: string) {
        if (isNullOrWhiteSpace(commentString)) {
            return;
        }

        if (!StoresHub.bugBashItemCommentStore.isLoading(bugBashItemId)) {
            StoresHub.bugBashItemCommentStore.setLoading(true, bugBashItemId);

            try {
                const savedComment = await BugBashItemCommentDataService.createComment(bugBashItemId, commentString);

                BugBashItemCommentActionsHub.CreateComment.invoke({bugBashItemId: bugBashItemId, comment: savedComment});
                StoresHub.bugBashItemCommentStore.setLoading(false, bugBashItemId);
            }
            catch (e) {
                StoresHub.bugBashItemCommentStore.setLoading(false, bugBashItemId);
                throw e;
            }
        }
    }
}
