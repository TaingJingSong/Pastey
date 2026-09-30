import { NativeModules } from 'react-native';

const native = NativeModules.PasteySQLite;

if (!native) {
  throw new Error('PasteySQLite native module not found');
}

export type SqlParams = Array<string | number | null>;

export const sqlite = {
  async open(name: string): Promise<boolean> {
    return native.open(name);
  },
  async execute<T = Record<string, unknown>>(
    sql: string,
    params: SqlParams = []
  ): Promise<T[]> {
    const json: string = await native.execute(sql, params);
    return JSON.parse(json) as T[];
  },
};
