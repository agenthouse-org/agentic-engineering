#!/usr/bin/env node
import {main} from '../src/cli.js';
try {process.exitCode=await main(process.argv.slice(2));}
catch(error){process.stderr.write(`agenthouse: ${error.message}\n`);process.exitCode=2;}
