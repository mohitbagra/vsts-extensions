import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { getCurrentUser, parseUniquefiedIdentityName } from "Common/Utilities/Identity";
import { hashCode, isNullOrWhiteSpace } from "Common/Utilities/String";
import { IRuleGroup } from "OneClick/Interfaces";

export namespace RuleGroupsDataService {
    export async function loadRuleGroups(workItemTypeName: string, projectId: string): Promise<IRuleGroup[]> {
        return ExtensionDataManager.readDocuments<IRuleGroup>(getCollectionKey(workItemTypeName, projectId), false);
    }

    export async function createRuleGroup(workItemTypeName: string, ruleGroup: IRuleGroup, projectId: string): Promise<IRuleGroup> {
        try {
            const createdRuleGroup = await ExtensionDataManager.createDocument<IRuleGroup>(getCollectionKey(workItemTypeName, projectId), ruleGroup, false);
            preProcessModel(createdRuleGroup);
            return createdRuleGroup;
        }
        catch (e) {
            throw `Cannot create rule group. Reason: ${e.message}`;
        }
    }

    export async function updateRuleGroup(workItemTypeName: string, ruleGroup: IRuleGroup, projectId: string): Promise<IRuleGroup> {
        const ruleGroupToSave = {...ruleGroup};
        ruleGroupToSave.lastUpdatedBy = getCurrentUser();

        try {
            const updatedRuleGroup = await ExtensionDataManager.updateDocument<IRuleGroup>(getCollectionKey(workItemTypeName, projectId), ruleGroupToSave, false);
            preProcessModel(updatedRuleGroup);
            return updatedRuleGroup;
        }
        catch {
            throw "The version of this rule group doesn't match with the version on server. Please refresh the rule group to get the latest version first.";
        }
    }

    export async function deleteRuleGroup(workItemTypeName: string, ruleGroupId: string, projectId: string) {
        try {
            await ExtensionDataManager.deleteDocument(getCollectionKey(workItemTypeName, projectId), ruleGroupId, false);
        }
        catch {
            // eat exception
        }
    }

    export async function deleteRuleGroups(workItemTypeName: string, ruleGroupIds: string[], projectId: string) {
        await Promise.all(ruleGroupIds.map(ruleGroupId => deleteRuleGroup(workItemTypeName, ruleGroupId, projectId)));
    }

    function preProcessModel(ruleGroup: IRuleGroup) {
        if (typeof ruleGroup.createdBy === "string") {
            if (isNullOrWhiteSpace(ruleGroup.createdBy as string)) {
                ruleGroup.createdBy = null;
            }
            else {
                ruleGroup.createdBy = parseUniquefiedIdentityName(ruleGroup.createdBy);
            }
        }

        if (typeof ruleGroup.lastUpdatedBy === "string") {
            if (isNullOrWhiteSpace(ruleGroup.lastUpdatedBy as string)) {
                ruleGroup.lastUpdatedBy = null;
            }
            else {
                ruleGroup.lastUpdatedBy = parseUniquefiedIdentityName(ruleGroup.lastUpdatedBy);
            }
        }
    }

    function getCollectionKey(workItemTypeName: string, projectId: string): string {
        const key = `${projectId}_${workItemTypeName}`.toLowerCase();
        const suffix = hashCode(key).toString();
        return `rg_${suffix}`;
    }
}
