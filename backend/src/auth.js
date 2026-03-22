const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

const registeredSessionHours = Number(process.env.REGISTERED_SESSION_HOURS || 24 * 7);
const guestSessionHours = Number(process.env.GUEST_SESSION_HOURS || 24);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateUsername(username) {
  const value = String(username || "").trim();

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(value)) {
    return "Usernames must be 3-24 characters and contain only letters, numbers, or underscores.";
  }

  return null;
}

function validatePassword(password) {
  const value = String(password || "");

  if (value.length < 8) {
    return "Passwords must be at least 8 characters long.";
  }

  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return "Passwords must contain at least one letter and one number.";
  }

  return null;
}

function validateEmail(email) {
  const value = normalizeEmail(email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Enter a valid email address.";
  }

  return null;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);

  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, hash] = String(storedHash).split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derived = await scrypt(password, salt, 64);
  const stored = Buffer.from(hash, "hex");

  if (stored.length !== derived.length) {
    return false;
  }

  return crypto.timingSafeEqual(stored, derived);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSessionRecord(sessionType) {
  const token = crypto.randomBytes(32).toString("hex");
  const hours =
    sessionType === "guest" ? guestSessionHours : registeredSessionHours;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  return {
    id: crypto.randomUUID(),
    token,
    tokenHash: hashToken(token),
    expiresAt
  };
}

function getBearerToken(request) {
  const header = request.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

function parseCookies(headerValue) {
  return String(headerValue || "")
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((cookies, pair) => {
      const separatorIndex = pair.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const name = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function createOAuthState(secret) {
  const payload = Buffer.from(
    JSON.stringify({
      nonce: crypto.randomBytes(16).toString("hex"),
      exp: Date.now() + 10 * 60 * 1000
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function verifyOAuthState(state, secret) {
  const [payload, signature] = String(state || "").split(".");

  if (!payload || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  if (
    Buffer.byteLength(expected) !== Buffer.byteLength(signature) ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(decoded.exp) > Date.now();
  } catch (_error) {
    return false;
  }
}

function createAttemptStore() {
  const attempts = new Map();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;
  const blockMs = 15 * 60 * 1000;

  function cleanup(now) {
    for (const [key, value] of attempts.entries()) {
      if (value.resetAt <= now && value.blockedUntil <= now) {
        attempts.delete(key);
      }
    }
  }

  return {
    assertCanAttempt(key) {
      const now = Date.now();
      cleanup(now);
      const entry = attempts.get(key);

      if (entry && entry.blockedUntil > now) {
        const minutes = Math.ceil((entry.blockedUntil - now) / 60000);
        throw new Error(`Too many login attempts. Try again in ${minutes} minute(s).`);
      }
    },
    recordFailure(key) {
      const now = Date.now();
      cleanup(now);
      const entry = attempts.get(key);

      if (!entry || entry.resetAt <= now) {
        attempts.set(key, {
          count: 1,
          resetAt: now + windowMs,
          blockedUntil: 0
        });
        return;
      }

      entry.count += 1;

      if (entry.count >= maxAttempts) {
        entry.blockedUntil = now + blockMs;
      }
    },
    clear(key) {
      attempts.delete(key);
    }
  };
}

module.exports = {
  createAttemptStore,
  createOAuthState,
  createSessionRecord,
  getBearerToken,
  hashPassword,
  hashToken,
  normalizeEmail,
  parseCookies,
  serializeCookie,
  validateEmail,
  validatePassword,
  validateUsername,
  verifyOAuthState,
  verifyPassword
};
