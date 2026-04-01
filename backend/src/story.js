const crypto = require("crypto");

const storyMinLength = 24;
const storyMaxLength = 1500;

function normalizeStoryBody(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function validateStoryBody(body, options = {}) {
  const minimumLength = options.allowShortDraft ? 1 : storyMinLength;

  if (!body) {
    return "Write a little more before continuing.";
  }

  if (body.length < minimumLength) {
    return options.allowShortDraft
      ? "Add a few more details before running the privacy check."
      : `Stories must be at least ${storyMinLength} characters long.`;
  }

  if (body.length > storyMaxLength) {
    return `Stories must be ${storyMaxLength} characters or fewer.`;
  }

  return "";
}

function createStoryChecksum(body) {
  return crypto.createHash("sha256").update(body).digest("hex");
}

function generateStoryTitle(body) {
  const firstParagraph = body.split(/\n+/).find(Boolean) || body;
  const firstSentence = firstParagraph.split(/[.!?]/)[0].trim();
  const source = (firstSentence || firstParagraph)
    .replace(/[#_*"`]/g, "")
    .trim();
  const words = source.split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "Untitled reflection";
  }

  const title = words.slice(0, 6).join(" ");
  const hasMoreWords = words.length > 6;
  const withSuffix = hasMoreWords ? `${title}...` : title;

  return withSuffix.slice(0, 160);
}

function suggestStoryTag(body) {
  const normalized = body.toLowerCase();
  const tagRules = [
    {
      tag: "#healing",
      terms: ["heal", "healing", "grief", "loss", "recover", "trauma"]
    },
    {
      tag: "#memories",
      terms: ["remember", "memory", "grandmother", "grandfather", "childhood"]
    },
    {
      tag: "#release",
      terms: ["anxious", "panic", "breathe", "release", "letting go"]
    },
    {
      tag: "#hope",
      terms: ["hope", "future", "beginning", "tomorrow", "light"]
    }
  ];

  const match = tagRules.find((rule) =>
    rule.terms.some((term) => normalized.includes(term))
  );

  return match?.tag || "#reflections";
}

function createStoryExcerpt(body, maxLength = 180) {
  const normalized = body.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function runPrivacyCheck(body) {
  const findings = [];

  function addFinding(type, severity, message) {
    if (findings.some((finding) => finding.type === type)) {
      return;
    }

    findings.push({
      type,
      severity,
      message
    });
  }

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi.test(body)) {
    addFinding(
      "email_address",
      "block",
      "This draft appears to contain an email address."
    );
  }

  if (/(?:\+?\d{1,2}\s*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]?\d{4}\b/g.test(body)) {
    addFinding(
      "phone_number",
      "block",
      "This draft appears to contain a phone number."
    );
  }

  if (/(https?:\/\/\S+|www\.\S+)/gi.test(body)) {
    addFinding(
      "link",
      "block",
      "This draft appears to contain a direct link or website address."
    );
  }

  if (/(^|\s)@[a-z0-9_]{2,}/gi.test(body)) {
    addFinding(
      "social_handle",
      "block",
      "This draft appears to contain a social handle or username."
    );
  }

  if (
    /\b\d{1,5}\s+[a-z0-9.'-]+\s(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way)\b/gi.test(
      body
    )
  ) {
    addFinding(
      "street_address",
      "block",
      "This draft appears to contain a street address."
    );
  }

  if (/\b(my name is|call me|reach me at|text me at|email me at|my address is)\b/gi.test(body)) {
    addFinding(
      "explicit_identity",
      "block",
      "This draft contains language that directly reveals personal identity details."
    );
  }

  if (/\b(?:i work at|my school is|i go to|my company is)\b/gi.test(body)) {
    addFinding(
      "organization_reference",
      "warning",
      "Specific school or workplace references can make a story easier to identify."
    );
  }

  if (/\b(?:in|at)\s+[A-Z][a-z]+,\s*(?:[A-Z]{2}|[A-Z][a-z]+)\b/g.test(body)) {
    addFinding(
      "specific_location",
      "warning",
      "A specific city or state reference may narrow down identity."
    );
  }

  const hasBlocker = findings.some((finding) => finding.severity === "block");
  const hasWarning = findings.some((finding) => finding.severity === "warning");

  if (hasBlocker) {
    return {
      status: "block",
      summary:
        "Potential identifying details were found. Remove direct contact or location details before publishing.",
      findings
    };
  }

  if (hasWarning) {
    return {
      status: "warning",
      summary:
        "A few details may make this story easier to identify. Review them before publishing.",
      findings
    };
  }

  return {
    status: "pass",
    summary: "No obvious identifying details were detected in this draft.",
    findings: []
  };
}

module.exports = {
  createStoryChecksum,
  createStoryExcerpt,
  generateStoryTitle,
  normalizeStoryBody,
  runPrivacyCheck,
  storyMaxLength,
  storyMinLength,
  suggestStoryTag,
  validateStoryBody
};
