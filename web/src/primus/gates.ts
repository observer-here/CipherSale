export const GATES = [{
  label: "Spotify account ownership",
  condition: "[{\"op\":\"REVEAL_STRING\",\"field\":\"$.data.me.profile.username\",\"reveal_id\":\"username\"},{\"op\":\"REVEAL_STRING\",\"field\":\"$.data.me.profile.name\",\"reveal_id\":\"name\"}]",
}] as const;
