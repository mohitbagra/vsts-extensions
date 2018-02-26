import { DelayedFunction } from "Library/Utilities/Core";
import { getCurrentUserName, getDistinctNameFromIdentityRef } from "Library/Utilities/Identity";
import { Constants } from "OneClick/Constants";
import { RuleActionsHub, RuleGroupActionsHub } from "OneClick/Flux/Actions/ActionsHub";
import { IRule } from "OneClick/Interfaces";

const flush = new DelayedFunction(null, 100, () => {
    const insights = getInsights();
    if (insights) {
        insights.flush();
    }
});

export function flushInsightsNow() {
    flush.invokeNow();
}

export function trackEvent(name: string, properties?: IDictionaryStringTo<string>, measurements?: IDictionaryStringTo<number>) {
    const insights = getInsights();
    if (insights) {
        properties = {
            ...(properties || {}),
            host: VSS.getWebContext().host.authority
        };
        insights.trackEvent(name, properties, measurements);
        flush.reset();
    }
}

export function initTelemetry() {
    initRuleGroupTelemetry();
    initRuleTelemetry();
}

/*
* Rule Group actions telemetry
*/
function initRuleGroupTelemetry() {
    RuleGroupActionsHub.CreateRuleGroup.addListener(ruleGroup => {
        if (ruleGroup) {
            trackEvent("CreateRuleGroup", {
                createdBy: getDistinctNameFromIdentityRef(ruleGroup.createdBy),
                disabled: ruleGroup.disabled ? "true" : "false",
                workItemTypeName: ruleGroup.workItemType,
                project: ruleGroup.projectId
            });
        }
    });

    RuleGroupActionsHub.UpdateRuleGroup.addListener(ruleGroup => {
        if (ruleGroup) {
            trackEvent("UpdateRuleGroup", {
                createdBy: getDistinctNameFromIdentityRef(ruleGroup.createdBy),
                updatedBy: getDistinctNameFromIdentityRef(ruleGroup.lastUpdatedBy),
                disabled: ruleGroup.disabled ? "true" : "false",
                workItemTypeName: ruleGroup.workItemType,
                project: ruleGroup.projectId
            });
        }
    });

    RuleGroupActionsHub.DeleteRuleGroup.addListener(ruleGroup => {
        if (ruleGroup) {
            trackEvent("DeleteRuleGroup", {
                deletedBy: getCurrentUserName(),
                workItemTypeName: ruleGroup.workItemType,
                project: ruleGroup.projectId
            });
        }
    });
}

/*
* Rules actions telemetry
*/
function initRuleTelemetry() {
    RuleActionsHub.CreateRule.addListener((data: {ruleGroupId: string, rule: IRule}) => {
        if (data) {
            const rule = data.rule;
            const ruleGroupId = data.ruleGroupId;

            trackEvent("CreateRule", {
                createdBy: getDistinctNameFromIdentityRef(rule.createdBy),
                disabled: rule.disabled ? "true" : "false",
                actionCount: rule.actions.length.toString(),
                actions: rule.actions.map(a => a.name).join("; "),
                triggerCount: rule.triggers.length.toString(),
                triggers: rule.triggers.map(t => t.name).join("; "),
                workItemTypeName: rule.workItemType,
                project: rule.projectId,
                ruleGroupId: ruleGroupId,
                isPersonal: ruleGroupId === Constants.PersonalRuleGroupId ? "true" : "false",
                isGlobal: ruleGroupId === Constants.GlobalRuleGroupId ? "true" : "false"
            });
        }
    });

    RuleActionsHub.UpdateRule.addListener((data: {ruleGroupId: string, rule: IRule}) => {
        if (data) {
            const rule = data.rule;
            const ruleGroupId = data.ruleGroupId;

            trackEvent("UpdateRule", {
                createdBy: getDistinctNameFromIdentityRef(rule.createdBy),
                updatedBy: getDistinctNameFromIdentityRef(rule.lastUpdatedBy),
                disabled: rule.disabled ? "true" : "false",
                actionCount: rule.actions.length.toString(),
                actions: rule.actions.map(a => a.name).join("; "),
                triggerCount: rule.triggers.length.toString(),
                triggers: rule.triggers.map(t => t.name).join("; "),
                workItemTypeName: rule.workItemType,
                project: rule.projectId,
                ruleGroupId: ruleGroupId,
                isPersonal: ruleGroupId === Constants.PersonalRuleGroupId ? "true" : "false",
                isGlobal: ruleGroupId === Constants.GlobalRuleGroupId ? "true" : "false"
            });
        }
    });

    RuleActionsHub.DeleteRule.addListener((data: {ruleGroupId: string, rule: IRule}) => {
        if (data) {
            const rule = data.rule;
            const ruleGroupId = data.ruleGroupId;

            trackEvent("DeleteRule", {
                deletedBy: getCurrentUserName(),
                workItemTypeName: rule.workItemType,
                project: rule.projectId,
                ruleGroupId: ruleGroupId,
                isPersonal: ruleGroupId === Constants.PersonalRuleGroupId ? "true" : "false",
                isGlobal: ruleGroupId === Constants.GlobalRuleGroupId ? "true" : "false"
            });
        }
    });
}

function getInsights() {
    return window["appInsights"];
}
