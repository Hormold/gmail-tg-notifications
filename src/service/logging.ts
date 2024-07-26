const formatDate = (date: Date): string => {
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
};

const logColors = {
  Error: "\x1b[31m", // Red
  Warning: "\x1b[33m", // Yellow
  Success: "\x1b[32m", // Green
  Info: "\x1b[36m", // Cyan
  Reset: "\x1b[0m", // Reset color
};

function createLogger(level: "Error" | "Warning" | "Success" | "Info") {
  return (...args: any[]) => {
    const timestamp = formatDate(new Date());

    const prefix = `[${timestamp}] ${logColors[level]}${level}:${logColors.Reset}`;

    switch (level) {
      case "Error":
        console.error(prefix, ...args);
        break;
      case "Warning":
        console.warn(prefix, ...args);
        break;
      case "Success":
      case "Info":
        console.log(prefix, ...args);
        break;
    }
  };
}

export const error = createLogger("Error");
export const warning = createLogger("Warning");
export const success = createLogger("Success");
export const info = createLogger("Info");
