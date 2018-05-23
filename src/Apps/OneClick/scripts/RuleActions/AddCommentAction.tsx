import * as React from "react";

import { Loading } from "Common/Components/Loading";
import { DEFAULT_BUTTONS } from "Common/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import { isNullOrEmpty, stringEquals } from "Common/Utilities/String";
import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import { IIconProps } from "OfficeFabric/Icon";
import * as ActionRenderers_Async from "OneClick/Components/ActionRenderers";
import { CoreFieldRefNames } from "OneClick/Constants";
import { BaseAction } from "OneClick/RuleActions/BaseAction";

const AsyncRichEditor = getAsyncLoadedComponent(
    ["scripts/ActionRenderers"],
    (m: typeof ActionRenderers_Async) => m.RichEditor,
    () => <Loading />);

export class AddCommentAction extends BaseAction {
    public async run() {
        const formService = await getFormService();
        await formService.setFieldValue(CoreFieldRefNames.History, this.getAttribute<string>("comment", true) || "");
    }

    public getFriendlyName(): string {
        return "Add a comment";
    }

    public getDescription(): string {
        return "Adds a comment in work item discussion";
    }

    public isValid(): boolean {
        return !isNullOrEmpty(this.getAttribute<string>("comment"));
    }

    public isDirty(): boolean {
        return super.isDirty() || !stringEquals(this.getAttribute<string>("comment", true), this.getAttribute<string>("comment"), true);
    }

    public getIcon(): IIconProps {
        return {
            iconName: "CommentAdd",
            styles: {
                root: {color: "#EA4300 !important"}
            }
        };
    }

    public render(): React.ReactNode {
        return (
            <div>
                <AsyncRichEditor
                    className="action-property-control"
                    value={this.getAttribute<string>("comment")}
                    label="Comment"
                    info="Enter comment"
                    delay={200}
                    editorOptions={{
                        buttons: DEFAULT_BUTTONS
                    }}
                    onChange={this._onCommentChange}
                />
            </div>
        );
    }

    protected defaultAttributes(): IDictionaryStringTo<any> {
        return {
            comment: ""
        };
    }

    private _onCommentChange = (value: string) => {
        this.setAttribute<string>("comment", value);
    }
}
