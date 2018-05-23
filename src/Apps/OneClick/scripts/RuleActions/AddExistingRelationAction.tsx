import * as React from "react";

import { Loading } from "Common/Components/Loading";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import { isInteger } from "Common/Utilities/Number";
import { isNullOrEmpty, stringEquals } from "Common/Utilities/String";
import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import { IIconProps } from "OfficeFabric/Icon";
import * as ActionRenderers_Async from "OneClick/Components/ActionRenderers";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { translateToFieldValue } from "OneClick/Helpers";
import { BaseMacro } from "OneClick/Macros/Macros";
import { BaseAction } from "OneClick/RuleActions/BaseAction";
import { FieldType } from "TFS/WorkItemTracking/Contracts";

const AsyncAddExistingRelationRenderer = getAsyncLoadedComponent(
    ["scripts/ActionRenderers"],
    (m: typeof ActionRenderers_Async) => m.AddExistingRelationActionRenderer,
    () => <Loading />);

export class AddExistingRelationAction extends BaseAction {
    public async run() {
        // read attributes
        const workItemId = this.getAttribute<string>("workItemId", true);
        const translatedWorkItemId = await translateToFieldValue(workItemId, FieldType.Integer);
        const intWorkItemId = parseInt(translatedWorkItemId, 10);
        if (isNaN(intWorkItemId)) {
            throw `Invalid work item id: ${translatedWorkItemId}`;
        }

        const relationType = this.getAttribute<string>("relationType", true);

        const workItemFormService = await getFormService();
        const relationTypes = await workItemFormService.getWorkItemRelationTypes();
        const selectedRelationType = relationTypes.filter(r => stringEquals(r.name, relationType, true));
        if (!selectedRelationType) {
            throw `Relation type "${relationType}" does not exist`;
        }

        const relation = {
            rel: selectedRelationType[0].referenceName,
            attributes: {
                isLocked: false
            },
            url: `${VSS.getWebContext().collection.uri}/_apis/wit/workitems/${translatedWorkItemId}`
        };
        workItemFormService.addWorkItemRelations([relation]);
    }

    public getFriendlyName(): string {
        return "Link to an existing work item";
    }

    public getDescription(): string {
        return "Link the current work item to an existing work item id.";
    }

    public isValid(): boolean {
        const relationType = this.getAttribute<string>("relationType");
        const workItemId = this.getAttribute<string>("workItemId");

        return StoresHub.workItemRelationTypeStore.isLoaded()
            && !isNullOrEmpty(relationType)
            && StoresHub.workItemRelationTypeStore.itemExists(relationType)
            && !isNullOrEmpty(workItemId)
            && isNullOrEmpty(this._getWorkItemIdError(workItemId));
    }

    public isDirty(): boolean {
        return super.isDirty()
            || !stringEquals(this.getAttribute<string>("workItemId", true), this.getAttribute<string>("workItemId"), true)
            || !stringEquals(this.getAttribute<string>("relationType", true), this.getAttribute<string>("relationType"), true);
    }

    public getIcon(): IIconProps {
        return {
            iconName: "Link",
            styles: {
                root: {color: "#004578 !important"}
            }
        };
    }

    public render(): React.ReactNode {
        const workItemId = this.getAttribute<string>("workItemId");
        const relationType = this.getAttribute<string>("relationType");

        return (
            <div>
                <AsyncAddExistingRelationRenderer
                    workItemId={workItemId}
                    relationType={relationType}
                    onWorkItemIdChange={this._onWorkItemIdChange}
                    onRelationTypeChange={this._onWorkItemRelationTypeChange}
                    valueError={this._getWorkItemIdError(workItemId)}
                />
            </div>
        );
    }

    protected defaultAttributes(): IDictionaryStringTo<any> {
        return {
            workItemId: "",
            relationType: ""
        };
    }

    private _getWorkItemIdError(id: string): string {
        if (BaseMacro.isMacro(id) && BaseMacro.getMacroType(id)) {
            return null;
        }

        return this._validateInteger(id);
    }

    private _validateInteger(value: string): string {
        if (value && !isInteger(value)) {
            return "Invalid integer value";
        }
        return "";
    }

    private _onWorkItemIdChange = (value: string) => {
        this.setAttribute<string>("workItemId", value);
    }

    private _onWorkItemRelationTypeChange = (value: string) => {
        this.setAttribute<string>("relationType", value);
    }
}
