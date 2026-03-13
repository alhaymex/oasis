import { Electroview } from "electrobun/view";
import type { AppRPCSchema } from "@/shared/rpc";

const rpc = Electroview.defineRPC<AppRPCSchema>({
  handlers: {
    requests: {},
    messages: {},
  },
});

export const electroview = new Electroview({ rpc });
