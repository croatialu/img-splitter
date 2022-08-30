import NodePath from 'path'
import RollupTypescript from '@rollup/plugin-typescript'

import Package from './package.json'

const resolveFile = path => NodePath.resolve(__dirname, path)

export default {
  input: resolveFile(Package.source),
  output: [
    {
      file: resolveFile(Package.main),
      format: 'cjs',
      sourcemap: false
    },
    {
      file: resolveFile(Package.module),
      format: 'es',
      sourcemap: false
    },
    {
      file: resolveFile(Package.browser),
      format: 'umd',
      name: 'img-splitter',
      sourcemap: false,
    }
  ],
  plugins: [
    RollupTypescript({
      tsconfig: resolveFile('tsconfig.json')
    })
  ]
}
