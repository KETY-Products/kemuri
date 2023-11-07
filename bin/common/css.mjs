import * as fs from 'node:fs';
import * as path from 'node:path';
import { b as baseBuilder } from './base.mjs';
import { glob } from 'glob';
import * as sass from 'sass';
import { rimraf } from 'rimraf';
import js_beautify from 'js-beautify';
import { a as console } from './config.mjs';

const beautify = js_beautify.css;
/**
 * ビルド処理の抽象クラス
 */
class sassBuilder extends baseBuilder {
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
        this.outputExt = 'css';
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
        const partialMatchFiles = glob
            .sync(indexMatchPatterns, {
            cwd: targetDir,
        })
            .filter((partialFile) => {
            // 同一階層のインデックスファイルは除外
            return partialFile !== this.indexFileName;
        })
            .sort();
        const indexFilePath = path.join(targetDir, this.indexFileName);
        if (partialMatchFiles.length === 0) {
            rimraf(indexFilePath);
            console.log('Remove index file: ' + indexFilePath);
        }
        else {
            const partialFiles = {
                children: [],
                files: [],
            };
            partialMatchFiles.forEach((partialFile) => {
                if (partialFile.includes(path.sep)) {
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
            if (fs.existsSync(indexFilePath)) {
                const indexFileContentBefore = fs.readFileSync(indexFilePath, 'utf-8');
                if (indexFileContentBefore != indexFileContent) {
                    fs.writeFileSync(indexFilePath, indexFileContent);
                    console.log('Update index file: ' + indexFilePath);
                }
            }
            else {
                fs.writeFileSync(indexFilePath, indexFileContent);
                console.log('Generate index file: ' + indexFilePath);
            }
        }
        if (recursive && path.dirname(targetDir).startsWith(this.srcDir)) {
            this.generateIndexFile(path.dirname(targetDir));
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
        if (this.generateIndex && path.basename(filePath) === this.indexFileName) {
            return;
        }
        console.group('Add file: ' + filePath);
        if (this.generateIndex) {
            // インデックスファイルの生成/更新
            this.generateIndexFile.bind(this)(path.dirname(filePath));
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
        if (this.generateIndex && path.basename(filePath) === this.indexFileName) {
            return;
        }
        console.group('Update file: ' + filePath);
        if (this.generateIndex) {
            // インデックスファイルの更新
            this.generateIndexFile.bind(this)(path.dirname(filePath));
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
        if (this.generateIndex && path.basename(filePath) === this.indexFileName) {
            return;
        }
        console.group('Remove file: ' + filePath);
        if (this.generateIndex) {
            // インデックスファイルの更新
            this.generateIndexFile.bind(this)(path.dirname(filePath));
        }
        if (Array.from(this.entryPoint.values()).includes(filePath)) {
            this.entryPoint.delete(filePath);
            const outputPath = this.convertOutputPath(filePath);
            rimraf(outputPath);
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
        const beautifyOption = this.getBeautifyOption('dummy.' + this.outputExt);
        const result = sass.compile(srcPath, compileOption);
        if (compileOption.style !== 'compressed') {
            result.css = beautify(result.css, beautifyOption);
        }
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, result.css.trim() + '\n');
        if (result.sourceMap) {
            fs.writeFileSync(outputPath + '.map', JSON.stringify(result.sourceMap));
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
            const partialFilePattern = path.join(this.srcDir, '**/_*.' + this.convertGlobPattern(this.fileExts));
            const partialFiles = glob.sync(partialFilePattern);
            if (partialFiles.length > 0) {
                partialFiles
                    .map((partialFile) => {
                    return path.dirname(partialFile);
                })
                    .reduce((unique, item) => {
                    return unique.includes(item) ? unique : [...unique, item];
                }, [])
                    .forEach((generateIndexDir) => {
                    this.generateIndexFile.bind(this)(generateIndexDir, false);
                });
            }
        }
        if (entries.size === 0) {
            return;
        }
        const compileOption = this.getCompileOption();
        const beautifyOption = this.getBeautifyOption('dummy.' + this.outputExt);
        entries.forEach((srcFile, entryPoint) => {
            const outputPath = path.join(this.outputDir, entryPoint + '.' + this.outputExt);
            const result = sass.compile(srcFile, compileOption);
            if (compileOption.style !== 'compressed') {
                result.css = beautify(result.css, beautifyOption);
            }
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, result.css.trim() + '\n');
            console.log('Compile: ' + srcFile + ' => ' + outputPath);
            if (result.sourceMap) {
                fs.writeFileSync(outputPath + '.map', JSON.stringify(result.sourceMap));
            }
        });
        // console.groupEnd();
    }
}

const cssBuilder = new sassBuilder();

export { cssBuilder as c };
