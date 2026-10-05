// Mention à côté du pseudo d'un joueur qui joue sans compte
export default function GuestTag({ player }: { player?: { isAnonymous?: boolean } }) {
  if (!player?.isAnonymous) return null;
  return <span className="badge badge-ghost badge-xs ml-1 align-middle font-normal">invité</span>;
}
