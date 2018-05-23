import { LongTextActions } from "BugBashPro/Actions/LongTextActions";
import { ILongText } from "BugBashPro/Interfaces";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";

export class LongText {
    private _originalModel: ILongText;
    private _updates: ILongText;

    get id(): string {
        return this._originalModel.id;
    }

    get version(): number {
        return this._originalModel.__etag;
    }

    get Text(): string {
        const updatedModel: ILongText = {...this._originalModel, ...this._updates};
        return updatedModel.text;
    }

    constructor(model: ILongText) {
        const longTextModel = model;
        this._originalModel = {...longTextModel};
        this._updates = {} as ILongText;
    }

    public setDetails(newText: string, fireChange: boolean = true) {
        this._updates.text = newText;

        if (fireChange) {
            LongTextActions.fireStoreChange();
        }
    }

    public save() {
        if (this.isDirty()) {
            const updatedModel: ILongText = {...this._originalModel, ...this._updates};
            LongTextActions.addOrUpdateLongText(updatedModel);
        }
    }

    public reset(fireChange: boolean = true) {
        this._updates = {} as ILongText;
        if (fireChange) {
            LongTextActions.fireStoreChange();
        }
    }

    public refresh() {
        if (!this.isNew()) {
            LongTextActions.refreshLongText(this.id);
        }
    }

    public isNew(): boolean {
        return isNullOrWhiteSpace(this.id);
    }

    public isDirty(): boolean {
        const updatedModel: ILongText = {...this._originalModel, ...this._updates};
        return !stringEquals(updatedModel.text, this._originalModel.text);
    }
}
