// Mention à côté du nom d'un joueur qui joue sans compte (« invité ») ou d'un robot (« robot »)
export default function GuestTag({ player }: { player?: { isAnonymous?: boolean; isBot?: boolean } }) {
  const label = player?.isBot ? "robot" : player?.isAnonymous ? "invité" : null;
  if (!label) return null;
  return <span className="badge badge-ghost badge-xs ml-1 align-middle font-normal">{label}</span>;
}
