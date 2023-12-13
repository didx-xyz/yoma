// declare global {
//   namespace Cypress {
//     interface Chainable {
//       log: typeof log;
//     }
//   }
// }

export const log = (originalFn: Function, message: string): void => {
  const log = originalFn(message);
  log.snapshot("Log");
  log.end();
};
