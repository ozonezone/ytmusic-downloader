import { get_playlist, PlaylistItem } from "libmuse";
import ytdl from "youtube-dl-exec";

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

async function* downloadTracks(playlist_id: string, tracks: PlaylistItem[]) {
  for (const track of tracks) {
    console.log(`Downloading ${track.title}`);
    yield new Promise<void>((resolve, reject) => {
      ytdl(`https://music.youtube.com/watch?v=${track.videoId}`, {
        output: `./downloads/${playlist_id}/${track.videoId}.mp3`,
      }).then(() => {
        resolve();
      }).catch((e) => {
        reject(e);
      });
    });
  }
}

async function* makeIterator(playlist_id: string) {
  yield encoder.encode(`Fetching playlist id: ${playlist_id}\n`);
  try {
    const playlist = await get_playlist(playlist_id);
    yield encoder.encode(`Playlist title: ${playlist.title}\n`);
    for (const track of playlist.tracks) {
      yield encoder.encode(`  ${track.title}\n`);
    }

    for await (const _ of downloadTracks(playlist_id, playlist.tracks)) {
      yield encoder.encode(`Downloaded ${playlist.title}\n`);
    }
  } catch (e) {
    console.error("Failed fetch playlist", e);
    yield encoder.encode(`Failed to fetch playlist ${playlist_id}\n`);
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
