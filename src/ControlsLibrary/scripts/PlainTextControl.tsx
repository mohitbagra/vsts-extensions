import "../css/PlainTextControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { AutoResizableComponent } from "Library/Components/Utilities/AutoResizableComponent";
import { Fabric } from "OfficeFabric/Fabric";
import {
    IWorkItemLoadedArgs, IWorkItemNotificationListener
} from "TFS/WorkItemTracking/ExtensionContracts";

interface IPlainTextControlInputs {
    Text: string;
}

interface IPlainTextControlProps {
    text: string;
}

export class PlainTextControl extends AutoResizableComponent<IPlainTextControlProps, {}> {

    public render(): JSX.Element {
        return (
            <Fabric className="plaintext-control">{this.props.text}</Fabric>
        );
    }

    public componentDidMount() {
        super.componentDidMount();
        VSS.register(VSS.getContribution().id, {
            onLoaded: (_args: IWorkItemLoadedArgs) => {
                // do nothing. Just need to register an object to avoid seeing error in browser console.
            }
        } as IWorkItemNotificationListener);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        VSS.unregister(VSS.getContribution().id);
    }
}

export function init() {
    const inputs = VSS.getConfiguration().witInputs as IPlainTextControlInputs;

    ReactDOM.render(
        <PlainTextControl
            text={inputs.Text}
        />,
        document.getElementById("ext-container"));
}
