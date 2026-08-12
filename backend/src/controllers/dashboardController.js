const { getWeddingForUser, toDateOnly, buildInitials } = require("../utils/wedding");
const { fetchGuestsForWedding, mapGuestRow } = require("./guestsController");

function statsFromGuests(guests) {
  const confirmed = guests.filter((guest) => guest.status === "confirmed");
  const pending = guests.filter((guest) => guest.status === "pending");
  const declined = guests.filter((guest) => guest.status === "declined");

  return {
    guestsInvited: guests.reduce(
      (sum, guest) => sum + (Number(guest.invitedCount) || 0),
      0
    ),
    rsvpConfirmed: confirmed.reduce((sum, guest) => {
      const attending = Number(guest.rsvpCount) || 0;
      const invited = Number(guest.invitedCount) || 0;
      return sum + (attending > 0 ? attending : invited);
    }, 0),
    pending: pending.reduce(
      (sum, guest) => sum + (Number(guest.invitedCount) || 0),
      0
    ),
    declined: declined.length,
    guestParties: guests.length,
    confirmedParties: confirmed.length,
    pendingParties: pending.length,
    declinedParties: declined.length,
  };
}

async function getDashboard(req, res) {
  try {
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);

    if (!wedding) {
      return res.status(404).json({
        error: "Not Found",
        message: "No wedding found for this account",
      });
    }

    const rows = await fetchGuestsForWedding(wedding.id);
    const guests = rows.map(mapGuestRow);
    const stats = statsFromGuests(guests);
    const weddingDate = toDateOnly(wedding.wedding_date);

    return res.status(200).json({
      wedding: {
        id: wedding.id,
        coupleNames: wedding.couple_names,
        initials: buildInitials(wedding.couple_names),
        weddingDate,
        weddingDateTime: wedding.wedding_date,
      },
      stats,
      guests,
    });
  } catch (err) {
    console.error("dashboard error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load dashboard",
    });
  }
}

module.exports = { getDashboard };
