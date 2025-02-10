import Debug from 'debug'

const debug = Debug('env')

const isServing = process.env.ELEVENTY_RUN_MODE === 'serve'

const env = JSON.stringify({
  gtag: isServing ? { debug_mode: true } : {}
}, null, 2)

debug(env)

export default env
