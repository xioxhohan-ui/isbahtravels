type LogLevel = "info" | "warn" | "error" | "debug";

export function logEvent(level: LogLevel, message: string, context?: Record<string, any>) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context || {},
  };

  const output = JSON.stringify(payload);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "debug":
      console.debug(output);
      break;
    default:
      console.log(output);
      break;
  }
}
