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
  nameIndex: boolean = false,
) {
  setup();
  const auth = get_option("auth");

  try {
    await fs.mkdir(outputFolder, { recursive: true });
  } catch {}

  sendMessage(`Downloading ${tracks.length} tracks to ${outputFolder}`);
  tracks.forEach((track) => {
    sendMessage(`|  Downloading ${track.title}`);
  });

  await Promise.all(tracks.map(async (track, i) => {
    if (!track.videoId) {
      sendMessage(
        "No video id found for " + track.title + ". Maybe not authed.?",
      );
      return;
    }
    const ytDlpTempPath = tempfile({ extension: "m4a" });
    await downloadTrack(track.videoId, auth.token!.access_token, ytDlpTempPath);
    // ffmpeg cannot handle m4a metadata well. So, we convert it to mp4 first.
    // After ffmpeg, we rename it back to m4a.
    const ffmpegTempPath = outputFolder + track.videoId + ".mp4";
    const outputPath = (nameIndex ? `${i + 1} - ` : "") + outputFolder +
      sanitize(track.title) + ".m4a";

    try {
      await addMetadata(ytDlpTempPath, ffmpegTempPath, track);
      await fs.rename(ffmpegTempPath, outputPath);
      sendMessage(`Downloaded ${track.title}`);
    } catch (e) {
      if (e && typeof e === "object") {
        if ("shortMessage" in e) {
          sendMessage(`Failed to download ${track.title}: ${e.shortMessage}`);
          return;
        }
      }
      sendMessage(`Failed to download ${track.title}: ${e}`);
    } finally {
      await fs.rm(ytDlpTempPath);
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
    options.push("-y", outputPath);

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
