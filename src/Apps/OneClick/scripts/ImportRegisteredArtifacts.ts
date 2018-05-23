import { IAction, ITrigger } from "OneClick/Interfaces";
import { AddCommentAction } from "OneClick/RuleActions/AddCommentAction";
import { AddExistingRelationAction } from "OneClick/RuleActions/AddExistingRelationAction";
import { AddNewRelationAction } from "OneClick/RuleActions/AddNewRelationAction";
import { AddTagsAction } from "OneClick/RuleActions/AddTagsAction";
import { BaseAction } from "OneClick/RuleActions/BaseAction";
import { MentionAction } from "OneClick/RuleActions/MentionAction";
import { RemoveTagsAction } from "OneClick/RuleActions/RemoveTagsAction";
import { SaveWorkItemAction } from "OneClick/RuleActions/SaveWorkItemAction";
import { SetFieldValueAction } from "OneClick/RuleActions/SetFieldValueAction";
import { BaseTrigger } from "OneClick/RuleTriggers/BaseTrigger";
import { FieldChangedTrigger } from "OneClick/RuleTriggers/FieldChangedTrigger";
import { NewWorkItemOpenedTrigger } from "OneClick/RuleTriggers/NewWorkItemOpenedTrigger";

export const registeredActions: IDictionaryStringTo<new(model: IAction) => BaseAction> = {};
export const registeredTriggers: IDictionaryStringTo<new(model: ITrigger) => BaseTrigger> = {};

export function registerAction(actionName: string, actionType: new(model: IAction) => BaseAction): void {
    registeredActions[actionName.toUpperCase()] = actionType;
}

export function getActionType(actionName: string): new(model: IAction) => BaseAction {
    return registeredActions[actionName.toUpperCase()];
}

export function registerTrigger(triggerName: string, triggerType: new(model: ITrigger) => BaseTrigger): void {
    registeredTriggers[triggerName.toUpperCase()] = triggerType;
}

export function getTriggerType(triggerName: string): new(model: ITrigger) => BaseTrigger {
    return registeredTriggers[triggerName.toUpperCase()];
}

// register actions
registerAction("SetFieldValueAction", SetFieldValueAction);
registerAction("MentionAction", MentionAction);
registerAction("SaveWorkItemAction", SaveWorkItemAction);
registerAction("AddCommentAction", AddCommentAction);
registerAction("AddTagsAction", AddTagsAction);
registerAction("RemoveTagsAction", RemoveTagsAction);
registerAction("AddNewRelationAction", AddNewRelationAction);
registerAction("AddExistingRelationAction", AddExistingRelationAction);

// register triggers
registerTrigger("NewWorkItemOpenedTrigger", NewWorkItemOpenedTrigger);
registerTrigger("FieldChangedTrigger", FieldChangedTrigger);
