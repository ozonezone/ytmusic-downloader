import * as v from "valibot";

export const DownloadRequestPostSchema = v.object({
  url: v.string(),
  excludeVideo: v.boolean(),
  overwrite: v.boolean(),
  /// If true, the file name will be prefixed with the index of the song in the playlist.
  indexName: v.boolean(),
  /// Write youtube id to the metadata.
  writeYoutubeId: v.boolean(),
});
