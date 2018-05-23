import * as format from "date-fns/format";

function convertToString(value: any, upperCase: boolean, useLocale: boolean): string {
    let result: string;

    if (value === null || value === undefined) {
        return "";
    }

    result = useLocale ? value.toLocaleString() : value.toString();

    if (upperCase) {
        result = useLocale ? result.toLocaleUpperCase() : result.toUpperCase();
    }

    return result;
}

export function htmlEncode(str: string): string {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));

    // The trick we are using here doesnt encode quotes. So we have to replace them using regexp search
    return div.innerHTML
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function isNullOrWhiteSpace(str: string): boolean {
    return str == null || str.trim() === "";
}

export function isNullOrEmpty(str: string): boolean {
    return str == null || str === "";
}

export function defaultComparer(a: string, b: string): number {
    if (a === b) {
        return 0;
    }

    const a1 = convertToString(a, false, false);
    const b1 = convertToString(b, false, false);

    if (a1 === b1) {
        return 0;
    }
    else if (a1 > b1) {
        return 1;
    }
    else {
        return -1;
    }
}

export function ignoreCaseComparer(a: string, b: string): number {
    if (a === b) {
        return 0;
    }

    const a1 = convertToString(a, true, false);
    const b1 = convertToString(b, true, false);

    if (a1 === b1) {
        return 0;
    }
    else if (a1 > b1) {
        return 1;
    }
    else {
        return -1;
    }
}

export function localeComparer(a: string, b: string): number {
    if (a === b) {
        return 0;
    }

    const a1 = convertToString(a, false, true);
    const b1 = convertToString(b, false, true);

    return a1.localeCompare(b1);
}

export function localeIgnoreCaseComparer(a: string, b: string): number {
    if (a === b) {
        return 0;
    }

    const a1 = convertToString(a, true, true);
    const b1 = convertToString(b, true, true);

    return a1.localeCompare(b1);
}

export function stringEquals(a: string, b: string, ignoreCase: boolean = false): boolean {
    if (ignoreCase) {
        return localeIgnoreCaseComparer(a, b) === 0;
    }
    else {
        return localeComparer(a, b) === 0;
    }
}

export function startsWith(str: string, prefix: string, comparer?: (param1: string, param2: string) => number): boolean {
    const innerComparer = comparer || defaultComparer;
    return innerComparer(prefix, str.substr(0, prefix.length)) === 0;
}

export function endsWith(str: string, suffix: string, comparer?: (param1: string, param2: string) => number): boolean {
    const innerComparer = comparer || defaultComparer;
    return innerComparer(suffix, str.substr(str.length - suffix.length, suffix.length)) === 0;
}

export function caseInsensitiveContains(str: string, subStr: string): boolean {
    return (str.toLowerCase().indexOf(subStr.toLowerCase()) !== -1);
}

export function toString(val: any): string {
    if (typeof(val) === "boolean") {
        return val ? "True" : "False";
    }
    else if (typeof(val) === "number") {
        return `${val}`;
    }
    else if (val instanceof Date) {
        format(val);
    }
    else {
        return val;
    }
}

export function hashCode(str: string): number {
    if (isNullOrWhiteSpace(str)) { return 0; }

    let hash = 0;
    const trimmedString = str.trim();

    for (let i = 0; i < trimmedString.length; i++) {
        const ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash = hash & hash; // Convert to 32bit integer
    }

    return hash;
}
