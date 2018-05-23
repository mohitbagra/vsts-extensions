export function newGuid(): string {
    // tslint:disable-next-line:insecure-random
    const clockSequenceHi = (128 + Math.floor(Math.random() * 64)).toString(16);
    return `${oct(8)}-${oct(4)}-4${oct(3)}-${clockSequenceHi}${oct(2)}-${oct(12)}`;
}

export function isGuid(str: string): boolean {
    const guidRegex = /^\{?([\dA-F]{8})-?([\dA-F]{4})-?([\dA-F]{4})-?([\dA-F]{4})-?([\dA-F]{12})\}?$/i;
    return guidRegex.test(str);
}

function oct(length?: number): string {
    if (!length) {
        // tslint:disable-next-line:insecure-random
        return (Math.floor(Math.random() * 0x10)).toString(16);
    }

    let result: string = "";
    for (let i: number = 0; i < length; i++) {
        result += oct();
    }

    return result;
}
