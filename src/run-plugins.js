'use strict'

import chalk from 'chalk'
import { inquire, runArray, run } from './utils.js'

// this is used to run all of the plugins
export default async function runPlugins(plugins) {
  const running = []

  for (let i = 0; i < plugins.length; i++) {
    running.push(runPlugin(plugins[i]))
  }

  return await Promise.all(running)
}


async function runPlugin(plugin) {
  try {
    // Try to run the `pre` defined in the plugin
    if (plugin.pre && plugin.list) {
      plugin.list = await plugin.pre(plugin.list)
    }
  } catch (err) {
    console.log(
      chalk.red('Error:'), '\n',
      `running 'pre' function for ${chalk.yellow.bold(plugin.command)} in`, '\n',
      `index: ${plugin.index}`, '\n',
      `file: ${plugin.path}`, '\n',
      err.stack
    )

    // check to see if they want to continue with the install
    const question = await inquire.choose(
      `Would you like to continue with the full list in for ${plugin.command}`,
      [ 'yes', 'no' ],
      {
        timeout: 10000,
        timeout_message: 'Continued on because there was no answer after 10s',
        default: 'yes'
      }
    )

    if (question === 'yes') {
      return `${plugin.command} pre function was skipped because of an issue with it`
    }

    process.exit()
  }

  try {
    if (plugin.list) {
      await runArray(
        plugin.command,
        plugin.list,
        'inherit',
        true
      )
    } else {
      await run(plugin.command, 'inherit', true)
    }
  } catch (err) {
    console.log(chalk.red('Error:\n'), err)
  }

  try {
    if (plugin.post) {
      await plugin.post(plugin.command, plugin.list)
    }
  } catch (err) {
    console.log(
      chalk.red('Error:\n'),
      `There was an issue running the post function for ${plugin.command}`,
      err
    )
  }
}
