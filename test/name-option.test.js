import path from 'path';

import {
  compile,
  execute,
  getCompiler,
  normalizeErrors,
  readAsset,
} from './helpers';

describe('"name" option', () => {
  it('should work without value', async () => {
    const compiler = getCompiler('simple.js');
    const stats = await compile(compiler);

    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('should work with "String" value', async () => {
    const compiler = getCompiler('simple.js', {
      name: '[hash].string.[ext][query]',
    });
    const stats = await compile(compiler);

    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('should work with "Function" value', async () => {
    const compiler = getCompiler('simple.js', {
      name(resourcePath, resourceQuery) {
        expect(resourcePath).toBeDefined();
        expect(resourceQuery).toBeDefined();

        return '[hash].function.[ext][query]';
      },
    });
    const stats = await compile(compiler);

    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('should work for CDN support query params', async () => {
    const compiler = getCompiler(
      'cdn.js',
      {
        name: '[path][name].[ext][query]',
      },
      {
        output: {
          path: path.resolve(__dirname, './outputs'),
          publicPath: 'https://cdn.example.com/',
          filename: '[name].bundle.js',
          chunkFilename: '[name].chunk.js',
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('should work and emit "immutable" for assets flag by default', async () => {
    expect.assertions(1);

    const compiler = getCompiler('simple.js');
    const stats = await compile(compiler);

    for (const [name, info] of stats.compilation.assetsInfo) {
      if (name.endsWith('png')) {
        expect(info.immutable).toBe(true);
      }
    }
  });

  it('should work and emit "immutable" for hashed assets', async () => {
    expect.assertions(1);

    const compiler = getCompiler('simple.js', {
      name: '[md5:hash:hex:8].asset.[ext]',
    });
    const stats = await compile(compiler);

    for (const [name, info] of stats.compilation.assetsInfo) {
      if (name.endsWith('png')) {
        expect(info.immutable).toBe(true);
      }
    }
  });

  it('should work and emit "immutable" for hashed assets #2', async () => {
    expect.assertions(1);

    const compiler = getCompiler('simple.js', {
      name: '[name].[contenthash].asset.[ext]',
    });
    const stats = await compile(compiler);

    for (const [name, info] of stats.compilation.assetsInfo) {
      if (name.endsWith('png')) {
        expect(info.immutable).toBe(true);
      }
    }
  });

  it('should not mark unhashed asset as immutable', async () => {
    expect.assertions(1);

    const compiler = getCompiler('simple.js', {
      name: 'asset.[ext]',
    });
    const stats = await compile(compiler);

    for (const [name, info] of stats.compilation.assetsInfo) {
      if (name.endsWith('png')) {
        expect(info.immutable).toBe(false);
      }
    }
  });
});
