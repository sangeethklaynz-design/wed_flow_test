const { getWeddingForUser } = require("../utils/wedding");
const {
  loadStaticInvitationBundle,
} = require("../utils/invitationTemplate");

async function getInvite(req, res) {
  try {
    const wedding = await getWeddingForUser(req.user.id, req.user.weddingId);

    if (!wedding) {
      return res.status(404).json({
        error: "Not Found",
        message: "No wedding found for this account",
      });
    }

    const staticBundle = await loadStaticInvitationBundle(wedding.id);
    if (!staticBundle) {
      return res.status(404).json({
        error: "Not Found",
        message: "Wedding not found",
      });
    }

    return res.status(200).json({
      wedding: staticBundle.wedding,
      video: staticBundle.video,
      invitation: staticBundle.invitation,
      images: staticBundle.images,
      milestones: staticBundle.milestones,
      contacts: staticBundle.contacts,
    });
  } catch (err) {
    console.error("invite error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to load invitation",
    });
  }
}

module.exports = { getInvite };
