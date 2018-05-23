import { RulesDataService } from "OneClick/DataServices/RulesDataService";
import { SettingsDataService } from "OneClick/DataServices/SettingsDataService";
import { RuleActionsHub } from "OneClick/Flux/Actions/ActionsHub";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { IRule } from "OneClick/Interfaces";

export namespace RuleActions {
    export async function initializeRules(ruleGroupId: string) {
        if (StoresHub.ruleStore.isLoaded(ruleGroupId)) {
            RuleActionsHub.InitializeRules.invoke(null);
        }
        else if (!StoresHub.ruleStore.isLoading(ruleGroupId)) {
            StoresHub.ruleStore.setLoading(true, ruleGroupId);
            const rules = await RulesDataService.loadRulesForGroup(ruleGroupId, VSS.getWebContext().project.id);

            RuleActionsHub.InitializeRules.invoke({ruleGroupId: ruleGroupId, rules: rules});
            StoresHub.ruleStore.setLoading(false, ruleGroupId);
        }
    }

    export async function refreshRules(ruleGroupId: string) {
        if (!StoresHub.ruleStore.isLoading(ruleGroupId)) {
            StoresHub.ruleStore.setLoading(true, ruleGroupId);
            const rules = await RulesDataService.loadRulesForGroup(ruleGroupId, VSS.getWebContext().project.id);

            RuleActionsHub.RefreshRules.invoke({ruleGroupId: ruleGroupId, rules: rules});
            StoresHub.ruleStore.setLoading(false, ruleGroupId);
        }
    }

    export async function createRule(ruleGroupId: string, rule: IRule) {
        if (!StoresHub.ruleStore.isLoading(ruleGroupId)) {
            const createdRule = await RulesDataService.createRule(ruleGroupId, rule);
            RuleActionsHub.CreateRule.invoke({ruleGroupId: ruleGroupId, rule: createdRule});

            SettingsDataService.updateCacheStamp(rule.workItemType, rule.projectId);
        }
    }

    export async function updateRule(ruleGroupId: string, rule: IRule) {
        if (!StoresHub.ruleStore.isLoading(rule.id)) {
            StoresHub.ruleStore.setLoading(true, rule.id);
            try {
                const updatedRule = await RulesDataService.updateRule(ruleGroupId, rule);

                RuleActionsHub.UpdateRule.invoke({ruleGroupId: ruleGroupId, rule: updatedRule});
                StoresHub.ruleStore.setLoading(false, rule.id);

                SettingsDataService.updateCacheStamp(rule.workItemType, rule.projectId);
            }
            catch (e) {
                StoresHub.ruleStore.setLoading(false, rule.id);
                throw e;
            }
        }
    }

    export async function deleteRule(ruleGroupId: string, rule: IRule) {
        if (!StoresHub.ruleStore.isLoading(rule.id)) {
            await RulesDataService.deleteRule(ruleGroupId, rule.id);
            RuleActionsHub.DeleteRule.invoke({ruleGroupId: ruleGroupId, rule: rule});

            SettingsDataService.updateCacheStamp(rule.workItemType, rule.projectId);
        }
    }
}
