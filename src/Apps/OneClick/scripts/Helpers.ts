import { isInteger, isNumeric } from "Common/Utilities/Number";
import { stringEquals } from "Common/Utilities/String";
import * as parse from "date-fns/parse";
import { Constants } from "OneClick/Constants";
import { IRuleGroup } from "OneClick/Interfaces";
import * as Macros from "OneClick/Macros/Macros";
import * as WitContracts from "TFS/WorkItemTracking/Contracts";

export function isPersonalRuleGroup(ruleGroup: IRuleGroup): boolean {
    return ruleGroup && ruleGroup.id === Constants.PersonalRuleGroupId;
}

export function isGlobalRuleGroup(ruleGroup: IRuleGroup): boolean {
    return ruleGroup && ruleGroup.id === Constants.GlobalRuleGroupId;
}

export function isPersonalOrGlobalRuleGroup(ruleGroup: IRuleGroup): boolean {
    return isPersonalRuleGroup(ruleGroup) || isGlobalRuleGroup(ruleGroup);
}

export function getRuleGroupUrl(witName: string, ruleGroupId: string): string {
    const {collection, project} = VSS.getWebContext();
    const extensionId = `${VSS.getExtensionContext().publisherId}.${VSS.getExtensionContext().extensionId}`;
    return `${collection.uri}/${project.name}/_apps/hub/${extensionId}.settings-hub?witName=${witName}&ruleGroup=${ruleGroupId}`;
}

export async function translateToFieldValue(value: string, fieldType?: WitContracts.FieldType): Promise<any> {
    if (Macros.BaseMacro.isMacro(value) && Macros.BaseMacro.getMacroType(value)) {
        const macroType = Macros.BaseMacro.getMacroType(value);
        return new macroType().translate(value, true);
    }
    else {
        switch (fieldType) {
            case WitContracts.FieldType.Boolean:
                return stringEquals(value, "True", true) || stringEquals(value, "1", true);
            case WitContracts.FieldType.DateTime:
                return parse(value) || value;
            case WitContracts.FieldType.Double:
                return isNumeric(value) ? parseFloat(value) : value;
            case WitContracts.FieldType.Integer:
                return isInteger(value) ? parseInt(value, 10) : value;
            default:
                return value;
        }
    }
}

export function isAnyMacro(value: string): boolean {
    return stringEquals(value, Constants.AnyMacro, true);
}
