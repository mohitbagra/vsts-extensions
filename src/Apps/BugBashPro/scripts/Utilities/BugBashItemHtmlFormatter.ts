import { BugBashItemFieldNames, WorkItemFieldNames } from "BugBashPro/Constants";
import { BugBashItem } from "BugBashPro/ViewModels/BugBashItem";
import { HtmlTableFormatter } from "Common/Utilities/HtmlTableFormatter";
import { IColumn } from "OfficeFabric/DetailsList";

export class BugBashItemHtmlFormatter extends HtmlTableFormatter<BugBashItem, IColumn> {
    protected getCellValue(row: BugBashItem, column: IColumn): string {
        return row.getStringValue(column.key as BugBashItemFieldNames | WorkItemFieldNames);
    }

    protected getColumnName(column: IColumn): string {
        return column.name;
    }
}
