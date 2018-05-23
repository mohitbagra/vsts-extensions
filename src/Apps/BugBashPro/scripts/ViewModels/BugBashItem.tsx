import * as React from "react";

import { BugBashItemActions } from "BugBashPro/Actions/BugBashItemActions";
import { BugBashItemFieldNames, SizeLimits, WorkItemFieldNames } from "BugBashPro/Constants";
import { IBugBashItem, ISortState } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { IdentityView } from "Common/Components/IdentityView";
import { WorkItemStateView } from "Common/Components/VSTS/WorkItemStateView";
import { WorkItemTitleView } from "Common/Components/VSTS/WorkItemTitleView";
import { WorkItemActions } from "Common/Flux/Actions/WorkItemActions";
import { defaultDateComparer, friendly } from "Common/Utilities/Date";
import {
    getCurrentUser, getDistinctNameFromIdentityRef, IdentityRef
} from "Common/Utilities/Identity";
import {
    caseInsensitiveContains, ignoreCaseComparer, isNullOrWhiteSpace, stringEquals
} from "Common/Utilities/String";
import { openWorkItemDialog } from "Common/Utilities/WorkItemFormHelpers";
import * as format from "date-fns/format";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";
import { IFilterState } from "VSSUI/Utilities/Filter";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";

export const BugBashItemKeyTypes = {
    [BugBashItemFieldNames.Title]: "string",
    [BugBashItemFieldNames.BugBashId]: "string",
    [BugBashItemFieldNames.CreatedBy]: "identityRef",
    [BugBashItemFieldNames.CreatedDate]: "date",
    [BugBashItemFieldNames.Description]: "string",
    [BugBashItemFieldNames.ID]: "string",
    [BugBashItemFieldNames.Rejected]: "boolean",
    [BugBashItemFieldNames.RejectedBy]: "identityRef",
    [BugBashItemFieldNames.RejectReason]: "string",
    [BugBashItemFieldNames.TeamId]: "string",
    [BugBashItemFieldNames.WorkItemId]: "number",
    [WorkItemFieldNames.AreaPath]: "string",
    [WorkItemFieldNames.AssignedTo]: "identity",
    [WorkItemFieldNames.Title]: "string",
    [WorkItemFieldNames.State]: "string",
    [WorkItemFieldNames.WorkItemType]: "string",
    [WorkItemFieldNames.ID]: "number",
};

export class BugBashItem {
    public static isWorkItemFieldName(field: string) {
        return field.indexOf("System.") === 0;
    }

    public static compare(bugBashItem1: BugBashItem, bugBashItem2: BugBashItem, sortState: ISortState): number {
        const sortKey = sortState.sortKey;
        const isSortedDescending = sortState.isSortedDescending;
        let compareValue: number = 0;

        if (sortKey === BugBashItemFieldNames.Status) {
            return 0;
        }

        let v1: string | Date | number | boolean | IdentityRef;
        let v2: string | Date | number | boolean | IdentityRef;

        if (this.isWorkItemFieldName(sortKey)) {
            if (bugBashItem1.isAccepted) {
                v1 = sortKey === WorkItemFieldNames.ID ? bugBashItem1.workItemId : bugBashItem1.workItem.fields[sortKey];
            }
            if (bugBashItem2.isAccepted) {
                v2 = sortKey === WorkItemFieldNames.ID ? bugBashItem2.workItemId : bugBashItem2.workItem.fields[sortKey];
            }
        }
        else if (sortKey === BugBashItemFieldNames.Title) {
            v1 = bugBashItem1.isAccepted ? bugBashItem1.workItem.fields[WorkItemFieldNames.Title] : bugBashItem1.getFieldValue(BugBashItemFieldNames.Title, true);
            v2 = bugBashItem2.isAccepted ? bugBashItem2.workItem.fields[WorkItemFieldNames.Title] : bugBashItem2.getFieldValue(BugBashItemFieldNames.Title, true);
        }
        else {
            v1 = bugBashItem1.getFieldValue(sortKey as BugBashItemFieldNames, true);
            v2 = bugBashItem2.getFieldValue(sortKey as BugBashItemFieldNames, true);

            if (sortKey === BugBashItemFieldNames.TeamId) {
                const team1 = StoresHub.teamStore.getItem(v1 as string);
                const team2 = StoresHub.teamStore.getItem(v2 as string);
                v1 = team1 ? team1.name : v1;
                v2 = team2 ? team2.name : v1;
            }
        }

        if (v1 == null && v2 == null) {
            compareValue = 0;
        }
        else if (v1 == null && v2 != null) {
            compareValue = -1;
        }
        else if (v1 != null && v2 == null) {
            compareValue = 1;
        }
        else if (BugBashItemKeyTypes[sortKey] === "string" || BugBashItemKeyTypes[sortKey] === "identity") {
            compareValue = ignoreCaseComparer(v1 as string, v2 as string);
        }
        else if (BugBashItemKeyTypes[sortKey] === "identityRef") {
            compareValue = ignoreCaseComparer(getDistinctNameFromIdentityRef(v1 as IdentityRef), getDistinctNameFromIdentityRef(v2 as IdentityRef));
        }
        else if (BugBashItemKeyTypes[sortKey] === "date") {
            compareValue = defaultDateComparer(v1 as Date, v2 as Date);
        }
        else if (BugBashItemKeyTypes[sortKey] === "boolean") {
            const b1 = !v1 ? "False" : "True";
            const b2 = !v2 ? "False" : "True";
            compareValue = ignoreCaseComparer(b1, b2);
        }
        else if (BugBashItemKeyTypes[sortKey] === "number") {
            compareValue = (v1 > v2) ? 1 : -1;
        }

        return isSortedDescending ? -1 * compareValue : compareValue;
    }

    public static getNewBugBashItemModel(bugBashId?: string, teamId?: string): IBugBashItem {
        return {
            bugBashId: bugBashId,
            title: "",
            description: "",
            teamId: teamId,
            workItemId: 0,
            createdDate: null,
            createdBy: getCurrentUser(),
            rejected: false,
            rejectReason: "",
            rejectedBy: null
        };
    }

    private _originalModel: IBugBashItem;
    private _updates: IBugBashItem;
    private _newComment: string;

    get newComment(): string {
        return this._newComment;
    }

    get id(): string {
        return this._originalModel.id;
    }

    get bugBashId(): string {
        return this._originalModel.bugBashId;
    }

    get workItemId(): number {
        return this._originalModel.workItemId;
    }

    get workItem(): WorkItem {
        return this.isAccepted ? StoresHub.workItemStore.getItem(this.workItemId) : null;
    }

    get version(): number {
        return this._originalModel.__etag;
    }

    get isAccepted(): boolean {
        return this.workItemId != null && this.workItemId > 0;
    }

    get isRejected(): boolean {
        return this._originalModel.rejected;
    }

    get isPending(): boolean {
        return !this.isAccepted && !this.isRejected;
    }

    constructor(model?: IBugBashItem) {
        const bugBashItemModel = model || BugBashItem.getNewBugBashItemModel();
        this._originalModel = {...bugBashItemModel};
        this._updates = {} as IBugBashItem;
        this._newComment = "";
    }

    public setFieldValue<T extends string | boolean | Date | number | IdentityRef>(fieldName: BugBashItemFieldNames, fieldValue: T, fireChange: boolean = true) {
        this._updates[fieldName] = fieldValue;

        if (fireChange) {
            BugBashItemActions.fireStoreChange();
        }
    }

    public getFieldValue<T extends string | boolean | Date | number | IdentityRef>(fieldName: BugBashItemFieldNames, original?: boolean): T {
        if (original) {
            return this._originalModel[fieldName] as T;
        }
        else {
            const updatedModel: IBugBashItem = {...this._originalModel, ...this._updates};
            return updatedModel[fieldName] as T;
        }
    }

    public matches(filter: IFilterState): boolean {
        if (filter == null) {
            return true;
        }

        // filter by keyword : title (all items) and reject reason
        const keyword = filter["keyword"] && filter["keyword"].value;
        if (!isNullOrWhiteSpace(keyword)) {
            const title = this.isAccepted ? this.workItem.fields[WorkItemFieldNames.Title] : this._originalModel.title;
            return caseInsensitiveContains(title, keyword);
        }

        // filter by teamIds: only for non accepted items
        const teamIds = filter[BugBashItemFieldNames.TeamId] && filter[BugBashItemFieldNames.TeamId].value;
        if (teamIds && teamIds.length > 0 && !this.isAccepted) {
            if (teamIds.filter(v => stringEquals(v, this._originalModel.teamId, true)).length === 0) {
                return false;
            }
        }

        // filter by item created by
        const createdBys = filter[BugBashItemFieldNames.CreatedBy] && filter[BugBashItemFieldNames.CreatedBy].value;
        if (createdBys && createdBys.length > 0) {
            if (createdBys.filter(v => stringEquals(v, getDistinctNameFromIdentityRef(this._originalModel.createdBy), true)).length === 0) {
                return false;
            }
        }

        // filter by rejected by: only for rejected items
        const rejectedBys = filter[BugBashItemFieldNames.RejectedBy] && filter[BugBashItemFieldNames.RejectedBy].value;
        if (rejectedBys && rejectedBys.length > 0 && this.isRejected) {
            if (rejectedBys.filter(v => stringEquals(v, getDistinctNameFromIdentityRef(this._originalModel.rejectedBy), true)).length === 0) {
                return false;
            }
        }

        // filter by work item state
        const states = filter[WorkItemFieldNames.State] && filter[WorkItemFieldNames.State].value;
        if (states && states.length > 0 && this.isAccepted) {
            if (states.filter(v => stringEquals(v, this.workItem.fields[WorkItemFieldNames.State], true)).length === 0) {
                return false;
            }
        }

        // filter by work item assigned to
        const assignedTos = filter[WorkItemFieldNames.AssignedTo] && filter[WorkItemFieldNames.AssignedTo].value;
        if (assignedTos && assignedTos.length > 0 && this.isAccepted) {
            if (assignedTos.filter(v => stringEquals(v, this.workItem.fields[WorkItemFieldNames.AssignedTo] || "Unassigned", true)).length === 0) {
                return false;
            }
        }

        // filter by work item area path
        const areaPaths = filter[WorkItemFieldNames.AreaPath] && filter[WorkItemFieldNames.AreaPath].value;
        if (areaPaths && areaPaths.length > 0 && this.isAccepted) {
            if (areaPaths.filter(v => stringEquals(v, this.workItem.fields[WorkItemFieldNames.AreaPath], true)).length === 0) {
                return false;
            }
        }

        return true;
    }

    public setComment(newComment: string) {
        this._newComment = newComment;
        BugBashItemActions.fireStoreChange();
    }

    public save(bugBashId: string) {
        if (this.isDirty() && this.isValid()) {
            const updatedModel: IBugBashItem = {...this._originalModel, ...this._updates};

            if (this.isNew()) {
                BugBashItemActions.createBugBashItem(bugBashId, updatedModel, this.newComment);
            }
            else {
                BugBashItemActions.updateBugBashItem(this.bugBashId, updatedModel, this.newComment);
            }
        }
    }

    public reset(fireChange: boolean = true) {
        this._updates = {} as IBugBashItem;
        this._newComment = "";
        if (fireChange) {
            BugBashItemActions.fireStoreChange();
        }
    }

    // tslint:disable-next-line:no-reserved-keywords
    public delete() {
        if (!this.isNew()) {
            BugBashItemActions.deleteBugBashItem(this.bugBashId, this.id);
        }
    }

    public refresh() {
        if (!this.isNew()) {
            BugBashItemActions.refreshItem(this.bugBashId, this.id);
        }
    }

    public accept() {
        if (!this.isDirty() && !this.isNew()) {
            BugBashItemActions.acceptBugBashItem(this._originalModel);
        }
    }

    public isNew(): boolean {
        return isNullOrWhiteSpace(this.id);
    }

    public isDirty(): boolean {
        const updatedModel: IBugBashItem = {...this._originalModel, ...this._updates};

        return !stringEquals(updatedModel.title, this._originalModel.title)
            || !stringEquals(updatedModel.teamId, this._originalModel.teamId)
            || !stringEquals(updatedModel.description, this._originalModel.description)
            || !stringEquals(updatedModel.rejectReason, this._originalModel.rejectReason)
            || Boolean(updatedModel.rejected) !== Boolean(this._originalModel.rejected)
            || !isNullOrWhiteSpace(this._newComment);
    }

    public isValid(): boolean {
        const updatedModel: IBugBashItem = {...this._originalModel, ...this._updates};

        return !isNullOrWhiteSpace(updatedModel.title)
            && updatedModel.title.trim().length <= SizeLimits.TitleFieldMaxLength
            && !isNullOrWhiteSpace(updatedModel.teamId)
            && StoresHub.teamStore.itemExists(updatedModel.teamId)
            && (!updatedModel.rejected
                || (!isNullOrWhiteSpace(updatedModel.rejectReason)
                    && updatedModel.rejectReason.trim().length <= SizeLimits.RejectFieldMaxLength));
    }

    public onRenderPropertyCell(key: BugBashItemFieldNames | WorkItemFieldNames): JSX.Element {
        let value: any;
        let className = "item-grid-cell";
        if (this.isDirty()) {
            className += " is-dirty";
        }
        if (!this.isValid() && !this.isAccepted) {
            className += " is-invalid";
        }

        if (BugBashItem.isWorkItemFieldName(key)) {
            if (this.isAccepted) {
                value = key === WorkItemFieldNames.ID ? this.workItemId : this.workItem.fields[key];
            }
        }
        else if (key === BugBashItemFieldNames.Title && this.isAccepted) {
            value = this.workItem.fields[WorkItemFieldNames.Title];
        }
        else if (key !== BugBashItemFieldNames.Status) {
            value = this.getFieldValue(key as BugBashItemFieldNames);
            if (key === BugBashItemFieldNames.TeamId) {
                const team = StoresHub.teamStore.getItem(value);
                value = team ? team.name : value;
            }
        }

        if (key === BugBashItemFieldNames.Status) {
            return this._renderStatusCell();
        }
        else if (key === BugBashItemFieldNames.Title && this.isAccepted) {
            return (
                <WorkItemTitleView
                    className={className}
                    showId={true}
                    workItemId={this.workItem.id}
                    onClick={this._onTitleClick}
                    title={value}
                    workItemType={this.workItem.fields[WorkItemFieldNames.WorkItemType]}
                />
            );
        }
        else if (key === WorkItemFieldNames.State) {
            return (
                <WorkItemStateView
                    className={className}
                    state={value}
                    workItemType={this.workItem.fields[WorkItemFieldNames.WorkItemType]}
                />
            );
        }
        else if (key === BugBashItemFieldNames.Title) {
            return (
                <TooltipHost
                    content={value}
                    delay={TooltipDelay.medium}
                    overflowMode={TooltipOverflowMode.Parent}
                    directionalHint={DirectionalHint.bottomLeftEdge}
                >
                    <span className={className}>
                        {`${this.isDirty() ? "* " : ""}${value}`}
                    </span>
                </TooltipHost>
            );
        }
        else if (BugBashItemKeyTypes[key] === "identity") {
            return <IdentityView className={className} identityDistinctName={value} />;
        }
        else if (BugBashItemKeyTypes[key] === "identityRef") {
            return <IdentityView className={className} identityRef={value} />;
        }
        else if (BugBashItemKeyTypes[key] === "date") {
            return (
                <TooltipHost
                    content={format(value, "M/D/YYYY h:mm aa")}
                    delay={TooltipDelay.medium}
                    directionalHint={DirectionalHint.bottomLeftEdge}
                >
                    <span className={className}>
                        {friendly(value)}
                    </span>
                </TooltipHost>
            );
        }
        else {
            return (
                <TooltipHost
                    content={value}
                    delay={TooltipDelay.medium}
                    overflowMode={TooltipOverflowMode.Parent}
                    directionalHint={DirectionalHint.bottomLeftEdge}
                >
                    <span className={className}>
                        {value}
                    </span>
                </TooltipHost>
            );
        }
    }

    private _renderStatusCell(): JSX.Element {
        let tooltip: string;
        let iconName: string;
        let color: string;

        if (this.isAccepted) {
            tooltip = "Accepted";
            iconName = "Accept";
            color = "#107c10";
        }
        else if (this.isRejected) {
            tooltip = "Rejected";
            iconName = "Cancel";
            color = "#da0a00";
        }
        else {
            tooltip = "Pending";
            iconName = "Clock";
            color = "#666666";
        }

        return (
            <div style={{textAlign: "center"}}>
                <TooltipHost
                    content={tooltip}
                    delay={TooltipDelay.medium}
                    directionalHint={DirectionalHint.bottomCenter}
                >
                    <VssIcon
                        iconName={iconName}
                        iconType={VssIconType.fabric}
                        styles={{
                            root: {
                                color: color,
                                cursor: "default"
                            }
                        }}
                    />
                </TooltipHost>
            </div>
        );
    }

    private _onTitleClick = async (e: React.MouseEvent<HTMLElement>) => {
        const updatedWorkItem = await openWorkItemDialog(e, this.workItem);
        if (updatedWorkItem) {
            WorkItemActions.refreshWorkItemInStore([updatedWorkItem]);
        }
    }
}
