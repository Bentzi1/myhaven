const defaultPolicyVersion = {
  versionLabel: "pilot-v1",
  pilotStatus:
    "Pilot phase: privacy, moderation, and recovery flows are still being refined before production launch.",
  termsOfService: [
    "You keep ownership of the stories you share, but you grant MyHaven permission to display and moderate them inside the platform.",
    "Content that threatens safety, exposes private identities, or violates platform rules may be removed.",
    "Registered users can later manage their own stories from My Stories. Anonymous sessions cannot recover prior-session ownership."
  ],
  privacyHighlights: [
    "Registered accounts store a username, email address, and authentication metadata needed to secure your account.",
    "Anonymous access uses a temporary guest session and does not preserve a cross-session account history.",
    "Policy acceptance is recorded so the platform can enforce consent before posting."
  ]
};

function getPolicyPresentation(activeVersion) {
  return {
    versionLabel: activeVersion?.version_label || defaultPolicyVersion.versionLabel,
    pilotStatus: defaultPolicyVersion.pilotStatus,
    termsOfService: defaultPolicyVersion.termsOfService,
    privacyHighlights: defaultPolicyVersion.privacyHighlights
  };
}

module.exports = {
  defaultPolicyVersion,
  getPolicyPresentation
};
