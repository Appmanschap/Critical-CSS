import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index2.js'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index2.js',
})