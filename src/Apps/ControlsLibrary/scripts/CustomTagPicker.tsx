import * as React from "react";

import { BasePicker } from "OfficeFabric/components/pickers/BasePicker";
import { IBasePickerProps } from "OfficeFabric/components/pickers/BasePicker.types";
import { IPickerItemProps } from "OfficeFabric/components/pickers/PickerItem.types";
import { TagItem } from "OfficeFabric/components/pickers/TagPicker/TagItem";
import { ITag } from "OfficeFabric/components/pickers/TagPicker/TagPicker";
import { autobind, css } from "OfficeFabric/Utilities";

export interface ICustomTagPickerProps extends IBasePickerProps<ITag> {
    suggestionsListClassName?: string;
    onToggleCallout(show: boolean): void;
}

export class CustomTagPicker extends BasePicker<ITag, ICustomTagPickerProps> {
    protected static defaultProps = {
        onRenderItem: (props: IPickerItemProps<ITag>) => { return <TagItem {...props}>{props.item.name}</TagItem>; },
        onRenderSuggestionsItem: (props: ITag) => <div className={css("ms-TagItem-TextOverflow")}>{props.name}</div>
    };

    @autobind
    protected onInputBlur(ev: React.FocusEvent<HTMLInputElement>): void {
        super.onInputBlur(ev);
        if (this.props.inputProps && this.props.inputProps.onBlur) {
            this.props.inputProps.onBlur(ev);
        }
    }

    protected renderSuggestions(): JSX.Element | null {
        this.props.onToggleCallout(this.state.suggestionsVisible);

        const TypedSuggestion = this.SuggestionOfProperType;
        return this.state.suggestionsVisible && this.input ? (
            <TypedSuggestion
                className={this.props.suggestionsListClassName}
                onRenderSuggestion={this.props.onRenderSuggestionsItem}
                onSuggestionClick={this.onSuggestionClick}
                onSuggestionRemove={this.onSuggestionRemove}
                suggestions={this.suggestionStore.getSuggestions()}
                ref={this._resolveRef("suggestionElement")}
                onGetMoreResults={this.onGetMoreResults}
                moreSuggestionsAvailable={this.state.moreSuggestionsAvailable}
                isLoading={this.state.suggestionsLoading}
                isSearching={this.state.isSearching}
                isMostRecentlyUsedVisible={this.state.isMostRecentlyUsedVisible}
                isResultsFooterVisible={this.state.isResultsFooterVisible}
                refocusSuggestions={this.refocusSuggestions}
                removeSuggestionAriaLabel={this.props.removeButtonAriaLabel}
                {...this.props.pickerSuggestionsProps as any}
            />
        ) : (null);
    }
}
