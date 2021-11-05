/**
 * Stores the color values for a RGBA color.
 */
export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * A value that can be parsed by a {@link Color} instance.
 */
export type ColorLike = RGBAColor | string;

/**
 * Represents a color value such as `rgba(255, 1, 100, 255)`, `#FEFEFE` or `lightblue` to allow for easy conversion between color representations
 */
export default class Color {
  original: string | RGBAColor;
  hex: string;
  rgba: RGBAColor;
  webgl: number[];

  /**
   * Creates a {@link Color} instance from a {@link ColorLike} representation.
   *
   * @param color The {@link ColorLike} representation to use when creating the {@link Color} instance
   */
  constructor(color: ColorLike) {
    let valid = false;
    if (typeof color === "object") {
      valid = this.validateRGBA(color);
      if (valid) this.parseRGBA(color);
    } else if (color[0] === "#") {
      valid = this.validateHEX(color);
      if (valid) this.parseHEX(color);
    } else {
      valid = this.validateHTML(color);
      if (valid) this.parseHTML(color);
    }

    if (!valid) throw new Error(`Color: '${color}' is not a valid color representation.`);
  }

  /**
   * Validates a rgba color.
   *
   * @param color The rgba color to validate
   * @returns Wether or not the `color` is a valid rgba color
   */
  validateRGBA(color: RGBAColor): boolean {
    if (color.r < 0 || color.r > 255) return false;
    if (color.g < 0 || color.g > 255) return false;
    if (color.b < 0 || color.b > 255) return false;
    if (color.a && (color.a < 0 || color.a > 1)) return false;

    let expected = 3;
    if (color.a) expected++;
    if (Object.keys(color).length !== expected) return false;

    return true;
  }

  /**
   * Validates a hex color.
   *
   * @param color The hex color to validate
   * @returns Wether or not the `color` is a valid hex color
   */
  validateHEX(color: string): boolean {
    const hexRegex = /^#(([0-9A-F]){8}|([0-9A-F]{3}){1,2})$/i;
    return hexRegex.test(color);
  }

  /**
   * Validates a html color.
   *
   * @param color The html color to validate
   * @returns Wether or not the `color` is a valid html color
   */
  validateHTML(color: string): boolean {
    return Object.keys(this.html).includes(color);
  }

  /**
   * Takes in a rgba color then converts it to hex and webgl and stores the conversions.
   *
   * @param color The rgba color to parse
   */
  parseRGBA(color: RGBAColor) {
    this.original = { ...color };
    color.a = color.a !== undefined ? color.a : 1;

    this.rgba = color;
    this.hex = this.rgbaToHex(color);
    this.webgl = this.rgbaToWebGL(color);
  }

  /**
   * Takes in a hex color then converts it to rgba and webgl and stores the conversions.
   *
   * @param color The hex color to parse
   */
  parseHEX(color: string) {
    this.original = color;

    this.rgba = this.hexToRgba(color);
    this.hex = color;
    this.webgl = this.rgbaToWebGL(this.rgba);
  }

  /**
   * Takes in a html color then converts it to hex, rgba and webgl and stores the conversions.
   *
   * @param color The html color to parse
   */
  parseHTML(color: string) {
    this.original = color;
    this.hex = this.html[color];
    this.rgba = this.hexToRgba(this.hex);
    this.webgl = this.rgbaToWebGL(this.rgba);
  }

  /**
   * Converts a valid hex color to rgba.
   *
   * @param hex The hex color to convert to rgba
   * @returns The rgba equivalent of the hex color
   *
   * @throws When an invalid hex color is provided
   */
  hexToRgba(hex: string): RGBAColor {
    if (!this.validateHEX(hex)) throw new Error("Color: Invalid hex color provided to hexToRgba.");

    let fixed = hex.substr(1);
    if (fixed.length === 3) fixed += fixed + "FF";
    else if (fixed.length === 6) fixed += "FF";

    const rHex = fixed.substr(0, 2);
    const gHex = fixed.substr(2, 2);
    const bHex = fixed.substr(4, 2);
    const aHex = fixed.substr(6, 2);

    return {
      r: parseInt(rHex, 16),
      g: parseInt(gHex, 16),
      b: parseInt(bHex, 16),
      a: parseInt(aHex, 16) / 255,
    };
  }

  /**
   * Converts a valid rgba color to hex.
   *
   * @param rgba The rgba color to convert to hex
   * @returns The hex equivalent of the rgba color
   *
   * @throws When an invalid rgba color is provided
   */
  rgbaToHex(rgba: RGBAColor): string {
    if (!this.validateRGBA(rgba)) throw new Error("Color: Invalid rgba color provided to rgbaToHex.");

    const rHex = rgba.r.toString(16);
    const bHex = rgba.g.toString(16);
    const gHex = rgba.b.toString(16);

    let alpha = rgba.a !== undefined ? rgba.a : 1;
    alpha *= 255;
    const aHex = alpha.toString(16);

    return `#${rHex}${bHex}${gHex}${aHex}`;
  }

  /**
   * Converts a valid rgba color to webgl.
   *
   * @param rgba The rgba color to convert to a webgl color representation
   * @returns The webgl equivalent of the rgba color
   *
   * @throws When an invalid rgba color is provided
   */
  rgbaToWebGL(rgba: RGBAColor) {
    if (!this.validateRGBA(rgba)) throw new Error("Color: Invalid rgba color provided to rgbaToWebGL.");

    return [
      this.rgba.r / 255,
      this.rgba.g / 255,
      this.rgba.b / 255,
      this.rgba.a !== undefined ? this.rgba.a : 1,
    ];
  }

  html: { [index: string]: string } = {
    black: "#000000",
    silver: "#c0c0c0",
    gray: "#808080",
    white: "#ffffff",
    maroon: "#800000",
    red: "#ff0000",
    purple: "#800080",
    fuchsia: "#ff00ff",
    green: "#008000",
    lime: "#00ff00",
    olive: "#808000",
    yellow: "#ffff00",
    navy: "#000080",
    blue: "#0000ff",
    teal: "#008080",
    aqua: "#00ffff",
    orange: "#ffa500",
    aliceblue: "#f0f8ff",
    antiquewhite: "#faebd7",
    aquamarine: "#7fffd4",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    bisque: "#ffe4c4",
    blanchedalmond: "#ffebcd",
    blueviolet: "#8a2be2",
    brown: "#a52a2a",
    burlywood: "#deb887",
    cadetblue: "#5f9ea0",
    chartreuse: "#7fff00",
    chocolate: "#d2691e",
    coral: "#ff7f50",
    cornflowerblue: "#6495ed",
    cornsilk: "#fff8dc",
    crimson: "#dc143c",
    darkblue: "#00008b",
    darkcyan: "#008b8b",
    darkgoldenrod: "#b8860b",
    darkgray: "#a9a9a9",
    darkgreen: "#006400",
    darkgrey: "#a9a9a9",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkseagreen: "#8fbc8f",
    darkslateblue: "#483d8b",
    darkslategray: "#2f4f4f",
    darkslategrey: "#2f4f4f",
    darkturquoise: "#00ced1",
    darkviolet: "#9400d3",
    deeppink: "#ff1493",
    deepskyblue: "#00bfff",
    dimgray: "#696969",
    dimgrey: "#696969",
    dodgerblue: "#1e90ff",
    firebrick: "#b22222",
    floralwhite: "#fffaf0",
    forestgreen: "#228b22",
    gainsboro: "#dcdcdc",
    ghostwhite: "#f8f8ff",
    gold: "#ffd700",
    goldenrod: "#daa520",
    greenyellow: "#adff2f",
    grey: "#808080",
    honeydew: "#f0fff0",
    hotpink: "#ff69b4",
    indianred: "#cd5c5c",
    indigo: "#4b0082",
    ivory: "#fffff0",
    khaki: "#f0e68c",
    lavender: "#e6e6fa",
    lavenderblush: "#fff0f5",
    lawngreen: "#7cfc00",
    lemonchiffon: "#fffacd",
    lightblue: "#add8e6",
    lightcoral: "#f08080",
    lightcyan: "#e0ffff",
    lightgoldenrodyellow: "#fafad2",
    lightgray: "#d3d3d3",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightsalmon: "#ffa07a",
    lightseagreen: "#20b2aa",
    lightskyblue: "#87cefa",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    lightsteelblue: "#b0c4de",
    lightyellow: "#ffffe0",
    limegreen: "#32cd32",
    linen: "#faf0e6",
    mediumaquamarine: "#66cdaa",
    mediumblue: "#0000cd",
    mediumorchid: "#ba55d3",
    mediumpurple: "#9370db",
    mediumseagreen: "#3cb371",
    mediumslateblue: "#7b68ee",
    mediumspringgreen: "#00fa9a",
    mediumturquoise: "#48d1cc",
    mediumvioletred: "#c71585",
    midnightblue: "#191970",
    mintcream: "#f5fffa",
    mistyrose: "#ffe4e1",
    moccasin: "#ffe4b5",
    navajowhite: "#ffdead",
    oldlace: "#fdf5e6",
    olivedrab: "#6b8e23",
    orangered: "#ff4500",
    orchid: "#da70d6",
    palegoldenrod: "#eee8aa",
    palegreen: "#98fb98",
    paleturquoise: "#afeeee",
    palevioletred: "#db7093",
    papayawhip: "#ffefd5",
    peachpuff: "#ffdab9",
    peru: "#cd853f",
    pink: "#ffc0cb",
    plum: "#dda0dd",
    powderblue: "#b0e0e6",
    rosybrown: "#bc8f8f",
    royalblue: "#4169e1",
    saddlebrown: "#8b4513",
    salmon: "#fa8072",
    sandybrown: "#f4a460",
    seagreen: "#2e8b57",
    seashell: "#fff5ee",
    sienna: "#a0522d",
    skyblue: "#87ceeb",
    slateblue: "#6a5acd",
    slategray: "#708090",
    slategrey: "#708090",
    snow: "#fffafa",
    springgreen: "#00ff7f",
    steelblue: "#4682b4",
    tan: "#d2b48c",
    thistle: "#d8bfd8",
    tomato: "#ff6347",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    wheat: "#f5deb3",
    whitesmoke: "#f5f5f5",
    yellowgreen: "#9acd32",
    rebeccapurple: "#663399",
  };
}
