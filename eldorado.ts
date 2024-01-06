#!/usr/bin/env node

import { Console } from "console";
import { createWriteStream, readFileSync } from "fs";

import { delay } from "./lib/delay";
import { EldoradoApi } from "./lib/Eldorado";
import { FunpayAPI } from "./lib/Funpay";
import { funpayCheck } from "./lib/funpayCheck";

const outputStream = createWriteStream('./output.txt');
const myConsole = new Console(outputStream);

const log = console.log;

console.log = (...args: any[]) => {
  log(...args);
  myConsole.log(...args);
};

async function main() {
  const regExp = /\#(\d+)/;
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
    const { id } = await EldoradoApi.getAccountByName(name);
    const items = await EldoradoApi.fetchItems(id);
    console.log(`Finding`, items.length, 'items');
    const need = items
      .map((e) => ({
        ...e,
        id: e.id,
        title: e.offerTitle,
        funpayId: regExp.exec(e.description)?.[1] ?? null
      }))
      .filter(e => e.funpayId);

    await funpayCheck(need);
    console.log(' ');
  }
}

main().catch(console.error);