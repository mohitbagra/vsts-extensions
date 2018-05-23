import { BugBashActions } from "BugBashPro/Actions/BugBashActions";
import { BugBashFieldNames, SizeLimits } from "BugBashPro/Constants";
import { IBugBash, ISortState } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { dateEquals, defaultDateComparer } from "Common/Utilities/Date";
import {
    caseInsensitiveContains, ignoreCaseComparer, isNullOrWhiteSpace, stringEquals
} from "Common/Utilities/String";
import { FieldType } from "TFS/WorkItemTracking/Contracts";
import { IFilterState } from "VSSUI/Utilities/Filter";

const BugBashKeyTypes = {
    [BugBashFieldNames.Title]: "string",
    [BugBashFieldNames.StartTime]: "date",
    [BugBashFieldNames.EndTime]: "date",
    [BugBashFieldNames.AcceptTemplateId]: "string",
    [BugBashFieldNames.AcceptTemplateTeam]: "string",
    [BugBashFieldNames.AutoAccept]: "boolean",
    [BugBashFieldNames.ID]: "string",
    [BugBashFieldNames.DefaultTeam]: "string",
    [BugBashFieldNames.ItemDescriptionField]: "string",
    [BugBashFieldNames.ProjectId]: "string",
    [BugBashFieldNames.WorkItemType]: "string"
};

export class BugBash {
    public static compare(bugBash1: BugBash, bugBash2: BugBash, sortState: ISortState): number {
        const sortKey = sortState.sortKey;
        const isSortedDescending = sortState.isSortedDescending;
        let compareValue: number = 0;

        if (BugBashKeyTypes[sortKey] === "string") {
            const v1 = bugBash1.getFieldValue<string>(sortKey as BugBashFieldNames, true);
            const v2 = bugBash2.getFieldValue<string>(sortKey as BugBashFieldNames, true);
            compareValue = ignoreCaseComparer(v1, v2);
        }
        else if (BugBashKeyTypes[sortKey] === "date") {
            const v1 = bugBash1.getFieldValue<Date>(sortKey as BugBashFieldNames, true);
            const v2 = bugBash2.getFieldValue<Date>(sortKey as BugBashFieldNames, true);
            compareValue = defaultDateComparer(v1, v2);
        }
        else if (BugBashKeyTypes[sortKey] === "boolean") {
            const v1 = bugBash1.getFieldValue<boolean>(sortKey as BugBashFieldNames, true);
            const v2 = bugBash2.getFieldValue<boolean>(sortKey as BugBashFieldNames, true);
            const b1 = v1 == null ? "" : (!v1 ? "False" : "True");
            const b2 = v2 == null ? "" : (!v2 ? "False" : "True");
            compareValue = ignoreCaseComparer(b1, b2);
        }

        return isSortedDescending ? -1 * compareValue : compareValue;
    }

    public static getNewBugBashModel(): IBugBash {
        return {
            title: "New Bug Bash",
            projectId: VSS.getWebContext().project.id,
            workItemType: "",
            itemDescriptionField: "",
            autoAccept: false,
            acceptTemplateTeam: "",
            acceptTemplateId: ""
        };
    }

    private _originalModel: IBugBash;
    private _updates: IBugBash;

    get id(): string {
        return this._originalModel.id;
    }

    get projectId(): string {
        return this._originalModel.projectId;
    }

    get version(): number {
        return this._originalModel.__etag;
    }

    get isAutoAccept(): boolean {
        return this._originalModel.autoAccept;
    }

    constructor(model?: IBugBash) {
        const bugBashModel = model || BugBash.getNewBugBashModel();
        this._originalModel = {...bugBashModel};
        this._updates = {} as IBugBash;
    }

    public setFieldValue<T extends string | boolean | Date | number>(fieldName: BugBashFieldNames, fieldValue: T, fireChange: boolean = true) {
        this._updates[fieldName] = fieldValue;

        if (fireChange) {
            BugBashActions.fireStoreChange();
        }
    }

    public getFieldValue<T extends string | boolean | Date | number>(fieldName: BugBashFieldNames, original?: boolean): T {
        if (original) {
            return this._originalModel[fieldName] as T;
        }
        else {
            const updatedModel: IBugBash = {...this._originalModel, ...this._updates};
            return updatedModel[fieldName] as T;
        }
    }

    public matches(filter: IFilterState) {
        if (filter == null || filter[BugBashFieldNames.Title] == null || isNullOrWhiteSpace(filter[BugBashFieldNames.Title].value)) {
            return true;
        }

        const title = filter[BugBashFieldNames.Title].value;
        return caseInsensitiveContains(this.getFieldValue<string>(BugBashFieldNames.Title, true), title);
    }

    public save() {
        if (this.isDirty() && this.isValid()) {
            const updatedModel: IBugBash = {...this._originalModel, ...this._updates};
            if (this.isNew()) {
                BugBashActions.createBugBash(updatedModel);
            }
            else {
                BugBashActions.updateBugBash(updatedModel);
            }
        }
    }

    public reset(fireChange: boolean = true) {
        this._updates = {} as IBugBash;
        if (fireChange) {
            BugBashActions.fireStoreChange();
        }
    }

    public refresh() {
        if (!this.isNew()) {
            BugBashActions.refreshBugBash(this.id);
        }
    }

    // tslint:disable-next-line:no-reserved-keywords
    public delete() {
        if (!this.isNew()) {
            BugBashActions.deleteBugBash(this.id);
        }
    }

    public isNew(): boolean {
        return isNullOrWhiteSpace(this.id);
    }

    public isDirty(): boolean {
        const updatedModel: IBugBash = {...this._originalModel, ...this._updates};

        return !stringEquals(updatedModel.title, this._originalModel.title)
            || !stringEquals(updatedModel.workItemType, this._originalModel.workItemType, true)
            || !dateEquals(updatedModel.startTime, this._originalModel.startTime)
            || !dateEquals(updatedModel.endTime, this._originalModel.endTime)
            || !stringEquals(updatedModel.itemDescriptionField, this._originalModel.itemDescriptionField, true)
            || updatedModel.autoAccept !== this._originalModel.autoAccept
            || !stringEquals(updatedModel.defaultTeam, this._originalModel.defaultTeam, true)
            || !stringEquals(updatedModel.acceptTemplateTeam, this._originalModel.acceptTemplateTeam, true)
            || !stringEquals(updatedModel.acceptTemplateId, this._originalModel.acceptTemplateId, true);

    }

    public isValid(): boolean {
        const updatedModel: IBugBash = {...this._originalModel, ...this._updates};

        let dataValid = !isNullOrWhiteSpace(updatedModel.title)
            && updatedModel.title.length <= SizeLimits.TitleFieldMaxLength
            && !isNullOrWhiteSpace(updatedModel.workItemType)
            && !isNullOrWhiteSpace(updatedModel.itemDescriptionField)
            && !isNullOrWhiteSpace(updatedModel.acceptTemplateId)
            && !isNullOrWhiteSpace(updatedModel.acceptTemplateTeam)
            && (!updatedModel.startTime || !updatedModel.endTime || defaultDateComparer(updatedModel.startTime, updatedModel.endTime) < 0);

        if (dataValid && StoresHub.teamStore.isLoaded() && StoresHub.workItemTypeStore.isLoaded() && StoresHub.workItemFieldStore.isLoaded()) {
            dataValid = dataValid
                && StoresHub.teamStore.itemExists(updatedModel.acceptTemplateTeam)
                && (isNullOrWhiteSpace(updatedModel.defaultTeam) ||  StoresHub.teamStore.itemExists(updatedModel.defaultTeam))
                && StoresHub.workItemTypeStore.itemExists(updatedModel.workItemType)
                && StoresHub.workItemFieldStore.itemExists(updatedModel.itemDescriptionField)
                && StoresHub.workItemFieldStore.getItem(updatedModel.itemDescriptionField).type === FieldType.Html;
        }

        return dataValid;
    }
}
