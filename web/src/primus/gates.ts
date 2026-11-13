// The Spotify template reveals the profile name and username. The sale stores this exact string.
export const GATES = [{
  id: "spotify",
  label: "Spotify account ownership",
  condition: "[{\"op\":\"REVEAL_STRING\",\"field\":\"$.data.me.profile.username\",\"reveal_id\":\"username\"},{\"op\":\"REVEAL_STRING\",\"field\":\"$.data.me.profile.name\",\"reveal_id\":\"name\"}]",
}] as const;
