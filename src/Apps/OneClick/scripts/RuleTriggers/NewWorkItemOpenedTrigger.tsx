import * as React from "react";

import { IIconProps } from "OfficeFabric/Icon";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { FormEvents } from "OneClick/Constants";
import { BaseTrigger } from "OneClick/RuleTriggers/BaseTrigger";
import { IWorkItemLoadedArgs } from "TFS/WorkItemTracking/ExtensionContracts";

export class NewWorkItemOpenedTrigger extends BaseTrigger {
    public async shouldTrigger(args: IWorkItemLoadedArgs): Promise<boolean> {
        return args.isNew;
    }

    public getFriendlyName(): string {
        return "New work item load";
    }

    public getDescription(): string {
        return "Triggers when a new work item form is opened";
    }

    public isValid(): boolean {
        return true;
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
        return (
            <MessageBar messageBarType={MessageBarType.info}>
                This rule would be automatically triggered when a new work item form is opened.
            </MessageBar>
        );
    }

    public getAssociatedFormEvent(): FormEvents {
        return FormEvents.onLoaded;
    }
}
