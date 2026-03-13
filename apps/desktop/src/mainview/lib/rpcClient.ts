import { electroview } from "./electroview";

export const api = {
  ping: (msg: string) => electroview.rpc?.request.ping({ msg }),
};
