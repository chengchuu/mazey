/**
 * @author Cheng
 */

export interface BrowserInfo {
  engine: string; // webkit gecko presto trident
  engineVs: string;
  platform: string; // desktop mobile
  supporter: string; // chrome safari firefox opera iexplore edge
  supporterVs: string;
  system: string; // windows macos linux android ios
  systemVs: string;
  shell: string; // wechat qq uc 360 2345 sougou liebao maxthon
  shellVs: string;
  appleType: string;
}

export interface DefineListeners {
  [key: string]: any;
}

export type TestUa = (regexp: RegExp) => boolean;
export type TestVs = (regexp: RegExp) => string;

export type MultiValueUrlParams = {
  [key: string]: string[];
};

export type SingleValueUrlParams = {
  [key: string]: string;
};

export type ThrottleFunc<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T> | null;

export type DebounceFunc<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

export interface IsNumberOptions {
  isNaNAsNumber?: boolean;
  isInfinityAsNumber?: boolean;
  isUnFiniteAsNumber?: boolean;
}

export type AnyFunction = (...args: any[]) => any;

export interface ZResResponse {
  status: number;
  data: {
    code: number;
  };
}

export interface ZResIsValidResOptions {
  validStatusRange?: [number, number];
  validCode?: number[];
}

export interface RepeatUntilOptions {
  interval?: number;
  times?: number;
  context?: any;
  args?: Array<any>;
}

export type LoadScriptReturns = Promise<boolean | string | Error | void>;

export type SimpleType = string | number | boolean | null | undefined;
export type SimpleObject = {
  [key: string]: SimpleType | SimpleType[] | SimpleObject | SimpleObject[];
};

export type MazeyObject = any;
export type MazeyFnParams = any[];
export type MazeyFnReturn = any;
export type MazeyFunction = (...args: any[]) => any;
export type MazeyFn = (...args: MazeyFnParams) => MazeyFnReturn;

export interface MazeyWindow {
  [key: string]: any;
}

export interface WebPerformance {
  [key: string]: string | number;
}

export type MazeyElement = HTMLElement | null;

export type MazeyDate = Date | string | number;
