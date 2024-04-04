/// <reference lib="deno.unstable" />

import { type Handlers } from "$fresh/server.ts";
import { chart } from "$fresh_charts/core.ts";
import { ChartColors, transparentize } from "$fresh_charts/utils.ts";
import { delay } from "$std/async/delay.ts";

const kv = await Deno.openKv();

const supportedPairs = [
  "btc_jpy",
  "etc_jpy",
  "lsk_jpy",
  "mona_jpy",
  "plt_jpy",
  "fnct_jpy",
  "dai_jpy",
  "wbtc_jpy",
];

export const handler: Handlers = {
  async GET(_, { params, renderNotFound }) {
    console.log("[chart]", params);
    const { pair, date } = params;
    const today = new Date(date);
    const targetDate = new Date(today);
    if (!supportedPairs.includes(pair) || Number.isNaN(today.getTime())) {
      return renderNotFound();
    }

    const data = new Map<Date, string>();
    for (let i = 0; i < 31; i++) {
      const time = targetDate.toISOString();

      targetDate.setDate(targetDate.getDate() - 1);

      // From cache
      const { value } = await kv.get([pair, time]);
      if (value) {
        const { rate } = value as { rate: string };
        console.log("[cache]", pair, time, rate);

        data.set(new Date(time), rate);

        continue;
      }

      // From API
      const url =
        `https://coincheck.com/exchange/rates/search?pair=${pair}&time=${time}`;
      const response = await fetch(url);
      const { rate } = await response.json();
      console.log("[api]", pair, time, rate);

      // To cache
      if (rate !== undefined) {
        await kv.set([pair, time], { rate });
      }

      data.set(new Date(today), rate);

      if (i % 5 === 4) {
        await delay(500);
      }
    }

    const svg = chart({
      type: "line",
      data: {
        labels: [...data.keys()].reverse().map((date) =>
          `${date.getMonth() + 1}/${date.getDate()}`
        ),
        datasets: [
          {
            label: `${pair} (${today.toLocaleDateString("ja")})`,
            data: [...data].reverse().map(([, rate]) => Number(rate)),
            borderColor: ChartColors.Blue,
            backgroundColor: transparentize(ChartColors.Blue, 0.5),
            borderWidth: 1,
          },
        ],
      },
      options: {
        devicePixelRatio: 1,
      },
    });

    return new Response(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  },
};
