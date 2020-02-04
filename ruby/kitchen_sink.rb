require_relative 'src/os_vars.rb'
require_relative 'src/secrets.rb'
require_relative 'src/env_config.rb'

#############################################################################
# USAGE                                                                     #
#############################################################################

#
# In order to test-run this kitchen sink:

# > cd ruby
# > bundle install

# the below is a happy path...
# - VAULT_USER=<vault user> VAULT_PASSWORD=<vault pass> TWIST_ENV=kitchen-sink-demo-do-not-delete ruby kitchen_sink.rb

# omit "VAULT_USER" in order to yield the mandatory-missing var. Pay attention it will sys.EXIT!
# add "__CONFIG_USAGE=1" in order to view required/dependable list of env vars
# add "__DUMP_CONFIG=1" in order to dump the actual env var values.

#############################################################################
# OS / ENVIRONMENT VARS                                                     #
#############################################################################

# mandatory env vars ALREADY(!!!) registered by Secrets and EnvConfig...
# OSVars.register_mandatory('VAULT_USER", "Vault secret management user name", String)
# OSVars.register_mandatory('VAULT_PASSWORD", "Vault secret management password", String)
# OSVars.register_mandatory('TWIST_ENV", "running environment name", String)

# optional env var with default value
OSVars.register('COMPANY', 'company name', String, 'Twist')

# must be called after all required (mandatory and optional) env vars have been registered.
OSVars.instance.init

v = OSVars.get('COMPANY')
puts "Company name provided by os env is: #{v} and its type is: #{v.class}"

#############################################################################
# ENV CONFIGURATION (using github)                                          #
#############################################################################

# visit https://github.com/Twistbioscience/configuration/tree/kitchen-sink-demo-do-not-delete
# in order to examine concrete values involved in this example.

# attempting to read the "all" section from the system.json conf file in the configuration repo
v = EnvConfig.get('SYSTEM', 'all', nil)
puts "got #{v} from system conf [all] section...\n"

# attempting to read the all.some_demo_key value from the system.json conf file in the configuration repo
v = EnvConfig.get('SYSTEM', 'all', 'some_demo_key')
puts "got #{v} from system conf [all.some_demo_key]...\n"

# attempting to read a non existing config from the global.json conf file in the configuration repo
v = EnvConfig.get(
  'global',
  'non_existing_section',
  'non_existing_key',
  ['this is a default value as a single list element']
)
puts "got #{v} from system conf global section...\n"

#############################################################################
# READING SECRETS                                                           #
#############################################################################

# reading the common secret
v = Secrets.get('secret/common')
puts "got #{v} from vault common...it hit the cache because EnvConfig has already accessed common for git token\n"

# reading the common secret again (it hits the cache as the stdout print suggests)
v = Secrets.get('secret/common')
puts "got #{v} from vault common...the cached value again...\n\n"

# attempting to read dummy from the dummy.json conf file that is not in existence
# in the conf repo - this should fail
EnvConfig.get('DUMMY', 'dummy', 'some_dummy_key')