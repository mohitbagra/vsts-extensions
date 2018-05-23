import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { getCurrentUser, parseUniquefiedIdentityName } from "Common/Utilities/Identity";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { Constants } from "OneClick/Constants";
import { IRule } from "OneClick/Interfaces";

export namespace RulesDataService {
    export async function loadRulesForGroup(ruleGroupId: string, projectId: string): Promise<IRule[]> {
        let rules = await ExtensionDataManager.readDocuments<IRule>(getCollectionKey(ruleGroupId), isPrivateRuleGroup(ruleGroupId));
        rules = rules.filter(r => stringEquals(r.projectId, projectId, true));

        for (const rule of rules) {
            preProcessRule(rule);
        }

        return rules;
    }

    export async function loadRulesForGroups(ruleGroupIds: string[], projectId: string): Promise<IRule[]> {
        const collections: ExtensionDataCollection[] = ruleGroupIds.map(ruleGroupId => ({
            collectionName: getCollectionKey(ruleGroupId),
            scopeType: isPrivateRuleGroup(ruleGroupId) ? "User" : "Default",
            scopeValue: isPrivateRuleGroup(ruleGroupId) ? "Me" : "Current"
        }) as ExtensionDataCollection);

        const loadedCollections = await ExtensionDataManager.queryCollections(collections);
        let rules: IRule[] = [];
        for (const coll of loadedCollections) {
            if (coll && coll.documents && coll.documents.length > 0) {
                rules.push(...coll.documents as IRule[]);
            }
        }

        rules = rules.filter(r => stringEquals(r.projectId, projectId, true));

        for (const rule of rules) {
            preProcessRule(rule);
        }

        return rules;
    }

    export async function createRule(ruleGroupId: string, rule: IRule): Promise<IRule> {
        try {
            const createdRule = await ExtensionDataManager.createDocument<IRule>(getCollectionKey(ruleGroupId), rule, isPrivateRuleGroup(ruleGroupId));
            preProcessRule(createdRule);
            return createdRule;
        }
        catch (e) {
            throw `Cannot create rule. Reason: ${e.message}`;
        }
    }

    export async function updateRule(ruleGroupId: string, rule: IRule): Promise<IRule> {
        const ruleToSave = {...rule};
        ruleToSave.lastUpdatedBy = getCurrentUser();

        try {
            const updatedRule = await ExtensionDataManager.updateDocument<IRule>(getCollectionKey(ruleGroupId), rule, isPrivateRuleGroup(ruleGroupId));
            preProcessRule(updatedRule);
            return updatedRule;
        }
        catch {
            throw "The version of this rule doesn't match with the version on server. Please refresh the rule to get the latest version first.";
        }
    }

    export async function deleteRule(ruleGroupId: string, ruleId: string) {
        try {
            await ExtensionDataManager.deleteDocument(getCollectionKey(ruleGroupId), ruleId, isPrivateRuleGroup(ruleGroupId));
        }
        catch {
            // eat exception
        }
    }

    export async function deleteRules(ruleGroupId: string, ruleIds: string[]) {
        await Promise.all(ruleIds.map(ruleId => deleteRule(ruleGroupId, ruleId)));
    }

    function getCollectionKey(ruleGroupId: string): string {
        if (ruleGroupId === Constants.PersonalRuleGroupId || ruleGroupId === Constants.GlobalRuleGroupId) {
            return "witoneclickactions";
        }

        return `r_${ruleGroupId.toLowerCase()}`;
    }

    function isPrivateRuleGroup(ruleGroupId: string) {
        return ruleGroupId === Constants.PersonalRuleGroupId;
    }

    function preProcessRule(rule: IRule) {
        if (!rule.color) {
            rule.color = "#007acc";
        }
        if (rule.hideOnForm == null) {
            rule.hideOnForm = false;
        }
        if (!rule.actions) {
            rule.actions = [];
        }
        if (!rule.triggers) {
            rule.triggers = [];
        }

        if (typeof rule.createdBy === "string") {
            if (isNullOrWhiteSpace(rule.createdBy as string)) {
                rule.createdBy = null;
            }
            else {
                rule.createdBy = parseUniquefiedIdentityName(rule.createdBy);
            }
        }

        if (typeof rule.lastUpdatedBy === "string") {
            if (isNullOrWhiteSpace(rule.lastUpdatedBy as string)) {
                rule.lastUpdatedBy = null;
            }
            else {
                rule.lastUpdatedBy = parseUniquefiedIdentityName(rule.lastUpdatedBy);
            }
        }
    }
}
