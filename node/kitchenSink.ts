import EnvConfig from './src/EnvConfig';
import OSVars from './src/OSVars'
import { OSVarType } from './src/OSVars'
import Secrets from './src/Secrets'



// #############################################################################
// # USAGE                                                                     #
// #############################################################################

/* 
  In order to test-run this kitchen sink:

    > cd node
    > npm i

    # the below is a happy path...
    > VAULT_USER=<your vault user> VAULT_PASSWORD=<your vault pass> TWIST_ENV=kitchen-sink-demo-do-not-delete COMPANY=Google npm run demo

   # omit "VAULT_USER" in order to yield the mandatory-missing var. Pay attention it will sys.EXIT!
   # add "__CONFIG_USAGE=1" in order to view required/dependable list of env vars
   # add "__DUMP_CONFIG=1" in order to dump the actual env var values.
   */

// #############################################################################
// # OS / ENVIRONMENT VARS                                                     #
// #############################################################################

function demoOsVars() {

  /*
    mandatory env vars ALREADY(!!!) registered by Secrets and EnvConfig...
  
    OSVars.register_mandatory("VAULT_USER", "Vault secret management user name", str)
    OSVars.register_mandatory("VAULT_PASSWORD", "Vault secret management password", str)
    OSVars.register_mandatory("TWIST_ENV", "running environment name", str)
  */

  // optional env var with default value
  OSVars.register("COMPANY", "company name", OSVarType.String, "Twist")

  // we are done with process initialization, lets start consuming vars
  // it is important to place this call in your __main__
  OSVars.initialize()

  const v = OSVars.get("COMPANY")
  console.log(`Company name provided by os env is: ${v} and its type is: ${typeof v}`)
}


// #############################################################################
// # ENV CONFIGURATION (using github)                                          #
// #############################################################################

// visit https://github.com/Twistbioscience/configuration/tree/kitchen-sink-demo-do-not-delete
// in order to examine concrete values involved in this example.

async function demoConfig(): Promise<void> {
  // attempting to read the "all" section from the system.json conf file in the configuration repo
  let v = await EnvConfig.get('system', 'all');
  console.log(`got ${JSON.stringify(v)} from system conf [all] section...\n`);

  // attempting to read the all.some_demo_key value from the system.json conf file in the configuration repo
  v = await EnvConfig.get('system', 'all', 'some_demo_key');
  console.log(`got "${v}" from system conf [all.some_demo_key]...\n`);

  // attempting to read a non existing config from the global.json conf file in the configuration repo
  v = await EnvConfig.get('global', 'non_existing_section', 'non_existing_key', [
    'this is a default value as a single list element',
  ]);
  console.log(`got "${v}" from system conf global section...\n`);
}

// #############################################################################
// # READING SECRETS                                                           #
// #############################################################################

async function demoSecrets(): Promise<void> {

  // reading the common secret
  const v1 = await Secrets.get("secret/common")
  console.log(`got ${JSON.stringify(v1)} from vault common`)

  // reading the common secret again(it hits the cache as the stdout print suggests)
  const v2 = await Secrets.get("secret/common")
  console.log(`got ${JSON.stringify(v2)} from vault common...the cached value again...\n\n`)
}

/* eslint-disable @typescript-eslint/no-floating-promises */
async function main() {
  demoOsVars();
  await demoConfig();
  await demoSecrets();
}

main();