import * as React from "react";

import { Loading } from "Common/Components/Loading";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import { WorkItemActions } from "Common/Flux/Actions/WorkItemActions";
import { WorkItemTemplateItemActions } from "Common/Flux/Actions/WorkItemTemplateItemActions";
import { isNullOrEmpty, stringEquals } from "Common/Utilities/String";
import { getFormNavigationService, getFormService } from "Common/Utilities/WorkItemFormHelpers";
import { IIconProps } from "OfficeFabric/Icon";
import * as ActionRenderers_Async from "OneClick/Components/ActionRenderers";
import { CoreFieldRefNames } from "OneClick/Constants";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { translateToFieldValue } from "OneClick/Helpers";
import { BaseAction } from "OneClick/RuleActions/BaseAction";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";

const AsyncAddNewRelationRenderer = getAsyncLoadedComponent(
    ["scripts/ActionRenderers"],
    (m: typeof ActionRenderers_Async) => m.AddNewRelationActionRenderer,
    () => <Loading />);

export class AddNewRelationAction extends BaseAction {
    public async run() {
        // read attributes
        const workItemType = this.getAttribute<string>("workItemType", true);
        const relationType = this.getAttribute<string>("relationType", true);
        const teamId = this.getAttribute<string>("teamId", true);
        const templateId = this.getAttribute<string>("templateId", true);
        const autoCreate = this.getAttribute<boolean>("autoCreate", true);
        let savedWorkItem: WorkItem;

        const workItemFormService = await getFormService();
        const project = await workItemFormService.getFieldValue(CoreFieldRefNames.TeamProject) as string;

        // read template
        await WorkItemTemplateItemActions.initializeWorkItemTemplateItem(teamId, templateId, project);
        const template = StoresHub.workItemTemplateItemStore.getItem(templateId);

        // read fields from template
        const templateMap = {...template.fields};
        if (templateMap["System.Tags-Add"]) {
            templateMap["System.Tags"] = templateMap["System.Tags-Add"];
        }
        delete templateMap["System.Tags-Add"];
        delete templateMap["System.Tags-Remove"];
        const translatedFieldValuesMap: IDictionaryStringTo<any> = {};

        // translate field values (for macros usage)
        for (const templateFieldRefName of Object.keys(templateMap)) {
            const fieldValue = templateMap[templateFieldRefName];
            const translatedFieldValue = await translateToFieldValue(fieldValue || "");
            translatedFieldValuesMap[templateFieldRefName] = translatedFieldValue;
        }

        if (autoCreate) {
            try {
                // create work item
                savedWorkItem = await WorkItemActions.createWorkItem(workItemType, translatedFieldValuesMap, project);
            }
            catch (e) {
                throw `Could not create work item. Error: ${e}. Please check the template used in this action.`;
            }
        }
        else {
            const workItemNavSvc = await getFormNavigationService();
            savedWorkItem = await workItemNavSvc.openNewWorkItem(workItemType, translatedFieldValuesMap);
        }

        if (savedWorkItem) {
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
                url: savedWorkItem.url
            };
            workItemFormService.addWorkItemRelations([relation]);
        }
    }

    public getFriendlyName(): string {
        return "Add a new linked work item";
    }

    public getDescription(): string {
        return "Creates a work item using a given template and link it to current work item";
    }

    public isValid(): boolean {
        const workItemType = this.getAttribute<string>("workItemType");
        const relationType = this.getAttribute<string>("relationType");
        const teamId = this.getAttribute<string>("teamId");
        const templateId = this.getAttribute<string>("templateId");

        return StoresHub.workItemTypeStore.isLoaded()
            && StoresHub.teamStore.isLoaded()
            && StoresHub.workItemRelationTypeStore.isLoaded()
            && !isNullOrEmpty(workItemType)
            && StoresHub.workItemTypeStore.itemExists(workItemType)
            && !isNullOrEmpty(relationType)
            && StoresHub.workItemRelationTypeStore.itemExists(relationType)
            && !isNullOrEmpty(teamId)
            && StoresHub.teamStore.itemExists(teamId)
            && !isNullOrEmpty(templateId)
            && StoresHub.workItemTemplateStore.getTemplate(templateId) != null;
    }

    public isDirty(): boolean {
        return super.isDirty()
            || !stringEquals(this.getAttribute<string>("workItemType", true), this.getAttribute<string>("workItemType"), true)
            || !stringEquals(this.getAttribute<string>("relationType", true), this.getAttribute<string>("relationType"), true)
            || !stringEquals(this.getAttribute<string>("teamId", true), this.getAttribute<string>("teamId"), true)
            || !stringEquals(this.getAttribute<string>("templateId", true), this.getAttribute<string>("templateId"), true)
            || this.getAttribute<boolean>("autoCreate", true) !== this.getAttribute<boolean>("autoCreate");
    }

    public getIcon(): IIconProps {
        return {
            iconName: "WorkItem",
            styles: {
                root: {color: "#004578 !important"}
            }
        };
    }

    public render(): React.ReactNode {
        const workItemType = this.getAttribute<string>("workItemType");
        const relationType = this.getAttribute<string>("relationType");
        const teamId = this.getAttribute<string>("teamId");
        const templateId = this.getAttribute<string>("templateId");
        const autoCreate = this.getAttribute<boolean>("autoCreate");

        return (
            <div>
                <AsyncAddNewRelationRenderer
                    workItemType={workItemType}
                    relationType={relationType}
                    teamId={teamId}
                    templateId={templateId}
                    autoCreate={autoCreate}
                    onWorkItemTypeChange={this._onWorkItemTypeChange}
                    onRelationTypeChange={this._onWorkItemRelationTypeChange}
                    onTeamChange={this._onTeamChange}
                    onTemplateChange={this._onTemplateChange}
                    onAutoCreateChange={this._onAutoCreateChange}
                />
            </div>
        );
    }

    protected defaultAttributes(): IDictionaryStringTo<any> {
        return {
            workItemType: "",
            relationType: "",
            teamId: "",
            templateId: "",
            autoCreate: false
        };
    }

    protected preProcessAttributes(attributes: IDictionaryStringTo<any>): IDictionaryStringTo<any> {
        if (attributes["autoCreate"] == null) {
            return {...attributes, autoCreate: true};
        }
        return {...attributes};
    }

    private _onAutoCreateChange = (value: boolean) => {
        this.setAttribute<boolean>("autoCreate", value);
    }

    private _onWorkItemTypeChange = (value: string) => {
        this.setAttribute<string>("workItemType", value);
    }

    private _onWorkItemRelationTypeChange = (value: string) => {
        this.setAttribute<string>("relationType", value);
    }

    private _onTeamChange = (value: string) => {
        this.setAttribute<string>("teamId", value, false);
        this.setAttribute<string>("templateId", "");
    }

    private _onTemplateChange = (value: string) => {
        this.setAttribute<string>("templateId", value);
    }
}
