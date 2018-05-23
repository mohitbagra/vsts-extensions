import { BugBashItemActionsHub } from "BugBashPro/Actions/ActionsHub";
import { BugBashFieldNames, UrlActions } from "BugBashPro/Constants";
import { getBugBashUrl } from "BugBashPro/Helpers";
import { IBugBashItem, IBugBashItemComment } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { BugBash } from "BugBashPro/ViewModels/BugBash";
import { TeamFieldActions } from "Common/Flux/Actions/TeamFieldActions";
import { WorkItemActions } from "Common/Flux/Actions/WorkItemActions";
import { WorkItemTemplateItemActions } from "Common/Flux/Actions/WorkItemTemplateItemActions";
import { defaultDateComparer } from "Common/Utilities/Date";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { isGuid } from "Common/Utilities/Guid";
import { getCurrentUser, parseUniquefiedIdentityName } from "Common/Utilities/Identity";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { WorkItem, WorkItemTemplate } from "TFS/WorkItemTracking/Contracts";

export namespace BugBashItemDataService {
    export async function loadBugBashItems(bugBashId: string): Promise<IBugBashItem[]> {
        let bugBashItemModels = await ExtensionDataManager.readDocuments<IBugBashItem>(getCollectionKey(bugBashId), false);

        const workItemIdsToLoad: number[] = [];
        for (const bugBashItemModel of bugBashItemModels) {
            preProcessModel(bugBashItemModel);
            if (bugBashItemModel.workItemId) {
                workItemIdsToLoad.push(bugBashItemModel.workItemId);
            }
        }
        await WorkItemActions.refreshWorkItems(workItemIdsToLoad);
        const workItems = StoresHub.workItemStore.getItems(workItemIdsToLoad).filter(w => w.rev > 0);
        const workItemsMap: IDictionaryNumberTo<boolean> = {};
        workItems.forEach(w => {
            workItemsMap[w.id] = true;
        });
        bugBashItemModels = bugBashItemModels.filter(b => !b.workItemId || (b.workItemId && workItemsMap[b.workItemId]));

        return bugBashItemModels;
    }

    export async function loadBugBashItem(bugBashId: string, bugBashItemId: string): Promise<IBugBashItem> {
        const bugBashItemModel = await ExtensionDataManager.readDocument<IBugBashItem>(getCollectionKey(bugBashId), bugBashItemId, null, false);

        if (bugBashItemModel) {
            if (bugBashItemModel.workItemId) {
                await WorkItemActions.refreshWorkItem(bugBashItemModel.workItemId);
            }

            preProcessModel(bugBashItemModel);
            return bugBashItemModel;
        }
        else {
            throw "This instance of bug bash item does not exist.";
        }
    }

    export async function createBugBashItem(bugBashId: string, bugBashItemModel: IBugBashItem, newComment?: string): Promise<IBugBashItem> {
        try {
            const cloneBugBashItemModel = {...bugBashItemModel};
            cloneBugBashItemModel.bugBashId = bugBashId;
            cloneBugBashItemModel.createdBy = getCurrentUser();
            cloneBugBashItemModel.createdDate = new Date(Date.now());
            const bugBash = StoresHub.bugBashStore.getItem(bugBashId);
            let createdBugBashItemModel: IBugBashItem;

            if (bugBash.isAutoAccept) {
                createdBugBashItemModel = await acceptItem(cloneBugBashItemModel, newComment);
            }
            else {
                createdBugBashItemModel = await ExtensionDataManager.createDocument<IBugBashItem>(getCollectionKey(bugBashId), cloneBugBashItemModel, false);
                preProcessModel(createdBugBashItemModel);
            }

            return createdBugBashItemModel;
        }
        catch (e) {
            throw `Cannot create bug bash item. Reason: ${e.message || e}`;
        }
    }

    export async function updateBugBashItem(bugBashId: string, bugBashItemModel: IBugBashItem): Promise<IBugBashItem> {
        try {
            const updatedBugBashItemModel = await ExtensionDataManager.updateDocument<IBugBashItem>(getCollectionKey(bugBashId), bugBashItemModel, false);
            preProcessModel(updatedBugBashItemModel);
            return updatedBugBashItemModel;
        }
        catch {
            throw "This bug bash item has been modified by some one else. Please refresh the item to get the latest version and try updating it again.";
        }
    }

    export async function deleteBugBashItem(bugBashId: string, bugBashItemId: string) {
        try {
            await ExtensionDataManager.deleteDocument(getCollectionKey(bugBashId), bugBashItemId, false);
        }
        catch {
            // eat exception
        }
    }

    export async function acceptItem(bugBashItemModel: IBugBashItem, newComment?: string): Promise<IBugBashItem> {
        let updatedBugBashItemModel: IBugBashItem;
        let savedWorkItem: WorkItem;
        const bugBash = StoresHub.bugBashStore.getItem(bugBashItemModel.bugBashId);
        let acceptTemplate: WorkItemTemplate;

        // read bug bash wit template
        const acceptTemplateId = bugBash.getFieldValue<string>(BugBashFieldNames.AcceptTemplateId, true);
        const acceptTemplateTeam = bugBash.getFieldValue<string>(BugBashFieldNames.AcceptTemplateTeam, true);

        if (acceptTemplateTeam && acceptTemplateId) {
            try {
                await WorkItemTemplateItemActions.initializeWorkItemTemplateItem(acceptTemplateTeam, acceptTemplateId);
                acceptTemplate = StoresHub.workItemTemplateItemStore.getItem(acceptTemplateId);
            }
            catch (e) {
                throw `Bug bash template '${acceptTemplateId}' does not exist in team '${acceptTemplateTeam}'`;
            }
        }

        try {
            await TeamFieldActions.initializeTeamFields(bugBashItemModel.teamId);
        }
        catch (e) {
            throw `Cannot read team field value for team: ${bugBashItemModel.teamId}.`;
        }

        if (bugBashItemModel.__etag) {
            // first do a empty save to check if its the latest version of the item
            updatedBugBashItemModel = await updateBugBashItem(bugBashItemModel.bugBashId, bugBashItemModel);
        }
        else {
            updatedBugBashItemModel = {...bugBashItemModel}; // For auto accept scenario
        }

        const itemDescriptionField = bugBash.getFieldValue<string>(BugBashFieldNames.ItemDescriptionField, true);
        const workItemType = bugBash.getFieldValue<string>(BugBashFieldNames.WorkItemType, true);
        const teamFieldValue = StoresHub.teamFieldStore.getItem(updatedBugBashItemModel.teamId);

        const fieldValues = acceptTemplate ? {...acceptTemplate.fields} : {};
        fieldValues["System.Title"] = updatedBugBashItemModel.title;
        fieldValues[itemDescriptionField] = updatedBugBashItemModel.description;
        fieldValues[teamFieldValue.field.referenceName] = teamFieldValue.defaultValue;

        if (fieldValues["System.Tags-Add"]) {
            fieldValues["System.Tags"] = fieldValues["System.Tags-Add"];
        }

        delete fieldValues["System.Tags-Add"];
        delete fieldValues["System.Tags-Remove"];

        try {
            // create work item
            savedWorkItem = await WorkItemActions.createWorkItem(workItemType, fieldValues);
        }
        catch (e) {
            BugBashItemActionsHub.UpdateBugBashItem.invoke(updatedBugBashItemModel);
            throw e;
        }

        // associate work item with bug bash item
        updatedBugBashItemModel.workItemId = savedWorkItem.id;
        updatedBugBashItemModel.title = "";
        updatedBugBashItemModel.description = "";
        updatedBugBashItemModel.teamId = "";
        updatedBugBashItemModel.rejected = false;
        updatedBugBashItemModel.rejectedBy = null;
        updatedBugBashItemModel.rejectReason = "";

        if (updatedBugBashItemModel.__etag) {
            updatedBugBashItemModel = await ExtensionDataManager.updateDocument(getCollectionKey(updatedBugBashItemModel.bugBashId), updatedBugBashItemModel, false);
        }
        else {
            updatedBugBashItemModel = await ExtensionDataManager.createDocument(getCollectionKey(updatedBugBashItemModel.bugBashId), updatedBugBashItemModel, false);
        }
        preProcessModel(updatedBugBashItemModel);

        addCommentToWorkitem(savedWorkItem.id, updatedBugBashItemModel, newComment);

        return updatedBugBashItemModel;
    }

    function addCommentToWorkitem(workItemId: number, bugBashItemModel: IBugBashItem, newComment?: string) {
        const fieldValues: IDictionaryStringTo<string> = {};
        const bugBash = StoresHub.bugBashStore.getItem(bugBashItemModel.bugBashId);

        fieldValues["System.History"] = newComment || getAcceptedItemComment(bugBash, bugBashItemModel);

        WorkItemActions.updateWorkItem(workItemId, fieldValues);
    }

    function getAcceptedItemComment(bugBash: BugBash, bugBashItemModel: IBugBashItem): string {
        const entity = bugBashItemModel.createdBy;
        const bugBashTitle = bugBash.getFieldValue<string>(BugBashFieldNames.Title, true);

        let commentToSave = `Created from <a href='${getBugBashUrl(bugBash.id, UrlActions.ACTION_RESULTS)}' target='_blank'>${bugBashTitle}</a> bug bash`;

        if (!stringEquals(VSS.getWebContext().user.uniqueName, entity.uniqueName, true)) {
            if (entity.id) {
                commentToSave =
                    `${commentToSave} on behalf of <a href='#' data-vss-mention='version:2.0,${entity.id}'>@${entity.displayName}</a>`;
            }
        }

        let discussionComments = StoresHub.bugBashItemCommentStore.getItem(bugBashItemModel.id);

        if (discussionComments && discussionComments.length > 0) {
            discussionComments = discussionComments.slice();
            discussionComments = discussionComments.sort((c1: IBugBashItemComment, c2: IBugBashItemComment) => defaultDateComparer(c1.createdDate, c2.createdDate));

            commentToSave += "<div style='margin: 15px 0;font-size: 15px; font-weight: bold; text-decoration: underline;'>Discussions :</div>";

            for (const comment of discussionComments) {
                commentToSave += `
                    <div style='border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px;'>
                        <div><span style='font-size: 13px; font-weight: bold;'>${comment.createdBy.displayName}</span> wrote:</div>
                        <div>${comment.content}</div>
                    </div>
                `;
            }
        }

        return commentToSave;
    }

    function getCollectionKey(bugBashId: string): string {
        return isGuid(bugBashId) ? `Items_${bugBashId}` : `BugBashCollection_${bugBashId}`;
    }

    function preProcessModel(bugBashItem: IBugBashItem) {
        if (typeof bugBashItem.createdDate === "string") {
            if (isNullOrWhiteSpace(bugBashItem.createdDate as string)) {
                bugBashItem.createdDate = undefined;
            }
            else {
                bugBashItem.createdDate = new Date(bugBashItem.createdDate);
            }
        }

        // back-compat -  If created by is uniquefied string, parse it into identityref object
        if (typeof bugBashItem.rejectedBy === "string") {
            if (isNullOrWhiteSpace(bugBashItem.rejectedBy as string)) {
                bugBashItem.rejectedBy = null;
            }
            else {
                bugBashItem.rejectedBy = parseUniquefiedIdentityName(bugBashItem.rejectedBy);
            }
        }
        if (typeof bugBashItem.createdBy === "string") {
            if (isNullOrWhiteSpace(bugBashItem.createdBy as string)) {
                bugBashItem.createdBy = null;
            }
            else {
                bugBashItem.createdBy = parseUniquefiedIdentityName(bugBashItem.createdBy);
            }
        }

        bugBashItem.teamId = bugBashItem.teamId || "";
    }
}
