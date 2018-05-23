import { IdentityRef } from "Common/Utilities/Identity";

export interface IRuleGroup {
    id?: string;
    __etag?: number;
    name: string;
    description?: string;
    disabled?: boolean;
    createdBy: IdentityRef;
    lastUpdatedBy: IdentityRef;
    projectId: string;
    workItemType: string;
}

export interface IRule {
    id?: string;
    __etag?: number;
    name: string;
    color?: string;
    description?: string;
    disabled?: boolean;
    hideOnForm?: boolean;
    actions: IAction[];
    triggers: ITrigger[];
    projectId: string;
    workItemType: string;
    createdBy: IdentityRef;
    lastUpdatedBy: IdentityRef;
}

export interface ITrigger {
    name: string;
    attributes: IDictionaryStringTo<string>;
}

export interface IAction {
    name: string;
    attributes: IDictionaryStringTo<string>;
}

export interface ILocalStorageRulesData {
    cacheStamp: number;
    workItemType: string;
    projectId: string;
    rules: IRule[];
}

export interface IActionError {
    actionName: string;
    error: string;
}
