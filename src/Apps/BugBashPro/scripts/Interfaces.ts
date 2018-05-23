import { BugBashFieldNames, BugBashItemFieldNames, WorkItemFieldNames } from "BugBashPro/Constants";
import { IdentityRef } from "Common/Utilities/Identity";

export interface IBugBash {
    id?: string;
    __etag?: number;
    title: string;
    workItemType: string;
    projectId: string;
    itemDescriptionField: string;
    autoAccept: boolean;
    startTime?: Date;
    endTime?: Date;
    defaultTeam?: string;
    acceptTemplateTeam?: string;
    acceptTemplateId?: string;
}

export interface IBugBashItem {
    id?: string;
    __etag?: number;
    bugBashId: string;
    title: string;
    workItemId: number;
    teamId: string;
    description?: string;
    createdDate: Date;
    createdBy: IdentityRef;
    rejected?: boolean;
    rejectReason?: string;
    rejectedBy?: IdentityRef;
}

export interface IBugBashItemComment {
    id?: string;
    __etag?: number;
    content: string;
    createdDate: Date;
    createdBy: IdentityRef;
}

export interface IBugBashSettings {
    gitMediaRepo: string;
}

export interface IUserSettings {
    id: string;
    __etag?: number;
    associatedTeam: string;
}

export interface INameValuePair {
    name: string;
    value: number;
    members?: INameValuePair[];
}

export interface ILongText {
    id?: string;
    __etag?: number;
    text: string;
}

export interface ISortState {
    sortKey: BugBashFieldNames | BugBashItemFieldNames | WorkItemFieldNames;
    isSortedDescending: boolean;
}
