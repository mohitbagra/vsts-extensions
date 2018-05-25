import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { contains } from "Common/Utilities/Array";
import { delegate } from "Common/Utilities/Core";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { stringEquals } from "Common/Utilities/String";
import { Checkbox } from "OfficeFabric/Checkbox";
import { Fabric } from "OfficeFabric/Fabric";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class ConfigureDialog {
    private _configuredWorkItemTypes: string[];
    public async initialize() {
        const witClient = await WitClient.getClient();
        const projectId = VSS.getWebContext().project.id;
        const [configuredWorkItemTypes, allWorkItemTypes] = await Promise.all([
            ExtensionDataManager.readSetting(`wits_${projectId}`, ["Bug", "User Story"], false),
            witClient.getWorkItemTypes(projectId)
        ]);
        this._configuredWorkItemTypes = configuredWorkItemTypes;

        initializeIcons();
        ReactDOM.render(
            <ConfigureDialogComponent
                onToggleWorkItemType={this._onToggleWorkItemType}
                configuredWorkItemTypes={configuredWorkItemTypes}
                allWorkItemTypes={allWorkItemTypes}
            />,
            document.getElementById("dialog-container"));
    }

    private _onToggleWorkItemType = (workItemTypeName: string, toggleOn: boolean) => {
        const witSubscribed = contains(this._configuredWorkItemTypes, workItemTypeName, (w1, w2) => stringEquals(w1, w2, true));
        const projectId = VSS.getWebContext().project.id;

        if (toggleOn && !witSubscribed) {
            this._configuredWorkItemTypes.push(workItemTypeName);
        }
        else if (!toggleOn && witSubscribed) {
            this._configuredWorkItemTypes = this._configuredWorkItemTypes.filter(w1 => !stringEquals(w1, workItemTypeName, true));
        }
        ExtensionDataManager.writeSetting(`wits_${projectId}`, this._configuredWorkItemTypes, false);
    }
}

interface IConfigureDialogComponentProps {
    configuredWorkItemTypes: string[];
    allWorkItemTypes: WorkItemType[];
    onToggleWorkItemType(workItemTypeName: string, toggleOn: boolean);
}

class ConfigureDialogComponent extends React.Component<IConfigureDialogComponentProps, {}> {
    constructor(props: any, context?: any) {
        super(props, context);
        this.state = {};
    }

    public render(): JSX.Element {
        const {allWorkItemTypes, configuredWorkItemTypes} = this.props;
        const configuredWorkItemTypesMap: IDictionaryStringTo<boolean> = {};
        for (const w of configuredWorkItemTypes) {
            configuredWorkItemTypesMap[w.toLowerCase()] = true;
        }
        return (
            <Fabric>
                <div style={{marginBottom: "10px", fontWeight: 600, fontSize: "15px"}}>
                    Select work item types which can be linked to Pull requests.
                </div>
                {allWorkItemTypes.map(w => (
                        <Checkbox
                            styles={{
                                root: {marginBottom: "10px"}
                            }}
                            defaultChecked={!!configuredWorkItemTypesMap[w.name.toLowerCase()]}
                            label={w.name}
                            onChange={delegate(this, this._onToggle, w)}
                        />
                    ))}
            </Fabric>
        );
    }

    private _onToggle = (_ev: React.FormEvent<HTMLElement | HTMLInputElement>, checked: boolean, workItemType: WorkItemType) => {
        this.props.onToggleWorkItemType(workItemType.name, checked);
    }
}
