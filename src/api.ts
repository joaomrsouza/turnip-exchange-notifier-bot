import axios, { AxiosResponse } from "axios";

const islanders = ["neither", "daisy", "celeste"] as const;

type Islander = typeof islanders[number];

const categories = ["turnips", "cataloging", "crafting", "other"] as const;

type Category = typeof categories[number];

interface TurnipExchangeAPIBody {
  islander: Islander;
  category: Category;
  patreon?: 1;
  fee?: 0 | 1;
}

export interface TurnipExchangeAPIIsland {
  name: string;
  background: null;
  fruit: string;
  turnipPrice: number;
  maxQueue: number;
  turnipCode: string;
  hemisphere: "north" | "south";
  watchlist: number;
  fee: 0 | 1;
  islander: Islander;
  category: Category;
  islandTime: string;
  creationTime: string;
  description: string;
  queued: string;
  patreon: number;
  discordOnly: number;
  patreonOnly: number;
  messageID: string;
  rating: number;
  ratingCount: number;
  live: number;
  thumbsupt: number;
  thumbsdown: number;
  heart: number;
  poop: number;
  clown: number;
  islandScore: number;
}

interface TurnipExchangeAPIResponse {
  $$time: number;
  islands: TurnipExchangeAPIIsland[];
  message: string;
  success: boolean;
}

const turnipExchangeAPI = axios.create({
  baseURL: "https://api.turnip.exchange/islands",
});

export const api = {
  getIslands: async (): Promise<TurnipExchangeAPIResponse> => {
    const res = await turnipExchangeAPI.post<
      TurnipExchangeAPIResponse,
      AxiosResponse<TurnipExchangeAPIResponse>,
      TurnipExchangeAPIBody
    >("", {
      islander: "neither",
      category: "turnips",
    });
    return res.data;
  },
};
