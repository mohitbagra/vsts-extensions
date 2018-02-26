export interface IClipboardOptions {
    copyAsHtml?: boolean;
}

export function copyToClipboard(data: string, options?: IClipboardOptions): boolean {
    let dataCopied = false;
    if (data && typeof data === "string") {
        if (options && options.copyAsHtml) {
            // HTML Copy
            if (supportsNativeHtmlCopy()) {
                try {
                    dataCopied = nativeCopy(data, true);
                }
                catch {
                    // eat up
                }
            }
        }
        else {
            // Plain text copy
            if (supportsNativeCopy()) {
                try {
                    dataCopied = nativeCopy(data, false);
                }
                catch {
                    // eat up
                }
            }
        }
    }

    return dataCopied;
}

export function supportsNativeCopy(): boolean {
    return document.queryCommandSupported("copy") || (<any>window).clipboardData !== undefined;
}

export function supportsNativeHtmlCopy(): boolean {
    return (<any>document.body).createTextRange !== undefined
        || (document.queryCommandSupported("copy") && document.createRange !== undefined);
}

function nativeCopy(data: string, copyAsHtml: boolean): boolean {
    let success = false;

    if (!copyAsHtml && (<any>window).clipboardData !== undefined) {
        (<any>window).clipboardData.setData("text", data);
        success = true;
    }
    else {
        let range;
        let sel;
        // Create an element in the dom with the content to be copied.
        const $copyContent = $("<div/>");
        try {

            // body can have its own background color.
            $copyContent.css("background-color", "white");

            if (copyAsHtml) {
                $copyContent.append(data);
            }
            else {
                $copyContent.css("white-space", "pre");
                $copyContent.text(data);
            }

            if ((<any>document.body).createTextRange) {
                $copyContent.prependTo($("body"));

                range = (<any>document.body).createTextRange();
                range.moveToElementText($copyContent[0]);
                range.select();
                success = range.execCommand("copy");
            }
            else if (document.createRange && window.getSelection) {
                $copyContent.appendTo($("body"));

                range = document.createRange();
                sel = window.getSelection();
                sel.removeAllRanges();

                range.selectNodeContents($copyContent[0]);
                sel.addRange(range);
                success = (<any>document).execCommand("copy");
            }
        }
        finally {
            // Remove the content from the dom.
            $copyContent.remove();
        }
    }

    return success;
}
