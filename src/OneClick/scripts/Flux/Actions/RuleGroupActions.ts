import { RuleGroupsDataService } from "OneClick/DataServices/RuleGroupsDataService";
import { SettingsDataService } from "OneClick/DataServices/SettingsDataService";
import { RuleGroupActionsHub } from "OneClick/Flux/Actions/ActionsHub";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { IRuleGroup } from "OneClick/Interfaces";

export namespace RuleGroupActions {
    const store = StoresHub.ruleGroupStore;

    export async function initializeRuleGroups(workItemTypeName: string) {
        if (!store.isLoading(workItemTypeName)) {
            store.setLoading(true, workItemTypeName);

            const ruleGroups = await RuleGroupsDataService.loadRuleGroups(workItemTypeName, VSS.getWebContext().project.id);

            if (store.checkCurrentWorkItemType(workItemTypeName)) {
                RuleGroupActionsHub.InitializeRuleGroups.invoke(ruleGroups);
            }

            store.setLoading(false, workItemTypeName);
        }
    }

    export async function createRuleGroup(workItemTypeName: string, ruleGroup: IRuleGroup) {
        if (!store.isLoading(workItemTypeName)) {
            const createdRuleGroup = await RuleGroupsDataService.createRuleGroup(workItemTypeName, ruleGroup, VSS.getWebContext().project.id);

            if (store.checkCurrentWorkItemType(workItemTypeName)) {
                RuleGroupActionsHub.CreateRuleGroup.invoke(createdRuleGroup);
            }

            SettingsDataService.updateCacheStamp(workItemTypeName, VSS.getWebContext().project.id);
        }
    }

    export async function updateRuleGroup(workItemTypeName: string, ruleGroup: IRuleGroup) {
        if (!store.isLoading(ruleGroup.id)) {
            store.setLoading(true, ruleGroup.id);

            try {
                const updatedRuleGroup = await RuleGroupsDataService.updateRuleGroup(workItemTypeName, ruleGroup, VSS.getWebContext().project.id);

                if (store.checkCurrentWorkItemType(workItemTypeName)) {
                    RuleGroupActionsHub.UpdateRuleGroup.invoke(updatedRuleGroup);
                }
                store.setLoading(false, ruleGroup.id);

                SettingsDataService.updateCacheStamp(workItemTypeName, VSS.getWebContext().project.id);
            }
            catch (e) {
                store.setLoading(false, ruleGroup.id);
                throw e;
            }
        }
    }

    export async function deleteRuleGroup(workItemTypeName: string, ruleGroup: IRuleGroup) {
        if (!store.isLoading(ruleGroup.id)) {
            store.setLoading(true, ruleGroup.id);
            await RuleGroupsDataService.deleteRuleGroup(workItemTypeName, ruleGroup.id, VSS.getWebContext().project.id);

            if (store.checkCurrentWorkItemType(workItemTypeName)) {
                RuleGroupActionsHub.DeleteRuleGroup.invoke(ruleGroup);
            }

            store.setLoading(false, ruleGroup.id);
            SettingsDataService.updateCacheStamp(workItemTypeName, VSS.getWebContext().project.id);
        }
    }
}
