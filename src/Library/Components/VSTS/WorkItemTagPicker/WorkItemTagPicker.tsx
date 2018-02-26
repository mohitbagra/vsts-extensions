import "./WorkItemTagPicker.scss";

import * as React from "react";

import { InfoLabel } from "Library/Components/InfoLabel";
import { InputError } from "Library/Components/InputError";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { WorkItemTagActions } from "Library/Flux/Actions/WorkItemTagActions";
import { BaseStore, StoreFactory } from "Library/Flux/Stores/BaseStore";
import { WorkItemTagStore } from "Library/Flux/Stores/WorkItemTagStore";
import { findIndex } from "Library/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import { ValidationState } from "OfficeFabric/components/pickers/BasePicker.types";
import { ITag, TagPicker } from "OfficeFabric/components/pickers/TagPicker/TagPicker";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { autobind, css } from "OfficeFabric/Utilities";
import { WebApiTagDefinition } from "TFS/Core/Contracts";

export interface IWorkItemTagPickerProps extends IBaseFluxComponentProps {
    selectedTags?: string[];
    error?: string;
    label?: string;
    info?: string;
    disabled?: boolean;
    required?: boolean;
    onChange?(tags: string[]): void;
}

export interface IWorkItemTagPickerState extends IBaseFluxComponentState {
    allTags?: WebApiTagDefinition[];
    internalSelectedTags?: string[];
}

export class WorkItemTagPicker extends BaseFluxComponent<IWorkItemTagPickerProps, IWorkItemTagPickerState> {
    private _workItemTagStore = StoreFactory.getInstance<WorkItemTagStore>(WorkItemTagStore);

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemTagStore.isLoaded()) {
            this.setState({
                allTags: this._workItemTagStore.getAll()
            });
        }
        else {
            WorkItemTagActions.initializeTags();
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemTagPickerProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);
        this.setState({internalSelectedTags: nextProps.selectedTags});
    }

    public render(): JSX.Element {
        if (!this.state.allTags) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const {label, disabled, info, className} = this.props;
        const error = this.props.error || this._getDefaultError();

        return (
            <div className={css("work-item-tag-picker", className)}>
                {label && <InfoLabel className="work-item-tag-picker-label" label={label} info={info} />}
                <TagPicker
                    disabled={disabled}
                    selectedItems={(this.state.internalSelectedTags || []).map(t => this._getTag(t))}
                    onResolveSuggestions={this._onTagFilterChanged}
                    getTextFromItem={this._getTagText}
                    onChange={this._onChange}
                    onValidateInput={this._onValidateInput}
                    createGenericItem={this._createGenericItem}
                    inputProps={{
                        style: {
                            height: "26px"
                        }
                    }}
                    pickerSuggestionsProps={
                        {
                            suggestionsHeaderText: "Suggested Tags",
                            noResultsFoundText: "No suggested tags. Press enter to select current input."
                        }
                    }
                />
                {error && <InputError className="work-item-tag-picker-error" error={error} />}
            </div>
        );
    }

    protected getStoresState(): IWorkItemTagPickerState {
        return {
            allTags: this._workItemTagStore.getAll()
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._workItemTagStore];
    }

    protected initializeState() {
        this.state = {
            internalSelectedTags: this.props.selectedTags
        };
    }

    private _getDefaultError(): string {
        if (!this.state.internalSelectedTags || this.state.internalSelectedTags.length === 0) {
            return this.props.required ? "A value is required." : null;
        }

        return null;
    }

    @autobind
    private _onValidateInput(value: string): ValidationState {
        return isNullOrWhiteSpace(value) ? ValidationState.invalid : ValidationState.valid;
    }

    @autobind
    private _createGenericItem(input: string): any {
        return {
            key: input,
            name: input
        };
    }

    @autobind
    private _onChange(items: ITag[]) {
        const selectedTags = items.map(i => i.name);
        this.setState(
            {
                internalSelectedTags: selectedTags
            },
            () => {
                if (this.props.onChange) {
                    this.props.onChange(selectedTags);
                }
            }
        );
    }

    @autobind
    private _getTag(tag: string): ITag {
        return {
            key: tag,
            name: tag
        };
    }

    @autobind
    private _getTagText(tag: ITag): string {
        return tag.name;
    }

    @autobind
    private _onTagFilterChanged(filterText: string, tagList: ITag[]): ITag[] {
        if (isNullOrWhiteSpace(filterText)) {
            return [];
        }

        return this.state.allTags
            .filter(tag => tag.name.toLowerCase().indexOf(filterText.toLowerCase()) === 0 && findIndex(tagList, (t: ITag) => stringEquals(t.key, tag.name, true)) === -1)
            .map(tag => {
                return { key: tag.name, name: tag.name};
            });
    }
}
