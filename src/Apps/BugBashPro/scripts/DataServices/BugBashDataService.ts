import { IBugBash } from "BugBashPro/Interfaces";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";

export namespace BugBashDataService {
    export async function loadBugBashes(): Promise<IBugBash[]> {
        let bugBashModels = await ExtensionDataManager.readDocuments<IBugBash>(getCollectionKey(), false);
        bugBashModels = bugBashModels.filter(b => stringEquals(VSS.getWebContext().project.id, b.projectId, true));

        for (const bugBashModel of bugBashModels) {
            preProcessModel(bugBashModel);
        }

        return bugBashModels;
    }

    export async function loadBugBash(bugBashId: string): Promise<IBugBash> {
        const bugBashModel = await ExtensionDataManager.readDocument<IBugBash>(getCollectionKey(), bugBashId, null, false);

        if (bugBashModel) {
            preProcessModel(bugBashModel);
        }

        return bugBashModel;
    }

    export async function createBugBash(bugBashModel: IBugBash): Promise<IBugBash> {
        try {
            const updatedBugBashModel = await ExtensionDataManager.createDocument<IBugBash>(getCollectionKey(), bugBashModel, false);
            preProcessModel(updatedBugBashModel);

            return updatedBugBashModel;
        }
        catch (e) {
            throw `Cannot create bug bash. Reason: ${e.message}`;
        }
    }

    export async function updateBugBash(bugBashModel: IBugBash): Promise<IBugBash> {
        try {
            const updatedBugBashModel = await ExtensionDataManager.updateDocument<IBugBash>(getCollectionKey(), bugBashModel, false);
            preProcessModel(updatedBugBashModel);

            return updatedBugBashModel;
        }
        catch {
            throw "This bug bash instance has been modified by some one else. Please refresh the instance to get the latest version and try updating it again.";
        }
    }

    export async function deleteBugBash(bugBashId: string) {
        try {
            await ExtensionDataManager.deleteDocument(getCollectionKey(), bugBashId, false);
        }
        catch {
            // eat exception
        }
    }

    function getCollectionKey(): string {
        return "bugbashes";
    }

    function preProcessModel(bugBashModel: IBugBash) {
        if (typeof bugBashModel.startTime === "string") {
            if (isNullOrWhiteSpace(bugBashModel.startTime as string)) {
                bugBashModel.startTime = undefined;
            }
            else {
                bugBashModel.startTime = new Date(bugBashModel.startTime);
            }
        }
        if (typeof bugBashModel.endTime === "string") {
            if (isNullOrWhiteSpace(bugBashModel.endTime as string)) {
                bugBashModel.endTime = undefined;
            }
            else {
                bugBashModel.endTime = new Date(bugBashModel.endTime);
            }
        }

        // convert old format of accept template to new one
        if (bugBashModel["acceptTemplate"] != null) {
            bugBashModel.acceptTemplateId = bugBashModel["acceptTemplate"].templateId;
            bugBashModel.acceptTemplateTeam = bugBashModel["acceptTemplate"].team;

            delete bugBashModel["acceptTemplate"];
        }

        if (bugBashModel["description"] != null) {
            delete bugBashModel["description"];
        }
    }
}
