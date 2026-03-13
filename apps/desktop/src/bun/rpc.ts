import { BrowserView } from "electrobun";
import { AppRPCSchema } from "../shared/rpc";

export const rpc = BrowserView.defineRPC<AppRPCSchema>({
  maxRequestTime: 60_000,
  handlers: {
    requests: {
      ping: ({ msg }) => console.log(msg),
    },
  },
});
