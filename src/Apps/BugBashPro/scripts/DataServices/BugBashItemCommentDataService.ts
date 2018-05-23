import { IBugBashItemComment } from "BugBashPro/Interfaces";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { isGuid } from "Common/Utilities/Guid";
import { getCurrentUser, parseUniquefiedIdentityName } from "Common/Utilities/Identity";
import { isNullOrWhiteSpace } from "Common/Utilities/String";

export namespace BugBashItemCommentDataService {
    export async function loadComments(bugBashItemId: string): Promise<IBugBashItemComment[]> {
        const comments = await ExtensionDataManager.readDocuments<IBugBashItemComment>(getCollectionKey(bugBashItemId), false);
        for (const comment of comments) {
            preProcessModel(comment);
        }

        return comments;
    }

    export async function createComment(bugBashItemId: string, commentString: string): Promise<IBugBashItemComment> {
        try {
            const bugBashItemComment: IBugBashItemComment = {
                createdBy: getCurrentUser(),
                createdDate: new Date(Date.now()),
                content: commentString
            };

            const savedComment = await ExtensionDataManager.createDocument<IBugBashItemComment>(getCollectionKey(bugBashItemId), bugBashItemComment, false);
            preProcessModel(savedComment);

            return savedComment;
        }
        catch (e) {
            throw `Cannot create comment. Reason: ${e.message}`;
        }
    }

    function getCollectionKey(bugBashItemId: string): string {
        return isGuid(bugBashItemId) ? `Comments_${bugBashItemId}` : `BugBashItemCollection_${bugBashItemId}`;
    }

    function preProcessModel(bugBashItemComment: IBugBashItemComment) {
        if (typeof bugBashItemComment.createdDate === "string") {
            if (isNullOrWhiteSpace(bugBashItemComment.createdDate as string)) {
                bugBashItemComment.createdDate = undefined;
            }
            else {
                bugBashItemComment.createdDate = new Date(bugBashItemComment.createdDate);
            }
        }

        // back-compat -  If created by is uniquefied string, parse it into identityref object
        if (typeof bugBashItemComment.createdBy === "string") {
            bugBashItemComment.createdBy = parseUniquefiedIdentityName(bugBashItemComment.createdBy);
        }
    }
}
