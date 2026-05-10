import enJson from '../../locales/urban/en.json';

const en = enJson;

type DeepStringMessages<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringMessages<T[K]>;
};

export type EnMessages = DeepStringMessages<typeof en>;
export default en;
