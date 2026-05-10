import type { EnMessages } from "./en";
import trJson from '../../locales/urban/tr.json';

const tr: EnMessages = trJson;

export type TrMessages = typeof tr;
export default tr;
