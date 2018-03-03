import * as React from "react";

import { getCurrentUser } from "Library/Utilities/Identity";
import { isNullOrEmpty, stringEquals } from "Library/Utilities/String";
import { IconButton } from "OfficeFabric/Button";
import { autobind } from "OfficeFabric/Utilities";
import { FormEvents, RuleFieldNames, SizeLimits } from "OneClick/Constants";
import { getActionType, getTriggerType } from "OneClick/ImportRegisteredArtifacts";
import { IAction, IActionError, IRule, ITrigger } from "OneClick/Interfaces";
import { BaseAction } from "OneClick/RuleActions/BaseAction";
import { BaseTrigger } from "OneClick/RuleTriggers/BaseTrigger";
import { Observable } from "VSSUI/Utilities/Observable";

export class Rule extends Observable<void> {
    public static getNewRule(workItemTypeName: string): Rule {
        return new Rule({
            name: "New rule",
            description: "",
            disabled: false,
            hideOnForm: false,
            color: "#007acc",
            projectId: VSS.getWebContext().project.id,
            workItemType: workItemTypeName,
            actions: [],
            triggers: [],
            createdBy: getCurrentUser(),
            lastUpdatedBy: getCurrentUser()
        });
    }

    private _originalModel: IRule;
    private _updates: IRule;
    private _actions: BaseAction[];
    private _triggers: BaseTrigger[];

    constructor(model: IRule) {
        super();
        this._originalModel = {...model};
        this._updates = {} as IRule;

        this._actions = this._prepareActions(this._originalModel.actions || []);
        this._triggers = this._prepareTriggers(this._originalModel.triggers || []);
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

    public get updatedModel(): IRule {
        const updatedModel = {...this._originalModel, ...this._updates};
        updatedModel.actions = this._actions.map(action => ({
            name: action.name,
            attributes: action.updatedAttributes
        }));
        updatedModel.triggers = this._triggers.map(trigger => ({
            name: trigger.name,
            attributes: trigger.updatedAttributes
        }));

        return updatedModel;
    }

    public get originalModel(): IRule {
        return {...this._originalModel};
    }

    public get actions(): BaseAction[] {
        return this._actions;
    }

    public get triggers(): BaseTrigger[] {
        return this._triggers;
    }

    public get hasTriggers(): boolean {
        return this.triggers && this.triggers.length > 0;
    }

    public isDirty(): boolean {
        return !stringEquals(this.updatedModel.name, this._originalModel.name)
            || !stringEquals(this.updatedModel.color, this._originalModel.color, true)
            || !stringEquals(this.updatedModel.description, this._originalModel.description, true)
            || this.updatedModel.disabled !== this._originalModel.disabled
            || this.updatedModel.hideOnForm !== this._originalModel.hideOnForm
            || this._originalModel.actions.length !== this._actions.length
            || this._originalModel.triggers.length !== this._triggers.length
            || this._actions.some((a: BaseAction) => a.isDirty())
            || this._triggers.some((t: BaseTrigger) => t.isDirty());
    }

    public isValid(): boolean {
        return this.updatedModel.name.trim().length > 0
            && this.updatedModel.name.length <= SizeLimits.TitleMaxLength
            && this.updatedModel.description.length <= SizeLimits.DescriptionMaxLength
            && this._actions.length > 0
            && this._actions.every((a: BaseAction) => a.isValid())
            && this._triggers.every((t: BaseTrigger) => t.isValid());
    }

    public setFieldValue<T extends string | boolean | number>(fieldName: RuleFieldNames, fieldValue: T) {
        this._updates[fieldName] = fieldValue;
        this._emitChanged();
    }

    public getFieldValue<T extends string | boolean | number>(fieldName: RuleFieldNames, original?: boolean): T {
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
        for (const action of this._actions) {
            action.removeChangedListener(this._emitChanged);
            action.dispose();
        }
        for (const trigger of this._triggers) {
            trigger.removeChangedListener(this._emitChanged);
            trigger.dispose();
        }
    }

    public addAction(action: BaseAction): void {
        this._subscribeToAction(action);
        this._actions.push(action);
        this._emitChanged();
    }

    public addTrigger(trigger: BaseTrigger): void {
        this._subscribeToTrigger(trigger);
        this._triggers.push(trigger);
        this._emitChanged();
    }

    public renderActions(): React.ReactNode {
        return this._actions.map((action: BaseAction) => {
            return (
                <div key={action.id} className="action-container">
                    <div className="action-header">
                        <div className="action-name">{action.getFriendlyName()}</div>
                        <IconButton
                            className="delete-action-command"
                            iconProps={{iconName: "Trash"}}
                            onClick={this._onRemoveActionButtonClick(action)}
                        />
                    </div>
                    <div className="action-properties-list">
                        {action.render(this._originalModel.workItemType)}
                    </div>
                </div>
            );
        });
    }

    public renderTriggers(): React.ReactNode {
        return this._triggers.map((trigger: BaseTrigger) => {
            return (
                <div key={trigger.id} className="action-container">
                    <div className="action-header">
                        <div className="action-name">{trigger.getFriendlyName()}</div>
                        <IconButton
                            className="delete-action-command"
                            iconProps={{iconName: "Trash"}}
                            onClick={this._onRemoveTriggerButtonClick(trigger)}
                        />
                    </div>
                    <div className="action-properties-list">
                        {trigger.render(this._originalModel.workItemType)}
                    </div>
                </div>
            );
        });
    }

    // Returns an array of strings - each string corresponds to an error in action execution
    public async run(): Promise<IActionError> {
        let error: IActionError;
        if (this.actions == null || this.actions.length === 0) {
            return null;
        }

        for (const action of this.actions) {
            try {
                await action.run();
            }
            catch (e) {
                error = {
                    actionName: action.getFriendlyName(),
                    error: e.message || e
                };

                break;
            }
        }

        return error;
    }

    // determine if the rule should be run when an event is fired
    public async shouldRunOnEvent(eventName: FormEvents, triggerArgs: any): Promise<boolean> {
        const result = await Promise.all(this._triggers.map(trigger => this._shouldTriggerFire(eventName, triggerArgs, trigger)));
        return result.some(trigger => trigger);
    }

    private async _shouldTriggerFire(eventName: FormEvents, triggerArgs: any, trigger: BaseTrigger): Promise<boolean> {
        if (trigger.getAssociatedFormEvent() !== eventName) {
            return false;
        }

        return await trigger.shouldTrigger(triggerArgs);
    }

    @autobind
    private _onRemoveActionButtonClick(action: BaseAction): (event: React.MouseEvent<HTMLButtonElement>) => void {
        return () => {
            this._removeAction(action);
        };
    }

    @autobind
    private _onRemoveTriggerButtonClick(trigger: BaseTrigger): (event: React.MouseEvent<HTMLButtonElement>) => void {
        return () => {
            this._removeTrigger(trigger);
        };
    }

    private _removeAction(action: BaseAction) {
        this._unsubscribeFromAction(action);
        this._actions = this._actions.filter((a: BaseAction) => !stringEquals(a.id, action.id, true));
        this._emitChanged();
    }

    private _removeTrigger(trigger: BaseTrigger) {
        this._unsubscribeFromTrigger(trigger);
        this._triggers = this._triggers.filter((t: BaseTrigger) => !stringEquals(t.id, trigger.id, true));
        this._emitChanged();
    }

    @autobind
    private _emitChanged() {
        this.notify(null, null);
    }

    private _prepareActions(actionModels: IAction[]): BaseAction[] {
        return actionModels.map(model => {
            const actionType = getActionType(model.name);
            if (!actionType) {
                return null;
            }

            const action = new actionType(model);
            this._subscribeToAction(action);
            return action;
        }).filter(a => a != null);
    }

    private _prepareTriggers(triggerModels: ITrigger[]): BaseTrigger[] {
        return triggerModels.map(model => {
            const triggerType = getTriggerType(model.name);
            if (!triggerType) {
                return null;
            }

            const trigger = new triggerType(model);
            this._subscribeToTrigger(trigger);
            return trigger;
        }).filter(t => t != null);
    }

    private _subscribeToAction(action: BaseAction) {
        action.addChangedListener(this._emitChanged);
    }

    private _subscribeToTrigger(trigger: BaseTrigger) {
        trigger.addChangedListener(this._emitChanged);
    }

    private _unsubscribeFromAction(action: BaseAction) {
        action.removeChangedListener(this._emitChanged);
    }

    private _unsubscribeFromTrigger(trigger: BaseTrigger) {
        trigger.removeChangedListener(this._emitChanged);
    }
}
