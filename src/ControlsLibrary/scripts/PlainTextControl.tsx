import "../css/PlainTextControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { AutoResizableComponent } from "Library/Components/Utilities/AutoResizableComponent";
import { first } from "Library/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import * as MarkdownIt from "markdown-it";
import { Fabric } from "OfficeFabric/Fabric";
import {
    IWorkItemChangedArgs, IWorkItemLoadedArgs, IWorkItemNotificationListener
} from "TFS/WorkItemTracking/ExtensionContracts";
import { WorkItemFormService } from "TFS/WorkItemTracking/Services";

interface IPlainTextControlInputs {
    Text: string;
}

interface IPlainTextControlProps {
    text: string;
}

interface IPlainTextControlState {
    translatedText: string;
}

function unescape(html: string): string {
    return html
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'");
}

async function processString(str: string): Promise<string> {
    if (isNullOrWhiteSpace(str)) {
        return str;
    }

    const fieldValueRegex = /\${@fieldValue=\w[\w\s\d]*\w}/gi;
    const matches = str.match(fieldValueRegex);
    if (matches && matches.length > 0) {
        let returnStr = str;
        const fieldValues = await Promise.all(matches.map(m => {
            const fieldName = m.replace("$\{@fieldValue=", "").replace("}", "").trim();
            return getFieldValue(fieldName);
        }));

        matches.forEach((m, i) => {
            const fieldValue = fieldValues[i] || "";
            returnStr = returnStr.replace(m, fieldValue.toString());
        });

        return returnStr;
    }
    else {
        return str;
    }
}

async function getFieldValue(fieldName: string): Promise<any> {
    const service = await WorkItemFormService.getService();
    if (stringEquals(fieldName, "id", true)) {
        return await service.getId();
    }
    try {
        const fields = await service.getFields();
        const field = first(fields, (f) => {
            return stringEquals(f.name, fieldName, true) || stringEquals(f.referenceName, fieldName, true);
        });

        if (field) {
            return await service.getFieldValue(field.referenceName);
        }
        else {
            return null;
        }
    }
    catch {
        return null;
    }
}

export class PlainTextControl extends AutoResizableComponent<IPlainTextControlProps, IPlainTextControlState> {
    private _markdown: MarkdownIt.MarkdownIt;

    constructor(props: IPlainTextControlProps, context?: any) {
        super(props, context);
        this.state = {translatedText: null};
        this._markdown = new MarkdownIt({
            linkify: true
        });
    }

    public render(): JSX.Element {
        if (this.state.translatedText != null) {
            const html = unescape(this._markdown.render(this.state.translatedText));
            return (
                <Fabric className="plaintext-control">
                    <div dangerouslySetInnerHTML={{__html: html}} />
                </Fabric>
            );
        }
        else {
            return null;
        }
    }

    public componentDidMount() {
        super.componentDidMount();
        VSS.register(VSS.getContribution().id, {
            onLoaded: (_args: IWorkItemLoadedArgs) => {
                this._setText();
            },
            onUnloaded: (_args: IWorkItemChangedArgs) => {
                this.setState({translatedText: null});
            }
        } as IWorkItemNotificationListener);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        VSS.unregister(VSS.getContribution().id);
    }

    private async _setText() {
        const translatedText = await processString(this.props.text);
        this.setState({translatedText: translatedText});
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
