import { htmlEncode } from "Common/Utilities/String";

export interface ITableFormatterOptions {
    extendedHtml?: string;
}

export abstract class HtmlTableFormatter<TItem, TColumn> {
    private static readonly HEADER_BACKGROUND_COLOR = "background-color: #106EBE;";
    private static readonly HEADER_COLOR = "color: white;";
    private static readonly FONT_SIZE = "font-size: 11pt;";
    private static readonly FONT_FAMILY = "font-family: Calibri, sans-serif;";
    private static readonly BORDER_COLLAPSE = "border-collapse: collapse;";
    private static readonly COLUMN_BORDER = "border: 1px solid white;";
    private static readonly COLUMN_VERTICAL_ALIGN = "vertical-align: top;";
    private static readonly COLUMN_PADDING = "padding: 1.45pt .05in;";
    private static readonly ROW_BACKGROUND_COLOR = "background-color: #FFFFFF";
    private static readonly ROW_ALT_BACKGROUND_COLOR = "background-color: #F8F8F8";
    private static readonly COLUMN_STYLE = HtmlTableFormatter.COLUMN_BORDER + HtmlTableFormatter.COLUMN_VERTICAL_ALIGN + HtmlTableFormatter.COLUMN_PADDING;
    private static readonly HEADER_STYLE = HtmlTableFormatter.HEADER_BACKGROUND_COLOR + HtmlTableFormatter.HEADER_COLOR;
    private static readonly TABLE_STYLE = HtmlTableFormatter.FONT_FAMILY + HtmlTableFormatter.FONT_SIZE + HtmlTableFormatter.BORDER_COLLAPSE;

    constructor(protected rows: TItem[], protected columns: TColumn[], protected options?: ITableFormatterOptions) {}

    public getHtml(): string {
        if (this.rows.length === 0 || this.columns.length === 0) {
            return "<div></div>";
        }

        const headerRows = this.columns.map(c => `<th style="${HtmlTableFormatter.COLUMN_STYLE}">${htmlEncode(this.getColumnName(c))}</th>`);
        const tableHeader = `<thead style="${HtmlTableFormatter.HEADER_STYLE}"><tr>${headerRows.join("")}</tr></thead>`;
        const tableRows = this.rows.map((row, rowIndex) => {
            const rows = this.columns.map(c => `<td style="${HtmlTableFormatter.COLUMN_STYLE}">${this.getCellValue(row, c)}</td>`);
            const rowStyle = rowIndex % 2 ? HtmlTableFormatter.ROW_ALT_BACKGROUND_COLOR : HtmlTableFormatter.ROW_BACKGROUND_COLOR;

            return `<tr style="${rowStyle}">${rows.join("")}</tr>`;
        });
        const tableBody = `<tbody>${tableRows.join("")}</tbody>`;
        const extendedSection =
            this.options && this.options.extendedHtml ? `<div style="${HtmlTableFormatter.FONT_FAMILY + HtmlTableFormatter.FONT_SIZE}">${this.options.extendedHtml}</div>` : "";
        return `<div><table border="0" cellpadding="0" cellspacing="0" style="${HtmlTableFormatter.TABLE_STYLE}">${tableHeader}${tableBody}</table>${extendedSection}</div>`;
    }

    protected abstract getColumnName(column: TColumn): string;
    protected abstract getCellValue(row: TItem, column: TColumn): string;
}
