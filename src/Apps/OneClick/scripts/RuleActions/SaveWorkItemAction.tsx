import * as React from "react";

import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import { IIconProps } from "OfficeFabric/Icon";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { BaseAction } from "OneClick/RuleActions/BaseAction";

export class SaveWorkItemAction extends BaseAction {
    public async run() {
        const workItemFormService = await getFormService();
        const isValid = await workItemFormService.isValid();
        const isDirty = await workItemFormService.isDirty();

        if (isValid && isDirty) {
            await workItemFormService.save();
        }
    }

    public getFriendlyName(): string {
        return "Save Work item";
    }

    public getDescription(): string {
        return "Save the current work item";
    }

    public isValid(): boolean {
        return true;
    }

    public getIcon(): IIconProps {
        return {
            iconName: "Save",
            styles: {
                root: {color: "#0078D7 !important"}
            }
        };
    }

    public render(): React.ReactNode {
        return (
            <MessageBar messageBarType={MessageBarType.info}>
                Save the current work item.
            </MessageBar>
        );
    }
}
