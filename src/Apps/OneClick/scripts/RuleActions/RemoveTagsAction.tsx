import * as React from "react";

import { Loading } from "Common/Components/Loading";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import { subtract } from "Common/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import { IIconProps } from "OfficeFabric/Icon";
import * as ActionRenderers_Async from "OneClick/Components/ActionRenderers";
import { CoreFieldRefNames } from "OneClick/Constants";
import { BaseAction } from "OneClick/RuleActions/BaseAction";

const AsyncWorkItemTagPicker = getAsyncLoadedComponent(
    ["scripts/ActionRenderers"],
    (m: typeof ActionRenderers_Async) => m.WorkItemTagPicker,
    () => <Loading />);

export class RemoveTagsAction extends BaseAction {
    public async run() {
        const formService = await getFormService();
        const tags = await formService.getFieldValue(CoreFieldRefNames.Tags) as string;
        const tagsToRemove = (this.getAttribute<string>("tags", true) as string).split(";").map((t: string) => t.trim());
        if (tags) {
            const existingTags = tags.split(";").map((t: string) => t.trim());
            const newTags = subtract(existingTags, tagsToRemove, (s1, s2) => stringEquals(s1, s2, true));

            await formService.setFieldValue(CoreFieldRefNames.Tags, newTags.join(";"));
        }
    }

    public getFriendlyName(): string {
        return "Remove tags";
    }

    public getDescription(): string {
        return "Removes tags from the workitem";
    }

    public isDirty(): boolean {
        return super.isDirty() || !stringEquals(this.getAttribute<string>("tags", true), this.getAttribute<string>("tags"), true);
    }

    public isValid(): boolean {
        return !isNullOrWhiteSpace(this.getAttribute<string>("tags"));
    }

    public getIcon(): IIconProps {
        return {
            iconName: "Tag",
            styles: {
                root: {color: "#da0a00 !important"}
            }
        };
    }

    public render(): React.ReactNode {
        const value = this.getAttribute<string>("tags");
        const tags = isNullOrWhiteSpace(value) ? [] : value.split(";");

        return (
            <div>
                <AsyncWorkItemTagPicker
                    className="action-property-control"
                    selectedTags={tags}
                    label="Remove tags"
                    info="Select tags to be removed"
                    required={true}
                    onChange={this._onTagsChange}
                />
            </div>
        );
    }

    protected defaultAttributes(): IDictionaryStringTo<any> {
        return {
            tags: ""
        };
    }

    private _onTagsChange = (tags: string[]) => {
        this.setAttribute<string>("tags", tags.join(";"));
    }
}
