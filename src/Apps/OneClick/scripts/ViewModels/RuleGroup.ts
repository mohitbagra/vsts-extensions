import { getCurrentUser } from "Common/Utilities/Identity";
import { isNullOrEmpty, stringEquals } from "Common/Utilities/String";
import { RuleGroupFieldNames, SizeLimits } from "OneClick/Constants";
import { IRuleGroup } from "OneClick/Interfaces";
import { Observable } from "VSSUI/Utilities/Observable";

export class RuleGroup extends Observable<void> {
    public static getNewRuleGroup(workItemTypeName: string): RuleGroup {
        return new RuleGroup({
            name: "",
            description: "",
            createdBy: getCurrentUser(),
            disabled: false,
            lastUpdatedBy: getCurrentUser(),
            projectId: VSS.getWebContext().project.id,
            workItemType: workItemTypeName
        });
    }

    private _originalModel: IRuleGroup;
    private _updates: IRuleGroup;

    constructor(model: IRuleGroup) {
        super();
        this._originalModel = {...model};
        this._updates = {} as IRuleGroup;
    }

    public get id(): string {
        return this._originalModel.id;
    }

    public get isNew(): boolean {
        return isNullOrEmpty(this.id);
    }

    public get version(): number {
        return this._originalModel.__etag;
    }

    public get updatedModel(): IRuleGroup {
        return {...this._originalModel, ...this._updates};
    }

    public get originalModel(): IRuleGroup {
        return {...this._originalModel};
    }

    public isDirty(): boolean {
        return !stringEquals(this.updatedModel.name, this._originalModel.name)
            || !stringEquals(this.updatedModel.description, this._originalModel.description, true)
            || this.updatedModel.disabled !== this._originalModel.disabled;

    }

    public isValid(): boolean {
        return this.updatedModel.name.trim().length > 0
            && this.updatedModel.name.length <= SizeLimits.TitleMaxLength
            && this.updatedModel.description.length <= SizeLimits.DescriptionMaxLength;
    }

    public setFieldValue<T extends string | boolean | number>(fieldName: RuleGroupFieldNames, fieldValue: T) {
        this._updates[fieldName] = fieldValue;
        this._emitChanged();
    }

    public getFieldValue<T extends string | boolean | number>(fieldName: RuleGroupFieldNames, original?: boolean): T {
        return original ? this._originalModel[fieldName] as T : this.updatedModel[fieldName] as T;
    }

    public addChangedListener(listener: () => void) {
        this.subscribe(listener);
    }

    public removeChangedListener(listener: () => void) {
        this.unsubscribe(listener);
    }

    public dispose() {
        this._originalModel = null;
        this._updates = null;
    }

    private _emitChanged() {
        this.notify(null, null);
    }
}
