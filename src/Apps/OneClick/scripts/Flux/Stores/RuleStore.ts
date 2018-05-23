import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { findIndex, first } from "Common/Utilities/Array";
import { stringEquals } from "Common/Utilities/String";
import { Constants } from "OneClick/Constants";
import { RuleActionsHub } from "OneClick/Flux/Actions/ActionsHub";
import { IRule } from "OneClick/Interfaces";

export class RuleStore extends BaseStore<IDictionaryStringTo<IRule[]>, IRule[], string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(ruleGroupId: string): IRule[] {
        return this.getRules(ruleGroupId, null);
    }

    public getRules(ruleGroupId: string, workItemType: string): IRule[] {
        const items = this.items[ruleGroupId.toLowerCase()];
        if (items && (ruleGroupId === Constants.PersonalRuleGroupId || ruleGroupId === Constants.GlobalRuleGroupId)) {
            return items.filter(i => stringEquals(i.workItemType, workItemType, true));
        }
        return items;
    }

    public getRule(ruleGroupId: string, ruleId: string, workItemType: string): IRule {
        const rules = this.getRules(ruleGroupId, workItemType) || [];
        return first(rules, rg => stringEquals(rg.id, ruleId, true));
    }

    public getKey(): string {
        return "RuleStore";
    }

    public clear() {
        this.items = {};
    }

    protected initializeActionListeners() {
        RuleActionsHub.InitializeRules.addListener((data: {ruleGroupId: string, rules: IRule[]}) => {
            if (data) {
                this.items[data.ruleGroupId.toLowerCase()] = data.rules;
            }

            this.emitChanged();
        });

        RuleActionsHub.RefreshRules.addListener((data: {ruleGroupId: string, rules: IRule[]}) => {
            if (data) {
                this.items[data.ruleGroupId.toLowerCase()] = data.rules;
            }

            this.emitChanged();
        });

        RuleActionsHub.CreateRule.addListener((data: {ruleGroupId: string, rule: IRule}) => {
            if (data) {
                this._addOrUpdateItem(data.ruleGroupId, data.rule);
            }

            this.emitChanged();
        });

        RuleActionsHub.UpdateRule.addListener((data: {ruleGroupId: string, rule: IRule}) => {
            if (data) {
                this._addOrUpdateItem(data.ruleGroupId, data.rule);
            }

            this.emitChanged();
        });

        RuleActionsHub.DeleteRule.addListener((data: {ruleGroupId: string, rule: IRule}) => {
            if (data) {
                this._removeItem(data.ruleGroupId, data.rule);
            }
            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _addOrUpdateItem(ruleGroupId: string, item: IRule) {
        if (!item || !ruleGroupId) {
            return;
        }

        if (this.items[ruleGroupId.toLowerCase()] == null) {
            this.items[ruleGroupId.toLowerCase()] = [];
        }
        // add in all items
        const existingIndex = findIndex(this.items[ruleGroupId.toLowerCase()], (existingItem: IRule) => stringEquals(item.id, existingItem.id, true));
        if (existingIndex !== -1) {
            this.items[ruleGroupId.toLowerCase()][existingIndex] = item;
        }
        else {
            this.items[ruleGroupId.toLowerCase()].push(item);
        }
    }

    private _removeItem(ruleGroupId: string, rule: IRule) {
        if (!rule || !rule.id || !ruleGroupId || this.items[ruleGroupId.toLowerCase()] == null) {
            return;
        }

        // remove from all items
        const existingIndex = findIndex(this.items[ruleGroupId.toLowerCase()], (existingItem: IRule) => stringEquals(rule.id, existingItem.id, true));
        if (existingIndex !== -1) {
            this.items[ruleGroupId.toLowerCase()].splice(existingIndex, 1);
        }
    }
}
