let enabled = false;

export function setVerbose(value: boolean): void {
  enabled = value;
}

export function verbose(message: string): void {
  if (enabled) {
    process.stderr.write(`[verbose] ${message}\n`);
  }
}
