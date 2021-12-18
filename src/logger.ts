export type LoggerArg = string | number | bigint | boolean;

// types so functions can differentiate their return strings
export type LogString = string;
export type WarnString = string;
export type ErrorString = string;

export default abstract class Logger {
  static errorColor = "#dc3545";
  static successColor = "#28a745";
  static warnColor = "#ffc107";

  /**
   * Logs a message.
   *
   * @param id The identifier of who is logging
   * @param args The args to log
   */
  static log(id: string, ...args: LoggerArg[]): LogString {
    const str = this.str(id, ...args);

    console.log(str);
    return str;
  }

  static error(id: string, ...args: LoggerArg[]): ErrorString {
    const str = this.str(id, ...args);

    console.log("%c" + str, `color: ${this.errorColor}`);
    return str;
  }

  static warn(id: string, ...args: LoggerArg[]): WarnString {
    const str = this.str(id, ...args);

    console.log("%c" + str, `color: ${this.warnColor}`);
    return str;
  }

  /**
   * Constructs the string to be logged.
   *
   * @param id The identifier of who is logging
   * @param args The args to log
   */
  static str(id: string, ...args: LoggerArg[]): string {
    let str = "";
    args.forEach((arg) => (str += String(arg)));

    return `[${id}]: ${str}`;
  }
}
