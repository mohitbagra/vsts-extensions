import { AutoResizableComponent } from "Library/Components/Utilities/AutoResizableComponent";
import {
    IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import * as WitExtensionContracts from "TFS/WorkItemTracking/ExtensionContracts";
import { WorkItemFormService } from "TFS/WorkItemTracking/Services";

export interface IWorkItemFieldControlProps extends IBaseFluxComponentProps {
    fieldName: string;
}

export interface IWorkItemFieldControlState<T> extends IBaseFluxComponentState {
    error?: string;
    value?: T;
}

export abstract class WorkItemFieldControl<TDataType, TP extends IWorkItemFieldControlProps, TS extends IWorkItemFieldControlState<TDataType>> extends AutoResizableComponent<TP, TS> {
    public static getInputs<T>() {
        return VSS.getConfiguration().witInputs as T;
    }

    private _flushing: boolean;

    public componentDidMount() {
        super.componentDidMount();
        const { fieldName } = this.props;

        VSS.register(VSS.getContribution().id, {
            onLoaded: (_args: WitExtensionContracts.IWorkItemLoadedArgs) => {
                this._invalidate();
            },
            onUnloaded: (_args: WitExtensionContracts.IWorkItemChangedArgs) => {
                this._setValue(null);
            },
            onFieldChanged: (args: WitExtensionContracts.IWorkItemFieldChangedArgs) => {
                if (args.changedFields[fieldName] != null) {
                    this._invalidate();
                }
            },
        } as WitExtensionContracts.IWorkItemNotificationListener);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        VSS.unregister(VSS.getContribution().id);
    }

    /**
     * Flushes the control's value to the field
     */
    protected async onValueChanged(newValue: TDataType): Promise<void> {
        this._setValue(newValue);

        this._flushing = true;
        const workItemFormService = await WorkItemFormService.getService();
        try {
            await workItemFormService.setFieldValue(this.props.fieldName, newValue);
            this._flushing = false;
        }
        catch (e) {
            this._flushing = false;
            this._onError(`Error in storing the field value: ${e.message}`);
        }
    }

    protected getErrorMessage(_value: TDataType): string {
        return "";
    }

    /**
     * Invalidate the control's value
     */
    private async _invalidate(): Promise<void> {
        if (!this._flushing) {
            const value = await this._getCurrentFieldValue();
            this._setValue(value as TDataType);
        }

        this.resize();
    }

    private async _getCurrentFieldValue(): Promise<TDataType> {
        const workItemFormService = await WorkItemFormService.getService();
        try {
            return await workItemFormService.getFieldValue(this.props.fieldName) as TDataType;
        }
        catch (e) {
            this._onError(`Error in loading the field value: ${e.message}`);
            return null;
        }
    }

    private _setValue(value: TDataType) {
        this.setState({value: value, error: this.getErrorMessage(value)});
    }

    private _onError(error: string) {
        this.setState({error: error});
    }
}
