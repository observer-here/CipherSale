// Buyer checks offered on Create sale. The Spotify template is account ownership and sends no extra condition, so the proof's attConditions is [].
export const GATES = [{ id: "spotify", label: "Spotify account ownership", condition: "[]" }] as const;
