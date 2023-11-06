// wrap apis with setup

import {
  get_current_user as get_current_user_orig,
  get_playlist as get_playlist_orig,
  get_queue as get_queue_orig,
} from "libmuse";
import { setup } from "./auth";

function executeAndLog<T extends (...args: any[]) => Promise<any>>(
  func: T,
) {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    setup();
    return await func(...args);
  });
}

export const get_queue = executeAndLog(get_queue_orig);
export const get_playlist = executeAndLog(get_playlist_orig);
export const get_current_user = executeAndLog(get_current_user_orig);
