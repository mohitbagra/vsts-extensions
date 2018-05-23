import * as format from "date-fns/format";
import * as isValid from "date-fns/is_valid";
import * as parse from "date-fns/parse";

export function isDate(value: string): boolean {
    return isValid(parse(value));
}

export function defaultDateComparer(date1: Date, date2: Date): number {
    if (date1 instanceof Date && date2 instanceof Date) {
        return date1.getTime() - date2.getTime();
    }

    if (date1 instanceof Date) {
        return 1;
    }

    if (date2 instanceof Date) {
        return -1;
    }

    return 0;
}

export function dateEquals(date1: Date, date2: Date): boolean {
    if (date1 === null || date1 === undefined) {
        return date1 === date2;
    }
    else {
        return (date1 instanceof Date) && defaultDateComparer(date1, date2) === 0;
    }
}

export function shiftToUTC(date: Date): Date {
    return new Date(date.getTime() + (date.getTimezoneOffset() * 1000 * 60));
}

export function shiftToLocal(date: Date): Date {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 1000 * 60));
}

export function ago(date: Date): string {
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = (day * 365) / 12;
    const year = day * 365;
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    const steps = [
        { limit: minute, format: "just now" },
        { limit: minute * 1.5, format: "a minute ago" },
        { limit: hour, format: `${Math.round(diff / minute)} minutes ago` },
        { limit: hour * 1.5, format: "an hour ago" },
        { limit: day, format: `${Math.round(diff / hour)} hours ago` },
        { limit: day * 1.5, format: "a day ago" },
        { limit: week, format: `${Math.round(diff / day)} days ago` },
        { limit: week * 1.5, format: "a week ago" },
        { limit: month, format: `${Math.round(diff / week)} weeks ago` },
        { limit: month * 1.5, format: "a month ago" },
        { limit: year, format: `${Math.round(diff / month)} months ago` },
        { limit: year * 1.5, format: "a year ago" },
        { limit: Number.POSITIVE_INFINITY, format: `${Math.round(diff / year)} years ago` }
    ];

    for (const step of steps) {
        if (diff < step.limit) {
            return step.format;
        }
    }

    return "";
}

export function friendly(date: Date): string {
    const day = 60 * 60 * 24;
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    const steps = [
        {
            limit: day,
            format: (dt) => {
                return ago(dt);
            }
        },
        {
            limit: (<any>now - <any>firstDayOfWeek) / 1000,
            format: (dt) => {
                return format(dt, "dddd");
            }
        },
        {
            limit: Number.POSITIVE_INFINITY,
            format: (dt) => {
                return format(dt, "M/D/YYYY");
            }
        }
    ];

    for (const step of steps) {
        if (diff < step.limit && step.limit > 0) {
            return step.format(date);
        }
    }

    return "";
}
