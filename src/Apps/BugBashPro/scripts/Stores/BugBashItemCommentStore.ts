import { BugBashItemCommentActionsHub } from "BugBashPro/Actions/ActionsHub";
import { IBugBashItemComment } from "BugBashPro/Interfaces";
import { BaseStore } from "Common/Flux/Stores/BaseStore";

export class BugBashItemCommentStore extends BaseStore<IDictionaryStringTo<IBugBashItemComment[]>, IBugBashItemComment[], string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(bugBashItemId: string): IBugBashItemComment[] {
         return this.items[(bugBashItemId || "").toLowerCase()] || null;
    }

    public getKey(): string {
        return "BugBashItemCommentStore";
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    protected initializeActionListeners() {
        BugBashItemCommentActionsHub.InitializeComments.addListener((commentItems: {bugBashItemId: string, comments: IBugBashItemComment[]}) => {
            if (commentItems) {
                this.items[commentItems.bugBashItemId.toLowerCase()] = commentItems.comments;
            }

            this.emitChanged();
        });

        BugBashItemCommentActionsHub.CreateComment.addListener((commentItem: {bugBashItemId: string, comment: IBugBashItemComment}) => {
            if (commentItem) {
                if (this.items[commentItem.bugBashItemId.toLowerCase()] == null) {
                    this.items[commentItem.bugBashItemId.toLowerCase()] = [];
                }
                this.items[commentItem.bugBashItemId.toLowerCase()].push(commentItem.comment);
            }

            this.emitChanged();
        });

        BugBashItemCommentActionsHub.Clean.addListener(() => {
            this.items = {};
            this.emitChanged();
        });
    }
}
