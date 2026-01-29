#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, validateConfig } from '../adapters/config.js';
import { ClipperService } from '../core/ClipperService.js';

const program = new Command();

program
  .name('clipper')
  .description('YouTube to 9:16 Viral Shorts Generator')
  .version('1.0.0')
  .argument('<url>', 'YouTube URL to process')
  .option('-w, --watch', 'Watch processing progress (default: true)')
  .option('-nw, --no-watch', 'Skip watching, just trigger workflow')
  .action(async (url: string, options) => {
    console.log(chalk.cyan('\n🎬 Clipper CLI - YouTube to 9:16 Shorts\n'));

    try {
      const config = loadConfig();
      validateConfig(config);
      const service = new ClipperService(config);

      const watch = options.watch !== false;
      await service.process(url, watch);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program.parse();
