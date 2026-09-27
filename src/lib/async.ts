export class OperationTimeoutError extends Error {
  code = 'app/operation-timeout';

  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'OperationTimeoutError';
  }
}

export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new OperationTimeoutError()), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
