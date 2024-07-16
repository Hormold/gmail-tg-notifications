export function error(m1: any, m2?: any) {
  console.log(`Errrrrror`, m1, m2);
}

export function warning(what: string) {
  console.warn(log("Warning", what));
}

export function success(what: string) {
  console.log(log("Success", what));
}

export function info(what: string) {
  console.info(log("Info", what));
}

function log(type: string, what: string) {
  return `[${new Date().toISOString()}]: ${type}: ${what}`;
}
