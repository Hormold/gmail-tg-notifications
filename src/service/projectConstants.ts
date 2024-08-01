export const MAX_MESSAGE_LENGTH = 3800;
export const EMAIL_HISTORY_ID_MAP_KEY = "emailHistoryIdMap";
export const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];
export const BASE_MODEL_NAME = "gpt-4o-mini";
export const TRIAL_MODEL_NAME = "gpt-4o-mini";
export const TRIAL_PERIOD = 24 * 60 * 60 * 1000;
export const SUBSCRIBTIONS = [
  {
    codename: "1m",
    name: "1 Month",
    price: 299,
    period: 30,
    currency: "USD",
  },
  {
    codename: "3m",
    name: "3 Months",
    price: 799,
    period: 90,
    currency: "USD",
  },
  {
    codename: "6m",
    name: "6 Months",
    price: 1499,
    period: 180,
    currency: "USD",
  },
  {
    codename: "1y",
    name: "1 Year",
    price: 2799,
    period: 365,
    currency: "USD",
  },
];
