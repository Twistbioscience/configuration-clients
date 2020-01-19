#!/usr/bin/env python


#############################################################################
# HEADER                                                                    #
#############################################################################
"""
Concrete implementation of github configuration repo reader
"""

#############################################################################
# IMPORT MODULES                                                            #
#############################################################################

import requests
import urllib
import json
import os
from .abstract_env_conf_loader import EnvConfigLoader
from .secrets import Secrets


#############################################################################
# GLOBALS and CONSTANTS                                                            #
#############################################################################

TWIST_GITHUB_ACCOUNT = "Twistbioscience"
CONFIGURATION_REPO = "configuration"
GIT_CONF_TOKEN_KEY = "GIT_CONFIG_TOKEN"

#############################################################################
# IMPLEMENTATION                                                            #
#############################################################################


class GithubEnvConfigLoader(EnvConfigLoader):
    """
    Github environment aware config loader.
    Implements EnvConfigLoader in order to be injected into EnvConfig.
    Reads and lists repo files.
    """

    def __init__(self, environment):
        super().__init__(environment)

    def list_categories(self):
        return self.__get_repo_file_list()

    def load(self, category):
        """
        concrete implementation fo abstract method

        Returns:
            dict -- json parsed config
        """
        try:
            config_raw_content = self.__get_file_content(f"{category}.json", self._env)
            return json.loads(config_raw_content)

        except Exception as ex:
            print(
                f'Failed loading and parsing config json content from branch/env "{self._env}"\nexception: {ex}'
            )
            return {}

    @staticmethod
    def __get_github_token():
        # first chance to env var...
        if GIT_CONF_TOKEN_KEY in os.environ:
            github_conf_token = os.environ[GIT_CONF_TOKEN_KEY]
        else:
            # otherwise fetch from secrets
            common = Secrets.get("secret/common")
            github_conf_token = common[GIT_CONF_TOKEN_KEY]

        if github_conf_token is None or github_conf_token == "":
            raise Exception(
                f"Missing git configuration repo access token. See Vault::secret/common or set env var {GIT_CONF_TOKEN_KEY}"
            )

        return github_conf_token

    def __get_file_content(self, file_path, branch_name):
        github_conf_token = GithubEnvConfigLoader.__get_github_token()

        github_url = f"https://raw.githubusercontent.com/{TWIST_GITHUB_ACCOUNT}/{CONFIGURATION_REPO}/{branch_name}/{file_path}"
        file_path = urllib.parse.quote(file_path, safe="")

        headers = {
            "Accept-Encoding": "gzip, deflate",
            "Accept": "*/*",
            "Authorization": f"token {github_conf_token}",
        }

        print(f'Fetching {file_path} from {github_url} on branch/env "{branch_name}"')

        response = requests.get(github_url, headers=headers)

        if response.status_code == 401:
            raise Exception(
                f"Could not authenticate and get configuration repo file using provided token"
            )

        if response.status_code != 200:
            raise Exception(
                f"Could not find configuration file {file_path} in configuration repo in branch = {self._env}"
            )

        # print(f"remote file content({file_path}): {response.text}")
        return response.text

    def __get_repo_file_list(self):
        """
        Based on self environment, pull the repo files list

        Returns:
            [list] -- list of files, uppercased and without the .json suffix
        """
        github_conf_token = GithubEnvConfigLoader.__get_github_token()
        # API reference: https://developer.github.com/v3/repos/contents/
        github_api_url = f"https://api.github.com/repos/{TWIST_GITHUB_ACCOUNT}/{CONFIGURATION_REPO}/contents/?ref={self._env}"

        headers = {
            "Accept-Encoding": "gzip, deflate",
            "Accept": "application/json",
            "Authorization": f"token {github_conf_token}",
        }

        # print(f'Fetching file list from {github_api_url} on branch/env "{self._env}"')

        response = requests.get(github_api_url, headers=headers)
        files_json = response.json()

        if response.status_code == 401:
            raise Exception(
                f"Could not authenticate and get configuration repo list using provided token"
            )

        if response.status_code != 200:
            raise Exception(
                f"Could not find configuration branch at configuration repo with name = {self._env}"
            )

        # filter only file names that end with .json and that are not nested (only root level)
        files_json = list(
            filter(
                lambda f: f["name"].endswith(".json") and f["path"].find("/") == -1,
                files_json,
            )
        )
        # extract only the file names and transform
        files_list = list(
            map(lambda o: o["name"].replace(".json", "").upper(), files_json)
        )

        return files_list
