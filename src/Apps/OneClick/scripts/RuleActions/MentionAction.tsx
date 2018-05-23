import * as React from "react";

import { Loading } from "Common/Components/Loading";
import { DEFAULT_BUTTONS } from "Common/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import { parseUniquefiedIdentityName } from "Common/Utilities/Identity";
import { isNullOrEmpty, stringEquals } from "Common/Utilities/String";
import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import { IIconProps } from "OfficeFabric/Icon";
import * as ActionRenderers_Async from "OneClick/Components/ActionRenderers";
import { CoreFieldRefNames } from "OneClick/Constants";
import { translateToFieldValue } from "OneClick/Helpers";
import { BaseAction } from "OneClick/RuleActions/BaseAction";
import { FieldType } from "TFS/WorkItemTracking/Contracts";

const AsyncRichEditor = getAsyncLoadedComponent(
    ["scripts/ActionRenderers"],
    (m: typeof ActionRenderers_Async) => m.RichEditor,
    () => <Loading />);

const AsyncThrottledTextField = getAsyncLoadedComponent(
    ["scripts/ActionRenderers"],
    (m: typeof ActionRenderers_Async) => m.ThrottledTextField,
    () => <Loading />);

export class MentionAction extends BaseAction {
    public async run() {
        const warnMessage = "A recent change in VSTS mention feature makes it incompatible with one click's \"Mention someone\" action. " +
        "Due to this, mentioning someone is temporarily suspended from the extension.";
        console.warn(warnMessage);

        const personNames = this.getAttribute<string>("personNames", true) || "";
        const message = this.getAttribute<string>("message", true) || "";
        let mentionsString = "";

        const personNamesArr = personNames.split(";").map((t: string) => t.trim());
        if (personNamesArr.length > 0) {
            const translatedPersonNames = await Promise.all(personNamesArr.map(v => translateToFieldValue(v, FieldType.String)));

            for (const personName of translatedPersonNames) {
                if (personName) {
                    const entity = parseUniquefiedIdentityName(personName as string);
                    // const mentionStr = `<a href='mailto:${entity.uniqueName || entity.displayName || ""}' data-vss-mention='version:1.0'>@${entity.displayName}</a>`;
                    const mentionStr = `@${entity.displayName}`;
                    mentionsString = mentionsString ? `${mentionsString} ${mentionStr}` : mentionStr;
                }
            }

            const formService = await getFormService();
            await formService.setFieldValue(CoreFieldRefNames.History, `${mentionsString} ${message}`);
        }
    }

    public getFriendlyName(): string {
        return "Mention someone";
    }

    public getDescription(): string {
        // return "Mention someone in the work item";
        return "A recent change in VSTS mention feature makes it incompatible with one click's \"Mention someone\" action. " +
        "Due to this, mentioning someone is temporarily suspended from the extension.";
    }

    public isDirty(): boolean {
        return super.isDirty()
            || !stringEquals(this.getAttribute<string>("personNames", true), this.getAttribute<string>("personNames"), true)
            || !stringEquals(this.getAttribute<string>("message", true), this.getAttribute<string>("message"), true);
    }

    public isValid(): boolean {
        return !isNullOrEmpty(this.getAttribute<string>("personNames"));
    }

    public getIcon(): IIconProps {
        return {
            iconName: "Accounts",
            styles: {
                root: {color: "#004578 !important"}
            }
        };
    }

    public isDisabled(): boolean {
        return true;
    }

    public render(): React.ReactNode {
        return (
            <div>
                <AsyncThrottledTextField
                    className="action-property-control"
                    value={this.getAttribute<string>("personNames")}
                    label="Users"
                    info="Enter semicolon separated list of email addresses. Supported macros - @fieldValue, @me."
                    required={true}
                    resizable={false}
                    multiline={true}
                    delay={200}
                    onChanged={this._onPersonsChange}
                />
                <AsyncRichEditor
                    className="action-property-control"
                    value={this.getAttribute<string>("message")}
                    label="Message"
                    info="Enter comment"
                    delay={200}
                    editorOptions={{
                        buttons: DEFAULT_BUTTONS
                    }}
                    onChange={this._onMessageChange}
                />
            </div>
        );
    }

    protected defaultAttributes(): IDictionaryStringTo<any> {
        return {
            personNames: "",
            message: ""
        };
    }

    private _onPersonsChange = (value: string) => {
        this.setAttribute<string>("personNames", value);
    }

    private _onMessageChange = (value: string) => {
        this.setAttribute<string>("message", value);
    }
}
