import axios from 'axios';
import JSON5 from 'json5';
import IEnvConfigLoader from './IEnvConfigLoader';
import Secrets from './Secrets'

// TODO: should be moved higher up the monorepo to be included by all polyglot clients
const TWIST_GITHUB_ACCOUNT = 'Twistbioscience';
const CONFIGURATION_REPO = 'configuration';
const GIT_CONF_TOKEN_KEY = "GIT_CONFIG_TOKEN"

export default class GithubEnvConfigLoader implements IEnvConfigLoader {
  private __environment: string;

  constructor(env: string) {
    this.__environment = env;
  }

  /**
   * for lazy loading single category configuration
   * @param category name to load
   */
  public async load(category: string): Promise<any> {
    try {
      // get raw data from repo file that ends with json
      const raw = await this.__getFileContent(`${category}.json`, this.__environment);
      // console.log(`RAW DATA: ${JSON.stringify(raw)}`);

      // seems that axios will convert response to json if json content is pure
      // but will return text if JSON5 (with comments) are detected
      if (typeof raw === 'object') {
        return raw;
      }

      return JSON5.parse(raw);
    } catch (ex) {
      console.log(
        `Failed loading and parsing config json content from branch/env "${this.__environment}"\nexception: ${ex}`,
      );
    }
    return undefined;
  }

  /**
   * get list of json files in repo and return list of their names
   */
  public async listCategories(): Promise<Array<string>> {
    return this.__getRepoFileList();
  }

  private static async __getGithubToken(): Promise<string> {
    // return 'b8b2a3c4f190a7a578503d1bd2a724553b6021e1';
    let githubToken;

    // first chance to env var...
    if (process.env[GIT_CONF_TOKEN_KEY]) {
      githubToken = process.env[GIT_CONF_TOKEN_KEY]
    }
    else {
      // otherwise fetch from secrets
      const common = await Secrets.get("secret/common")
      githubToken = common[GIT_CONF_TOKEN_KEY]
    }

    if (githubToken === undefined || githubToken.trim() === "") {
      throw new Error(
        `Missing git configuration repo access token. See Vault::secret/common or set env var ${GIT_CONF_TOKEN_KEY}`
      )
    }

    return githubToken
  }

  /**
   * fetch repo file list
   * return only upper cased names of files without extention
   */
  private async __getRepoFileList(): Promise<Array<string>> {
    const githubToken = await GithubEnvConfigLoader.__getGithubToken();

    //  API reference: https://developer.github.com/v3/repos/contents/
    const githubApiURL = `https://api.github.com/repos/${TWIST_GITHUB_ACCOUNT}/${CONFIGURATION_REPO}/contents/?ref=${this.__environment}`;

    const headers = {
      'Accept-Encoding': 'gzip, deflate',
      Accept: 'application/json',
      Authorization: `token ${githubToken}`,
    };

    console.log(`Fetching file list from ${githubApiURL} on branch/env "${this.__environment}"`);

    let res;
    try {
      res = await axios.get(githubApiURL, { headers });
    } catch (ex) {
      throw new Error(`Failed fetching ${githubApiURL}. Ex: ${ex}`);
    }

    // console.log(`AXIOS RESP: ${JSON.stringify(res?.data)}`)

    // very unlikely however to stay sane...
    if (!res.data || res.data.length === 0) {
      throw new Error(`configuration repo at branch ${this.__environment} is empty!`);
    }

    // return list of uppercased name of JSON files only without the .json part (eg. ["SYSTEM", "GENES"])
    return res.data
      .filter((e: any) => e.name.endsWith('.json') && e.path.indexOf('/') === -1)
      .map((e: any) => e.name.replace('.json', '').toUpperCase());
  }

  /**
   * fetch file content from repo
   * @param filePath
   * @param branchName
   */
  private async __getFileContent(filePath: string, branchName: string): Promise<any> {
    const githubToken = await GithubEnvConfigLoader.__getGithubToken();

    const githubApiURL = `https://raw.githubusercontent.com/${TWIST_GITHUB_ACCOUNT}/${CONFIGURATION_REPO}/${branchName}/${filePath}`;

    const headers = {
      'Accept-Encoding': 'gzip, deflate',
      Accept: '*/*',
      Authorization: `token ${githubToken}`,
    };

    console.log(`Fetching category file from ${githubApiURL} on branch/env "${this.__environment}"`);

    let res;
    try {
      res = await axios.get(githubApiURL, { headers });
    } catch (ex) {
      throw new Error(`Failed fetching ${githubApiURL}. Ex: ${ex}`);
    }

    // console.log(`AXIOS RESP: ${JSON.stringify(res?.data)}`)
    return res.data;
  }
}
