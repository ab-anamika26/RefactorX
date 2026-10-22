import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Code2,
  Eye,
  EyeOff,
  FileCode2,
  GitBranch,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Mail,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UserRound,
  Workflow,
  X
} from 'lucide-react';
import { createTask, getCurrentUser, health, signIn, signOut, signUp } from './api.js';

const demo = [
  { id: 'JOB-024', title: 'Audit authentication module', repo: 'sample-api', type: 'Code audit', status: 'Completed', time: 'Today, 09:42' },
  { id: 'JOB-023', title: 'Generate unit tests for utils', repo: 'sample-api', type: 'Test generation', status: 'Review needed', time: 'Today, 09:18' },
  { id: 'JOB-022', title: 'Refactor duplicated validators', repo: 'legacy-service', type: 'Refactoring', status: 'Failed', time: 'Yesterday, 16:10' }
];

const navigation = [
  [LayoutDashboard, 'Overview'],
  [Workflow, 'Agent Workflow'],
  [FileCode2, 'Task History'],
  [GitBranch, 'Code Review'],
  [Settings2, 'Settings']
];

const agentList = [
  { name: 'Code Auditor', desc: 'Finds potential issues and code smells', icon: Search },
  { name: 'Refactoring Agent', desc: 'Proposes focused code improvements', icon: Code2 },
  { name: 'Test Agent', desc: 'Plans tests for changed behaviour', icon: TestTube2 },
  { name: 'Validator', desc: 'Checks tests and potential regressions', icon: ShieldCheck }
];

function Badge({ status }) {
  return <span className={`badge ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

function App() {
  const [view, setView] = useState('loading');
  const [authMode, setAuthMode] = useState('signup');
  const [authNotice, setAuthNotice] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState('Overview');
  const [jobs, setJobs] = useState(demo);
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [form, setForm] = useState({ repository_path: '', task_type: 'audit', instructions: '' });

  useEffect(() => {
    checkBackend();
    let mounted = true;
    getCurrentUser()
      .then(currentUser => {
        if (!mounted) return;
        setUser(currentUser);
        setView(currentUser ? 'dashboard' : 'landing');
      })
      .catch(() => {
        if (mounted) setView('landing');
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function checkBackend() {
    setChecking(true);
    try {
      await health();
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setChecking(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      const response = await createTask(form);
      const repository = form.repository_path.split(/[\\/]/).filter(Boolean).pop() || 'repository';
      const type = form.task_type === 'test_generation'
        ? 'Test generation'
        : form.task_type === 'refactor'
          ? 'Refactoring'
          : 'Code audit';
      setJobs(current => [{
        id: response.job_id,
        title: form.instructions,
        repo: repository,
        type,
        status: response.status,
        time: 'Just now'
      }, ...current]);
      setNotice(response.message);
      setModal(false);
      setForm({ repository_path: '', task_type: 'audit', instructions: '' });
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        setAuthMode('login');
        setAuthNotice(error.message);
        setView('auth');
      } else {
        setNotice(error.status ? error.message : `${error.message} Start the backend in a separate terminal.`);
      }
    } finally {
      setBusy(false);
    }
  }

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const matchesQuery = `${job.title} ${job.repo} ${job.id} ${job.type}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === 'All statuses' || job.status === statusFilter);
  }), [jobs, query, statusFilter]);

  function openTaskModal() {
    setNotice('');
    setModal(true);
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthNotice('');
    setView('auth');
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthNotice('');
    const formData = new FormData(event.currentTarget);
    const credentials = {
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || '')
    };
    try {
      const account = authMode === 'signup'
        ? await signUp({ ...credentials, name: String(formData.get('name') || '') })
        : await signIn(credentials);
      setUser(account);
      setView('dashboard');
    } catch (error) {
      setAuthNotice(error.message === 'Failed to fetch'
        ? 'Unable to reach RefactorX. Start the backend, then try again.'
        : error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function leaveDashboard() {
    if (user) {
      try {
        await signOut();
      } catch (error) {
        setNotice(error.message);
        return;
      }
    }
    setUser(null);
    setNotice('');
    setView('landing');
  }

  if (view === 'loading') {
    return (
      <main className="authLoading">
        <span className="wordmarkIcon"><Code2 size={21} /></span>
        <span>Refactor<span>X</span></span>
      </main>
    );
  }

  if (view === 'landing') {
    return (
      <div className="marketingShell">
        <header className="marketingNav">
          <button className="wordmark" onClick={() => setView('landing')} aria-label="RefactorX home">
            <span className="wordmarkIcon"><Code2 size={20} /></span><span>Refactor<span>X</span></span>
          </button>
          <nav className="marketingLinks" aria-label="Main navigation">
            <a href="#features">Platform</a>
            <a href="#workflow">How it works</a>
            <a href="#trust">Security</a>
          </nav>
          <div className="marketingNavActions">
            <button className="textButton" onClick={() => openAuth('login')}>Log in</button>
            <button className="navCta" onClick={() => openAuth('signup')}>Get started <ArrowUpRight size={15} /></button>
          </div>
        </header>

        <main className="marketingMain">
          <section className="marketingHero">
            <div className="marketingHeroCopy">
              <div className="marketingEyebrow"><span className="eyebrowDot" />THE INTELLIGENT CODE IMPROVEMENT PLATFORM</div>
              <h1>Ship better code.<br /><span>With confidence.</span></h1>
              <p className="marketingLead">RefactorX brings focused AI agents into your software workflow—so teams can find issues, improve code, and validate every change with a human in control.</p>
              <div className="marketingHeroActions">
                <button className="marketingPrimary" onClick={() => openAuth('signup')}>Create your workspace <ArrowRight size={16} /></button>
                <button className="marketingSecondary" onClick={() => setView('dashboard')}><Play size={14} /> Explore the demo</button>
              </div>
              <div className="marketingProof"><span className="proofAvatars"><i><Code2 size={12} /></i><i><ShieldCheck size={12} /></i><i><CheckCircle2 size={12} /></i></span><span>Built for thoughtful, reviewable changes</span></div>
            </div>

            <div className="productPreview" aria-label="Preview of the RefactorX workspace">
              <div className="previewTopbar"><span className="previewBrand"><span className="previewLogo"><Code2 size={13} /></span>RefactorX</span><span className="previewBreadcrumb">Workspace <ChevronRight size={12} /> Overview</span><span className="previewOnline"><i /> All systems ready</span></div>
              <div className="previewBody">
                <aside className="previewSidebar"><span className="previewMenu active"><LayoutDashboard size={13} /> Overview</span><span className="previewMenu"><Workflow size={13} /> Agent workflow</span><span className="previewMenu"><FileCode2 size={13} /> Task history</span><span className="previewSidebarLabel">WORKSPACE HEALTH</span><div className="previewHealth"><span><CheckCircle2 size={14} /></span><div><b>All checks passed</b><small>Review pipeline ready</small></div></div></aside>
                <div className="previewContent"><div className="previewTitle"><div><small>YOUR ENGINEERING WORKSPACE</small><b>Good morning, developer</b></div><span>+ New task</span></div><div className="previewBanner"><span className="previewBannerIcon"><Sparkles size={19} /></span><div><small>AI-ASSISTED DEVELOPMENT</small><b>Make every change count.</b><p>Reviewable improvements, backed by validation.</p></div><ArrowUpRight size={16} /></div><div className="previewMetrics"><div><small>Active tasks</small><b>08</b><i className="metricLine linePurple" /></div><div><small>Validated</small><b>24</b><i className="metricLine lineGreen" /></div><div><small>Needs review</small><b>03</b><i className="metricLine lineAmber" /></div></div><div className="previewTasks"><div><b>Recent activity</b><small>View all</small></div><span><i className="taskIndicator green" /><b>Validate API response types</b><em>Completed</em></span><span><i className="taskIndicator purple" /><b>Refactor auth middleware</b><em>In review</em></span><span><i className="taskIndicator blue" /><b>Add tests for date helpers</b><em>Running</em></span></div></div>
              </div>
              <div className="previewFloating"><span><ShieldCheck size={17} /></span><div><b>Human-approved changes</b><small>You stay in control</small></div><CheckCircle2 size={16} /></div>
            </div>
            <div className="heroGlow" />
          </section>

          <section className="trustStrip" id="trust"><span>DESIGNED FOR RESPONSIBLE ENGINEERING</span><div><ShieldCheck size={16} /> Human approval first</div><div><LockKeyhole size={15} /> Privacy-minded workflow</div><div><CheckCircle2 size={16} /> Validation at every step</div></section>

          <section className="featureSection" id="features">
            <div className="featureIntro"><span className="sectionEyebrow">A BETTER WAY TO MAINTAIN SOFTWARE</span><h2>From codebase complexity<br />to <span>clarity and confidence.</span></h2><p>Bring the right tools and focused review into one workspace. RefactorX keeps every step visible and every decision in your hands.</p></div>
            <div className="featureGrid">
              <article className="featureCard"><span className="featureIcon lavender"><Search size={19} /></span><span className="featureNumber">01</span><h3>Spot what matters</h3><p>Identify code smells, risks, and opportunities for improvement without losing sight of context.</p></article>
              <article className="featureCard"><span className="featureIcon blue"><Workflow size={19} /></span><span className="featureNumber">02</span><h3>Coordinate specialist agents</h3><p>Bring auditing, refactoring, and test-planning roles together in a clear, reviewable workflow.</p></article>
              <article className="featureCard"><span className="featureIcon green"><ShieldCheck size={19} /></span><span className="featureNumber">03</span><h3>Keep developers in control</h3><p>Validate proposed changes and keep human review at the center of the engineering process.</p></article>
            </div>
          </section>

          <section className="workflowCallout" id="workflow"><div><span className="sectionEyebrow">BUILT AROUND YOUR WORKFLOW</span><h2>Better code is a team effort.</h2><p>Start with the workspace preview and see how a focused maintenance workflow can come together.</p></div><button className="marketingPrimary" onClick={() => setView('dashboard')}>Explore the workspace <ArrowRight size={16} /></button></section>
        </main>
        <footer className="marketingFooter"><button className="wordmark footerWordmark" onClick={() => setView('landing')}><span className="wordmarkIcon"><Code2 size={17} /></span><span>Refactor<span>X</span></span></button><span>Thoughtful code improvement, from first review to final validation.</span><span>© 2026 RefactorX</span></footer>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <main className="authShell">
        <section className="authStory">
          <button className="wordmark authWordmark" onClick={() => setView('landing')} aria-label="Back to RefactorX home"><span className="wordmarkIcon"><Code2 size={20} /></span><span>Refactor<span>X</span></span></button>
          <div className="authStoryContent"><span className="authStoryBadge"><Sparkles size={14} /> THE CODE IMPROVEMENT WORKSPACE</span><h1>Build with clarity.<br /><span>Ship with confidence.</span></h1><p>Bring your maintenance workflow into focus with thoughtful AI assistance and developers in control.</p><div className="authStoryPoints"><span><CheckCircle2 size={16} /> Specialist agent workflows</span><span><CheckCircle2 size={16} /> Reviewable code improvements</span><span><CheckCircle2 size={16} /> Validation built into the process</span></div></div>
          <div className="authStoryFoot"><ShieldCheck size={15} /> Your code. Your decisions. Always.</div>
          <div className="authStoryOrb authOrbOne" /><div className="authStoryOrb authOrbTwo" />
        </section>
        <section className="authFormSide">
          <button className="authBack" onClick={() => setView('landing')}><ArrowLeft size={15} /> Back to home</button>
          <div className="authFormWrap">
            <div className="authFormBrand"><span className="wordmarkIcon"><Code2 size={18} /></span><span>Refactor<span>X</span></span></div>
            <span className="sectionEyebrow">{authMode === 'signup' ? 'GET STARTED' : 'WELCOME BACK'}</span>
            <h2>{authMode === 'signup' ? 'Create your account' : 'Sign in to RefactorX'}</h2>
            <p className="authSubtitle">{authMode === 'signup' ? 'Start building a more thoughtful code workflow.' : 'Pick up where your team left off.'}</p>
            {authNotice && <div className="authNotice" role="alert"><AlertTriangle size={16} /><span>{authNotice}</span></div>}
            <form className="authForm" onSubmit={submitAuth}>
              {authMode === 'signup' && <label>Your name<span className="authInput"><UserRound size={16} /><input name="name" required autoComplete="name" placeholder="Alex Morgan" /></span></label>}
              <label>Work email<span className="authInput"><Mail size={16} /><input name="email" required type="email" autoComplete="email" placeholder="you@company.com" /></span></label>
              <label>Password<span className="authInput"><LockKeyhole size={16} /><input name="password" required type={showPassword ? 'text' : 'password'} minLength="8" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} placeholder={authMode === 'signup' ? 'At least 8 characters' : 'Enter your password'} /><button type="button" className="passwordToggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
              <button type="submit" className="marketingPrimary authSubmit" disabled={authBusy}>{authBusy ? <><RefreshCw size={15} className="spinning" /> {authMode === 'signup' ? 'Creating account...' : 'Signing in...'}</> : <>{authMode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></>}</button>
            </form>
            <div className="authSwitch">{authMode === 'signup' ? 'Already have an account?' : 'New to RefactorX?'} <button onClick={() => openAuth(authMode === 'signup' ? 'login' : 'signup')}>{authMode === 'signup' ? 'Log in' : 'Create an account'}</button></div>
            <div className="authDivider"><span />or<span /></div>
            <button className="demoAccess" onClick={() => setView('dashboard')}><LayoutDashboard size={16} /> Explore the demo workspace</button>
            <p className="authPreviewNote">Your session is protected with a secure, HTTP-only cookie.</p>
          </div>
          <div className="authLegal">© 2026 RefactorX <span>·</span> Built for better software</div>
        </section>
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('Overview'); }}>
          <span className="brandIcon"><Code2 size={21} /></span>
          <span className="brandCopy"><b>RefactorX</b><small>Code improvement</small></span>
        </a>
        <label className="sectionLabel">WORKSPACE</label>
        <nav className="navigation" aria-label="Workspace navigation">
          {navigation.map(([Icon, name]) => (
            <button
              key={name}
              className={`nav ${page === name ? 'selected' : ''}`}
              aria-current={page === name ? 'page' : undefined}
              aria-label={name}
              title={name}
              onClick={() => setPage(name)}
            >
              <Icon size={18} /><span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebarNote">
          <div className="sidebarNoteTitle"><ShieldCheck size={17} /><b>Privacy-first design</b></div>
          <p>Local model execution is planned. Verify backend setup before using real repositories.</p>
        </div>
        <div className="sidebarFooter">
          <span className="avatar">{user?.name?.slice(0, 1).toUpperCase() || <UserRound size={14} />}</span>
          <span className="sidebarAccount"><b>{user?.name || 'Demo workspace'}</b><small>{user?.email || 'Guest access'}</small></span>
          <button className="logoutButton" onClick={leaveDashboard} aria-label={user ? 'Sign out' : 'Leave demo workspace'} title={user ? 'Sign out' : 'Leave demo workspace'}>
            {user ? <LogOut size={16} /> : <ArrowLeft size={16} />}
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><b>{page}</b></div>
          <div className="topbarActions">
            <span className={`connection ${online ? 'online' : 'offline'}`}>
              <span className="connectionDot" />{online ? 'Backend connected' : 'Backend offline'}
            </span>
            <button className="iconButton refreshButton" onClick={checkBackend} disabled={checking} aria-label="Check backend connection" title="Check backend connection">
              <RefreshCw size={16} className={checking ? 'spinning' : ''} />
            </button>
          </div>
        </header>

        <div className="content">
          <div className="heading">
            <div>
              <div className="eyebrow"><span className="eyebrowDot" />PROJECT WORKSPACE <span>/</span> PHASE 1</div>
              <h1>{page}</h1>
              <p>AI-assisted software maintenance and safe code refactoring.</p>
            </div>
            <button className="primary" onClick={openTaskModal}><Plus size={17} /> New task</button>
          </div>

          {notice && (
            <div className="notice" role="status">
              <AlertTriangle size={17} /><span>{notice}</span>
              <button className="iconButton" onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16} /></button>
            </div>
          )}

          {page === 'Overview' && (
            <>
              <section className="hero">
                <div className="heroCopy">
                  <div className="heroKicker"><span className="heroKickerLine" />SOFTWARE MAINTENANCE, REIMAGINED</div>
                  <h2>Move from code issues<br />to <span>validated improvements.</span></h2>
                  <p>Coordinate specialist agents, validate changes with tests, and keep developers in control at every step.</p>
                  <button className="lightButton" onClick={openTaskModal}>Start a task <ArrowRight size={15} /></button>
                </div>
                <div className="heroVisual" aria-hidden="true">
                  <div className="heroOrbit orbitOne" />
                  <div className="heroOrbit orbitTwo" />
                  <div className="heroOrbit orbitThree" />
                  <div className="heroCore"><Bot size={34} /></div>
                  <span className="orbitDot dotOne" /><span className="orbitDot dotTwo" />
                </div>
                <div className="heroFootnote"><span className="heroStatusDot" />Human approval stays in control</div>
              </section>

              <section className="stats" aria-label="Workspace summary">
                <article className="statCard"><div className="statIcon lavender"><FileCode2 size={17} /></div><span>Tasks in workspace</span><strong>{jobs.length}</strong><small>Sample + submitted tasks</small></article>
                <article className="statCard"><div className="statIcon blue"><Bot size={17} /></div><span>Agents defined</span><strong>04</strong><small>Roles shown in starter UI</small></article>
                <article className="statCard"><div className="statIcon green"><CheckCircle2 size={17} /></div><span>Validation runs</span><strong>—</strong><small>Connect test runner to measure</small></article>
                <article className="statCard"><div className="statIcon amber"><ShieldCheck size={17} /></div><span>Regressions prevented</span><strong>—</strong><small>Requires rollback implementation</small></article>
              </section>

              <div className="columns">
                <section className="panel recentPanel">
                  <div className="panelHead">
                    <div><h3>Recent tasks</h3><p>Track activity across your workspace</p></div>
                    <button className="linkButton" onClick={() => setPage('Task History')}>View all <ArrowRight size={14} /></button>
                  </div>
                  <div className="tableHead"><span>Task</span><span>Type</span><span>Status</span></div>
                  {jobs.slice(0, 5).map(job => (
                    <div className="jobRow" key={job.id}>
                      <div className="jobTitle"><b>{job.title}</b><small>{job.repo} <span>·</span> {job.id}</small></div>
                      <span className="jobType">{job.type}</span><Badge status={job.status} />
                    </div>
                  ))}
                  <p className="footnote">Demo entries are illustrative, not measured results.</p>
                </section>

                <section className="panel workflowPanel">
                  <div className="panelHead">
                    <div><h3>Agent workflow</h3><p>A proposed review pipeline</p></div>
                    <span className="panelHeadIcon"><Activity size={17} /></span>
                  </div>
                  <div className="workflowList">
                    {agentList.map((agent, index) => (
                      <div className="agentRow" key={agent.name}>
                        <span className="agentIcon"><agent.icon size={17} /></span>
                        <div><b>{agent.name}</b><small>{agent.desc}</small></div>
                        <span className="agentStep">0{index + 1}</span>
                      </div>
                    ))}
                  </div>
                  <button className="secondary wide" onClick={() => setPage('Agent Workflow')}>Explore workflow <ArrowRight size={14} /></button>
                </section>
              </div>
            </>
          )}

          {page === 'Agent Workflow' && (
            <section className="panel pagePanel">
              <div className="sectionHeading"><div className="sectionIcon"><Workflow size={19} /></div><div><h3>Planned multi-agent workflow</h3><p>Role definitions for a reviewable maintenance pipeline.</p></div></div>
              <div className="agentCards">
                {agentList.map((agent, index) => (
                  <article className="agentCard" key={agent.name}>
                    <div className="agentCardTop"><span className="agentIcon"><agent.icon size={19} /></span><span className="agentStep">STEP 0{index + 1}</span></div>
                    <h3>{agent.name}</h3><p>{agent.desc}.</p><Badge status="Not connected" />
                  </article>
                ))}
              </div>
              <div className="warning"><AlertTriangle size={16} /><span>These roles are not connected to live agents yet. The backend currently accepts demo tasks only.</span></div>
            </section>
          )}

          {page === 'Task History' && (
            <section className="panel pagePanel historyPanel">
              <div className="historyHeading">
                <div><h3>Task history</h3><p>{filteredJobs.length} {filteredJobs.length === 1 ? 'task' : 'tasks'} in this browser session</p></div>
                <button className="primary compactPrimary" onClick={openTaskModal}><Plus size={15} /> New task</button>
              </div>
              <div className="historyTools">
                <label className="searchField"><Search size={16} /><input aria-label="Search tasks" placeholder="Search tasks or repositories..." value={query} onChange={event => setQuery(event.target.value)} /></label>
                <label className="filterField"><ArrowDownUp size={15} /><select aria-label="Filter tasks by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All statuses</option><option>Queued</option><option>Completed</option><option>Review needed</option><option>Failed</option></select></label>
              </div>
              <div className="historyList">
                {filteredJobs.map(job => (
                  <article className="historyRow" key={job.id}>
                    <span className="historyFileIcon"><FileCode2 size={18} /></span>
                    <div className="historyJob"><b>{job.title}</b><small>{job.repo} <span>·</span> {job.id} <span>·</span> {job.type}</small></div>
                    <span className="historyTime">{job.time}</span><Badge status={job.status} />
                  </article>
                ))}
                {filteredJobs.length === 0 && (
                  <div className="noResults"><Search size={23} /><b>No tasks found</b><p>Try a different search or status filter.</p><button className="linkButton" onClick={() => { setQuery(''); setStatusFilter('All statuses'); }}>Clear filters</button></div>
                )}
              </div>
            </section>
          )}

          {page === 'Code Review' && (
            <section className="panel empty">
              <span className="emptyIcon"><GitBranch size={24} /></span><h3>No code diff connected yet</h3>
              <p>When the backend produces a patch, review the original and modified code here. Human approval should be required before applying changes.</p>
              <button className="secondary" onClick={() => setPage('Agent Workflow')}>View agent workflow <ArrowRight size={14} /></button>
            </section>
          )}

          {page === 'Settings' && (
            <section className="panel pagePanel settingsPanel">
              <div className="sectionHeading"><div className="sectionIcon"><Settings2 size={19} /></div><div><h3>Connection settings</h3><p>Services and runtime configuration for this workspace.</p></div></div>
              <div className="setting"><span><b>Backend API</b><small>Development API endpoint</small></span><div className="settingValue"><code>{import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}</code><span className={`settingStatus ${online ? 'online' : 'offline'}`}><span className="connectionDot" />{online ? 'Connected' : 'Offline'}</span></div></div>
              <div className="setting"><span><b>Ollama</b><small>Local model runtime integration</small></span><Badge status="Not connected" /></div>
              <div className="setting"><span><b>Execution sandbox</b><small>Isolate untrusted repository code</small></span><Badge status="Not connected" /></div>
              <div className="settingsActions"><button className="secondary" onClick={checkBackend} disabled={checking}><RefreshCw size={14} className={checking ? 'spinning' : ''} /> Check connection</button></div>
            </section>
          )}
        </div>
        <footer><span>RefactorX <span className="footerDivider">·</span> Code improvement workspace</span><span>Preview environment</span></footer>
      </main>

      {modal && (
        <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) setModal(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modalHead">
              <div><div className="modalKicker">NEW WORKSPACE TASK</div><h2 id="modal-title">Create a task</h2><p>Submit a repository maintenance request.</p></div>
              <button className="iconButton" onClick={() => setModal(false)} aria-label="Close dialog"><X size={19} /></button>
            </div>
            <form onSubmit={submit}>
              <label>Repository folder path<input required value={form.repository_path} onChange={event => setForm({ ...form, repository_path: event.target.value })} placeholder="C:\\Projects\\sample-repository" /></label>
              <label>Task type<select value={form.task_type} onChange={event => setForm({ ...form, task_type: event.target.value })}><option value="audit">Code audit</option><option value="refactor">Code refactoring</option><option value="test_generation">Unit-test generation</option></select></label>
              <label>Instructions<textarea required rows="4" value={form.instructions} onChange={event => setForm({ ...form, instructions: event.target.value })} placeholder="Find duplicated validation logic and suggest a safe refactoring." /></label>
              <div className="safety"><ShieldCheck size={16} /><span>This starter queues a demo task only. It does not execute code or modify files.</span></div>
              <div className="modalActions"><button type="button" className="secondary" onClick={() => setModal(false)}>Cancel</button><button className="primary" disabled={busy}>{busy ? <><RefreshCw size={15} className="spinning" /> Submitting...</> : <><Play size={15} /> Submit task</>}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
