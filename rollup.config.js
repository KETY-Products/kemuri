import typescript from '@rollup/plugin-typescript';

export default {
  input: {
    'html-builder': 'lib/html-builder.ts',
    'css-builder': 'lib/css-builder.ts',
    'js-builder': 'lib/js-builder.ts',
    builder: 'lib/builder.ts',
    server: 'lib/server.ts',
    screenshot: 'lib/screenshot.ts',
    'snippet-builder': 'lib/snippet-builder.ts',
  },
  plugins: [typescript()],
  output: {
      dir: 'bin',
      format: 'esm',
      chunkFileNames: 'common/[name].mjs',
      entryFileNames: '[name].js',
  }
};
