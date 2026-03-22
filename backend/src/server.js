const cors = require("cors");
const express = require("express");
const {
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
} = require("./auth");
const {
  checkDatabaseConnection,
  ensureDatabaseSchema,
  getActivePolicyVersion,
  pool
} = require("./db");
const { getPolicyPresentation } = require("./policyContent");

const app = express();
const port = process.env.PORT || 3001;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const backendPublicOrigin =
  process.env.BACKEND_PUBLIC_ORIGIN || `http://localhost:${port}`;
const oauthStateSecret = process.env.AUTH_STATE_SECRET || "dev-auth-state-secret";
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const googleRedirectUri =
  process.env.GOOGLE_REDIRECT_URI ||
  `${backendPublicOrigin}/api/auth/google/callback`;
const loginAttempts = createAttemptStore();

app.use(
  cors({
    origin: frontendOrigin,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());

function isGoogleConfigured() {
  return Boolean(googleClientId && googleClientSecret);
}

function getClientMeta(request) {
  return {
    ipAddress: request.ip || null,
    userAgent: request.get("user-agent") || null
  };
}

async function createRegisteredSession(userId, clientMeta) {
  const session = createSessionRecord("registered");

  await pool.query(
    `
      INSERT INTO sessions (
        id,
        user_id,
        session_token_hash,
        status,
        issued_at,
        expires_at,
        last_activity_at,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, 'active', UTC_TIMESTAMP(), ?, UTC_TIMESTAMP(), ?, ?)
    `,
    [
      session.id,
      userId,
      session.tokenHash,
      session.expiresAt,
      clientMeta.ipAddress,
      clientMeta.userAgent
    ]
  );

  return session;
}

async function createGuestSession(clientMeta) {
  const session = createSessionRecord("guest");

  await pool.query(
    `
      INSERT INTO guest_sessions (
        id,
        session_token_hash,
        status,
        issued_at,
        expires_at,
        last_activity_at,
        ip_address,
        user_agent
      )
      VALUES (?, ?, 'active', UTC_TIMESTAMP(), ?, UTC_TIMESTAMP(), ?, ?)
    `,
    [session.id, session.tokenHash, session.expiresAt, clientMeta.ipAddress, clientMeta.userAgent]
  );

  return session;
}

async function findSessionByToken(token) {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const [registeredRows] = await pool.query(
    `
      SELECT
        'registered' AS session_type,
        s.id,
        s.user_id,
        s.expires_at,
        u.username,
        u.email
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.session_token_hash = ?
        AND s.status = 'active'
        AND s.expires_at > UTC_TIMESTAMP()
      LIMIT 1
    `,
    [tokenHash]
  );

  if (registeredRows[0]) {
    await pool.query(
      `
        UPDATE sessions
        SET last_activity_at = UTC_TIMESTAMP()
        WHERE id = ?
      `,
      [registeredRows[0].id]
    );

    return registeredRows[0];
  }

  const [guestRows] = await pool.query(
    `
      SELECT
        'guest' AS session_type,
        id,
        expires_at
      FROM guest_sessions
      WHERE session_token_hash = ?
        AND status = 'active'
        AND expires_at > UTC_TIMESTAMP()
      LIMIT 1
    `,
    [tokenHash]
  );

  if (!guestRows[0]) {
    return null;
  }

  await pool.query(
    `
      UPDATE guest_sessions
      SET last_activity_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    [guestRows[0].id]
  );

  return guestRows[0];
}

async function getPolicyAcceptanceStatus(session, activePolicy) {
  if (!session || !activePolicy) {
    return false;
  }

  const query =
    session.session_type === "registered"
      ? `
          SELECT id
          FROM policy_acceptances
          WHERE policy_version_id = ?
            AND user_id = ?
          LIMIT 1
        `
      : `
          SELECT id
          FROM policy_acceptances
          WHERE policy_version_id = ?
            AND guest_session_id = ?
          LIMIT 1
        `;

  const subjectId =
    session.session_type === "registered" ? session.user_id : session.id;
  const [rows] = await pool.query(query, [activePolicy.id, subjectId]);
  return Boolean(rows[0]);
}

function buildSessionPayload(session, activePolicy, hasAcceptedPolicy) {
  const payload = {
    authenticated: Boolean(session),
    sessionType: session?.session_type || null,
    hasAcceptedActivePolicy: hasAcceptedPolicy,
    activePolicy: activePolicy ? getPolicyPresentation(activePolicy) : null
  };

  if (session?.session_type === "registered") {
    payload.user = {
      id: session.user_id,
      username: session.username,
      email: session.email
    };
  }

  if (session?.session_type === "guest") {
    payload.guest = {
      sessionId: session.id
    };
  }

  return payload;
}

async function loadSessionForRequest(request) {
  const token = getBearerToken(request);
  const session = await findSessionByToken(token);
  request.authToken = token;
  request.authSession = session;
}

async function revokeSession(session) {
  if (!session) {
    return;
  }

  const table = session.session_type === "registered" ? "sessions" : "guest_sessions";

  await pool.query(
    `
      UPDATE ${table}
      SET status = 'revoked',
          revoked_at = UTC_TIMESTAMP()
      WHERE id = ?
    `,
    [session.id]
  );
}

async function findOrCreateGoogleUser(profile) {
  const normalizedEmail = normalizeEmail(profile.email);
  const providerUserId = String(profile.sub || "");

  const [linkedRows] = await pool.query(
    `
      SELECT u.id, u.username, u.email
      FROM auth_providers ap
      INNER JOIN users u ON u.id = ap.user_id
      WHERE ap.provider_name = 'google'
        AND ap.provider_user_id = ?
      LIMIT 1
    `,
    [providerUserId]
  );

  if (linkedRows[0]) {
    return linkedRows[0];
  }

  const [existingUserRows] = await pool.query(
    `
      SELECT id, username, email
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [normalizedEmail]
  );

  let user = existingUserRows[0];

  if (!user) {
    const usernameBase = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") || "haven_user";
    let usernameCandidate = usernameBase.slice(0, 20) || "haven_user";
    let suffix = 1;

    while (true) {
      const [duplicateRows] = await pool.query(
        `
          SELECT id
          FROM users
          WHERE username = ?
          LIMIT 1
        `,
        [usernameCandidate]
      );

      if (!duplicateRows[0]) {
        break;
      }

      suffix += 1;
      usernameCandidate = `${usernameBase.slice(0, 18)}_${suffix}`;
    }

    const [result] = await pool.query(
      `
        INSERT INTO users (
          username,
          email,
          password_hash,
          signup_method,
          email_verified_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, NULL, 'google', UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
      [usernameCandidate, normalizedEmail]
    );

    user = {
      id: result.insertId,
      username: usernameCandidate,
      email: normalizedEmail
    };
  }

  await pool.query(
    `
      INSERT INTO auth_providers (
        user_id,
        provider_name,
        provider_user_id,
        provider_email,
        provider_email_verified,
        created_at,
        updated_at
      )
      VALUES (?, 'google', ?, ?, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        provider_email = VALUES(provider_email),
        provider_email_verified = VALUES(provider_email_verified),
        updated_at = UTC_TIMESTAMP()
    `,
    [user.id, providerUserId, normalizedEmail]
  );

  return user;
}

app.use(async (request, _response, next) => {
  try {
    await loadSessionForRequest(request);
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "backend"
  });
});

app.get("/api/health/db", async (_request, response) => {
  try {
    await checkDatabaseConnection();

    response.json({
      status: "ok",
      service: "backend",
      database: "mysql"
    });
  } catch (error) {
    response.status(503).json({
      status: "error",
      service: "backend",
      database: "mysql",
      message: error.message
    });
  }
});

app.get("/api/auth/config", (_request, response) => {
  response.json({
    googleEnabled: isGoogleConfigured()
  });
});

app.get("/api/auth/session", async (request, response) => {
  const activePolicy = await getActivePolicyVersion();
  const hasAcceptedPolicy = await getPolicyAcceptanceStatus(
    request.authSession,
    activePolicy
  );

  response.json(buildSessionPayload(request.authSession, activePolicy, hasAcceptedPolicy));
});

app.post("/api/auth/register", async (request, response) => {
  const { username, email, password } = request.body || {};
  const usernameError = validateUsername(username);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (usernameError || emailError || passwordError) {
    return response.status(400).json({
      message: usernameError || emailError || passwordError
    });
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  try {
    const [result] = await pool.query(
      `
        INSERT INTO users (
          username,
          email,
          password_hash,
          signup_method,
          email_verified_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, 'manual', NULL, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
      [String(username).trim(), normalizedEmail, passwordHash]
    );

    const activePolicy = await getActivePolicyVersion();
    const session = await createRegisteredSession(result.insertId, getClientMeta(request));
    const [userRows] = await pool.query(
      `
        SELECT id, username, email
        FROM users
        WHERE id = ?
      `,
      [result.insertId]
    );

    return response.status(201).json({
      token: session.token,
      session: buildSessionPayload(
        {
          ...session,
          session_type: "registered",
          user_id: userRows[0].id,
          username: userRows[0].username,
          email: userRows[0].email
        },
        activePolicy,
        false
      )
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({
        message: "That username or email is already in use."
      });
    }

    throw error;
  }
});

app.post("/api/auth/login", async (request, response) => {
  const { email, password } = request.body || {};
  const emailError = validateEmail(email);

  if (emailError || !password) {
    return response.status(400).json({
      message: emailError || "Email and password are required."
    });
  }

  const normalizedEmail = normalizeEmail(email);
  const attemptKey = `${request.ip}:${normalizedEmail}`;

  try {
    loginAttempts.assertCanAttempt(attemptKey);
  } catch (error) {
    return response.status(429).json({
      message: error.message
    });
  }

  const [rows] = await pool.query(
    `
      SELECT id, username, email, password_hash
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [normalizedEmail]
  );

  const user = rows[0];
  const isValid = user && (await verifyPassword(password, user.password_hash));

  if (!isValid) {
    loginAttempts.recordFailure(attemptKey);
    return response.status(401).json({
      message: "Incorrect email or password."
    });
  }

  loginAttempts.clear(attemptKey);

  const activePolicy = await getActivePolicyVersion();
  const session = await createRegisteredSession(user.id, getClientMeta(request));
  const hasAcceptedPolicy = await getPolicyAcceptanceStatus(
    {
      ...session,
      session_type: "registered",
      user_id: user.id
    },
    activePolicy
  );

  response.json({
    token: session.token,
    session: buildSessionPayload(
      {
        ...session,
        session_type: "registered",
        user_id: user.id,
        username: user.username,
        email: user.email
      },
      activePolicy,
      hasAcceptedPolicy
    )
  });
});

app.post("/api/auth/guest", async (request, response) => {
  const activePolicy = await getActivePolicyVersion();
  const session = await createGuestSession(getClientMeta(request));

  response.status(201).json({
    token: session.token,
    session: buildSessionPayload(
      {
        ...session,
        session_type: "guest"
      },
      activePolicy,
      false
    )
  });
});

app.post("/api/auth/logout", async (request, response) => {
  if (request.authSession) {
    await revokeSession(request.authSession);
  }

  response.status(204).send();
});

app.get("/api/policies/active", async (_request, response) => {
  const activePolicy = await getActivePolicyVersion();
  response.json({
    activePolicy: getPolicyPresentation(activePolicy)
  });
});

app.post("/api/policies/accept", async (request, response) => {
  if (!request.authSession) {
    return response.status(401).json({
      message: "You need an active session before accepting policies."
    });
  }

  const activePolicy = await getActivePolicyVersion();

  if (!activePolicy) {
    return response.status(503).json({
      message: "No active policy version is available."
    });
  }

  if (request.authSession.session_type === "registered") {
    await pool.query(
      `
        INSERT INTO policy_acceptances (
          policy_version_id,
          user_id,
          guest_session_id,
          accepted_at
        )
        VALUES (?, ?, NULL, UTC_TIMESTAMP())
        ON DUPLICATE KEY UPDATE
          accepted_at = UTC_TIMESTAMP()
      `,
      [activePolicy.id, request.authSession.user_id]
    );
  } else {
    await pool.query(
      `
        INSERT INTO policy_acceptances (
          policy_version_id,
          user_id,
          guest_session_id,
          accepted_at
        )
        VALUES (?, NULL, ?, UTC_TIMESTAMP())
        ON DUPLICATE KEY UPDATE
          accepted_at = UTC_TIMESTAMP()
      `,
      [activePolicy.id, request.authSession.id]
    );
  }

  response.json({
    session: buildSessionPayload(request.authSession, activePolicy, true)
  });
});

app.get("/api/dashboard/my-stories", async (request, response) => {
  if (!request.authSession) {
    return response.status(401).json({
      message: "Sign in to access My Stories."
    });
  }

  if (request.authSession.session_type !== "registered") {
    return response.status(403).json({
      message: "Anonymous sessions cannot access My Stories."
    });
  }

  response.json({
    unreadCommentCount: 0,
    stories: [],
    emptyState:
      "Your published stories will appear here once story creation is connected."
  });
});

app.get("/api/auth/google/start", (request, response) => {
  if (!isGoogleConfigured()) {
    return response.status(503).json({
      message: "Google OAuth is not configured for this environment."
    });
  }

  const state = createOAuthState(oauthStateSecret);
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state
  });

  response.setHeader(
    "Set-Cookie",
    serializeCookie("myhaven_oauth_state", state, {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/api/auth/google",
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production"
    })
  );

  response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
});

app.get("/api/auth/google/callback", async (request, response) => {
  const stateCookie = parseCookies(request.headers.cookie).myhaven_oauth_state;
  const redirectBase = `${frontendOrigin}/auth/google/callback`;

  response.setHeader(
    "Set-Cookie",
    serializeCookie("myhaven_oauth_state", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/api/auth/google",
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production"
    })
  );

  if (!isGoogleConfigured()) {
    return response.redirect(`${redirectBase}?error=google_not_configured`);
  }

  if (
    !request.query.state ||
    request.query.state !== stateCookie ||
    !verifyOAuthState(request.query.state, oauthStateSecret)
  ) {
    return response.redirect(`${redirectBase}?error=invalid_oauth_state`);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code: String(request.query.code || ""),
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: googleRedirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!tokenResponse.ok) {
      throw new Error("Google token exchange failed.");
    }

    const tokenPayload = await tokenResponse.json();
    const userInfoResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`
        }
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Could not load Google profile.");
    }

    const profile = await userInfoResponse.json();

    if (!profile.email || !profile.email_verified) {
      throw new Error("Google account must provide a verified email address.");
    }

    const user = await findOrCreateGoogleUser(profile);
    const activePolicy = await getActivePolicyVersion();
    const session = await createRegisteredSession(user.id, getClientMeta(request));
    const hasAcceptedPolicy = await getPolicyAcceptanceStatus(
      {
        ...session,
        session_type: "registered",
        user_id: user.id
      },
      activePolicy
    );
    const nextStep = hasAcceptedPolicy ? "dashboard" : "consent";

    return response.redirect(
      `${redirectBase}#token=${encodeURIComponent(session.token)}&next=${nextStep}`
    );
  } catch (error) {
    return response.redirect(
      `${redirectBase}?error=${encodeURIComponent(error.message)}`
    );
  }
});

app.get("/api/message", (_request, response) => {
  response.json({
    message: "Authentication service is online."
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    message: "Something went wrong while processing the authentication request."
  });
});

async function start() {
  await ensureDatabaseSchema();
  await checkDatabaseConnection();

  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
