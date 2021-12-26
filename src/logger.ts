export type LoggerArg = string | number | bigint | boolean;

// types so functions can differentiate their return strings
export type LogString = string;
export type WarnString = string;
export type ErrorString = string;

export type LogType = "log" | "error" | "warning";
export type LogCallback = (type: LogType, str: string, id?: string, args?: LoggerArg[]) => void;

export default abstract class Logger {
  static errorColor = "#dc3545";
  static successColor = "#28a745";
  static warnColor = "#ffc107";

  static listeners: LogCallback[] = [];

  /**
   * Logs a message.
   *
   * @param id The identifier of who is logging
   * @param args The args to log
   */
  static log(id: string, ...args: LoggerArg[]): LogString {
    const str = this.str(id, ...args);

    console.log(str);
    this.callListeners("log", str, id, args);
    return str;
  }

  static error(id: string, ...args: LoggerArg[]): ErrorString {
    const str = this.str(id, ...args);

    console.log("%c" + str, `color: ${this.errorColor}`);
    this.callListeners("error", str, id, args);
    return str;
  }

  static warn(id: string, ...args: LoggerArg[]): WarnString {
    const str = this.str(id, ...args);

    console.log("%c" + str, `color: ${this.warnColor}`);
    this.callListeners("warning", str, id, args);
    return str;
  }

  /**
   * Constructs the string to be logged.
   *
   * @param id The identifier of who is logging
   * @param args The args to log
   */
  static str(id: string, ...args: LoggerArg[]): string {
    let str = args.join(" ");

    const date = new Date();
    const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;

    return `[${time} ${id}]: ${str}`;
  }

  private static callListeners(type: LogType, str: string, id: string, args: LoggerArg[]) {
    for (const cb of this.listeners) {
      cb(type, str, id, args);
    }
  }

  /**
   * Adds a callback which will be called whenever a message is logged.
   *
   * @param callback The listener's callback
   */
  static addListener(callback: LogCallback) {
    this.listeners.push(callback);
  }

  /**
   * Removes a listener from the logger.
   *
   * @param callback The listener to remove
   */
  static removeListener(callback: LogCallback) {
    const index = this.listeners.findIndex((cb) => cb === callback);
    if (index === -1) return;

    this.listeners.splice(index, 1);
  }
}
