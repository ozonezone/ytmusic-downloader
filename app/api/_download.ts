import { setup } from "@/lib/muse/auth";
import { get_option } from "libmuse";
import tempfile from "tempfile";
import { spawn } from "child_process";
import * as fs from "fs/promises";
import sanitize from "sanitize-filename";

export type DownloadTrack = {
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  year?: string;
  thumbnailUrl: string;
};

export async function downloadTracks(
  tracks: DownloadTrack[],
  outputFolder: string,
  sendMessage: (message: string) => void,
  options: {
    indexName: boolean;
    overwrite: boolean;
  },
) {
  setup();
  const auth = get_option("auth");

  try {
    await fs.mkdir(outputFolder, { recursive: true });
  } catch {}

  sendMessage(`Downloading ${tracks.length} tracks to ${outputFolder}`);
  tracks.forEach((track) => {
    sendMessage(`|  Downloading ${track.title} (${track.videoId})`);
  });

  let success = 0;
  let failed = 0;
  await Promise.all(tracks.map(async (track, i) => {
    if (!track.videoId) {
      sendMessage(
        "No video id found for " + track.title + ". Maybe not authed.?",
      );
      return;
    }
    const ytDlpTempPath = tempfile({ extension: "m4a" });
    // ffmpeg cannot handle m4a metadata well. So, we convert it to mp4 first.
    // After ffmpeg, we rename it back to m4a.
    const ffmpegTempPath = tempfile({ extension: "mp4" });
    const outputPath = (options.indexName ? `${i + 1} - ` : "") + outputFolder +
      sanitize(track.title) + ".m4a";

    try {
      await downloadTrack(
        track.videoId,
        auth.token!.access_token,
        ytDlpTempPath,
      );
      await addMetadata(
        ytDlpTempPath,
        ffmpegTempPath,
        track,
        options.overwrite,
      );
      await fs.copyFile(ffmpegTempPath, outputPath);
      success++;
      sendMessage(
        `Downloaded ${track.title} (success: ${success}, failed: ${failed})`,
      );
    } catch (e) {
      failed++;
      let mes = e;
      if (e && typeof e === "object") {
        if ("shortMessage" in e) {
          mes = e.shortMessage;
        }
      }
      sendMessage(
        `Failed to download ${track.title} (success: ${success}, failed: ${failed}): ${mes}`,
      );
    } finally {
      try {
        await fs.rm(ffmpegTempPath);
        await fs.rm(ytDlpTempPath);
      } catch {}
    }
  }));

  sendMessage(`Finished downloading ${tracks.length} tracks`);
}

async function downloadTrack(
  videoId: string,
  accessToken: string,
  outputPath: string,
) {
  await new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    // deno-fmt-ignore
    const proc = spawn("yt-dlp", [
      `https://music.youtube.com/watch?v=${videoId}`,
      "--output", outputPath,
      "--format", "bestaudio/best",
      "--no-embed-metadata", "--no-embed-thumbnail",
      "--add-header", `Authorization:Bearer ${accessToken}`,
      "--verbose"
    ]);
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(`yt-dlp exited with code ${code}: ${stderr}`);
      }
    });
  });
}

async function addMetadata(
  inputPath: string,
  outputPath: string,
  metaData: DownloadTrack,
  overwrite: boolean,
) {
  await new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    // deno-fmt-ignore
    const options = [
      "-i", inputPath,
      "-i", metaData.thumbnailUrl,
      "-map", "0",
      "-map", "1",
      "-c", "copy",
      "-disposition:1", "attached_pic",
      "-id3v2_version", "3",
      "-metadata", `title=${metaData.title}`,
      "-metadata", `artist=${metaData.artist}`
    ]
    if (metaData.album) {
      options.push("-metadata", `album=${metaData.album}`);
    }
    if (metaData.albumArtist) {
      options.push("-metadata", `album_artist=${metaData.albumArtist}`);
    }
    if (metaData.year) {
      options.push("-metadata", `year=${metaData.year}`);
    }

    if (overwrite) {
      options.push("-y");
    } else {
      options.push("-n");
    }
    options.push(outputPath);

    const proc = spawn("ffmpeg", options);

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(`ffmpeg exited with code ${code}: ${stderr}`);
      }
    });
  });
}
