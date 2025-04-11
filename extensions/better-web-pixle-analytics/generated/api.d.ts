export interface API {
  analytics: {
    subscribe: (event: string, callback: Function) => void;
    publish: (event: string, payload: any) => Promise<boolean>;
  };
  browser: {
    cookie: {
      get: (name: string) => string | undefined;
      set: (name: string, value: string, options?: CookieOptions) => void;
      remove: (name: string) => void;
    };
  };
  settings: {
    ga4AccountId?: string;
  };
}

export interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: number | Date;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export type FunctionResult = void;

export interface InputQuery {
  actionPayload: any;
  contextData: {
    [key: string]: any;
  };
} 