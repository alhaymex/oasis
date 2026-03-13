import type { RPCSchema } from "electrobun";

export type AppRPCSchema = {
  // functions that can be called from the client
  bun: RPCSchema<{
    requests: {
      ping: {
        params: { msg: string };
        response: void;
      };
    };
    messages: {};
  }>;

  // functions that can be called from the bun process
  webview: RPCSchema<{
    requests: {};
    messages: {};
  }>;
};
