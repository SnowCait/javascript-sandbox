import { type Handlers } from "$fresh/server.ts";
import { chart } from "$fresh_charts/core.ts";
import { ChartColors, transparentize } from "$fresh_charts/utils.ts";
import * as svg2png from "svg2png";

await svg2png.initialize(
  await fetch("https://unpkg.com/svg2png-wasm/svg2png_wasm_bg.wasm"),
);

export const handler: Handlers = {
  async GET() {
    const svg = chart({
      type: "line",
      data: {
        labels: ["1", "2", "3"],
        datasets: [
          {
            label: "Sessions",
            data: [123, 234, 234],
            borderColor: ChartColors.Red,
            backgroundColor: transparentize(ChartColors.Red, 0.5),
            borderWidth: 1,
          },
          {
            label: "Users",
            data: [346, 233, 123],
            borderColor: ChartColors.Blue,
            backgroundColor: transparentize(ChartColors.Blue, 0.5),
            borderWidth: 1,
          },
        ],
      },
      options: {
        devicePixelRatio: 1,
        scales: { y: { beginAtZero: true } },
      },
    });

    const png = await svg2png.svg2png(svg);

    return new Response(png, {
      headers: { "content-type": "image/png" },
    });
  },
};
