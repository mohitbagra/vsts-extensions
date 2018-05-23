import * as React from "react";

import { newGuid } from "Common/Utilities/Guid";
import { IIconProps } from "OfficeFabric/Icon";
import { FormEvents } from "OneClick/Constants";
import { ITrigger } from "OneClick/Interfaces";
import { Observable } from "VSSUI/Utilities/Observable";

export abstract class BaseTrigger extends Observable<void> {
    public static getNewTrigger<TTrigger extends BaseTrigger>(triggerType: new(model: ITrigger) => TTrigger, triggerName: string): BaseTrigger {
        return new triggerType({
            name: triggerName,
            attributes: null
        });
    }

    private _originalAttributes: IDictionaryStringTo<any>;
    private _updates: IDictionaryStringTo<any>;
    private _id: string;
    private _name: string;

    constructor(model: ITrigger) {
        super();
        this._name = model.name;
        this._originalAttributes = model.attributes ? {...model.attributes} : null;  // for new models, origina would be null
        this._updates = model.attributes ? {} : this.defaultAttributes();  // if its a new trigger, initialize updates with defaults
        this._id = newGuid();
    }

    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get isNew(): boolean {
        return this._originalAttributes == null;
    }

    public get updatedAttributes(): IDictionaryStringTo<any> {
        return {...(this._originalAttributes || {}), ...(this._updates || {})};
    }

    public dispose() {
        this._originalAttributes = null;
        this._updates = null;
    }

    public addChangedListener(listener: () => void) {
        this.subscribe(listener);
    }

    public removeChangedListener(listener: () => void) {
        this.unsubscribe(listener);
    }

    public setAttribute<T>(attributeName: string, attributeValue: T, fireChange: boolean = true) {
        if (!this._updates) {
            this._updates = {};
        }
        this._updates[attributeName] = attributeValue;

        if (fireChange) {
            this._emitChanged();
        }
    }

    public getAttribute<T>(attributeName: string, original?: boolean): T {
        if (original) {
            return this._originalAttributes && this._originalAttributes[attributeName] as T;
        }
        else {
            return this.updatedAttributes[attributeName] as T;
        }
    }

    public getIcon(): IIconProps {
        return null;
    }

    public isDirty(): boolean {
        return this.isNew;
    }

    public abstract getAssociatedFormEvent(): FormEvents;
    public abstract getFriendlyName(): string;
    public abstract getDescription(): string;
    public abstract async shouldTrigger(args: any): Promise<boolean>;
    public abstract render(workItemType: string): React.ReactNode;
    public abstract isValid(): boolean;

    protected defaultAttributes(): IDictionaryStringTo<any> {
        return {};
    }

    private _emitChanged() {
        this.notify(null, null);
    }
}
