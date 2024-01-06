#!/usr/bin/env node

import { Console } from "console";
import { createWriteStream, readFileSync } from "fs";

import { delay } from "./lib/delay";
import { EldoradoApi } from "./lib/Eldorado";
import { FunpayAPI } from "./lib/Funpay";
import { funpayCheck } from "./lib/funpayCheck";
import { G2GAPI } from "./lib/G2G";

const outputStream = createWriteStream('./output.txt');
const myConsole = new Console(outputStream);

const log = console.log;

console.log = (...args: any[]) => {
  log(...args);
  myConsole.log(...args);
};

async function main() {
  const regExp = /ID\((\d+)\)/i;
  console.log(new Date());

  let [argvNames = ''] = process.argv.slice(2);

  if (!argvNames) {
    try {
      argvNames = readFileSync('./input.txt', 'utf8');
    } catch (e) { }
  }

  const names: string[] = argvNames.split(/[,\s\n]/).map(e => e.trim()).filter(Boolean);

  for (const name of names) {
    console.log('Start of', name);
    const items = await G2GAPI.fetchItems(name);
    const need = items
      .map(e => ({
        ...e,
        title: e.title,
        id: e.offer_id,
        funpayId: regExp.exec(e.title)?.[1] || null
      }))
      .filter(e => e.funpayId);
    console.log('Find ', items.length, 'items');
    await funpayCheck(need);
    console.log(' ');
  }
}

main().catch(console.error);