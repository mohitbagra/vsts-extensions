import { AutoResizableComponent } from "Common/Components/Utilities/AutoResizableComponent";
import {
    IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { delay, DelayedFunction } from "Common/Utilities/Core";
import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import * as WitExtensionContracts from "TFS/WorkItemTracking/ExtensionContracts";

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
    private _delayedFunction: DelayedFunction;

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
        this._disposeDelayedFunction();
    }

    /**
     * Flushes the control's value to the field
     */
    protected onValueChanged(newValue: TDataType, immediate: boolean = true) {
        this._disposeDelayedFunction();

        const setValue = async () => {
            this._setValue(newValue);
            const formService = await getFormService();
            this._flushing = true;
            try {
                await formService.setFieldValue(this.props.fieldName, newValue);
                this._flushing = false;
            }
            catch (e) {
                this._flushing = false;
                this._onError(`Error in storing the field value: ${e.message}`);
            }
        };

        if (immediate) {
            setValue();
        }
        else {
            this._delayedFunction = delay(this, 200, () => {
                setValue();
            });
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
        try {
            const formService = await getFormService();
            return await formService.getFieldValue(this.props.fieldName) as TDataType;
        }
        catch (e) {
            this._onError(`Error in loading the field value: ${e.message}`);
            return null;
        }
    }

    private _setValue(value: TDataType) {
        this._disposeDelayedFunction();
        this.setState({value: value, error: this.getErrorMessage(value)});
    }

    private _onError(error: string) {
        this.setState({error: error});
    }

    private _disposeDelayedFunction() {
        if (this._delayedFunction) {
            this._delayedFunction.cancel();
            this._delayedFunction = null;
        }
    }
}
