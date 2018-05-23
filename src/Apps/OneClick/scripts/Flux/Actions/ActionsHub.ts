import { Action } from "Common/Flux/Actions/Action";
import { SettingKey } from "OneClick/Constants";
import { IRule, IRuleGroup } from "OneClick/Interfaces";

export namespace RuleGroupActionsHub {
    export const InitializeRuleGroups = new Action<IRuleGroup[]>();
    export const RefreshRuleGroups = new Action<IRuleGroup[]>();
    export const UpdateRuleGroup = new Action<IRuleGroup>();
    export const CreateRuleGroup = new Action<IRuleGroup>();
    export const DeleteRuleGroup = new Action<IRuleGroup>();
}

export namespace RuleActionsHub {
    export const InitializeRules = new Action<{ruleGroupId: string, rules: IRule[]}>();
    export const RefreshRules = new Action<{ruleGroupId: string, rules: IRule[]}>();
    export const UpdateRule = new Action<{ruleGroupId: string, rule: IRule}>();
    export const CreateRule = new Action<{ruleGroupId: string, rule: IRule}>();
    export const DeleteRule = new Action<{ruleGroupId: string, rule: IRule}>();
}

export namespace SettingsActionsHub {
    export const InitializeSetting = new Action<{key: SettingKey, value: any}>();
    export const UpdateSetting = new Action<{key: SettingKey, value: any}>();
}
