import { get_playlist } from "libmuse";

function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

const encoder = new TextEncoder();

async function* makeIterator(playlist_id: string) {
  yield encoder.encode(`Fetching playlist id: ${playlist_id}\n`);
  const playlist = await get_playlist(playlist_id);
  for (const track of playlist.tracks) {
    yield encoder.encode(`${track.title}\n`);
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const url_s = params.get("url");
  if (!url_s) {
    throw new Error("No url provided");
  }
  const url = new URL(url_s);
  const url_params = url.searchParams;
  const playlist_id = url_params.get("list");
  if (!playlist_id) {
    throw new Error("No playlist id provided");
  }

  const iterator = makeIterator(playlist_id);
  const stream = iteratorToStream(iterator);

  return new Response(stream);
}
