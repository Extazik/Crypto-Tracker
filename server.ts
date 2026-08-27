import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PROJECTS } from './src/data/seedProjects';
import { Project, ResetLog } from './src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const RESET_LOGS_FILE = path.join(DATA_DIR, 'reset_logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize projects database if not existing
function loadProjects(): Project[] {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading projects.json:', err);
  }
  // Initialize with seed data
  saveProjects(INITIAL_PROJECTS);
  return INITIAL_PROJECTS;
}

function saveProjects(projects: Project[]): void {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving projects.json:', err);
  }
}

function loadResetLogs(): ResetLog[] {
  try {
    if (fs.existsSync(RESET_LOGS_FILE)) {
      const data = fs.readFileSync(RESET_LOGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading reset_logs.json:', err);
  }
  return [
    {
      id: 'log_seed_1',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      triggeredBy: 'cron_03_00_msk',
      affectedProjectsCount: 3,
      affectedActivitiesCount: 4,
      status: 'success',
      note: 'Плановый автоматический сброс ежедневных заданий (03:00 МСК)',
    },
  ];
}

function saveResetLogs(logs: ResetLog[]): void {
  try {
    fs.writeFileSync(RESET_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving reset_logs.json:', err);
  }
}

// Reset progress mechanism
function executeProgressReset(triggeredBy: 'cron_03_00_msk' | 'manual_admin'): {
  affectedProjects: number;
  affectedActivities: number;
} {
  const projects = loadProjects();
  let affectedProjects = 0;
  let affectedActivities = 0;

  const updated = projects.map((p) => {
    let projectTouched = false;
    const activities = (p.activities || []).map((act) => {
      if (act.isDailyReset && act.isCompleted) {
        affectedActivities++;
        projectTouched = true;
        return {
          ...act,
          isCompleted: false,
          completedAt: null,
        };
      }
      return act;
    });

    if (projectTouched) {
      affectedProjects++;
      return {
        ...p,
        activities,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });

  saveProjects(updated);

  const logs = loadResetLogs();
  const newLog: ResetLog = {
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    triggeredBy,
    affectedProjectsCount: affectedProjects,
    affectedActivitiesCount: affectedActivities,
    status: 'success',
    note:
      triggeredBy === 'cron_03_00_msk'
        ? 'Автоматический сброс в 03:00 МСК'
        : 'Ручной сброс администратором',
  };

  logs.unshift(newLog);
  saveResetLogs(logs.slice(0, 50)); // keep last 50 logs

  return { affectedProjects, affectedActivities };
}

// Background Cron-check for 03:00 MSK daily reset
let lastResetDateStr = '';
setInterval(() => {
  const now = new Date();
  // Format current MSK time
  const mskTimeStr = now.toLocaleTimeString('en-US', {
    timeZone: 'Europe/Moscow',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const mskDateStr = now.toLocaleDateString('en-US', {
    timeZone: 'Europe/Moscow',
  });

  // Check if it is 03:00 MSK and hasn't been reset today
  if (mskTimeStr === '03:00' && lastResetDateStr !== mskDateStr) {
    lastResetDateStr = mskDateStr;
    console.log(`[CRON 03:00 MSK] Triggering daily progress reset for ${mskDateStr}...`);
    executeProgressReset('cron_03_00_msk');
  }
}, 30000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic CORS & Rate-limit simulation headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('X-RateLimit-Limit', '100');
    res.header('X-RateLimit-Remaining', '99');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==================== REST API ENDPOINTS ====================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString(), mskTime: new Date().toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' }) });
  });

  // GET /api/projects - List all projects with filtering
  app.get('/api/projects', (req, res) => {
    try {
      let projects = loadProjects();
      const { search, status, rewardType, blockchain, favoritesOnly, category, tier } = req.query;

      if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        projects = projects.filter((p) => {
          const matchName = p.name.toLowerCase().includes(q);
          const matchTicker = p.tokenomics?.ticker?.toLowerCase().includes(q);
          const matchToken = p.tokenomics?.tokenName?.toLowerCase().includes(q);
          const matchInvestor = p.investors?.some((i) => i.name.toLowerCase().includes(q));
          const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
          return matchName || matchTicker || matchToken || matchInvestor || matchTag;
        });
      }

      if (status && typeof status === 'string') {
        const statuses = status.split(',');
        projects = projects.filter((p) => statuses.includes(p.reward.status));
      }

      if (rewardType && typeof rewardType === 'string') {
        const types = rewardType.split(',');
        projects = projects.filter((p) =>
          p.reward.rewardTypes?.some((t) => types.includes(t))
        );
      }

      if (blockchain && typeof blockchain === 'string') {
        const chains = blockchain.split(',');
        projects = projects.filter((p) => chains.includes(p.tokenomics.blockchain));
      }

      if (favoritesOnly === 'true') {
        projects = projects.filter((p) => p.isFavorite);
      }

      if (category && typeof category === 'string') {
        const cats = category.split(',');
        projects = projects.filter((p) => cats.includes(p.category));
      }

      if (tier && typeof tier === 'string') {
        if (tier === 'tier1') {
          projects = projects.filter((p) => p.investors.some((i) => i.tier === 'Tier 1'));
        } else if (tier === 'tier2') {
          projects = projects.filter((p) => p.investors.some((i) => i.tier === 'Tier 2'));
        }
      }

      res.json({ success: true, count: projects.length, data: projects });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/projects/:id - Details of a single project
  app.get('/api/projects/:id', (req, res) => {
    const projects = loadProjects();
    const project = projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Проект не найден' });
    }
    res.json({ success: true, data: project });
  });

  // POST /api/projects - Create new project
  app.post('/api/projects', (req, res) => {
    try {
      const body = req.body;
      if (!body.name || !body.name.trim()) {
        return res.status(400).json({ success: false, error: 'Название проекта обязательно' });
      }

      const projects = loadProjects();
      const newId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const newProject: Project = {
        id: newId,
        name: body.name.trim(),
        description: body.description ? body.description.substring(0, 500) : '',
        logo: body.logo || 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=160&auto=format&fit=crop&q=80',
        website: body.website || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reward: {
          status: body.reward?.status || 'potential',
          claimLink: body.reward?.claimLink || '',
          statusUpdatedAt: new Date().toISOString(),
          rewardTypes: body.reward?.rewardTypes || ['tokens'],
          expectedAmount: body.reward?.expectedAmount || '',
        },
        activities: (body.activities || []).map((a: any, idx: number) => ({
          id: a.id || `act_${newId}_${idx + 1}`,
          projectId: newId,
          name: a.name || 'Активность',
          type: a.type || 'testnet',
          description: a.description || '',
          link: a.link || '',
          isCompleted: !!a.isCompleted,
          completedAt: a.isCompleted ? (a.completedAt || new Date().toISOString()) : null,
          isDailyReset: !!a.isDailyReset,
        })),
        investors: (body.investors || []).map((inv: any, idx: number) => ({
          id: inv.id || `inv_${newId}_${idx + 1}`,
          name: inv.name || 'Инвестор',
          tier: inv.tier || 'Tier 2',
          amount: inv.amount ? Number(inv.amount) : null,
          roundDate: inv.roundDate || new Date().toISOString().split('T')[0],
        })),
        tokenomics: {
          tokenName: body.tokenomics?.tokenName || body.name,
          ticker: (body.tokenomics?.ticker || 'TKN').toUpperCase().substring(0, 8),
          totalSupply: body.tokenomics?.totalSupply ? Number(body.tokenomics.totalSupply) : null,
          distribution: {
            team: Number(body.tokenomics?.distribution?.team || 20),
            investors: Number(body.tokenomics?.distribution?.investors || 20),
            community: Number(body.tokenomics?.distribution?.community || 40),
            ecosystem: Number(body.tokenomics?.distribution?.ecosystem || 10),
            reserve: Number(body.tokenomics?.distribution?.reserve || 10),
          },
          blockchain: body.tokenomics?.blockchain || 'Ethereum',
          tokenStandard: body.tokenomics?.tokenStandard || 'ERC-20',
        },
        dates: {
          registrationStart: body.dates?.registrationStart || null,
          registrationEnd: body.dates?.registrationEnd || null,
          claimStart: body.dates?.claimStart || null,
          claimEnd: body.dates?.claimEnd || null,
        },
        socials: {
          twitter: body.socials?.twitter || '',
          telegram: body.socials?.telegram || '',
          discord: body.socials?.discord || '',
          medium: body.socials?.medium || '',
          github: body.socials?.github || '',
          youtube: body.socials?.youtube || '',
          reddit: body.socials?.reddit || '',
          custom: body.socials?.custom || [],
        },
        isFavorite: !!body.isFavorite,
        priority: Number(body.priority) || 5,
        category: body.category || 'Layer 1',
        tags: body.tags || ['Высокий приоритет'],
        difficulty: Number(body.difficulty) || 2,
        potentialFactors: body.potentialFactors || {
          tier1Investors: (body.investors || []).some((i: any) => i.tier === 'Tier 1'),
          over10mRaised: (body.investors || []).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0) >= 10000000,
          famousTeam: true,
          workingProduct: true,
          activeCommunity: true,
        },
      };

      projects.unshift(newProject);
      saveProjects(projects);

      res.status(201).json({ success: true, data: newProject });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /api/projects/:id - Update project
  app.put('/api/projects/:id', (req, res) => {
    try {
      const projects = loadProjects();
      const index = projects.findIndex((p) => p.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Проект не найден' });
      }

      const existing = projects[index];
      const body = req.body;

      const statusChanged = body.reward?.status && body.reward.status !== existing.reward.status;

      const updatedProject: Project = {
        ...existing,
        ...body,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
        reward: {
          ...existing.reward,
          ...(body.reward || {}),
          statusUpdatedAt: statusChanged ? new Date().toISOString() : existing.reward.statusUpdatedAt,
        },
        tokenomics: {
          ...existing.tokenomics,
          ...(body.tokenomics || {}),
        },
        dates: {
          ...existing.dates,
          ...(body.dates || {}),
        },
        socials: {
          ...existing.socials,
          ...(body.socials || {}),
        },
      };

      projects[index] = updatedProject;
      saveProjects(projects);

      res.json({ success: true, data: updatedProject });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/projects/:id - Delete project
  app.delete('/api/projects/:id', (req, res) => {
    try {
      const projects = loadProjects();
      const filtered = projects.filter((p) => p.id !== req.params.id);
      if (filtered.length === projects.length) {
        return res.status(404).json({ success: false, error: 'Проект не найден' });
      }
      saveProjects(filtered);
      res.json({ success: true, message: 'Проект удален' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/projects/:id/activities
  app.get('/api/projects/:id/activities', (req, res) => {
    const projects = loadProjects();
    const project = projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Проект не найден' });
    }
    res.json({ success: true, data: project.activities || [] });
  });

  // POST /api/projects/:id/activities - Add activity
  app.post('/api/projects/:id/activities', (req, res) => {
    try {
      const projects = loadProjects();
      const project = projects.find((p) => p.id === req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Проект не найден' });
      }

      const body = req.body;
      const newActivity = {
        id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        projectId: project.id,
        name: body.name || 'Новая активность',
        type: body.type || 'testnet',
        description: body.description || '',
        link: body.link || '',
        isCompleted: !!body.isCompleted,
        completedAt: body.isCompleted ? new Date().toISOString() : null,
        isDailyReset: !!body.isDailyReset,
      };

      project.activities = project.activities || [];
      project.activities.push(newActivity);
      project.updatedAt = new Date().toISOString();
      saveProjects(projects);

      res.status(201).json({ success: true, data: newActivity });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT /api/activities/:id/toggle - Toggle completion status
  app.put('/api/activities/:id/toggle', (req, res) => {
    try {
      const projects = loadProjects();
      let targetActivity: any = null;
      let targetProject: any = null;

      for (const p of projects) {
        if (p.activities) {
          const act = p.activities.find((a) => a.id === req.params.id);
          if (act) {
            targetActivity = act;
            targetProject = p;
            break;
          }
        }
      }

      if (!targetActivity) {
        return res.status(404).json({ success: false, error: 'Активность не найдена' });
      }

      targetActivity.isCompleted = !targetActivity.isCompleted;
      targetActivity.completedAt = targetActivity.isCompleted ? new Date().toISOString() : null;
      targetProject.updatedAt = new Date().toISOString();

      saveProjects(projects);

      res.json({ success: true, data: targetActivity });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/favorites/:id - Add or toggle favorite
  app.post('/api/favorites/:id', (req, res) => {
    try {
      const projects = loadProjects();
      const project = projects.find((p) => p.id === req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Проект не найден' });
      }

      project.isFavorite = true;
      if (req.body?.priority !== undefined) {
        project.priority = Number(req.body.priority);
      }
      project.updatedAt = new Date().toISOString();
      saveProjects(projects);

      res.json({ success: true, data: project });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE /api/favorites/:id - Remove from favorites
  app.delete('/api/favorites/:id', (req, res) => {
    try {
      const projects = loadProjects();
      const project = projects.find((p) => p.id === req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Проект не найден' });
      }

      project.isFavorite = false;
      project.updatedAt = new Date().toISOString();
      saveProjects(projects);

      res.json({ success: true, data: project });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/reset-progress - Manual reset
  app.post('/api/reset-progress', (req, res) => {
    try {
      const result = executeProgressReset('manual_admin');
      res.json({
        success: true,
        message: 'Прогресс ежедневных заданий успешно сброшен',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/reset-logs
  app.get('/api/reset-logs', (req, res) => {
    const logs = loadResetLogs();
    res.json({ success: true, data: logs });
  });

  // GET /api/stats - Statistical analysis dashboard
  app.get('/api/stats', (req, res) => {
    try {
      const projects = loadProjects();
      const totalProjects = projects.length;
      const activeProjects = projects.filter(
        (p) => p.reward.status === 'registration' || p.reward.status === 'claiming' || p.reward.status === 'confirmed'
      ).length;
      const completedProjects = projects.filter((p) => p.reward.status === 'completed').length;
      const favoritesCount = projects.filter((p) => p.isFavorite).length;

      let totalTasks = 0;
      let completedTasks = 0;
      const investorCounts: Record<string, number> = {};
      const blockchainCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {
        potential: 0,
        registration: 0,
        claiming: 0,
        confirmed: 0,
        completed: 0,
      };

      projects.forEach((p) => {
        statusCounts[p.reward.status] = (statusCounts[p.reward.status] || 0) + 1;
        blockchainCounts[p.tokenomics.blockchain] = (blockchainCounts[p.tokenomics.blockchain] || 0) + 1;

        p.investors?.forEach((inv) => {
          investorCounts[inv.name] = (investorCounts[inv.name] || 0) + 1;
        });

        p.activities?.forEach((act) => {
          totalTasks++;
          if (act.isCompleted) completedTasks++;
        });
      });

      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const topInvestors = Object.entries(investorCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      const topBlockchains = Object.entries(blockchainCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      res.json({
        success: true,
        data: {
          totalProjects,
          activeProjects,
          completedProjects,
          favoritesCount,
          totalTasks,
          completedTasks,
          overallProgress,
          topInvestors,
          topBlockchains,
          statusCounts,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/filters - Available filters info
  app.get('/api/filters', (req, res) => {
    const projects = loadProjects();
    const blockchains = Array.from(new Set(projects.map((p) => p.tokenomics.blockchain)));
    const categories = Array.from(new Set(projects.map((p) => p.category)));

    res.json({
      success: true,
      data: {
        blockchains,
        categories,
        statuses: ['potential', 'registration', 'claiming', 'confirmed', 'completed'],
        rewardTypes: ['tokens', 'role', 'points', 'nft', 'whitelist', 'ambassador'],
      },
    });
  });

  // Vite Middleware for SPA serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Airdrop Tracker Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
