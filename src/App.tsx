import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  Calendar,
  ChevronRight,
  Compass,
  Heart,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Target,
  User,
  Users,
  Zap,
} from "lucide-react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api } from "./services";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./router";
import type { Match, MessageThread, RequestItem, Skill, Student } from "./types";
import type { ProfileUpdateInput, SignUpInput } from "./types/auth";

type AppView =
  | "landing"
  | "discover"
  | "dashboard"
  | "profile"
  | "matches"
  | "requests"
  | "messages"
  | "exchange"
  | "settings";

interface FormState extends SignUpInput {
  confirmPassword: string;
}

const filters = ["All", "Programming", "AI & ML", "Electronics", "Design", "Business", "Languages"];

const protectedViews: { path: string; view: AppView; label: string }[] = [
  { path: "/discover", view: "discover", label: "Discover" },
  { path: "/matches", view: "matches", label: "Matches" },
  { path: "/requests", view: "requests", label: "Requests" },
  { path: "/messages", view: "messages", label: "Messages" },
  { path: "/dashboard", view: "dashboard", label: "My Skills" },
];

const mobileViews: { path: string; view: AppView; label: string; icon: ReactNode }[] = [
  { path: "/", view: "landing", label: "Home", icon: <Home size={18} /> },
  { path: "/discover", view: "discover", label: "Discover", icon: <Compass size={18} /> },
  { path: "/matches", view: "matches", label: "Matches", icon: <Users size={18} /> },
  { path: "/requests", view: "requests", label: "Requests", icon: <Bell size={18} /> },
  { path: "/profile", view: "profile", label: "Profile", icon: <User size={18} /> },
];

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="sign-in" element={<SignInPage />} />
            <Route path="sign-up" element={<SignUpPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="discover" element={<DiscoverPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="exchange" element={<ExchangeWorkspace />} />
            <Route path="settings" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function AppLayout() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const currentView = getViewFromPath(location.pathname);
  const isAuthScreen = location.pathname === "/sign-in" || location.pathname === "/sign-up";

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "Programming" as any,
    description: "",
    level: "Beginner" as any,
    availability: "Flexible" as any,
    type: "teach" as "teach" | "learn"
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !skillForm.name.trim()) return;
    setSaving(true);
    try {
      await api.addSkill({
        name: skillForm.name.trim(),
        category: skillForm.category,
        description: skillForm.description.trim() || `Exchange ${skillForm.name} with me!`,
        level: skillForm.level,
        availability: skillForm.availability,
        teacherId: currentUser.uid,
        type: skillForm.type
      });
      setShowAddSkill(false);
      setSkillForm({
        name: "",
        category: "Programming",
        description: "",
        level: "Beginner",
        availability: "Flexible",
        type: "teach"
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Backdrop />
      {!isAuthScreen && <TopNav currentView={currentView} />}
      <main className={isAuthScreen ? "page-shell auth-page-shell" : "page-shell"}>
        <Outlet />
      </main>
      {!isAuthScreen && <MobileDock currentView={currentView} />}
      {!isAuthScreen && (
        <button className="fab" aria-label="Teach a skill" onClick={() => setShowAddSkill(true)}>
          <Plus size={20} />
        </button>
      )}

      {showAddSkill && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Add a New Skill</h2>
              <button className="modal-close" onClick={() => setShowAddSkill(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <label className="field-block">
                <span>I want to...</span>
                <select 
                  value={skillForm.type} 
                  onChange={e => setSkillForm(prev => ({ ...prev, type: e.target.value as any }))}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  <option value="teach">Teach this skill</option>
                  <option value="learn">Learn this skill</option>
                </select>
              </label>

              <FormField 
                label="Skill Name" 
                value={skillForm.name} 
                onChange={val => setSkillForm(prev => ({ ...prev, name: val }))} 
                placeholder="e.g. React, Python, UI/UX" 
              />

              <label className="field-block">
                <span>Category</span>
                <select 
                  value={skillForm.category} 
                  onChange={e => setSkillForm(prev => ({ ...prev, category: e.target.value as any }))}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  {["Programming", "AI & ML", "Electronics", "Design", "Business", "Languages", "Music", "Photography", "Academics"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Experience Level</span>
                <select 
                  value={skillForm.level} 
                  onChange={e => setSkillForm(prev => ({ ...prev, level: e.target.value as any }))}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  {["Beginner", "Intermediate", "Advanced"].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Availability</span>
                <select 
                  value={skillForm.availability} 
                  onChange={e => setSkillForm(prev => ({ ...prev, availability: e.target.value as any }))}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  {["Available now", "Evenings", "Weekends", "Flexible"].map(av => (
                    <option key={av} value={av}>{av}</option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Description</span>
                <textarea 
                  value={skillForm.description} 
                  onChange={e => setSkillForm(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Tell others what you can teach or what you want to learn..."
                  rows={4}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                />
              </label>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="secondary-button" onClick={() => setShowAddSkill(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Saving..." : "Add Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getViewFromPath(pathname: string): AppView {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/discover") return "discover";
  if (pathname === "/profile") return "profile";
  if (pathname === "/matches") return "matches";
  if (pathname === "/requests") return "requests";
  if (pathname === "/messages") return "messages";
  if (pathname === "/exchange") return "exchange";
  if (pathname === "/settings") return "settings";
  return "landing";
}

function useAppData() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [rawRequests, setRawRequests] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Seed demo data on load
  useEffect(() => {
    void api.seedDemoData().catch(e => console.error("Seeding failed:", e));
  }, []);

  useEffect(() => {
    const unsubUsers = api.subscribeUsers(setStudents);
    const unsubSkills = api.subscribeSkills(setSkills);

    let unsubRequests = () => {};
    let unsubConvs = () => {};
    let unsubNotifications = () => {};

    if (currentUser) {
      unsubRequests = api.subscribeRequests(currentUser.uid, setRawRequests);
      unsubConvs = api.subscribeConversations(currentUser.uid, setConversations);
      unsubNotifications = api.subscribeNotifications(currentUser.uid, setNotifications);
    }

    return () => {
      unsubUsers();
      unsubSkills();
      unsubRequests();
      unsubConvs();
      unsubNotifications();
    };
  }, [currentUser]);

  const requests: RequestItem[] = useMemo(() => {
    if (!currentUser) return [];
    return rawRequests.map(r => {
      const isSender = r.senderId === currentUser.uid;
      const targetUserId = isSender ? r.receiverId : r.senderId;
      const skill = skills.find(s => s.id === r.skillId);

      let uiStatus: RequestItem["status"] = "Incoming";
      if (r.status === "ACCEPTED") {
        uiStatus = "Active";
      } else if (r.status === "REJECTED") {
        uiStatus = "Rejected";
      } else if (r.status === "COMPLETED") {
        uiStatus = "Completed";
      } else {
        uiStatus = isSender ? "Sent" : "Incoming";
      }

      return {
        id: r.id,
        studentId: targetUserId,
        skill: skill?.name || r.skillName || "Unknown Skill",
        message: r.message || "",
        date: r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : "Just now",
        status: uiStatus,
        match: 90,
        raw: r
      } as RequestItem & { raw: any };
    });
  }, [rawRequests, currentUser, skills]);

  const currentUserStudent = useMemo(() => {
    if (!currentUser) return null;
    return students.find(u => u.id === currentUser.uid) || null;
  }, [students, currentUser]);

  const matches: Match[] = useMemo(() => {
    if (!currentUserStudent) return [];
    const computedMatches: Match[] = [];
    
    // We compute compatibility based on: (matching skills / requested learning skills) * 100
    // Current user wants to learn: currentUserStudent.learnSkills
    // Other student teaches: user.teachSkills
    const myWantedSkills = currentUserStudent.learnSkills;

    for (const user of students) {
      if (user.id === currentUserStudent.id) continue;

      const matchingSkills = user.teachSkills.filter(s => myWantedSkills.includes(s));
      
      let score = 0;
      if (myWantedSkills.length > 0) {
        score = Math.round((matchingSkills.length / myWantedSkills.length) * 100);
      } else {
        // Fallback score if current user has not specified learning skills
        const reciprocalMatch = currentUserStudent.teachSkills.filter(s => user.learnSkills.includes(s));
        score = reciprocalMatch.length > 0 ? 50 : 0;
      }

      // Add availability bonus of +10 if overlapping
      if (user.availability === currentUserStudent.availability && score > 0) {
        score = Math.min(score + 10, 100);
      }

      // Only display match if there is any overlap
      if (score > 0 || matchingSkills.length > 0) {
        computedMatches.push({
          id: `m-${user.id}`,
          studentId: user.id,
          score: score || 50,
          theyTeach: user.teachSkills.slice(0, 3).join(", ") || "None",
          youTeach: currentUserStudent.teachSkills.slice(0, 3).join(", ") || "None",
          note: matchingSkills.length > 0 
            ? `Matches ${matchingSkills.length} skills you're interested in: ${matchingSkills.join(", ")}.`
            : "Strong overlap between your current skills and goals."
        });
      }
    }

    // Sort by highest match score
    return computedMatches.sort((a, b) => b.score - a.score);
  }, [currentUserStudent, students]);

  const threads: MessageThread[] = useMemo(() => {
    if (!currentUser) return [];
    return conversations.map(c => {
      const otherUserId = c.participantIds.find((id: string) => id !== currentUser.uid) || "";
      return {
        id: c.id,
        studentId: otherUserId,
        topic: c.topic || "Skill Exchange",
        online: false,
        messages: [
          {
            id: "last",
            from: c.lastSenderId === currentUser.uid ? "me" : "them",
            text: c.lastMessage || "No messages yet.",
            time: c.lastMessageAt ? new Date(c.lastMessageAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""
          }
        ]
      };
    });
  }, [conversations, currentUser]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return { 
    students, 
    skills, 
    requests, 
    matches, 
    threads, 
    rawRequests, 
    conversations, 
    notifications, 
    unreadNotificationsCount 
  };
}

function TopNav({ currentView }: { currentView: AppView }) {
  const navigate = useNavigate();
  const { isAuthenticated, userProfile, signOutUser } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/sign-in");
  };

  const { unreadNotificationsCount } = useAppData();

  return (
    <header className="topnav">
      <button className="brand" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}>
        <span className="brand-mark">S</span>
        <div>
          <strong>SkillSwap</strong>
          <small>Learn. Teach. Swap.</small>
        </div>
      </button>
      <nav className="topnav-links">
        {protectedViews.map((item) => (
          <button
            key={item.path}
            className={currentView === item.view ? "nav-link active" : "nav-link"}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="topnav-actions">
        {isAuthenticated ? (
          <>
            <button className="icon-button" onClick={() => navigate("/discover")}>
              <Search size={18} />
            </button>
            <button className="icon-button" style={{ position: "relative" }} onClick={() => navigate("/requests")}>
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  background: "var(--error)",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "bold",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button className="icon-button" onClick={() => navigate("/settings")}>
              <Settings size={18} />
            </button>
            <button className="avatar-chip" onClick={() => navigate("/profile")}>
              {userProfile?.avatar || "SS"}
            </button>
            <button className="secondary-button topnav-signout" onClick={handleSignOut}>
              <LogOut size={16} />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button className="secondary-button" onClick={() => navigate("/sign-in")}>
              Sign In
            </button>
            <button className="primary-button" onClick={() => navigate("/sign-up")}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <section className="stack-32">
      <div className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            Award-caliber student skill marketplace
          </div>
          <h1>Learn. Teach. Swap. Grow.</h1>
          <p>
            SkillSwap connects students who want to exchange knowledge, build reputation,
            and grow through real collaborative learning.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate("/sign-up")}>
              Explore Skills
            </button>
            <button className="secondary-button" onClick={() => navigate("/sign-in")}>
              Start Teaching
            </button>
          </div>
          <div className="stats-strip">
            <Stat value="12K+" label="Students" />
            <Stat value="840+" label="Skills" />
            <Stat value="4.8/5" label="Community Rating" />
            <Stat value="6.2K+" label="Skill Exchanges" />
          </div>
        </div>
        <div className="network-panel">
          <div className="network-orbit orbit-a" />
          <div className="network-orbit orbit-b" />
          <div className="network-line line-a" />
          <div className="network-line line-b" />
          <div className="network-node node-center">
            <span>Students</span>
          </div>
          <div className="network-node node-react">
            <span>React</span>
          </div>
          <div className="network-node node-ux">
            <span>UI/UX</span>
          </div>
          <div className="network-node node-python">
            <span>Python</span>
          </div>
          <div className="network-node node-ai">
            <span>AI</span>
          </div>
          <div className="network-node node-electronics">
            <span>Electronics</span>
          </div>
          <div className="network-pulse">
            <Users size={20} />
            <strong>Live skill graph</strong>
            <small>1,284 new match signals this week</small>
          </div>
        </div>
      </div>

      <section className="feature-grid">
        <HowCard index="01" title="Show what you know" text="Add skills you can teach with confidence, formats, and real availability." icon={<BookOpen size={18} />} />
        <HowCard index="02" title="Discover what you need" text="Search by technology, difficulty, learning style, and student compatibility." icon={<Compass size={18} />} />
        <HowCard index="03" title="Swap knowledge" text="Turn matches into sessions, conversations, and measurable progress." icon={<Zap size={18} />} />
      </section>

      <section className="highlight-band">
        <div>
          <p className="section-kicker">Picked for you</p>
          <h2>AI-style recommendations that explain the why.</h2>
        </div>
        <div className="recommendation-row">
          <RecommendationCard title="Computer Vision" reason="Because you know Python + Machine Learning" />
          <RecommendationCard title="Embedded AI" reason="Because you know Arduino + Electronics" />
          <RecommendationCard title="React Advanced" reason="Because you already know JavaScript" />
        </div>
      </section>
    </section>
  );
}

function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const redirectTo =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/dashboard";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormError("Email and password are required.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back to SkillSwap"
      subtitle="Sign in to continue your active exchanges, recommendations, and profile."
      footer={
        <p>
          New here? <button className="text-button inline-button" onClick={() => navigate("/sign-up")}>Create an account</button>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField label="Email" value={email} onChange={setEmail} placeholder="you@college.edu" type="email" />
        <FormField label="Password" value={password} onChange={setPassword} placeholder="Enter your password" type="password" />
        {(formError || authError) && <div className="form-error">{formError || authError}</div>}
        <button className="primary-button auth-submit" disabled={submitting} type="submit">
          {submitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}

function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, authError } = useAuth();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    yearOfStudy: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = (field: keyof FormState) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateSignUpForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const { confirmPassword: _confirmPassword, ...payload } = form;
      await signUp(payload);
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your SkillSwap profile"
      subtitle="Use your existing product shell, then make authentication and profile data real."
      footer={
        <p>
          Already have an account? <button className="text-button inline-button" onClick={() => navigate("/sign-in")}>Sign in</button>
        </p>
      }
    >
      <form className="auth-form auth-form-grid" onSubmit={handleSubmit}>
        <FormField label="Name" value={form.name} onChange={updateField("name")} placeholder="Shreehith Varma" />
        <FormField label="Email" value={form.email} onChange={updateField("email")} placeholder="you@college.edu" type="email" />
        <FormField label="Password" value={form.password} onChange={updateField("password")} placeholder="At least 6 characters" type="password" />
        <FormField label="Confirm Password" value={form.confirmPassword} onChange={updateField("confirmPassword")} placeholder="Re-enter password" type="password" />
        <FormField label="College" value={form.college} onChange={updateField("college")} placeholder="Your college or university" />
        <FormField label="Year" value={form.yearOfStudy} onChange={updateField("yearOfStudy")} placeholder="2nd Year" />
        {(formError || authError) && <div className="form-error form-error-full">{formError || authError}</div>}
        <button className="primary-button auth-submit form-submit-full" disabled={submitting} type="submit">
          {submitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const { students, requests, matches } = useAppData();
  const { userProfile } = useAuth();

  return (
    <section className="stack-24">
      <div className="dashboard-hero">
        <div>
          <p className="section-kicker">Your command center</p>
          <h2>Good afternoon, {userProfile?.name || "Creator"}</h2>
          <p>Ready to learn something new today?</p>
        </div>
        <button className="primary-button" onClick={() => navigate("/discover")}>
          Explore skill recommendations
        </button>
      </div>
      <div className="dashboard-grid">
        <div className="progress-panel">
          <PanelTitle title="Your Skill Progress" icon={<Target size={16} />} />
          <ProgressItem label="React mentorship track" value={80} />
          <ProgressItem label="Computer Vision basics" value={56} />
          <ProgressItem label="Design critique streak" value={68} />
        </div>
        <div className="recommendation-panel">
          <PanelTitle title="Picked for you" icon={<Sparkles size={16} />} />
          <RecommendationCard title="Computer Vision" reason="Because you know Python + Machine Learning" />
          <RecommendationCard title="Embedded AI" reason="Because you know Arduino + Electronics" />
          <RecommendationCard title="React Advanced" reason="Because you already know JavaScript" />
        </div>
        <div className="match-panel">
          <PanelTitle title="Your Skill Matches" icon={<Users size={16} />} />
          {matches.map((match) => {
            const student = students.find((item) => item.id === match.studentId);
            return (
              <div className="match-card" key={match.id}>
                <div className="score-ring">
                  <span>{match.score}%</span>
                </div>
                <div>
                  <strong>{student?.name ?? "Student"}</strong>
                  <p>You teach {match.youTeach} • They teach {match.theyTeach}</p>
                  <small>{match.note}</small>
                </div>
                <button className="text-button" onClick={() => navigate("/matches")}>View Match</button>
              </div>
            );
          })}
        </div>
        <div className="request-summary">
          <PanelTitle title="Pending Requests" icon={<Calendar size={16} />} />
          {requests.slice(0, 3).map((request) => (
            <div className="mini-request" key={request.id}>
              <strong>{request.skill}</strong>
              <span>{request.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiscoverPage() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { students, skills } = useAppData();
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    if (location.state && typeof location.state === "object" && "search" in location.state && typeof location.state.search === "string") {
      setSearch(location.state.search);
    }
  }, [location.state]);

  const [requestingSkill, setRequestingSkill] = useState<Skill | null>(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  const handleSendRequestSubmit = async () => {
    if (!currentUser || !requestingSkill) return;
    setSendingRequest(true);
    setRequestError(null);
    try {
      await api.sendRequest(
        currentUser.uid,
        requestingSkill.teacherId,
        requestingSkill.id,
        requestMsg.trim() || `Hi! I'm interested in learning ${requestingSkill.name} and swapping skills.`,
        requestingSkill.name
      );
      setRequestingSkill(null);
      setRequestMsg("");
    } catch (e: any) {
      setRequestError(e.message || "Failed to send request.");
    } finally {
      setSendingRequest(false);
    }
  };

  const filteredSkills = useMemo(
    () =>
      skills.filter((skill) => {
        // Exclude "learn" skills — show teach skills AND skills with no type (old data)
        if ((skill as any).type === "learn") return false;
        if (skill.teacherId === currentUser?.uid) return false;
        const byFilter = selectedFilter === "All" || skill.category === selectedFilter;
        const query = search.toLowerCase();
        const bySearch =
          !query ||
          skill.name.toLowerCase().includes(query) ||
          (skill.description || "").toLowerCase().includes(query) ||
          (skill.tags || []).some((tag) => tag.toLowerCase().includes(query));
        return byFilter && bySearch;
      }),
    [search, selectedFilter, skills, currentUser?.uid],
  );

  return (
    <section className="stack-24">
      <div className="section-header">
        <div>
          <p className="section-kicker">Discover</p>
          <h2>Discover your next skill</h2>
          <p>Find students who can teach what you want to learn.</p>
        </div>
        <div className="search-panel">
          <Search size={18} />
          <input
            aria-label="Search skills"
            placeholder="Search skills, technologies, interests..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="filter-row">
        {filters.map((filter) => (
          <button
            key={filter}
            className={selectedFilter === filter ? "chip active" : "chip"}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
          </button>
        ))}
        {["Beginner friendly", "Intermediate", "Advanced", "Online", "In-person", "Available now"].map((filter) => (
          <span className="subtle-chip" key={filter}>
            {filter}
          </span>
        ))}
      </div>
      <div className="discover-layout">
        <div className="skill-grid">
          {filteredSkills.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Compass size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 6 }}>No skills found</p>
              <p style={{ fontSize: '0.9rem' }}>Try a different filter or search term.</p>
            </div>
          )}
          {filteredSkills.map((skill) => {
            const teacher = students.find((student) => student.id === skill.teacherId);
            // Use graceful fallback while students are loading — don't silently drop the card
            const teacherName = teacher?.name ?? (skill.teacherId?.startsWith('demo-') ? skill.teacherId.replace('demo-', '').replace(/^\w/, (c: string) => c.toUpperCase()) : 'Student');
            const teacherAvatar = teacher?.avatar ?? teacherName.slice(0, 2).toUpperCase();
            const teacherRating = teacher?.rating ?? 4.8;
            return (
              <article className="skill-card" key={skill.id}>
                <div className="skill-card-top">
                  <div>
                    <span className="skill-icon">{skill.name.slice(0, 2)}</span>
                    <div>
                      <h3>{skill.name}</h3>
                      <p>{skill.category}</p>
                    </div>
                  </div>
                  <button className="icon-button small" aria-label="Bookmark">
                    <Heart size={16} fill={(skill as any).bookmarked ? "currentColor" : "none"} />
                  </button>
                </div>
                <p className="muted-copy">{skill.description}</p>
                <div className="teacher-row">
                  <span className="avatar-chip">{teacherAvatar}</span>
                  <div>
                    <strong>{teacherName}</strong>
                    <small>
                      <Star size={12} /> {teacherRating} • {skill.level}
                    </small>
                  </div>
                </div>
                <div className="tag-row">
                  {(skill.tags || []).map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="skill-card-footer">
                  <small>{skill.availability} • {skill.learners ?? 0} learners</small>
                  <button className="ghost-button" onClick={() => setRequestingSkill(skill)}>
                    Request to Learn
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <aside className="search-explorer">
          <PanelTitle title="Smart Search" icon={<Bot size={16} />} />
          <SearchCluster title="Recent searches" items={["AI Agents", "React", "Photography"]} />
          <SearchCluster title="Trending among students" items={["Python", "UI/UX", "Arduino", "Cybersecurity"]} />
          <SearchCluster title="Recommended" items={["Computer Vision", "Embedded AI", "Product Strategy"]} />
        </aside>
      </div>

      {requestingSkill && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Request to Learn {requestingSkill.name}</h2>
              <button className="modal-close" onClick={() => setRequestingSkill(null)}>×</button>
            </div>
            <div className="auth-form">
              <p className="muted-copy" style={{ marginBottom: 16 }}>Send a message to propose a skill swap.</p>
              <label className="field-block">
                <span>Message</span>
                <textarea 
                  placeholder="Hi! I see you teach Python. I can teach you React..." 
                  rows={4}
                  value={requestMsg}
                  onChange={(e) => setRequestMsg(e.target.value)}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                />
              </label>
              {requestError && <div className="form-error" style={{ marginTop: 8 }}>{requestError}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="secondary-button" onClick={() => setRequestingSkill(null)}>Cancel</button>
                <button type="button" className="primary-button" onClick={handleSendRequestSubmit} disabled={sendingRequest}>
                  {sendingRequest ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfilePage() {
  const { userProfile, updateProfileData } = useAuth();
  const { students, skills } = useAppData();
  const [editState, setEditState] = useState<ProfileUpdateInput>({
    name: "",
    college: "",
    yearOfStudy: "",
    bio: "",
    avatar: "",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Skill editing state
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editSkillForm, setEditSkillForm] = useState({
    name: "",
    category: "Programming" as any,
    description: "",
    level: "Beginner" as any,
    availability: "Flexible" as any,
    type: "teach" as "teach" | "learn"
  });
  const [savingSkill, setSavingSkill] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    setEditState({
      name: userProfile.name,
      college: userProfile.college,
      yearOfStudy: userProfile.yearOfStudy,
      bio: userProfile.bio,
      avatar: userProfile.avatar,
    });
  }, [userProfile]);

  const fallbackStudent = students[0];
  const reviews = fallbackStudent?.reviews ?? [];
  const projects = fallbackStudent?.projects ?? [];

  // Filter user's real skills from the skills list
  const mySkills = useMemo(() => {
    if (!userProfile) return [];
    return skills.filter(s => s.teacherId === userProfile.uid);
  }, [skills, userProfile]);

  const handleChange =
    (field: keyof ProfileUpdateInput) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setEditState((current) => ({ ...current, [field]: value }));
    };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      await updateProfileData(editState);
      setStatusMessage("Profile saved successfully.");
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setEditSkillForm({
      name: skill.name,
      category: skill.category,
      description: skill.description,
      level: skill.level,
      availability: skill.availability,
      type: skill.type
    });
  };

  const handleEditSkillSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSkill || !userProfile) return;
    setSavingSkill(true);
    try {
      await api.editSkill(editingSkill.id, {
        name: editSkillForm.name.trim(),
        category: editSkillForm.category,
        description: editSkillForm.description.trim() || `Exchange ${editSkillForm.name} with me!`,
        level: editSkillForm.level,
        availability: editSkillForm.availability,
        type: editSkillForm.type,
        teacherId: userProfile.uid
      });
      setEditingSkill(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (skill: Skill) => {
    if (!userProfile) return;
    if (window.confirm(`Are you sure you want to delete "${skill.name}"?`)) {
      try {
        await api.deleteSkill(skill.id, userProfile.uid, skill.name, skill.type);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <section className="stack-24">
      <div className="profile-hero">
        <div className="profile-main">
          <div className="profile-avatar">{userProfile.avatar || "SS"}</div>
          <div>
            <p className="section-kicker">Student profile</p>
            <h2>{userProfile.name}</h2>
            <p>{userProfile.bio}</p>
            <div className="meta-row">
              <span>{userProfile.college}</span>
              <span>{userProfile.yearOfStudy}</span>
              <span>{userProfile.email}</span>
              <span>Profile synced</span>
            </div>
          </div>
        </div>
      </div>
      <div className="profile-grid">
        <div className="stack-24">
          <section className="content-panel">
            <PanelTitle title="Edit profile" icon={<User size={16} />} />
            <form className="profile-form" onSubmit={handleSave}>
              <div className="profile-form-grid">
                <FormField label="Name" value={editState.name} onChangeValue={handleChange("name")} placeholder="Your name" />
                <FormField label="College" value={editState.college} onChangeValue={handleChange("college")} placeholder="Your college" />
                <FormField label="Year" value={editState.yearOfStudy} onChangeValue={handleChange("yearOfStudy")} placeholder="Your year" />
                <FormField label="Avatar" value={editState.avatar} onChangeValue={handleChange("avatar")} placeholder="Two-letter avatar" maxLength={2} />
              </div>
              <label className="field-block">
                <span>Bio</span>
                <textarea value={editState.bio} onChange={handleChange("bio")} rows={5} />
              </label>
              {statusMessage && <div className="form-success">{statusMessage}</div>}
              <button className="primary-button auth-submit" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </section>
          
          <section className="content-panel">
            <PanelTitle title="Skills I Teach" icon={<BookOpen size={16} />} />
            <div className="tag-row" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mySkills.filter(s => s.type === "teach").map((skill) => (
                <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 12px', background: 'var(--surface-soft)', borderRadius: '12px' }}>
                  <span className="tag large">{skill.name} • {skill.level}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="text-button" style={{ fontSize: '0.85rem' }} onClick={() => handleEditSkill(skill)}>Edit</button>
                    <button className="text-button" style={{ fontSize: '0.85rem', color: 'var(--error)' }} onClick={() => handleDeleteSkill(skill)}>Delete</button>
                  </div>
                </div>
              ))}
              {mySkills.filter(s => s.type === "teach").length === 0 && <p className="muted-copy">No skills added yet.</p>}
            </div>
          </section>

          <section className="content-panel">
            <PanelTitle title="Skills I Want to Learn" icon={<Compass size={16} />} />
            <div className="tag-row" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mySkills.filter(s => s.type === "learn").map((skill) => (
                <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 12px', background: 'var(--surface-soft)', borderRadius: '12px' }}>
                  <span className="subtle-chip">{skill.name} • {skill.level}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="text-button" style={{ fontSize: '0.85rem' }} onClick={() => handleEditSkill(skill)}>Edit</button>
                    <button className="text-button" style={{ fontSize: '0.85rem', color: 'var(--error)' }} onClick={() => handleDeleteSkill(skill)}>Delete</button>
                  </div>
                </div>
              ))}
              {mySkills.filter(s => s.type === "learn").length === 0 && <p className="muted-copy">No skills added yet.</p>}
            </div>
          </section>

          <section className="content-panel">
            <PanelTitle title="Projects" icon={<Zap size={16} />} />
            <div className="project-list">
              {projects.map((project) => (
                <article className="project-card" key={project.title}>
                  <strong>{project.title}</strong>
                  <p>{project.description}</p>
                  <div className="tag-row">
                    {project.technologies.map((technology) => (
                      <span className="tag" key={technology}>
                        {technology}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <div className="stack-24">
          <section className="content-panel">
            <PanelTitle title="Availability" icon={<Calendar size={16} />} />
            <div className="availability-grid">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                <div className={index >= 4 ? "slot active" : "slot"} key={day}>
                  <strong>{day}</strong>
                  <small>{index >= 4 ? "6-9 PM" : "Busy"}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="content-panel">
            <PanelTitle title="Skill Reputation" icon={<Star size={16} />} />
            <div className="reputation-block">
              <strong>2480 XP</strong>
              <h3>Level 12</h3>
              <p>Knowledge Builder</p>
              <div className="tag-row">
                {["First Skill Swap", "7 Day Learning Streak", "Top Mentor", "10 Exchanges Completed"].map((badge) => (
                  <span className="subtle-chip" key={badge}>{badge}</span>
                ))}
              </div>
            </div>
          </section>
          <section className="content-panel">
            <PanelTitle title="Reviews" icon={<MessageSquare size={16} />} />
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-card" key={review.author}>
                  <strong>{review.author}</strong>
                  <small>{"★".repeat(review.rating)}</small>
                  <p>{review.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      {editingSkill && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Edit Skill: {editingSkill.name}</h2>
              <button className="modal-close" onClick={() => setEditingSkill(null)}>×</button>
            </div>
            <form onSubmit={handleEditSkillSubmit} className="auth-form">
              <label className="field-block">
                <span>Skill Type</span>
                <select 
                  value={editSkillForm.type} 
                  onChange={e => setEditSkillForm(prev => ({ ...prev, type: e.target.value as any }))}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  <option value="teach">Teach this skill</option>
                  <option value="learn">Learn this skill</option>
                </select>
              </label>

              <FormField 
                label="Skill Name" 
                value={editSkillForm.name} 
                onChange={val => setEditSkillForm(prev => ({ ...prev, name: val }))} 
                placeholder="e.g. React, Python" 
              />

              <label className="field-block">
                <span>Category</span>
                <select 
                  value={editSkillForm.category} 
                  onChange={e => setEditSkillForm(prev => ({ ...prev, category: e.target.value as any }))}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  {["Programming", "AI & ML", "Electronics", "Design", "Business", "Languages", "Music", "Photography", "Academics"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Experience Level</span>
                <select 
                  value={editSkillForm.level} 
                  onChange={e => setEditSkillForm(prev => ({ ...prev, level: e.target.value as any }))}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  {["Beginner", "Intermediate", "Advanced"].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Availability</span>
                <select 
                  value={editSkillForm.availability} 
                  onChange={e => setEditSkillForm(prev => ({ ...prev, availability: e.target.value as any }))}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}
                >
                  {["Available now", "Evenings", "Weekends", "Flexible"].map(av => (
                    <option key={av} value={av}>{av}</option>
                  ))}
                </select>
              </label>

              <label className="field-block">
                <span>Description</span>
                <textarea 
                  value={editSkillForm.description} 
                  onChange={e => setEditSkillForm(prev => ({ ...prev, description: e.target.value }))} 
                  placeholder="Tell others what you can teach or what you want to learn..."
                  rows={4}
                  style={{ background: 'var(--surface-soft)', color: 'var(--text)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                />
              </label>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="secondary-button" onClick={() => setEditingSkill(null)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={savingSkill}>
                  {savingSkill ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function MatchesPage() {
  const navigate = useNavigate();
  const { matches, students } = useAppData();
  return (
    <section className="stack-24">
      <div className="section-header">
        <div>
          <p className="section-kicker">Matching</p>
          <h2>Your skill matches</h2>
          <p>Compatibility-powered opportunities designed to create balanced exchanges.</p>
        </div>
      </div>
      <div className="match-showcase">
        {matches.map((match) => {
          const student = students.find((item) => item.id === match.studentId);
          return (
            <article className="match-feature" key={match.id}>
              <div className="score-ring large">
                <span>{match.score}% Match</span>
              </div>
              <div className="stack-16">
                <h3>{student?.name ?? "Student"}</h3>
                <p>You teach {match.youTeach}</p>
                <p>They teach {match.theyTeach}</p>
                <small>{match.note}</small>
                <button className="primary-button narrow" onClick={() => navigate("/discover", { state: { search: match.theyTeach.split(", ")[0] } })}>
                  Request Swap
                </button>
              </div>
            </article>
          );
        })}
        {matches.length === 0 && (
          <p className="muted-copy" style={{ textAlign: "center", width: "100%", padding: "40px" }}>
            Add skills you want to learn on your Profile to see matching students here!
          </p>
        )}
      </div>
    </section>
  );
}

function RequestsPage() {
  const navigate = useNavigate();
  const { requests, students, notifications } = useAppData();
  const tabs = ["Notifications", "Incoming", "Sent", "Active", "Completed", "Rejected"] as const;
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Notifications");

  const filteredRequests = useMemo(() => {
    return requests.filter(r => r.status === activeTab);
  }, [requests, activeTab]);

  const handleAccept = async (requestId: string, rawRequest: any) => {
    try {
      await api.updateRequestStatus(requestId, "ACCEPTED", rawRequest);
    } catch (e) {
      console.error("Failed to accept request:", e);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await api.updateRequestStatus(requestId, "REJECTED");
    } catch (e) {
      console.error("Failed to decline request:", e);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  return (
    <section className="stack-24">
      <div className="section-header">
        <div>
          <p className="section-kicker">Request center</p>
          <h2>Manage every exchange signal</h2>
        </div>
      </div>
      <div className="tab-row">
        {tabs.map((tab) => (
          <button 
            className={tab === activeTab ? "chip active" : "chip"} 
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="request-list">
        {activeTab === "Notifications" ? (
          notifications.map((notif) => (
            <article 
              className="request-card" 
              key={notif.id} 
              style={{ 
                opacity: notif.read ? 0.7 : 1, 
                borderLeft: notif.read ? "1px solid var(--border)" : "3px solid var(--primary)" 
              }}
            >
              <div className="request-summary-main">
                <span className="avatar-chip" style={{ background: notif.read ? "var(--surface-soft)" : "var(--primary)" }}>
                  {notif.type === "new_message" ? "💬" : (notif.type === "new_request" ? "📨" : "🔔")}
                </span>
                <div>
                  <strong>{notif.title}</strong>
                  <p style={{ marginTop: 4, color: "var(--text)" }}>{notif.message}</p>
                  <small className="muted-copy">
                    {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                  </small>
                </div>
              </div>
              <div className="request-actions">
                {!notif.read && (
                  <button className="primary-button narrow" onClick={() => handleMarkAsRead(notif.id)}>
                    Mark Read
                  </button>
                )}
                {notif.type === "new_message" && (
                  <button className="secondary-button narrow" onClick={() => navigate("/messages")}>
                    Chat
                  </button>
                )}
                {(notif.type === "new_request" || notif.type === "request_accepted") && (
                  <button className="secondary-button narrow" onClick={() => setActiveTab("Incoming")}>
                    Requests
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          filteredRequests.map((request) => {
            const student = students.find((item) => item.id === request.studentId);
            return (
              <article className="request-card" key={request.id}>
                <div className="request-summary-main">
                  <span className="avatar-chip">{student?.avatar ?? "SS"}</span>
                  <div>
                    <strong>{student?.name ?? "Student"}</strong>
                    <p>{request.skill}</p>
                    <small>{request.message}</small>
                  </div>
                </div>
                <div className="request-meta">
                  <span>{request.date}</span>
                  <span className="status-badge">{request.status}</span>
                  <span>{request.match}% match</span>
                </div>
                <div className="request-actions">
                  {activeTab === "Incoming" && (
                    <>
                      <button className="primary-button narrow" onClick={() => handleAccept(request.id, (request as any).raw)}>Accept</button>
                      <button className="secondary-button narrow" onClick={() => handleDecline(request.id)}>Decline</button>
                    </>
                  )}
                  {activeTab === "Active" && (
                    <button className="primary-button narrow" onClick={() => navigate("/messages")}>Message</button>
                  )}
                  <button className="text-button" onClick={() => navigate("/discover")}>Discover More</button>
                </div>
              </article>
            );
          })
        )}
        
        {activeTab === "Notifications" && notifications.length === 0 && (
          <p className="muted-copy" style={{ textAlign: "center", padding: "40px 0" }}>
            No notifications yet.
          </p>
        )}
        {activeTab !== "Notifications" && filteredRequests.length === 0 && (
          <p className="muted-copy" style={{ textAlign: "center", padding: "40px 0" }}>
            No requests in this tab.
          </p>
        )}
      </div>
    </section>
  );
}

function MessagesPage() {
  const { currentUser } = useAuth();
  const { students, threads } = useAppData();
  const [activeThreadId, setActiveThreadId] = useState("");
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);

  // Fallback to first thread if activeThreadId is empty
  const activeThread = useMemo(() => {
    return threads.find((thread) => thread.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (!activeThread) return;
    // Set default active thread if none selected
    if (activeThreadId === "" && threads.length > 0) {
      setActiveThreadId(threads[0].id);
      return;
    }
    const unsub = api.subscribeMessages(activeThread.id, setActiveMessages);
    return unsub;
  }, [activeThreadId, activeThread, threads]);

  if (!activeThread) {
    return (
      <section className="messages-layout" style={{ justifyContent: "center", alignItems: "center", padding: "40px" }}>
        <div className="auth-card" style={{ maxWidth: "480px", textAlign: "center" }}>
          <h2>No active chats yet</h2>
          <p className="muted-copy">Accept an incoming request or wait for your request to be accepted to start swapping knowledge.</p>
        </div>
      </section>
    );
  }

  const currentStudent = students.find((student) => student.id === activeThread.studentId);

  const handleSend = async () => {
    if (!currentUser || !composerText.trim() || sending) return;
    setSending(true);
    try {
      await api.sendMessage(activeThread.id, currentUser.uid, composerText.trim());
      setComposerText("");
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const uiMessages = activeMessages.map(msg => ({
    id: msg.id,
    from: msg.senderId === currentUser?.uid ? "me" as const : "them" as const,
    text: msg.text,
    time: msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Sending..."
  }));

  return (
    <section className="messages-layout">
      <aside className="conversation-list">
        <PanelTitle title="Conversations" icon={<MessageSquare size={16} />} />
        {threads.map((thread) => {
          const student = students.find((item) => item.id === thread.studentId);
          return (
            <button
              key={thread.id}
              className={thread.id === activeThread.id ? "conversation-item active" : "conversation-item"}
              onClick={() => setActiveThreadId(thread.id)}
            >
              <span className="avatar-chip">{student?.avatar ?? "SS"}</span>
              <div>
                <strong>{student?.name ?? "Student"}</strong>
                <small>{thread.topic}</small>
              </div>
            </button>
          );
        })}
      </aside>
      <div className="chat-panel">
        <div className="chat-banner">
          <div>
            <strong>Skill Exchange: {activeThread.topic}</strong>
            <small>{currentStudent?.name ?? "Partner"} • active exchange</small>
          </div>
          <button className="icon-button">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="message-stream">
          {uiMessages.map((message) => (
            <div key={message.id} className={message.from === "me" ? "bubble mine" : "bubble theirs"}>
              {message.text}
              <small>{message.time}</small>
            </div>
          ))}
          {uiMessages.length === 0 && (
            <p className="muted-copy" style={{ textAlign: "center", padding: "40px" }}>No messages yet. Say hello!</p>
          )}
        </div>
        <div className="composer">
          <input 
            placeholder="Share notes, links, or next steps..." 
            aria-label="Message input"
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button className="primary-button narrow" onClick={handleSend} disabled={sending || !composerText.trim()}>
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ExchangeWorkspace() {
  return (
    <section className="stack-24">
      <div className="section-header">
        <div>
          <p className="section-kicker">Exchange workspace</p>
          <h2>Your Skill Exchange</h2>
          <p>You ↔ Rahul • You&apos;re teaching React • You&apos;re learning Machine Learning</p>
        </div>
      </div>
      <div className="exchange-grid">
        <section className="content-panel accent-panel">
          <PanelTitle title="Progress" icon={<Target size={16} />} />
          <div className="progress-bar">
            <div style={{ width: "80%" }} />
          </div>
          <strong>80% complete</strong>
          <small>Next session: Saturday, 6:00 PM</small>
        </section>
        <section className="content-panel">
          <PanelTitle title="Goals" icon={<Sparkles size={16} />} />
          <ul className="clean-list">
            <li>Finish dashboard state management pass</li>
            <li>Build first image classifier prototype</li>
            <li>Trade feedback on pitch storytelling</li>
          </ul>
        </section>
        <section className="content-panel">
          <PanelTitle title="Session history" icon={<Calendar size={16} />} />
          <ul className="clean-list">
            <li>Mon: React architecture and layout systems</li>
            <li>Wed: Model training fundamentals</li>
            <li>Fri: Shared code review and UI iteration</li>
          </ul>
        </section>
      </div>
    </section>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="eyebrow">
          <Sparkles size={16} />
          SkillSwap Access
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </section>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  onChangeValue,
  placeholder,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onChangeValue?: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input
        maxLength={maxLength}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange?.(event.target.value);
          onChangeValue?.(event);
        }}
      />
    </label>
  );
}

function validateSignUpForm(form: FormState) {
  if (!form.name.trim()) return "Name is required.";
  if (!form.email.trim()) return "Email is required.";
  if (!form.college.trim()) return "College is required.";
  if (!form.yearOfStudy.trim()) return "Year is required.";
  if (form.password.length < 6) return "Password must be at least 6 characters.";
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  return null;
}

function Backdrop() {
  return (
    <>
      <div className="backdrop glow-one" />
      <div className="backdrop glow-two" />
      <div className="noise" />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function HowCard({
  index,
  title,
  text,
  icon,
}: {
  index: string;
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <article className="how-card">
      <div className="how-top">
        <span>{index}</span>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function PanelTitle({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className="panel-title">
      <span>{icon}</span>
      <strong>{title}</strong>
    </div>
  );
}

function ProgressItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="progress-item">
      <div className="progress-label">
        <strong>{label}</strong>
        <span>{value}%</span>
      </div>
      <div className="progress-bar">
        <div style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RecommendationCard({ title, reason }: { title: string; reason: string }) {
  return (
    <article className="recommendation-card">
      <div className="recommendation-head">
        <span className="skill-icon small">
          <Sparkles size={14} />
        </span>
        <strong>{title}</strong>
      </div>
      <p>{reason}</p>
      <button className="text-button">Why this matches you →</button>
    </article>
  );
}

function SearchCluster({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="stack-12">
      <strong>{title}</strong>
      <div className="tag-row">
        {items.map((item) => (
          <span className="subtle-chip" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function MobileDock({ currentView }: { currentView: AppView }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;

  return (
    <nav className="mobile-dock">
      {mobileViews.map((item) => (
        <button
          key={item.path}
          className={currentView === item.view ? "dock-item active" : "dock-item"}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
