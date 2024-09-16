import { Request } from "express";

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charactersLength = characters.length;
export const generateRandomId = (length: number): string => {
  let result = "";
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

/**
 *
 * @returns function caller's moduleName and functionName
 *
 * This method makes use Error class to get the function
 * caller's moduleName (file name) and functionName.
 * It may have impact on performance, use with caution.
 */
export const callerInfo = (): { moduleName: string; functionName: string } => {
  const err = new Error();
  const errStack = err?.stack?.split("\n")[3].trim().split(" ");
  const functionName = errStack && errStack[1] ? errStack[1] : "";
  const moduleName =
    errStack && errStack[2]
      ? errStack[2].substring(
          errStack[2].indexOf("src"),
          errStack[2].length - 1
        )
      : "";
  return { moduleName, functionName };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const removeUndefined = (object: { [key: string]: any }): void => {
  Object.keys(object).forEach(
    (key) => object[key] === undefined && delete object[key]
  );
};

export const getDateBeforeNDays = (nDays: number): Date => {
  const today = new Date();
  const thresholdDate = new Date(new Date().setDate(today.getDate() - nDays));
  thresholdDate.setHours(0);
  thresholdDate.setMinutes(0);
  thresholdDate.setSeconds(0);
  thresholdDate.setMilliseconds(0);
  return thresholdDate;
};

export const getUTCDate = (
  year: number,
  month: number,
  date: number,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number
): Date => {
  return new Date(Date.UTC(year, month - 1, date, hours, minutes, seconds, ms));
};
