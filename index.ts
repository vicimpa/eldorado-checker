#!/usr/bin/env node

import { Console } from "console";
import { createWriteStream, readFileSync } from "fs";

import { delay } from "./lib/delay";
import { EldoradoApi } from "./lib/Eldorado";
import { FunpayAPI } from "./lib/Funpay";

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
    const { id } = await EldoradoApi.getAccountByName(name);
    const items = await EldoradoApi.fetchItems(id);
    console.log(`Finding`, items.length, 'items');
    const need = items
      .map((e) => ({
        ...e,
        funpayId: regExp.exec(e.description)?.[1] ?? null
      }))
      .filter(e => e.funpayId);
    console.log(`Checking`, need.length, 'by id');

    let time = 500;


    while (need.length) {
      const item = need.shift()!;
      const status = await FunpayAPI.checkItemStatus(item.funpayId!);

      if (status === 200) {
        time = 500;
        await delay(time);
        continue;
      }

      if (status === 429) {
        time += 200;
        need.push(item);
        await delay(time);
        continue;
      }

      console.log(status, item.id, item.offerTitle);
    }
    console.log(' ');
  }
}

main().catch(console.error);