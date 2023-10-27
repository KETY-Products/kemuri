import { cosmiconfigSync, CosmiconfigResult } from 'cosmiconfig';
import _ from 'lodash';

class configLoader {
  /**
   * ロード結果の
   */
  protected static result?: CosmiconfigResult;

  /**
   * デフォルトのコンパイラー
   */
  protected static defaultCompiler = {
    js: 'typescript',
    css: 'sass',
    html: 'nunjucks',
  };

  /**
   * 設定ファイルをロードする
   * @returns
   */
  public static load(): any {
    if (configLoader.result === undefined) {
      const explorerSync = cosmiconfigSync('builder');
      configLoader.result = explorerSync.search();
    }
    return configLoader.result ? configLoader.result.config : {};
  }
  /**
   * 指定のビルダーが有効化されているか確認する
   * @param type
   * @returns
   */
  public static isEnable(type: 'js' | 'css' | 'html') {
    const allConfig = configLoader.load();
    if (allConfig && _.has(allConfig, 'enable') && _.get(allConfig, 'enable')) {
      return _.get(allConfig, 'enable').includes(type);
    }
    return false;
  }
  /**
   * 指定のビルダーが無効化されているか確認する
   *
   * @param type
   * @returns
   */
  public static isDisable(type: 'js' | 'css' | 'html') {
    return !this.isEnable(type);
  }
  /**
   * 設定の指定のキーの値を取得する
   * @param key
   * @returns
   */
  public static get(key: string, defaultValue?: any) {
    const allConfig = configLoader.load();
    return _.get(allConfig, key, defaultValue);
  }
  /**
   * 指定されたビルダーのオプションを取得する
   * @param type
   * @returns
   */
  public static getOption(type: 'html' | 'css' | 'js', overrideOption?: any): any {
    const allConfig = configLoader.load();
    let builderConfig = {};
    if (allConfig) {
      builderConfig = allConfig;
      if (_.has(allConfig, type) && _.get(allConfig, type)) {
        builderConfig = _.merge(_.cloneDeep(builderConfig), _.cloneDeep(_.get(allConfig, type)));
      }
      ['enable', 'server', 'html', 'css', 'js'].forEach((removeKey) => {
        _.unset(builderConfig, removeKey);
      });
    }
    if (overrideOption) {
      builderConfig = _.merge(_.cloneDeep(builderConfig), _.cloneDeep(overrideOption));
    }
    return builderConfig;
  }
  /**
   * サーバーのオプションを取得する
   * @returns
   */
  public static getServerOption(overrideOption?: any): object {
    const allConfig = configLoader.load();
    let serverOption = _.has(allConfig, 'server') && !_.isNull(_.get(allConfig, 'server')) ? _.get(allConfig, 'server') : {};
    if (overrideOption) {
      serverOption = _.merge(_.cloneDeep(serverOption), _.cloneDeep(overrideOption));
    }
    return serverOption;
  }

  /**
   * HTMLビルダーのオプションを取得する
   * @returns
   */
  public static getHtmlOption(overrideOption?: any): object {
    return configLoader.getOption('html', overrideOption);
  }
  /**
   * CSSビルダーのオプションを取得する
   * @returns
   */
  public static getCssOption(overrideOption?: any) {
    return configLoader.getOption('css', overrideOption);
  }
  /**
   * JSビルダーのオプションを取得する
   * @returns
   */
  public static getJsOption(overrideOption?: any) {
    return configLoader.getOption('js', overrideOption);
  }
  /**
   * コンパイラーを取得する
   * @param type
   */
  public static getCompiler(type: 'js' | 'css' | 'html'): string {
    let compiler = _.get(configLoader.defaultCompiler, type);
    const builderOption = this.getOption(type);
    if (_.has(builderOption, 'compiler') && _.has(builderOption, 'compiler')) {
      compiler = _.get(builderOption, 'compiler');
    }
    return compiler;
  }
}

export default configLoader;
