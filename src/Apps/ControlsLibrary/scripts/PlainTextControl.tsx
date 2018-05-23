import "../css/PlainTextControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { AutoResizableComponent } from "Common/Components/Utilities/AutoResizableComponent";
import { first } from "Common/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import * as MarkdownIt from "markdown-it";
import { Fabric } from "OfficeFabric/Fabric";
import {
    IWorkItemChangedArgs, IWorkItemLoadedArgs, IWorkItemNotificationListener
} from "TFS/WorkItemTracking/ExtensionContracts";

interface IPlainTextControlInputs {
    Text: string;
    MaxHeight: number;
}

interface IPlainTextControlProps {
    text: string;
    maxHeight: number;
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
    const formService = await getFormService();
    if (stringEquals(fieldName, "id", true)) {
        return formService.getId();
    }
    try {
        const fields = await formService.getFields();
        const field = first(fields, (f) => {
            return stringEquals(f.name, fieldName, true) || stringEquals(f.referenceName, fieldName, true);
        });

        if (field) {
            return await formService.getFieldValue(field.referenceName);
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

        // Remember old renderer, if overriden, or proxy to default renderer

        const defaultRender = (tokens, idx, options, _env, self) => {
            return self.renderToken(tokens, idx, options);
        };
        const renderer = this._markdown.renderer.rules.link_open || defaultRender;

        this._markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
            // If you are sure other plugins can't add `target` - drop check below
            const aIndex = tokens[idx].attrIndex("target");

            if (aIndex < 0) {
                tokens[idx].attrPush(["target", "_blank"]); // add new attribute
            } else {
                tokens[idx].attrs[aIndex][1] = "_blank";    // replace value of existing attr
            }

            // pass token to default renderer.
            return renderer(tokens, idx, options, env, self);
        };
    }

    public render(): JSX.Element {
        return (
            <Fabric className="plaintext-control" style={{maxHeight: this.props.maxHeight}}>
                {this.state.translatedText && <div dangerouslySetInnerHTML={{__html: this.state.translatedText}} />}
            </Fabric>
        );
    }

    public componentDidMount() {
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
        VSS.unregister(VSS.getContribution().id);
    }

    private async _setText() {
        const translatedText = await processString(this.props.text);
        this.setState({translatedText: unescape(this._markdown.render(translatedText))});
    }
}

export function init() {
    const inputs = VSS.getConfiguration().witInputs as IPlainTextControlInputs;

    ReactDOM.render(
        <PlainTextControl
            text={inputs.Text}
            maxHeight={inputs.MaxHeight || 350}
        />,
        document.getElementById("ext-container"));
}
