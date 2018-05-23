import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { findIndex } from "Common/Utilities/Array";
import { stringEquals } from "Common/Utilities/String";
import { Constants, GlobalRuleGroup, PersonalRuleGroup } from "OneClick/Constants";
import { RuleGroupActionsHub } from "OneClick/Flux/Actions/ActionsHub";
import { IRuleGroup } from "OneClick/Interfaces";

/*
*  Store rule groups for a work item type in current project
*/
export class RuleGroupStore extends BaseStore<IRuleGroup[], IRuleGroup, string> {
    private _idToGroupMap: IDictionaryStringTo<IRuleGroup>;
    private _workItemTypeName: string;

    constructor() {
        super();
        this._idToGroupMap = {};
    }

    public getItem(groupId: string, personalRulesEnabled?: boolean, globalRulesEnabled?: boolean): IRuleGroup {
        if (personalRulesEnabled && groupId === Constants.PersonalRuleGroupId) {
            return PersonalRuleGroup;
        }
        if (globalRulesEnabled && groupId === Constants.GlobalRuleGroupId) {
            return GlobalRuleGroup;
        }

        return this._idToGroupMap[groupId.toLowerCase()];
    }

    public getAll(personalRulesEnabled?: boolean, globalRulesEnabled?: boolean): IRuleGroup[] {
        if (this.items) {
            const extraRuleGroups: IRuleGroup[] = [];

            if (personalRulesEnabled) {
                extraRuleGroups.push(PersonalRuleGroup);
            }
            if (globalRulesEnabled) {
                extraRuleGroups.push(GlobalRuleGroup);
            }

            return extraRuleGroups.concat(this.items);
        }
        else {
            return null;
        }
    }

    public setCurrentWorkItemType(workItemTypeName: string) {
        this._workItemTypeName = workItemTypeName;
    }

    public checkCurrentWorkItemType(workItemTypeName: string): boolean {
        return stringEquals(this._workItemTypeName, workItemTypeName, true);
    }

    public clear() {
        this.items = null;
        this._idToGroupMap = {};
        this._workItemTypeName = null;
    }

    public getKey(): string {
        return "RuleGroupStore";
    }

    protected initializeActionListeners() {
        RuleGroupActionsHub.InitializeRuleGroups.addListener(ruleGroups => {
            this._initializeItems(ruleGroups);
            this.emitChanged();
        });

        RuleGroupActionsHub.RefreshRuleGroups.addListener(ruleGroups => {
            this._initializeItems(ruleGroups);
            this.emitChanged();
        });

        RuleGroupActionsHub.CreateRuleGroup.addListener(ruleGroup => {
            this._addOrUpdateItem(ruleGroup);
            this.emitChanged();
        });

        RuleGroupActionsHub.UpdateRuleGroup.addListener(ruleGroup => {
            this._addOrUpdateItem(ruleGroup);
            this.emitChanged();
        });

        RuleGroupActionsHub.DeleteRuleGroup.addListener(ruleGroup => {
            this._removeItem(ruleGroup);
            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _initializeItems(ruleGroups: IRuleGroup[]) {
        if (ruleGroups) {
            this.items = ruleGroups;
            this._idToGroupMap = {};
            for (const ruleGroup of ruleGroups) {
                this._idToGroupMap[ruleGroup.id.toLowerCase()] = ruleGroup;
            }
        }
    }

    private _addOrUpdateItem(ruleGroup: IRuleGroup) {
        if (!ruleGroup || !this.items) {
            return;
        }

        if (this._idToGroupMap == null) {
            this._idToGroupMap = {};
        }
        // add in all items
        const existingIndex = findIndex(this.items, (existingItem: IRuleGroup) => stringEquals(ruleGroup.id, existingItem.id, true));
        if (existingIndex === -1) {
            this.items.push(ruleGroup);
        }
        else {
            this.items[existingIndex] = ruleGroup;
        }

        this._idToGroupMap[ruleGroup.id.toLowerCase()] = ruleGroup;
    }

    private _removeItem(ruleGroup: IRuleGroup) {
        if (!ruleGroup || !ruleGroup.id || !this.items) {
            return;
        }

        // remove from all items
        const existingIndex = findIndex(this.items, (existingItem: IRuleGroup) => stringEquals(ruleGroup.id, existingItem.id, true));
        if (existingIndex !== -1) {
            this.items.splice(existingIndex, 1);
        }

        if (this._idToGroupMap && this._idToGroupMap[ruleGroup.id.toLowerCase()]) {
            delete this._idToGroupMap[ruleGroup.id.toLowerCase()];
        }
    }
}
