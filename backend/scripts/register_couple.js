/**
 * Admin script path disabled — provision clients via Admin → Create event.
 */
console.error(`
This script is disabled.

Create clients from the Admin UI:
  Admin → Events → Add event
  (enter client email; password is generated automatically)

Use Actions → User credentials to view email / regenerate password.
`);
process.exit(1);
