const mongoose = require("mongoose");
const AppIntegration = require("../models/AppIntegration");
const Project = require("../models/Project");
const Team = require("../models/Team");
const asyncHandler = require("../utils/asyncHandler");
const { normalizeRole } = require("../utils/roles");

const APP_CATALOG = [
  {
    slug: "github-sync",
    name: "GitHub Sync",
    description:
      "Mirror issue state changes into pull request workflows and keep engineering progress tied to delivery status.",
    marketplaceStatus: "Installed",
    icon: "GitBranchPlus",
    defaultInstallationState: true,
    defaultConnectionState: true,
    legacyDefaultRoles: ["Admin"],
  },
  {
    slug: "slack-notifications",
    name: "Slack Notifications",
    description:
      "Broadcast sprint moves, assignment changes, and import summaries into the team channel.",
    marketplaceStatus: "Recommended",
    icon: "MessageSquareShare",
    defaultInstallationState: false,
    defaultConnectionState: false,
    legacyDefaultRoles: ["Admin", "User"],
  },
  {
    slug: "automation-bot",
    name: "Automation Bot",
    description:
      "Create rules for recurring triage, stale issue reminders, and sprint rollover housekeeping.",
    marketplaceStatus: "Preview",
    icon: "Bot",
    defaultInstallationState: false,
    defaultConnectionState: false,
    legacyDefaultRoles: ["Admin"],
  },
  {
    slug: "custom-plugin-hub",
    name: "Custom Plugin Hub",
    description:
      "Manage internal extensions and expose project-specific tooling to teams from one control panel.",
    marketplaceStatus: "Available",
    icon: "PlugZap",
    defaultInstallationState: false,
    defaultConnectionState: false,
    legacyDefaultRoles: ["Admin"],
  },
];

const APP_CATALOG_BY_SLUG = new Map(APP_CATALOG.map((app) => [app.slug, app]));

const normalizeRoles = (roles = []) =>
  [...new Set(roles.map(normalizeRole))].filter((role) => ["Admin", "User"].includes(role));

const getInstalledState = (app, catalogEntry) =>
  typeof app?.isInstalled === "boolean"
    ? app.isInstalled
    : Boolean(catalogEntry?.defaultInstallationState);

const createCatalogRecord = (app) => ({
  slug: app.slug,
  name: app.name,
  isInstalled: app.defaultInstallationState,
  installedAt: app.defaultInstallationState ? new Date() : null,
  isConnected: app.defaultConnectionState,
  connectedAt: app.defaultConnectionState ? new Date() : null,
  access: {
    roles: [],
    projects: [],
    teams: [],
  },
});

const ensureCatalogApps = async () => {
  const slugs = APP_CATALOG.map((app) => app.slug);
  const existingApps = await AppIntegration.find({
    slug: { $in: slugs },
  })
    .select("slug")
    .lean();
  const existingSlugs = new Set(existingApps.map((app) => app.slug));
  const missingApps = APP_CATALOG.filter((app) => !existingSlugs.has(app.slug)).map(
    createCatalogRecord
  );

  if (!missingApps.length) {
    return;
  }

  try {
    await AppIntegration.insertMany(missingApps, { ordered: false });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }
};

const populateAppQuery = (query) =>
  query
    .populate("connectedBy", "name email role")
    .populate("access.projects", "name key")
    .populate({
      path: "access.teams",
      select: "name projectId",
      populate: {
        path: "projectId",
        select: "name key",
      },
    });

const serializeUser = (user) =>
  user
    ? {
        ...user,
        role: normalizeRole(user.role),
      }
    : null;

const serializeProject = (project) =>
  project
    ? {
        _id: project._id,
        name: project.name,
        key: project.key,
      }
    : null;

const serializeTeam = (team) =>
  team
    ? {
        _id: team._id,
        name: team.name,
        projectId: serializeProject(team.projectId),
      }
    : null;

const getViewerScope = async (user) => {
  const [projects, teams] = await Promise.all([
    Project.find({
      $or: [{ members: user._id }, { owner: user._id }],
    })
      .select("_id")
      .lean(),
    Team.find({ users: user._id }).select("_id").lean(),
  ]);

  return {
    projectIds: new Set(projects.map((project) => String(project._id))),
    teamIds: new Set(teams.map((team) => String(team._id))),
  };
};

const serializeApp = (app, viewer, viewerScope) => {
  const catalogEntry = APP_CATALOG_BY_SLUG.get(app.slug);
  const isInstalled = getInstalledState(app, catalogEntry);
  const roles = normalizeRoles(app.access?.roles || []);
  const projects = (app.access?.projects || []).map(serializeProject).filter(Boolean);
  const teams = (app.access?.teams || []).map(serializeTeam).filter(Boolean);
  const legacyRoles = normalizeRoles(catalogEntry?.legacyDefaultRoles || []);
  const hasLegacySeededAudience =
    !projects.length &&
    !teams.length &&
    legacyRoles.length === roles.length &&
    legacyRoles.every((role) => roles.includes(role));
  const audienceRoles = hasLegacySeededAudience ? [] : roles;
  const viewerRole = normalizeRole(viewer?.role);
  const hasRoleAccess = audienceRoles.includes(viewerRole);
  const hasProjectAccess = projects.some((project) =>
    viewerScope.projectIds.has(String(project._id))
  );
  const hasTeamAccess = teams.some((team) => viewerScope.teamIds.has(String(team._id)));
  const hasExplicitAudience = Boolean(audienceRoles.length || projects.length || teams.length);
  const hasAudienceAccess =
    !hasExplicitAudience || hasRoleAccess || hasProjectAccess || hasTeamAccess;

  return {
    _id: app._id,
    slug: app.slug,
    name: catalogEntry?.name || app.name,
    description: catalogEntry?.description || "",
    marketplaceStatus: catalogEntry?.marketplaceStatus || "Available",
    icon: catalogEntry?.icon || "AppWindow",
    isInstalled,
    installedAt: app.installedAt || null,
    installedBy: serializeUser(app.installedBy),
    isConnected: Boolean(app.isConnected),
    hasAccess: Boolean(isInstalled && app.isConnected && hasAudienceAccess),
    connectedAt: app.connectedAt,
    connectedBy: serializeUser(app.connectedBy),
    access: {
      roles: audienceRoles,
      projects,
      teams,
    },
  };
};

const resolveAppBySlug = async (slug) => {
  if (!APP_CATALOG_BY_SLUG.has(slug)) {
    return null;
  }

  return populateAppQuery(AppIntegration.findOne({ slug }));
};

const resolveObjectIds = async (ids = [], Model) => {
  const uniqueIds = [
    ...new Set(ids.filter((id) => mongoose.isValidObjectId(id)).map((id) => String(id))),
  ];

  if (!uniqueIds.length) {
    return [];
  }

  const documents = await Model.find({
    _id: { $in: uniqueIds },
  })
    .select("_id")
    .lean();

  return documents.map((document) => document._id);
};

const getApps = asyncHandler(async (req, res) => {
  await ensureCatalogApps();

  const viewerScope = await getViewerScope(req.user);
  const apps = await populateAppQuery(
    AppIntegration.find({
      slug: { $in: APP_CATALOG.map((app) => app.slug) },
    }).sort({ createdAt: 1 })
  ).lean();
  const appsBySlug = new Map(apps.map((app) => [app.slug, app]));

  res.status(200).json(
    APP_CATALOG.map((catalogApp) => {
      const app = appsBySlug.get(catalogApp.slug) || createCatalogRecord(catalogApp);
      return serializeApp(app, req.user, viewerScope);
    })
  );
});

const updateAppConnection = asyncHandler(async (req, res) => {
  await ensureCatalogApps();

  const app = await resolveAppBySlug(req.params.slug);

  if (!app) {
    res.status(404);
    throw new Error("App not found");
  }

  const shouldConnect = Boolean(req.body.connected);
  const catalogEntry = APP_CATALOG_BY_SLUG.get(app.slug);

  if (shouldConnect && !getInstalledState(app, catalogEntry)) {
    res.status(400);
    throw new Error("Install the app before connecting it");
  }

  app.isConnected = shouldConnect;
  app.connectedAt = shouldConnect ? new Date() : null;
  app.connectedBy = shouldConnect ? req.user._id : null;

  await app.save();

  const populatedApp = await resolveAppBySlug(req.params.slug);
  const viewerScope = await getViewerScope(req.user);

  res.status(200).json(serializeApp(populatedApp.toObject(), req.user, viewerScope));
});

const updateAppInstallation = asyncHandler(async (req, res) => {
  await ensureCatalogApps();

  const app = await resolveAppBySlug(req.params.slug);

  if (!app) {
    res.status(404);
    throw new Error("App not found");
  }

  const shouldInstall = Boolean(req.body.installed);

  app.isInstalled = shouldInstall;
  app.installedAt = shouldInstall ? new Date() : null;
  app.installedBy = shouldInstall ? req.user._id : null;

  if (!shouldInstall) {
    app.isConnected = false;
    app.connectedAt = null;
    app.connectedBy = null;
  }

  await app.save();

  const populatedApp = await resolveAppBySlug(req.params.slug);
  const viewerScope = await getViewerScope(req.user);

  res.status(200).json(serializeApp(populatedApp.toObject(), req.user, viewerScope));
});

const updateAppAccess = asyncHandler(async (req, res) => {
  await ensureCatalogApps();

  const app = await resolveAppBySlug(req.params.slug);

  if (!app) {
    res.status(404);
    throw new Error("App not found");
  }

  const [projects, teams] = await Promise.all([
    resolveObjectIds(req.body.projectIds, Project),
    resolveObjectIds(req.body.teamIds, Team),
  ]);

  app.access = {
    roles: normalizeRoles(Array.isArray(req.body.roles) ? req.body.roles : []),
    projects,
    teams,
  };

  await app.save();

  const populatedApp = await resolveAppBySlug(req.params.slug);
  const viewerScope = await getViewerScope(req.user);

  res.status(200).json(serializeApp(populatedApp.toObject(), req.user, viewerScope));
});

module.exports = {
  getApps,
  updateAppAccess,
  updateAppConnection,
  updateAppInstallation,
};
