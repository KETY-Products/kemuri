'use strict';

var fs = require('node:fs');
var path = require('node:path');
var base = require('./base.js');
var glob = require('glob');
var sass = require('sass');
var rimraf = require('rimraf');
var js_beautify = require('js-beautify');
require('./config.js');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);
var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);
var sass__namespace = /*#__PURE__*/_interopNamespaceDefault(sass);

/**
 * ビルド処理の抽象クラス
 */
class sassBuilder extends base.baseBuilder {
    /**
     * コンストラクタ
     * @param option
     */
    constructor(option) {
        super(option);
        /**
         * 出力先ディレクトリ
         */
        this.outputDir = 'public/assets/css';
        /**
         * エントリポイントとなるファイルの拡張子
         */
        this.fileExts = ['scss', 'sass', 'css'];
        /**
         * エントリポイントから除外するファイル名の接頭語
         */
        this.ignoreFilePrefix = '_';
        /**
         * エントリポイントから除外するディレクトリ名
         * (このディレクトリ名以下に配置されているファイルはエントリポイントから除外される)
         */
        this.ignoreDirNames = [];
        /**
         * 出力時の拡張子
         */
        this.outpuExt = 'css';
        /**
         * コンパイラーのオプション
         */
        this.compilerOption = {};
        /**
         * インデックスファイルの自動生成の可否
         */
        this.generateIndex = false;
        /**
         * インデックスファイルの名前
         */
        this.indexFileName = '_all.scss';
        /**
         * インデックスファイルにインポートする際の方法
         */
        this.indexImportType = 'forward';
    }
    /**
     * -------------------------
     * このクラス固有のメソッド
     * -------------------------
     */
    /**
     * 出力スタイルの設定
     *
     * @param style
     */
    setStyle(style) {
        this.style = style;
    }
    /**
     * SourceMapファイル出力の可否
     *
     * @param sourcemap
     */
    setSourceMap(sourcemap) {
        this.sourcemap = sourcemap;
    }
    /**
     * SassのloadPathsオプションを設定する
     *
     * @param loadPaths
     */
    setLoadPaths(loadPaths) {
        this.loadPaths = loadPaths;
    }
    /**
     * インデックスファイルの自動生成の可否を設定する
     *
     * @param generateIndex
     */
    setGenerateIndex(generateIndex) {
        this.generateIndex = generateIndex;
    }
    /**
     * インデックスファイルの名前を設定する
     *
     * @param indexFileName
     */
    setIndexFileName(indexFileName) {
        this.indexFileName = indexFileName;
    }
    /**
     * インデックスファイルのインポート形式を設定する
     *
     * @param importType
     */
    setIndexImportType(importType) {
        this.indexImportType = importType;
    }
    /**
     * インデックスファイルの生成処理
     *
     * @param filePath
     */
    generateIndexFile(targetDir, recursive = true) {
        if (!this.generateIndex) {
            return;
        }
        const indexMatchPatterns = ['./_*.' + this.convertGlobPattern(this.fileExts), './*/' + this.indexFileName];
        const partialMatchFiles = glob.glob
            .sync(indexMatchPatterns, {
            cwd: targetDir,
        })
            .filter((partialFile) => {
            // 同一階層のインデックスファイルは除外
            return partialFile !== this.indexFileName;
        })
            .sort();
        const indexFilePath = path__namespace.join(targetDir, this.indexFileName);
        if (partialMatchFiles.length === 0) {
            rimraf.rimraf(indexFilePath);
            console.log('Remove index file: ' + indexFilePath);
        }
        else {
            const partialFiles = {
                children: [],
                files: [],
            };
            partialMatchFiles.forEach((partialFile) => {
                if (partialFile.includes(path__namespace.sep)) {
                    //@ts-ignore
                    partialFiles.children.push(partialFile);
                }
                else {
                    //@ts-ignore
                    partialFiles.files.push(partialFile);
                }
            });
            let indexFileContentLines = [
                '// ===============================',
                '// Auto generated by sassBuilder',
                '// Do not edit this file!',
                '// ===============================',
            ];
            if (partialFiles.children.length > 0) {
                indexFileContentLines = indexFileContentLines.concat(partialFiles.children.map((file) => {
                    return `@${this.indexImportType} '${file}';`;
                }));
            }
            if (partialFiles.files.length > 0) {
                indexFileContentLines = indexFileContentLines.concat(partialFiles.files.map((file) => {
                    return `@${this.indexImportType} '${file}';`;
                }));
            }
            const indexFileContent = indexFileContentLines.join('\n') + '\n';
            if (fs__namespace.existsSync(indexFilePath)) {
                const indexFileContentBefore = fs__namespace.readFileSync(indexFilePath, 'utf-8');
                if (indexFileContentBefore != indexFileContent) {
                    fs__namespace.writeFileSync(indexFilePath, indexFileContent);
                    console.log('Update index file: ' + indexFilePath);
                }
            }
            else {
                fs__namespace.writeFileSync(indexFilePath, indexFileContent);
                console.log('Generate index file: ' + indexFilePath);
            }
        }
        if (recursive && path__namespace.dirname(targetDir).startsWith(this.srcDir)) {
            this.generateIndexFile(path__namespace.dirname(targetDir));
        }
    }
    /**
     * -------------------------
     * 既存メソッドのオーバーライド
     * -------------------------
     */
    /**
     * ビルドオプションを設定する
     *
     * @param option
     * @returns
     */
    setOption(option) {
        super.setOption(option);
        if (option.style !== undefined && option.style) {
            this.setStyle(option.style);
        }
        if (option.sourcemap !== undefined && option.sourcemap !== null) {
            this.setSourceMap(option.sourcemap);
        }
        if (option.generateIndex !== undefined && option.generateIndex !== null) {
            this.setGenerateIndex(option.generateIndex);
        }
        if (option.indexFileName !== undefined) {
            this.setIndexFileName(option.indexFileName);
        }
        let sassLoadPaths = [this.srcDir, 'node_modules'];
        if (option.loadPaths !== undefined) {
            sassLoadPaths = option.loadPaths;
        }
        this.setLoadPaths(sassLoadPaths);
    }
    /**
     * コンパイルオプションを取得する
     * @returns
     */
    getCompileOption() {
        let compileOption = this.compileOption;
        if (this.style !== undefined) {
            compileOption = Object.assign(compileOption, { style: this.style });
        }
        if (this.sourcemap !== undefined) {
            compileOption = Object.assign(compileOption, { sourceMap: this.sourcemap });
        }
        if (this.loadPaths && this.loadPaths.length > 0) {
            compileOption = Object.assign(compileOption, { loadPaths: this.loadPaths });
        }
        return compileOption;
    }
    /**
     * ファイル追加時のコールバック処理
     * @param filePath
     */
    watchAddCallBack(filePath) {
        if (this.generateIndex && path__namespace.basename(filePath) === this.indexFileName) {
            return;
        }
        console.group('Add file: ' + filePath);
        if (this.generateIndex) {
            // インデックスファイルの生成/更新
            this.generateIndexFile.bind(this)(path__namespace.dirname(filePath));
        }
        try {
            //エントリポイントを更新
            this.getEntryPoint();
            if (Array.from(this.entryPoint.values()).includes(filePath)) {
                const outputPath = this.convertOutputPath(filePath);
                this.buildFile(filePath, outputPath);
            }
            else {
                this.buildAll();
            }
        }
        catch (error) {
            console.error(error);
            process.exit(1);
        }
        console.groupEnd();
    }
    /**
     * ファイル更新時のコールバック処理
     * @param filePath
     * @returns
     */
    watchChangeCallBack(filePath) {
        if (this.generateIndex && path__namespace.basename(filePath) === this.indexFileName) {
            return;
        }
        console.group('Update file: ' + filePath);
        if (this.generateIndex) {
            // インデックスファイルの更新
            this.generateIndexFile.bind(this)(path__namespace.dirname(filePath));
        }
        try {
            if (Array.from(this.entryPoint.values()).includes(filePath)) {
                const outputPath = this.convertOutputPath(filePath);
                this.buildFile(filePath, outputPath);
                console.log('Compile: ' + filePath + ' => ' + outputPath);
            }
            else {
                this.buildAll();
            }
        }
        catch (error) {
            console.error(error);
            process.exit(1);
        }
        console.groupEnd();
    }
    /**
     * ファイル削除時のコールバック処理
     * @param filePath
     * @returns
     */
    watchUnlinkCallBack(filePath) {
        if (this.generateIndex && path__namespace.basename(filePath) === this.indexFileName) {
            return;
        }
        console.group('Remove file: ' + filePath);
        if (this.generateIndex) {
            // インデックスファイルの更新
            this.generateIndexFile.bind(this)(path__namespace.dirname(filePath));
        }
        if (Array.from(this.entryPoint.values()).includes(filePath)) {
            this.entryPoint.delete(filePath);
            const outputPath = this.convertOutputPath(filePath);
            rimraf.rimraf(outputPath);
            console.log('Remove: ' + outputPath);
        }
        console.groupEnd();
    }
    /**
     * -------------------------
     * 抽象化メソッドの実装
     * -------------------------
     */
    /**
     * 単一ファイルのビルド処理
     * @param srcPath
     * @param outputPath
     */
    async buildFile(srcPath, outputPath) {
        const compileOption = this.getCompileOption();
        const beautifyOption = this.getBeautifyOption('dummy.' + this.outpuExt);
        const result = sass__namespace.compile(srcPath, compileOption);
        if (compileOption.style !== 'compressed') {
            result.css = js_beautify.css(result.css, beautifyOption);
        }
        fs__namespace.mkdirSync(path__namespace.dirname(outputPath), { recursive: true });
        fs__namespace.writeFileSync(outputPath, result.css.trim() + '\n');
        if (result.sourceMap) {
            fs__namespace.writeFileSync(outputPath + '.map', JSON.stringify(result.sourceMap));
        }
    }
    /**
     * 全ファイルのビルド処理
     */
    async buildAll() {
        // console.group('Build entory point files');
        const entries = this.getEntryPoint();
        if (this.generateIndex) {
            //インデックスファイルの生成/更新
            const partialFilePattern = path__namespace.join(this.srcDir, '**/_*.' + this.convertGlobPattern(this.fileExts));
            const partialFiles = glob.glob.sync(partialFilePattern);
            if (partialFiles.length > 0) {
                partialFiles
                    .map((partialFile) => {
                    return path__namespace.dirname(partialFile);
                })
                    .reduce((unique, item) => {
                    return unique.includes(item) ? unique : [...unique, item];
                }, [])
                    .forEach((generateIndexDir) => {
                    this.generateIndexFile.bind(this)(generateIndexDir, false);
                });
            }
        }
        if (entries.size > 0) {
            const compileOption = this.getCompileOption();
            const beautifyOption = this.getBeautifyOption('dummy.' + this.outpuExt);
            entries.forEach((srcFile, entryPoint) => {
                const outputPath = path__namespace.join(this.outputDir, entryPoint + '.' + this.outpuExt);
                const result = sass__namespace.compile(srcFile, compileOption);
                if (compileOption.style !== 'compressed') {
                    result.css = js_beautify.css(result.css, beautifyOption);
                }
                fs__namespace.mkdirSync(path__namespace.dirname(outputPath), { recursive: true });
                fs__namespace.writeFileSync(outputPath, result.css.trim() + '\n');
                console.log('Compile: ' + srcFile + ' => ' + outputPath);
                if (result.sourceMap) {
                    fs__namespace.writeFileSync(outputPath + '.map', JSON.stringify(result.sourceMap));
                }
            });
        }
        // console.groupEnd();
    }
}

const cssBuilder = new sassBuilder();

exports.cssBuilder = cssBuilder;
