export class Rgb {
    public static MinValue = 0;
    public static MaxValue = 255;
    private red: number;
    private green: number;
    private blue: number;

    constructor(red: number, green: number, blue: number) {
        if (red < 0 || red > 255) {
            throw Error(`Red value must be between ${Rgb.MinValue} and ${Rgb.MaxValue} inclusively.`);
        }
        if (green < 0 || green > 255) {
            throw Error(`Green value must be between ${Rgb.MinValue} and ${Rgb.MaxValue} inclusively.`);
        }
        if (blue < 0 || blue > 255) {
            throw Error(`Blue value must be between ${Rgb.MinValue} and ${Rgb.MaxValue} inclusively.`);
        }
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    public getRed(): number {
        return this.red;
    }

    public getGreen(): number {
        return this.green;
    }

    public getBlue(): number {
        return this.blue;
    }
}

export class Color {
    private _value: Rgb;

    constructor(color: string | Rgb) {
        if (color == null) {
            throw new Error("color must be defined");
        }
        if (typeof color === "string") {
            this.convertStringColorToRgb(<string>color);
        }
        else if (color instanceof Rgb) {
            this._value = <Rgb>color;
        } else {
            throw new Error("color not in a known type");
        }
    }

    public asHex(): string {
        return `#${((1 << 24) + (this._value.getRed() << 16) + (this._value.getGreen() << 8) + this._value.getBlue()).toString(16).slice(1)}`;
    }

    public asRgb(): string {
        return `rgb(${this._value.getRed()},${this._value.getGreen()},${this._value.getBlue()})`;
    }

    public asRgba(alpha: number): string {
        return `rgb(${this._value.getRed()},${this._value.getGreen()},${this._value.getBlue()},${alpha})`;
    }

    public convertStringColorToRgb(colorInString: string): void {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        colorInString = colorInString.replace(shorthandRegex, (_m, r, g, b) => (r + r + g + g + b + b));

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorInString);
        if (result != null) {
            this._value = new Rgb(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16));
        } else {
            throw new Error("Color in string only support Hex format");
        }

    }

    public equals(color: Color): boolean {
        return color != null && this.asHex() === color.asHex();
    }

    public getRed(): number {
        return this._value.getRed();
    }
    public getGreen(): number {
        return this._value.getGreen();
    }
    public getBlue(): number {
        return this._value.getBlue();
    }

    public convertToGrayscale(): Color {
        const sumColor = this.getRed() + this.getGreen() + this.getBlue();
        const gray = Math.floor(sumColor / 3);
        const rgb = new Rgb(gray, gray, gray);
        return new Color(rgb);
    }

    public invert(): Color {
        return new Color(new Rgb(Rgb.MaxValue - this.getRed(), Rgb.MaxValue - this.getGreen(), Rgb.MaxValue - this.getBlue()));
    }

    public toBlackOrWhite(): Color {
        const colorInvertedAndGray = this.convertToGrayscale();
        if (colorInvertedAndGray.getRed() < Rgb.MaxValue / 2) {
            return new Color("#000000");
        }
        return new Color("#ffffff");
    }

    public isLightColor(): boolean {
        return this.getRed() > 248 && this.getBlue() > 248 && this.getGreen() > 248;
    }
}

export class AccessibilityColor extends Color {
    public static FullPaletteColors: AccessibilityColor[] = [
        new AccessibilityColor("#222222"), new AccessibilityColor("#292E6B"), new AccessibilityColor("#009CCC"), new AccessibilityColor("#00643A"),
        new AccessibilityColor("#339947"), new AccessibilityColor("#FBBC3D"), new AccessibilityColor("#DB552C"), new AccessibilityColor("#7F1725"),
        new AccessibilityColor("#EC008C"), new AccessibilityColor("#5C197B"), new AccessibilityColor("#51399F"), new AccessibilityColor("#444444"),
        new AccessibilityColor("#1B478B"), new AccessibilityColor("#43B4D5"), new AccessibilityColor("#207752"), new AccessibilityColor("#60AF49"),
        new AccessibilityColor("#FBD144"), new AccessibilityColor("#E87025"), new AccessibilityColor("#B20B1E"), new AccessibilityColor("#EF33A3"),
        new AccessibilityColor("#71338D"), new AccessibilityColor("#6951AA"), new AccessibilityColor("#666666"), new AccessibilityColor("#0D60AB"),
        new AccessibilityColor("#86CDDE"), new AccessibilityColor("#56987D"), new AccessibilityColor("#8DC54B"), new AccessibilityColor("#FBE74B"),
        new AccessibilityColor("#F58B1F"), new AccessibilityColor("#E60017"), new AccessibilityColor("#F266BA"), new AccessibilityColor("#9260A1"),
        new AccessibilityColor("#8874C2"), new AccessibilityColor("#888888"), new AccessibilityColor("#007ACC"), new AccessibilityColor("#C9E7E7"),
        new AccessibilityColor("#7CAF9A"), new AccessibilityColor("#A8CE4B"), new AccessibilityColor("#FBFD52"), new AccessibilityColor("#F7A24B"),
        new AccessibilityColor("#EB3345"), new AccessibilityColor("#F599D1"), new AccessibilityColor("#AE88B9"), new AccessibilityColor("#AA9CDF"),
        new AccessibilityColor("#AAAAAA"), new AccessibilityColor("#3F9BD8"), new AccessibilityColor("#D6EDED"), new AccessibilityColor("#9CC3B2"),
        new AccessibilityColor("#C3D84C"), new AccessibilityColor("#FCFD7D"), new AccessibilityColor("#F9B978"), new AccessibilityColor("#F06673"),
        new AccessibilityColor("#F9CCE8"), new AccessibilityColor("#C7ABD0"), new AccessibilityColor("#C0B6E9"), new AccessibilityColor("#CCCCCC"),
        new AccessibilityColor("#7FBCE5"), new AccessibilityColor("#E4F3F3"), new AccessibilityColor("#BFD8CD"), new AccessibilityColor("#D7E587"),
        new AccessibilityColor("#FCFEA8"), new AccessibilityColor("#FBD0A5"), new AccessibilityColor("#F599A2"), new AccessibilityColor("#FBDDEF"),
        new AccessibilityColor("#E0CAE7"), new AccessibilityColor("#DAD4F7")
    ];

    public static VibrantPaletteColors: AccessibilityColor[] = [
        new AccessibilityColor("#222222"), new AccessibilityColor("#666666"), new AccessibilityColor("#292E6B"), new AccessibilityColor("#009CCC"),
        new AccessibilityColor("#00643A"), new AccessibilityColor("#339947"), new AccessibilityColor("#FBBC3D"), new AccessibilityColor("#DB552C"),
        new AccessibilityColor("#7F1725"), new AccessibilityColor("#EC008C"), new AccessibilityColor("#5C197B"), new AccessibilityColor("#51399F"),
        new AccessibilityColor("#FFFFFF"), new AccessibilityColor("#CCCCCC"), new AccessibilityColor("#007ACC"), new AccessibilityColor("#C9E7E7"),
        new AccessibilityColor("#7CAF9A"), new AccessibilityColor("#A8CE4B"), new AccessibilityColor("#FBFD52"), new AccessibilityColor("#F7A24B"),
        new AccessibilityColor("#E60017"), new AccessibilityColor("#F599D1"), new AccessibilityColor("#AE88B9"), new AccessibilityColor("#AA9CDF")
    ];

    public static MutePaletteColors: AccessibilityColor[] = [
        new AccessibilityColor("#888888"), new AccessibilityColor("#007ACC"), new AccessibilityColor("#C9E7E7"), new AccessibilityColor("#7CAF9A"),
        new AccessibilityColor("#A8CE4B"), new AccessibilityColor("#FBFD52"), new AccessibilityColor("#F7A24B"), new AccessibilityColor("#EB3345"),
        new AccessibilityColor("#F599D1"), new AccessibilityColor("#AE88B9"), new AccessibilityColor("#AA9CDF"), new AccessibilityColor("#AAAAAA"),
        new AccessibilityColor("#3F9BD8"), new AccessibilityColor("#D6EDED"), new AccessibilityColor("#9CC3B2"), new AccessibilityColor("#C3D84C"),
        new AccessibilityColor("#FCFD7D"), new AccessibilityColor("#F9B978"), new AccessibilityColor("#F06673"), new AccessibilityColor("#F9CCE8"),
        new AccessibilityColor("#C7ABD0"), new AccessibilityColor("#C0B6E9"), new AccessibilityColor("#CCCCCC"), new AccessibilityColor("#7FBCE5"),
        new AccessibilityColor("#E4F3F3"), new AccessibilityColor("#BFD8CD"), new AccessibilityColor("#D7E587"), new AccessibilityColor("#FCFEA8"),
        new AccessibilityColor("#FBD0A5"), new AccessibilityColor("#F599A2"), new AccessibilityColor("#FBDDEF"), new AccessibilityColor("#E0CAE7"),
        new AccessibilityColor("#DAD4F7"), new AccessibilityColor("#FFFFFF"), new AccessibilityColor("#BFDDF2"), new AccessibilityColor("#F1F9F9"),
        new AccessibilityColor("#E3F5EE"), new AccessibilityColor("#EBF2C3"), new AccessibilityColor("#FEFED3"), new AccessibilityColor("#FDE7D2"),
        new AccessibilityColor("#FACCD0"), new AccessibilityColor("#FDEEF7"), new AccessibilityColor("#F5E5FB"), new AccessibilityColor("#EDEAFF")
    ];

    private displayName: string;
    constructor(color: string | Rgb | Color, displayName?: string) {
        let colorCode: string | Rgb;
        if (color instanceof Color) {
            colorCode = color.asHex();
        } else {
            colorCode = < string | Rgb>color;
        }
        super(colorCode);
        this.displayName = displayName;
    }

    public getDisplayName(): string {
        if (this.displayName == null) {
            return super.asHex();
        }
        return this.displayName;
    }
}
