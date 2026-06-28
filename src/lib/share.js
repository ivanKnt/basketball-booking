/**
 * Client-side sharing helpers.
 *
 * WhatsApp (current): wa.me deep links + Web Share API — zero backend, works on mobile/desktop.
 *
 * OpenWA (@open-wa/wa-automate): Node.js server library that automates WhatsApp Web.
 * Use cases for HoopShare (requires Firebase Cloud Functions or separate server):
 *   - Auto-send match recap to a group chat when organizer clicks "Notify group"
 *   - RSVP reminders 1h before game
 *   - Payment confirmation pings
 * Not integrated here — SPA cannot run OpenWA; would need backend + WhatsApp session QR scan.
 * @see https://github.com/open-wa/wa-automate-nodejs
 */

export function shareViaWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

export async function shareNative({ title, text, url }) {
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return true;
  }
  return false;
}

export async function shareGameInvite(game, href) {
  const text = [
    `Match à ${game.location}`,
    `${game.date} à ${game.time}`,
    `${game.perHeadCost} ${game.currency || 'XOF'} par joueur`,
    '',
    `Rejoins sur HoopShare : ${href}`,
  ].join('\n');

  const shared = await shareNative({ title: 'HoopShare — Match', text, url: href });
  if (!shared) shareViaWhatsApp(`${text}`);
}

export async function shareGameSummary(game, rsvps, pledges, href) {
  const currency = game.currency || 'XOF';
  const lightIncluded = game.lightIncluded !== false;
  const duration = game.duration || 2;
  const lightCostPerHour = game.lightCostPerHour || 0;
  const totalLightNeeded = lightCostPerHour * duration;
  const totalPledged = pledges.reduce((acc, p) => acc + p.amount, 0);

  let text = `*MATCH — ${game.date} ${game.time}*\n`;
  text += `${game.location}\n\n`;
  text += `*JOUEURS (${rsvps.length}/${game.maxPlayers || '?'})*\n`;

  if (rsvps.length === 0) {
    text += 'Aucun joueur inscrit.\n';
  } else {
    rsvps.forEach((rsvp, idx) => {
      const playerPledge = pledges.filter(p => p.userId === rsvp.userId).reduce((a, p) => a + p.amount, 0);
      text += `${idx + 1}. ${rsvp.userName} — ${game.perHeadCost + playerPledge} ${currency}\n`;
    });
  }

  if (!lightIncluded && totalLightNeeded > 0) {
    text += `\n*LUMIÈRE (${totalPledged} / ${totalLightNeeded} ${currency})*\n`;
    const lightPledges = pledges.filter(p => p.amount > 0);
    if (lightPledges.length === 0) {
      text += 'Aucune cotisation.\n';
    } else {
      lightPledges.forEach(p => {
        text += `- ${p.userName} : ${p.amount} ${currency}\n`;
      });
    }
  }

  const totalCollected = rsvps.length * game.perHeadCost + totalPledged;
  text += `\n*Total récolté : ${totalCollected} ${currency}*\n`;
  text += `\n${href}`;

  const shared = await shareNative({ title: 'Récapitulatif HoopShare', text });
  if (!shared) shareViaWhatsApp(text);
}
