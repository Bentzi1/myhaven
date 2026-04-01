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
const {
  createStoryChecksum,
  createStoryExcerpt,
  generateStoryTitle,
  normalizeStoryBody,
  runPrivacyCheck,
  suggestStoryTag,
  validateStoryBody
} = require("./story");

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
    methods: ["GET", "POST", "PATCH", "DELETE"],
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

function isRegisteredSession(session) {
  return session?.session_type === "registered";
}

function buildStoryActorValues(session) {
  if (isRegisteredSession(session)) {
    return {
      userId: session.user_id,
      guestSessionId: null
    };
  }

  return {
    userId: null,
    guestSessionId: session?.id || null
  };
}

async function getStoryPostingStatus(session) {
  if (!session) {
    return {
      ok: false,
      statusCode: 401,
      message: "Start a session before sharing a story."
    };
  }

  const activePolicy = await getActivePolicyVersion();

  if (!activePolicy) {
    return {
      ok: false,
      statusCode: 503,
      message: "No active policy version is available."
    };
  }

  const hasAcceptedPolicy = await getPolicyAcceptanceStatus(session, activePolicy);

  if (!hasAcceptedPolicy) {
    return {
      ok: false,
      statusCode: 403,
      message: "Accept the current policy before sharing a story."
    };
  }

  return {
    ok: true,
    activePolicy
  };
}

function getViewerAuthorSelect(session, storyAlias = "s") {
  if (isRegisteredSession(session)) {
    return {
      sql: `CASE WHEN ${storyAlias}.author_user_id = ? THEN 1 ELSE 0 END AS viewer_is_author`,
      params: [session.user_id]
    };
  }

  if (session?.session_type === "guest") {
    return {
      sql: `CASE WHEN ${storyAlias}.author_guest_session_id = ? THEN 1 ELSE 0 END AS viewer_is_author`,
      params: [session.id]
    };
  }

  return {
    sql: "0 AS viewer_is_author",
    params: []
  };
}

function getOwnedByViewerSelect(session, storyAlias = "s") {
  if (isRegisteredSession(session)) {
    return {
      sql: `CASE WHEN ${storyAlias}.author_user_id = ? THEN 1 ELSE 0 END AS owned_by_viewer`,
      params: [session.user_id]
    };
  }

  return {
    sql: "0 AS owned_by_viewer",
    params: []
  };
}

function getViewerHuggedSelect(session, storyAlias = "s") {
  if (isRegisteredSession(session)) {
    return {
      sql: `EXISTS(
        SELECT 1
        FROM story_hugs shv
        WHERE shv.story_id = ${storyAlias}.id
          AND shv.user_id = ?
      ) AS viewer_has_hugged`,
      params: [session.user_id]
    };
  }

  if (session?.session_type === "guest") {
    return {
      sql: `EXISTS(
        SELECT 1
        FROM story_hugs shv
        WHERE shv.story_id = ${storyAlias}.id
          AND shv.guest_session_id = ?
      ) AS viewer_has_hugged`,
      params: [session.id]
    };
  }

  return {
    sql: "0 AS viewer_has_hugged",
    params: []
  };
}

function buildStorySummary(row) {
  return {
    id: row.id,
    title: row.title,
    tagLabel: row.tag_label,
    excerpt: createStoryExcerpt(row.body),
    publishedAt: row.published_at,
    hugCount: Number(row.hug_count || 0),
    ownedByViewer: Boolean(row.owned_by_viewer)
  };
}

function buildStoryDetail(row) {
  const ownedByViewer = Boolean(row.owned_by_viewer);
  const viewerIsAuthor = Boolean(row.viewer_is_author);

  return {
    id: row.id,
    title: row.title,
    tagLabel: row.tag_label,
    body: row.body,
    status: row.status,
    publishedAt: row.published_at,
    metadata: "Published anonymously",
    hugCount: Number(row.hug_count || 0),
    viewerHasHugged: Boolean(row.viewer_has_hugged),
    viewerIsAuthor,
    canEdit: ownedByViewer && row.status !== "deleted",
    canDelete: ownedByViewer && row.status !== "deleted",
    canSendHug:
      row.status === "published" && !viewerIsAuthor && !Boolean(row.viewer_has_hugged)
  };
}

async function fetchStoryById(storyId, session) {
  const viewerAuthorSelect = getViewerAuthorSelect(session);
  const ownedByViewerSelect = getOwnedByViewerSelect(session);
  const viewerHuggedSelect = getViewerHuggedSelect(session);
  const [rows] = await pool.query(
    `
      SELECT
        s.id,
        s.author_user_id,
        s.author_guest_session_id,
        s.title,
        s.tag_label,
        s.body,
        s.status,
        s.published_at,
        COALESCE(COUNT(sh.id), 0) AS hug_count,
        ${viewerAuthorSelect.sql},
        ${ownedByViewerSelect.sql},
        ${viewerHuggedSelect.sql}
      FROM stories s
      LEFT JOIN story_hugs sh ON sh.story_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
      LIMIT 1
    `,
    [
      ...viewerAuthorSelect.params,
      ...ownedByViewerSelect.params,
      ...viewerHuggedSelect.params,
      storyId
    ]
  );

  const story = rows[0];

  if (!story) {
    return null;
  }

  const isOwner = isRegisteredSession(session) && story.author_user_id === session.user_id;

  if (story.status === "deleted") {
    return null;
  }

  if (story.status !== "published" && !isOwner) {
    return null;
  }

  return buildStoryDetail(story);
}

async function insertStoryPrivacyScan(connection, { session, storyId = null, body, scan }) {
  const actor = buildStoryActorValues(session);
  const [result] = await connection.query(
    `
      INSERT INTO story_privacy_scans (
        story_id,
        user_id,
        guest_session_id,
        result_status,
        summary,
        findings_json,
        scanned_text_checksum,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
    `,
    [
      storyId,
      actor.userId,
      actor.guestSessionId,
      scan.status,
      scan.summary,
      JSON.stringify(scan.findings),
      createStoryChecksum(body)
    ]
  );

  return result.insertId;
}

async function insertStoryRevision(
  connection,
  { storyId, title, tagLabel, body, status, privacyScanId = null }
) {
  const [rows] = await connection.query(
    `
      SELECT COALESCE(MAX(revision_number), 0) + 1 AS next_revision_number
      FROM story_revisions
      WHERE story_id = ?
    `,
    [storyId]
  );

  await connection.query(
    `
      INSERT INTO story_revisions (
        story_id,
        revision_number,
        title,
        tag_label,
        body,
        status,
        privacy_scan_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
    `,
    [
      storyId,
      rows[0].next_revision_number,
      title,
      tagLabel,
      body,
      status,
      privacyScanId
    ]
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

app.get("/api/stories", async (request, response) => {
  const ownedByViewerSelect = getOwnedByViewerSelect(request.authSession);
  const [rows] = await pool.query(
    `
      SELECT
        s.id,
        s.title,
        s.tag_label,
        s.body,
        s.status,
        s.published_at,
        COALESCE(COUNT(sh.id), 0) AS hug_count,
        ${ownedByViewerSelect.sql}
      FROM stories s
      LEFT JOIN story_hugs sh ON sh.story_id = s.id
      WHERE s.status = 'published'
      GROUP BY s.id
      ORDER BY s.published_at DESC, s.id DESC
      LIMIT 50
    `,
    [...ownedByViewerSelect.params]
  );

  response.json({
    stories: rows.map(buildStorySummary),
    emptyState: "No stories have been shared yet. Your reflection could be the first."
  });
});

app.get("/api/stories/:storyId", async (request, response) => {
  const storyId = Number(request.params.storyId);

  if (!Number.isInteger(storyId) || storyId <= 0) {
    return response.status(400).json({
      message: "Provide a valid story id."
    });
  }

  const story = await fetchStoryById(storyId, request.authSession);

  if (!story) {
    return response.status(404).json({
      message: "That story could not be found."
    });
  }

  response.json({
    story
  });
});

app.post("/api/stories/privacy-check", async (request, response) => {
  const postingStatus = await getStoryPostingStatus(request.authSession);

  if (!postingStatus.ok) {
    return response.status(postingStatus.statusCode).json({
      message: postingStatus.message
    });
  }

  const body = normalizeStoryBody(request.body?.body);
  const validationError = validateStoryBody(body, {
    allowShortDraft: true
  });

  if (validationError) {
    return response.status(400).json({
      message: validationError
    });
  }

  const scan = runPrivacyCheck(body);
  const connection = await pool.getConnection();

  try {
    const scanId = await insertStoryPrivacyScan(connection, {
      session: request.authSession,
      body,
      scan
    });

    response.json({
      scan: {
        id: scanId,
        ...scan,
        checkedBodyChecksum: createStoryChecksum(body)
      }
    });
  } finally {
    connection.release();
  }
});

app.post("/api/stories", async (request, response) => {
  const postingStatus = await getStoryPostingStatus(request.authSession);

  if (!postingStatus.ok) {
    return response.status(postingStatus.statusCode).json({
      message: postingStatus.message
    });
  }

  const body = normalizeStoryBody(request.body?.body);
  const validationError = validateStoryBody(body);

  if (validationError) {
    return response.status(400).json({
      message: validationError
    });
  }

  const scan = runPrivacyCheck(body);

  if (scan.status === "block") {
    return response.status(400).json({
      message: scan.summary,
      scan: {
        ...scan,
        checkedBodyChecksum: createStoryChecksum(body)
      }
    });
  }

  const title = generateStoryTitle(body);
  const tagLabel = suggestStoryTag(body);
  const actor = buildStoryActorValues(request.authSession);
  const connection = await pool.getConnection();
  let storyId = null;

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        INSERT INTO stories (
          author_user_id,
          author_guest_session_id,
          title,
          tag_label,
          body,
          status,
          created_at,
          updated_at,
          published_at
        )
        VALUES (?, ?, ?, ?, ?, 'published', UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `,
      [actor.userId, actor.guestSessionId, title, tagLabel, body]
    );

    storyId = result.insertId;

    const privacyScanId = await insertStoryPrivacyScan(connection, {
      session: request.authSession,
      storyId,
      body,
      scan
    });

    await insertStoryRevision(connection, {
      storyId,
      title,
      tagLabel,
      body,
      status: "published",
      privacyScanId
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const story = await fetchStoryById(storyId, request.authSession);

  response.status(201).json({
    story,
    scan: {
      ...scan,
      checkedBodyChecksum: createStoryChecksum(body)
    }
  });
});

app.patch("/api/stories/:storyId", async (request, response) => {
  if (!request.authSession) {
    return response.status(401).json({
      message: "Start a session before editing a story."
    });
  }

  if (!isRegisteredSession(request.authSession)) {
    return response.status(403).json({
      message: "Only registered users can edit published stories."
    });
  }

  const postingStatus = await getStoryPostingStatus(request.authSession);

  if (!postingStatus.ok) {
    return response.status(postingStatus.statusCode).json({
      message: postingStatus.message
    });
  }

  const storyId = Number(request.params.storyId);

  if (!Number.isInteger(storyId) || storyId <= 0) {
    return response.status(400).json({
      message: "Provide a valid story id."
    });
  }

  const body = normalizeStoryBody(request.body?.body);
  const validationError = validateStoryBody(body);

  if (validationError) {
    return response.status(400).json({
      message: validationError
    });
  }

  const scan = runPrivacyCheck(body);

  if (scan.status === "block") {
    return response.status(400).json({
      message: scan.summary,
      scan: {
        ...scan,
        checkedBodyChecksum: createStoryChecksum(body)
      }
    });
  }

  const title = generateStoryTitle(body);
  const tagLabel = suggestStoryTag(body);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `
        SELECT id, status
        FROM stories
        WHERE id = ?
          AND author_user_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [storyId, request.authSession.user_id]
    );

    const story = existingRows[0];

    if (!story || story.status === "deleted") {
      await connection.rollback();
      return response.status(404).json({
        message: "That story is not available for editing."
      });
    }

    await connection.query(
      `
        UPDATE stories
        SET title = ?,
            tag_label = ?,
            body = ?,
            status = 'published',
            hidden_at = NULL,
            updated_at = UTC_TIMESTAMP()
        WHERE id = ?
      `,
      [title, tagLabel, body, storyId]
    );

    const privacyScanId = await insertStoryPrivacyScan(connection, {
      session: request.authSession,
      storyId,
      body,
      scan
    });

    await insertStoryRevision(connection, {
      storyId,
      title,
      tagLabel,
      body,
      status: "published",
      privacyScanId
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const story = await fetchStoryById(storyId, request.authSession);

  response.json({
    story,
    scan: {
      ...scan,
      checkedBodyChecksum: createStoryChecksum(body)
    }
  });
});

app.delete("/api/stories/:storyId", async (request, response) => {
  if (!request.authSession) {
    return response.status(401).json({
      message: "Start a session before deleting a story."
    });
  }

  if (!isRegisteredSession(request.authSession)) {
    return response.status(403).json({
      message: "Only registered users can delete published stories."
    });
  }

  const storyId = Number(request.params.storyId);

  if (!Number.isInteger(storyId) || storyId <= 0) {
    return response.status(400).json({
      message: "Provide a valid story id."
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
        SELECT id, title, tag_label, body, status
        FROM stories
        WHERE id = ?
          AND author_user_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [storyId, request.authSession.user_id]
    );

    const story = rows[0];

    if (!story || story.status === "deleted") {
      await connection.rollback();
      return response.status(404).json({
        message: "That story is not available for deletion."
      });
    }

    await connection.query(
      `
        UPDATE stories
        SET status = 'deleted',
            deleted_at = UTC_TIMESTAMP(),
            updated_at = UTC_TIMESTAMP()
        WHERE id = ?
      `,
      [storyId]
    );

    await insertStoryRevision(connection, {
      storyId,
      title: story.title,
      tagLabel: story.tag_label,
      body: story.body,
      status: "deleted"
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  response.status(204).send();
});

app.post("/api/stories/:storyId/hugs", async (request, response) => {
  if (!request.authSession) {
    return response.status(401).json({
      message: "Start a session before sending a hug."
    });
  }

  const storyId = Number(request.params.storyId);

  if (!Number.isInteger(storyId) || storyId <= 0) {
    return response.status(400).json({
      message: "Provide a valid story id."
    });
  }

  const story = await fetchStoryById(storyId, request.authSession);

  if (!story) {
    return response.status(404).json({
      message: "That story could not be found."
    });
  }

  if (story.viewerIsAuthor) {
    return response.status(400).json({
      message: "You cannot send a hug to your own story."
    });
  }

  const actor = buildStoryActorValues(request.authSession);

  await pool.query(
    `
      INSERT INTO story_hugs (
        story_id,
        user_id,
        guest_session_id,
        created_at
      )
      VALUES (?, ?, ?, UTC_TIMESTAMP())
      ON DUPLICATE KEY UPDATE
        created_at = created_at
    `,
    [storyId, actor.userId, actor.guestSessionId]
  );

  const updatedStory = await fetchStoryById(storyId, request.authSession);

  response.json({
    story: updatedStory
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

  const [rows] = await pool.query(
    `
      SELECT
        s.id,
        s.title,
        s.tag_label,
        s.body,
        s.status,
        s.published_at,
        COALESCE(COUNT(sh.id), 0) AS hug_count
      FROM stories s
      LEFT JOIN story_hugs sh ON sh.story_id = s.id
      WHERE s.author_user_id = ?
        AND s.status <> 'deleted'
      GROUP BY s.id
      ORDER BY s.published_at DESC, s.id DESC
    `,
    [request.authSession.user_id]
  );

  response.json({
    unreadCommentCount: 0,
    stories: rows.map((story) => ({
      ...buildStorySummary(story),
      body: story.body,
      tagLabel: story.tag_label,
      status: story.status
    })),
    emptyState:
      "Your published stories will appear here once you share your first reflection."
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
