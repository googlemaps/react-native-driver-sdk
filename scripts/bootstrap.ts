const os = require('os');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'path'.
const path = require('path');
const child_process = require('child_process');
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'root'.
const root = path.resolve(__dirname, '..');
// @ts-expect-error TS(2591): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
const args = process.argv.slice(2);
const options = {
  // @ts-expect-error TS(2591): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
  cwd: process.cwd(),
  // @ts-expect-error TS(2591): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
  env: process.env,
  stdio: 'inherit',
  encoding: 'utf-8',
};

if (os.type() === 'Windows_NT') {
  // @ts-expect-error TS(2339): Property 'shell' does not exist on type '{ cwd: an... Remove this comment to see the full error message
  options.shell = true;
}

let result;

// @ts-expect-error TS(2591): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
if (process.cwd() !== root || args.length) {
  // We're not in the root of the project, or additional arguments were passed
  // In this case, forward the command to `yarn`
  result = child_process.spawnSync('yarn', args, options);
} else {
  // If `yarn` is run without arguments, perform bootstrap
  result = child_process.spawnSync('yarn', ['bootstrap'], options);
}

// @ts-expect-error TS(2591): Cannot find name 'process'. Do you need to install... Remove this comment to see the full error message
process.exitCode = result.status;
