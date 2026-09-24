import { ensureChain, walletError } from "./wallet.js";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { BrowserProvider, Contract } from "ethers";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  Globe2,
  HelpCircle,
  LayoutGrid,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  Wallet,
  X,
  Plus,
  Minus,
  CheckCircle2,
  LoaderCircle,
  LogOut,
  ExternalLink,
  Download,
  Radio,
  Target,
  Flame,
  ArrowLeft,
  RefreshCw,
  Link2,
  Info,
} from "lucide-react";
import { LEAGUES, marketsFor, isOpen, shortAddress } from "../shared/game.js";
import "./styles.css";

async function api(path, body, method = "POST") {
  const r = await fetch(
    `/api${path}`,
    body === undefined
      ? {}
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  let data;
  try {
    data = await r.json();
  } catch {
    throw new Error("The server is unavailable. Please try again.");
  }
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}
const time = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const day = (d) =>
  new Date(d).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const dateKey = (d) => new Date(d).toLocaleDateString("en-CA");
function Brand() {
  return (
    <div className="brand">
      <img src="/mark.svg" alt="" />
      <span>
        matchday<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
function TeamBadge({ team, large = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`team-badge ${large ? "large" : ""}`}
      style={{ "--team": team.color || "#aac4b9" }}
    >
      {team.crest && !failed ? (
        <img
          src={team.crest}
          alt={`${team.name} crest`}
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{team.short || team.name.slice(0, 3).toUpperCase()}</span>
      )}
    </span>
  );
}
function LeagueIcon({ code }) {
  const l = LEAGUES.find((l) => l.code === code);
  return (
    <span className="league-icon" style={{ "--league": l?.color }}>
      {l?.short || "★"}
    </span>
  );
}
function FootballArt() {
  return (
    <svg className="football-art" viewBox="0 0 430 320" aria-hidden="true">
      <defs>
        <radialGradient id="orb">
          <stop offset="0" stopColor="#d3fff1" />
          <stop offset=".53" stopColor="#98d9bf" />
          <stop offset=".82" stopColor="#42705f" />
          <stop offset="1" stopColor="#153127" />
        </radialGradient>
        <radialGradient id="aura">
          <stop stopColor="#15dcac" stopOpacity=".25" />
          <stop offset="1" stopColor="#15dcac" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="patch">
          <stop stopColor="#1c4a3c" />
          <stop offset="1" stopColor="#091f18" />
        </linearGradient>
        <clipPath id="ballclip">
          <circle cx="247" cy="139" r="91" />
        </clipPath>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <circle cx="240" cy="150" r="170" fill="url(#aura)" />
      <g fill="none" stroke="#48b992" opacity=".17">
        <ellipse
          cx="240"
          cy="177"
          rx="167"
          ry="67"
          transform="rotate(-25 240 177)"
        />
        <ellipse
          cx="240"
          cy="177"
          rx="181"
          ry="86"
          transform="rotate(-25 240 177)"
        />
        <path d="M110 270L355 199M146 302L396 230M120 249L177 294M186 229L244 275M256 209L314 253M326 189L383 232" />
      </g>
      <ellipse
        cx="256"
        cy="269"
        rx="75"
        ry="11"
        fill="#00d7a2"
        opacity=".22"
        filter="url(#shadow)"
      />
      <g transform="rotate(-17 247 139)">
        <circle cx="247" cy="139" r="91" fill="url(#orb)" />
        <g clipPath="url(#ballclip)" stroke="#2c5b49" strokeWidth="1.6">
          <path
            d="M224 104L266 108L279 147L245 173L211 147Z"
            fill="url(#patch)"
          />
          <path
            d="M171 72L204 68L214 91L193 115L160 102Z M282 50L314 68L313 101L287 100L269 75Z M330 135L347 157L330 195L302 191L298 159Z M218 209L252 206L269 236L229 243L204 230Z M148 164L169 156L185 180L178 209L144 208Z"
            fill="url(#patch)"
          />
          <path
            d="M224 104L214 91M266 108L287 100M279 147L298 159M245 173L252 206M211 147L185 180M193 115L169 156M204 68L269 75M313 101L330 135M302 191L269 236M178 209L218 209"
            fill="none"
          />
        </g>
        <circle
          cx="247"
          cy="139"
          r="90"
          fill="none"
          stroke="#b5f3d3"
          strokeOpacity=".23"
        />
      </g>
      <g fill="#6ae4bd">
        <circle cx="100" cy="119" r="3" />
        <circle cx="380" cy="164" r="3" />
        <path d="M353 49v12m-6-6h12" stroke="#6ae4bd" strokeWidth="1.5" />
      </g>
      <g transform="translate(110 219) rotate(-8)">
        <rect width="137" height="39" rx="12" fill="#10271e" stroke="#2a5e48" />
        <circle cx="21" cy="20" r="9" fill="#15dcac" />
        <path d="m17 20 3 3 5-6" fill="none" stroke="#06261b" strokeWidth="2" />
        <text
          x="39"
          y="24"
          fill="#cefae8"
          fontSize="12"
          fontFamily="sans-serif"
          fontWeight="600"
        >
          Football. Pure skill.
        </text>
      </g>
    </svg>
  );
}
function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    function key(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll(
          'button:not([disabled]),a[href],input,select,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function App() {
  const [visibleCount, setVisibleCount] = useState(20);
  const [config, setConfig] = useState(null),
    [matches, setMatches] = useState([]),
    [feed, setFeed] = useState(null),
    [user, setUser] = useState(null),
    [picks, setPicks] = useState([]),
    [slip, setSlip] = useState([]),
    [board, setBoard] = useState([]),
    [receipts, setReceipts] = useState([]);
  const [page, setPage] = useState("matches"),
    [league, setLeague] = useState("ALL"),
    [search, setSearch] = useState(""),
    [date, setDate] = useState("all"),
    [status, setStatus] = useState("upcoming"),
    [period, setPeriod] = useState("week"),
    [pickFilter, setPickFilter] = useState("all");
  const [modal, setModal] = useState(null),
    [activeMatch, setActiveMatch] = useState(null),
    [toast, setToast] = useState(null),
    [busy, setBusy] = useState(""),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [mobileSlip, setMobileSlip] = useState(false),
    [mobileNav, setMobileNav] = useState(false),
    [providers, setProviders] = useState([]),
    [profileName, setProfileName] = useState(""),
    [serverOffset, setServerOffset] = useState(0),
    [tick, setTick] = useState(Date.now());
  const providerRef = useRef(null);
  const toastTimer = useRef();
  const notify = (message, error = false) => {
    clearTimeout(toastTimer.current);
    setToast({ message, error });
    toastTimer.current = setTimeout(() => setToast(null), 6500);
  };
  async function loadFixtures() {
    const d = await api("/fixtures");
    setMatches(d.matches);
    setFeed(d.feed);
    setServerOffset(d.serverTime - Date.now());
    setLoadError("");
  }
  async function loadPersonal() {
    const [p, r] = await Promise.all([api("/predictions"), api("/receipts")]);
    setPicks(p.predictions);
    setReceipts(r.receipts);
  }
  async function loadBoard() {
    const d = await api(`/leaderboard?period=${period}`);
    setBoard(d.rows);
  }
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const c = await api("/config");
        if (cancelled) return;
        setConfig(c);
        setUser(c.user);
        await loadFixtures();
      } catch (e) {
        setLoadError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    const refresh = setInterval(() => loadFixtures().catch(() => {}), 60000);
    const clock = setInterval(() => setTick(Date.now()), 15000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
      clearInterval(clock);
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    loadBoard().catch(() => {});
  }, [period, user, picks]);
  useEffect(() => {
    if (user) loadPersonal().catch((e) => notify(e.message, true));
    else {
      setPicks([]);
      setReceipts([]);
    }
  }, [user?.address]);
  useEffect(() => {
    const announce = (e) =>
      setProviders((old) =>
        old.some((p) => p.info.uuid === e.detail.info.uuid)
          ? old
          : [...old, e.detail],
      );
    window.addEventListener("eip6963:announceProvider", announce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () =>
      window.removeEventListener("eip6963:announceProvider", announce);
  }, []);
  useEffect(() => {
    const p = providerRef.current;
    if (!p?.on) return;
    const changed = async () => {
      try {
        await api("/auth/logout", {});
      } catch {}
      setUser(null);
      setSlip([]);
      notify("Wallet changed. Sign in again to continue.");
    };
    p.on("accountsChanged", changed);
    return () => p.removeListener?.("accountsChanged", changed);
  }, [user?.address]);
  const now = tick + serverOffset;
  const openMatches = matches.filter((m) => isOpen(m, now));
  const totalPoints = picks.filter((p) => p.outcome === "won").length;
  const settled = picks.filter((p) => ["won", "lost"].includes(p.outcome));
  const nav = (p) => {
    setPage(p);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  async function connect(provider) {
    setBusy("wallet");
    try {
      const injected = provider || window.ethereum;
      if (!injected)
        throw new Error(
          "Open Matchday in your wallet’s browser, or install an Ethereum-compatible wallet.",
        );
      providerRef.current = injected;
      const eth = new BrowserProvider(injected);
      const signer = await eth.getSigner();
      const address = await signer.getAddress();
      const challenge = await api("/auth/challenge", { address });
      const signature = await signer.signMessage(challenge.message);
      const d = await api("/auth/verify", { id: challenge.id, signature });
      setUser(d.user);
      setModal(null);
      notify("You’re signed in. Time to make your picks.");
    } catch (e) {
      notify(
        e.code === "ACTION_REJECTED"
          ? "Sign-in cancelled. Nothing was charged."
          : e.shortMessage || e.message,
        true,
      );
    } finally {
      setBusy("");
    }
  }
  async function practice() {
    setBusy("practice");
    try {
      const d = await api("/auth/practice", {});
      setUser(d.user);
      setModal(null);
      notify(
        "Practice mode ready. All fixtures and results here are fictional.",
      );
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy("");
    }
  }
  async function logout() {
    try {
      await api("/auth/logout", {});
      setUser(null);
      setSlip([]);
      setModal(null);
    } catch (e) {
      notify(e.message, true);
    }
  }
  const selectionFor = (match, market) =>
    slip.find((p) => p.fixtureId === match.id && p.market === market)
      ?.selection ||
    picks.find((p) => p.fixture_id === match.id && p.market === market)
      ?.selection;
  function select(match, market, selection) {
    if (!isOpen(match, now)) {
      notify("Predictions are closed for this match.", true);
      return;
    }
    const old = picks.find(
      (p) => p.fixture_id === match.id && p.market === market,
    );
    if (old && old.outcome !== "pending") {
      notify("This prediction is already settled.", true);
      return;
    }
    setSlip((prev) => {
      const current = prev.find(
        (p) => p.fixtureId === match.id && p.market === market,
      );
      const rest = prev.filter(
        (p) => !(p.fixtureId === match.id && p.market === market),
      );
      return current?.selection === selection
        ? rest
        : [...rest, { fixtureId: match.id, market, selection }];
    });
  }
  async function submit() {
    if (!user) {
      setModal("wallet");
      return;
    }
    setBusy("submit");
    let saved = 0;
    try {
      for (let i = 0; i < slip.length; i += 100) {
        const batch = slip.slice(i, i + 100);
        const d = await api("/predictions", { picks: batch });
        setPicks(d.predictions);
        setReceipts((r) => [d.receipt, ...r]);
        setSlip((prev) =>
          prev.filter(
            (p) =>
              !batch.some(
                (b) => b.fixtureId === p.fixtureId && b.market === p.market,
              ),
          ),
        );
        saved += batch.length;
      }
      setMobileSlip(false);
      setActiveMatch(null);
      notify(
        `${saved} ${saved === 1 ? "prediction" : "predictions"} saved. Good luck!`,
      );
      setModal("success");
    } catch (e) {
      notify(
        `${saved ? `${saved} picks saved; remaining picks are still in your slip. ` : ""}${e.message}`,
        true,
      );
      await loadFixtures().catch(() => {});
    } finally {
      setBusy("");
    }
  }
  async function anchor(receipt) {
    setBusy("anchor");
    try {
      if (!config.contract)
        throw new Error(
          "On-chain receipts will be available after the Matchday contract is deployed.",
        );
      const injected = providerRef.current || window.ethereum;
      if (!injected)
        throw new Error("Connect your wallet to anchor this receipt.");
      await ensureChain(injected, config.chain);
      const eth = new BrowserProvider(injected, "any");
      const signer = await eth.getSigner();
      if ((await signer.getAddress()).toLowerCase() !== user.address)
        throw new Error("Use the wallet you signed in with.");
      const contract = new Contract(
        config.contract,
        [
          "function commit(bytes32 digest,uint64 deadline) external",
          "function commitments(address,bytes32) view returns (uint64)",
        ],
        signer,
      );
      if (receipt.deadline <= Date.now() / 1000)
        throw new Error("This receipt has passed its kickoff deadline. Submit a prediction for an upcoming match.");
      if (await contract.commitments(user.address, receipt.hash) !== 0n) {
        notify("This receipt is already recorded on BOT Chain.");
        return;
      }
      const tx = await contract.commit(receipt.hash, receipt.deadline);
      notify("Receipt submitted. Waiting for BOT Chain confirmation…");
      await tx.wait();
      notify("Receipt confirmed on BOT Chain.");
    } catch (e) {
      notify(walletError(e), true);
    } finally {
      setBusy("");
    }
  }
  function exportReceipt(receipt) {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            hash: receipt.hash,
            payload: receipt.payload,
            deadline: receipt.deadline,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matchday-receipt-${receipt.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const filtered = matches.filter(
    (m) =>
      (league === "ALL" || m.league === league) &&
      `${m.home.name} ${m.away.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "upcoming"
        ? isOpen(m, now)
        : status === "finished"
          ? m.status === "FINISHED"
          : ["IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT"].includes(
              m.status,
            )) &&
      (date === "all" ||
        dateKey(m.kickoff) ===
          dateKey(Date.now() + (date === "tomorrow" ? 86400000 : 0))),
  );
  useEffect(() => setVisibleCount(20), [league, search, date, status]);
  const selectedLeague = LEAGUES.find((l) => l.code === league);
  const savedKeys = new Set(picks.map((p) => `${p.fixture_id}:${p.market}`));

  function pickButton(match, market, o, compact = false) {
    const selected = selectionFor(match, market) === o.value;
    return (
      <button
        key={o.value}
        className={`pick-option ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}
        onClick={() => select(match, market, o.value)}
        disabled={!isOpen(match, now)}
        aria-pressed={selected}
      >
        <span>{o.label}</span>
        <span className="point">
          {selected ? <Check size={14} /> : compact ? "+1" : "+1 pt"}
        </span>
      </button>
    );
  }
  function slipContent() {
    return (
      <>
        <div className="slip-heading">
          <h2>
            <Ticket size={19} /> Prediction slip{" "}
            <span className="count">{slip.length}</span>
          </h2>
          {slip.length > 0 && (
            <button className="text-button" onClick={() => setSlip([])}>
              Clear
            </button>
          )}
          <button
            className="mobile-only icon-button"
            onClick={() => setMobileSlip(false)}
            aria-label="Close prediction slip"
          >
            <X size={18} />
          </button>
        </div>
        <div className="slip-body">
          {slip.length === 0 ? (
            <div className="empty-slip">
              <div className="ticket-art">
                <Ticket size={33} strokeWidth={1.3} />
                <span>+</span>
              </div>
              <h3>Your next great call starts here.</h3>
              <p>
                Choose a prediction from any match.
                <br />
                Every correct pick earns 1 point.
              </p>
              <span className="small-pill">
                <span className="dot" /> Unlimited picks. Zero stakes.
              </span>
            </div>
          ) : (
            <div className="slip-items">
              {slip.map((p) => {
                const m = matches.find((m) => m.id === p.fixtureId);
                if (!m) return null;
                const market = marketsFor(m).find((x) => x.id === p.market),
                  o = market?.options.find((x) => x.value === p.selection);
                return (
                  <div className="slip-item" key={`${p.fixtureId}:${p.market}`}>
                    <div>
                      <span className="slip-market">{market?.name}</span>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${o?.label}`}
                        onClick={() =>
                          setSlip((prev) => prev.filter((x) => x !== p))
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <strong>{o?.label}</strong>
                    <p>
                      {m.home.name} <span>vs</span> {m.away.name}
                    </p>
                    <footer>
                      <span>
                        {savedKeys.has(`${p.fixtureId}:${p.market}`)
                          ? "Updates existing pick"
                          : day(m.kickoff)}
                      </span>
                      <span className="mint">+1 point</span>
                    </footer>
                    {!isOpen(m, now) && (
                      <p className="warning-text">
                        Match closed. Remove this pick.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {slip.length > 0 && (
          <div className="slip-submit">
            <div>
              <span>Potential points</span>
              <strong>+{slip.length}</strong>
            </div>
            <button
              className="primary full"
              disabled={
                !!busy ||
                slip.some(
                  (p) =>
                    !isOpen(
                      matches.find((m) => m.id === p.fixtureId) || {},
                      now,
                    ),
                ) ||
                feed?.stale
              }
              onClick={submit}
            >
              {busy === "submit" ? (
                <LoaderCircle className="spin" size={18} />
              ) : user ? (
                <CheckCircle2 size={17} />
              ) : (
                <Wallet size={17} />
              )}{" "}
              {user ? "Submit predictions" : "Connect to submit"}
            </button>
            <p>
              <ShieldCheck size={12} /> Free to play. No deposit. No cash
              prizes.
            </p>
          </div>
        )}
        <div className="slip-foot">
          <ShieldCheck size={15} />
          <span>Picks lock at kickoff. Your call, on record.</span>
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <button
            className="icon-button mobile-only"
            aria-label="Open navigation"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu size={22} />
          </button>
          <button
            className="brand-button"
            onClick={() => nav("matches")}
            aria-label="Matchday home"
          >
            <Brand />
          </button>
        </div>
        <div className="topbar-tag">THE GAME BEYOND THE GAME</div>
        <div className="topbar-actions">
          <span className="network-pill">
            <span className="dot" /> BOT Chain
          </span>
          <button
            className="wallet-button"
            onClick={() => {
              setProfileName(user?.name || "");
              setModal(user ? "profile" : "wallet");
            }}
          >
            <Wallet size={16} />
            <span>{user ? user.name : "Connect wallet"}</span>
            {user && <ChevronDown size={14} />}
          </button>
        </div>
      </header>
      {mobileNav && (
        <div className="nav-scrim" onClick={() => setMobileNav(false)} />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-label">PLAY YOUR GAME</div>
        <nav>
          <button
            className={page === "matches" ? "active" : ""}
            onClick={() => nav("matches")}
          >
            <LayoutGrid size={18} /> Match centre{" "}
            <span className="nav-number">{openMatches.length}</span>
          </button>
          <button
            className={page === "leaderboard" ? "active" : ""}
            onClick={() => nav("leaderboard")}
          >
            <Trophy size={18} /> Leaderboard
          </button>
          <button
            className={page === "picks" ? "active" : ""}
            onClick={() => nav("picks")}
          >
            <Ticket size={18} /> My predictions{" "}
            {picks.length > 0 && (
              <span className="nav-number">{picks.length}</span>
            )}
          </button>
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-label">THE BIG FIVE</div>
        <nav className="league-nav">
          <button
            className={league === "ALL" && page === "matches" ? "chosen" : ""}
            onClick={() => {
              setLeague("ALL");
              nav("matches");
            }}
          >
            <Globe2 size={18} /> All leagues
          </button>
          {LEAGUES.map((l) => (
            <button
              key={l.code}
              className={
                league === l.code && page === "matches" ? "chosen" : ""
              }
              onClick={() => {
                setLeague(l.code);
                nav("matches");
              }}
            >
              <LeagueIcon code={l.code} />
              {l.name}
              <span className="league-count">
                {openMatches.filter((m) => m.league === l.code).length}
              </span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <span className="support-symbol">↗</span>
            <h3>Back the next big thing.</h3>
            <p>Support Matchday in the BOT ecosystem rankings.</p>
            <button onClick={() => setModal("support")}>
              Vote for Matchday <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="help-button" onClick={() => setModal("rules")}>
            <HelpCircle size={17} /> How to play <ArrowUpRight size={14} />
          </button>
          <div className="built-on">
            <span className="bot-glyph">▰</span> Built for{" "}
            <strong>BOT Chain</strong>
            <span>↗</span>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="content-wrap">
          {feed?.mode === "demo" && (
            <div className="demo-banner">
              <span>
                <Info size={14} />
                <strong>Demo preview</strong>
                <span className="demo-long">
                  Fictional fixtures & practice points. Real football data is
                  not connected.
                </span>
                <span className="demo-short">Fictional fixtures & points.</span>
              </span>
              <button onClick={() => setModal("data")}>
                Data status <ArrowUpRight size={13} />
              </button>
            </div>
          )}
          {feed?.stale && (
            <div className="error-banner">
              Fixture updates are unavailable. Predictions are paused until the
              feed recovers.{" "}
              <button onClick={() => setModal("data")}>Details</button>
            </div>
          )}
          {page === "matches" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span className="dot" /> FOOTBALL KNOWLEDGE. ON THE RECORD.
                  </div>
                  <h1>
                    You know the game.
                    <br />
                    <span>Make your call.</span>
                  </h1>
                  <p>
                    Five leagues. Unlimited predictions.
                    <br />
                    Turn your football instinct into leaderboard points.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="primary"
                      onClick={() =>
                        document
                          .getElementById("fixtures")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          })
                      }
                    >
                      Explore matches <ArrowRight size={16} />
                    </button>
                    <button
                      className="hero-link"
                      onClick={() => setModal("rules")}
                    >
                      How it works <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
                <FootballArt />
                <div className="hero-corner">
                  <span className="dot" /> FREE TO PLAY
                </div>
              </section>
              <div className="stat-strip">
                <div>
                  <span className="stat-icon">
                    <Globe2 size={18} />
                  </span>
                  <strong>5</strong>
                  <span>elite leagues</span>
                </div>
                <div>
                  <span className="stat-icon">
                    <Target size={18} />
                  </span>
                  <strong>1</strong>
                  <span>point per correct pick</span>
                </div>
                <div>
                  <span className="stat-icon">
                    <Ticket size={18} />
                  </span>
                  <strong>∞</strong>
                  <span>predictions, zero stakes</span>
                </div>
              </div>
            </>
          )}
          <div
            className={`workspace ${page !== "matches" ? "inner-page" : ""}`}
          >
            <section className="main-column">
              {page === "matches" && (
                <section id="fixtures" className="fixtures-section">
                  <div className="section-heading">
                    <div>
                      <div className="eyebrow muted">THE FIXTURE LIST</div>
                      <h2>
                        {selectedLeague?.name || "Match centre"}{" "}
                        <span>{filtered.length}</span>
                      </h2>
                    </div>
                    <button
                      className="icon-button refresh"
                      aria-label="Refresh fixtures"
                      onClick={async () => {
                        try {
                          await loadFixtures();
                          notify("Fixture list refreshed.");
                        } catch (e) {
                          notify(e.message, true);
                        }
                      }}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <div className="filters">
                    <div className="segmented">
                      <button
                        className={status === "upcoming" ? "selected" : ""}
                        onClick={() => setStatus("upcoming")}
                      >
                        Upcoming
                      </button>
                      <button
                        className={status === "inplay" ? "selected" : ""}
                        onClick={() => setStatus("inplay")}
                      >
                        In progress
                      </button>
                      <button
                        className={status === "finished" ? "selected" : ""}
                        onClick={() => setStatus("finished")}
                      >
                        Results
                      </button>
                    </div>
                    <label className="search-box">
                      <Search size={16} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Find your team"
                        aria-label="Find your team"
                      />
                      {search && (
                        <button
                          className="icon-button"
                          aria-label="Clear search"
                          onClick={() => setSearch("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                  </div>
                  <div className="date-filters">
                    {[
                      ["all", "All fixtures"],
                      ["today", "Today"],
                      ["tomorrow", "Tomorrow"],
                    ].map(([v, label]) => (
                      <button
                        key={v}
                        className={date === v ? "active" : ""}
                        onClick={() => setDate(v)}
                      >
                        {label}
                      </button>
                    ))}
                    <span className="timezone">
                      <Clock size={12} /> Your local time
                    </span>
                  </div>
                  {loading ? (
                    <div className="skeleton-stack">
                      {[1, 2, 3].map((i) => (
                        <div className="skeleton" key={i} />
                      ))}
                    </div>
                  ) : loadError ? (
                    <div className="empty-state">
                      <Info />
                      <h3>Couldn’t load the fixtures</h3>
                      <p>{loadError}</p>
                      <button
                        className="secondary"
                        onClick={() =>
                          loadFixtures().catch((e) => setLoadError(e.message))
                        }
                      >
                        Try again
                      </button>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="empty-state">
                      <Search size={30} />
                      <h3>No matches in this view</h3>
                      <p>
                        {feed?.error
                          ? "Check data status for details."
                          : "Try another day, league, or team. There’s always another matchday."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => {
                          setDate("all");
                          setLeague("ALL");
                          setSearch("");
                          setStatus("upcoming");
                        }}
                      >
                        Show all upcoming fixtures
                      </button>
                    </div>
                  ) : (
                    <div className="match-list">
                      {filtered.slice(0, visibleCount).map((m) => (
                        <article className="match-card" key={m.id}>
                          <div className="match-meta">
                            <span>
                              <LeagueIcon code={m.league} />
                              {LEAGUES.find((l) => l.code === m.league)?.name}
                              <span className="meta-dot">·</span>
                              {day(m.kickoff)}
                            </span>
                            <span className="kickoff">
                              {isOpen(m, now) ? (
                                <>
                                  <Clock size={12} />
                                  {time(m.kickoff)}
                                </>
                              ) : m.status === "FINISHED" ? (
                                "FULL TIME"
                              ) : (
                                m.status.replaceAll("_", " ")
                              )}
                            </span>
                          </div>
                          <div className="match-body">
                            <div className="teams">
                              <div>
                                <TeamBadge team={m.home} />
                                <strong>{m.home.name}</strong>
                                {m.score.home !== null && <b>{m.score.home}</b>}
                              </div>
                              <div>
                                <TeamBadge team={m.away} />
                                <strong>{m.away.name}</strong>
                                {m.score.away !== null && <b>{m.score.away}</b>}
                              </div>
                            </div>
                            <div className="quick-market">
                              <div className="market-captions">
                                <span>HOME</span>
                                <span>DRAW</span>
                                <span>AWAY</span>
                              </div>
                              <div className="quick-options">
                                {[
                                  { value: "HOME", label: "1" },
                                  { value: "DRAW", label: "X" },
                                  { value: "AWAY", label: "2" },
                                ].map((o) => pickButton(m, "result", o, true))}
                              </div>
                            </div>
                          </div>
                          <div className="match-footer">
                            <span>
                              <ShieldCheck size={12} />{" "}
                              {isOpen(m, now)
                                ? "Picks close at kickoff"
                                : "Predictions locked"}
                            </span>
                            <button onClick={() => setActiveMatch(m)}>
                              All markets <span>10</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  <div className="load-more">
                    {filtered.length > visibleCount && (
                      <button
                        className="secondary"
                        onClick={() => setVisibleCount((n) => n + 20)}
                      >
                        Show more matches ({filtered.length - visibleCount}{" "}
                        remaining) <ChevronDown size={14} />
                      </button>
                    )}
                  </div>
                  <div className="data-footer">
                    <span className="dot" />
                    {feed?.mode === "demo" ? (
                      "Illustrative fixtures · not a real match schedule"
                    ) : (
                      <>
                        Data provided by{" "}
                        <a
                          href="https://www.football-data.org/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          football-data.org
                        </a>{" "}
                        · scores may be delayed
                      </>
                    )}
                    {feed?.updatedAt && (
                      <span>Updated {time(feed.updatedAt)}</span>
                    )}
                  </div>
                </section>
              )}
              {page === "leaderboard" && (
                <section>
                  <div className="eyebrow mint">
                    KNOW THE GAME. CLIMB THE TABLE.
                  </div>
                  <div className="page-title">
                    <h1>The leaderboard</h1>
                    <Trophy size={34} />
                  </div>
                  <p className="page-description">
                    Every correct prediction earns one point. See who’s making
                    the right calls.
                  </p>
                  <div className="board-summary">
                    <div>
                      <Trophy />
                      <strong>{board.length}</strong>
                      <span>ranked players</span>
                    </div>
                    <div>
                      <Target />
                      <strong>{totalPoints}</strong>
                      <span>your total points</span>
                    </div>
                    <div>
                      <Flame />
                      <strong>
                        {settled.length
                          ? Math.round((totalPoints / settled.length) * 100) +
                            "%"
                          : "—"}
                      </strong>
                      <span>your accuracy</span>
                    </div>
                  </div>
                  <div className="board-toolbar">
                    <div className="segmented">
                      <button
                        className={period === "week" ? "selected" : ""}
                        onClick={() => setPeriod("week")}
                      >
                        This week
                      </button>
                      <button
                        className={period === "season" ? "selected" : ""}
                        onClick={() => setPeriod("season")}
                      >
                        This season
                      </button>
                    </div>
                    {feed?.mode === "demo" && (
                      <span className="small-pill">Practice leaderboard</span>
                    )}
                  </div>
                  <div className="leader-table">
                    <div className="leader-row leader-head">
                      <span>RANK</span>
                      <span>PLAYER</span>
                      <span>PICKS</span>
                      <span>ACCURACY</span>
                      <span>POINTS</span>
                    </div>
                    {board.length ? (
                      board.map((r) => (
                        <div
                          key={r.address}
                          className={`leader-row ${r.you ? "you" : ""}`}
                        >
                          <span className={r.rank <= 3 ? "rank-top" : ""}>
                            {r.rank === 1 ? (
                              <Trophy size={18} />
                            ) : (
                              String(r.rank).padStart(2, "0")
                            )}
                          </span>
                          <span className="player-cell">
                            <span className="avatar">
                              {r.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span>
                              <strong>{r.name}</strong>
                              <small>
                                {r.you ? "You" : shortAddress(r.address)}
                              </small>
                            </span>
                          </span>
                          <span>{r.picks}</span>
                          <span>
                            {r.accuracy === null ? "—" : `${r.accuracy}%`}
                          </span>
                          <strong className="mint">{r.points}</strong>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <Trophy size={34} />
                        <h3>The top spot is open.</h3>
                        <p>Submit your first prediction to join the table.</p>
                        <button
                          className="primary"
                          onClick={() => nav("matches")}
                        >
                          Make your first pick <ArrowRight size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="fine-print">
                    Weeks begin Monday at 00:00 UTC; seasons begin July 1. Picks
                    belong to the period of their match’s kickoff. Ties use
                    accuracy, then share a rank.
                  </p>
                </section>
              )}
              {page === "picks" && (
                <section>
                  <div className="eyebrow mint">EVERY CALL COUNTS</div>
                  <div className="page-title">
                    <h1>My predictions</h1>
                    <Ticket size={32} />
                  </div>
                  <p className="page-description">
                    Your picks, your results, your football story.
                  </p>
                  {!user ? (
                    <div className="empty-state bordered">
                      <Wallet size={34} />
                      <h3>Your predictions live here.</h3>
                      <p>
                        Connect a wallet and sign a free message to create your
                        profile.
                      </p>
                      <button
                        className="primary"
                        onClick={() => setModal("wallet")}
                      >
                        <Wallet size={16} /> Connect wallet
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="board-summary">
                        <div>
                          <Ticket />
                          <strong>{picks.length}</strong>
                          <span>predictions</span>
                        </div>
                        <div>
                          <CheckCircle2 />
                          <strong>{totalPoints}</strong>
                          <span>points earned</span>
                        </div>
                        <div>
                          <Clock />
                          <strong>
                            {
                              picks.filter((p) => p.outcome === "pending")
                                .length
                            }
                          </strong>
                          <span>awaiting results</span>
                        </div>
                      </div>
                      <div className="date-filters">
                        {["all", "pending", "won", "lost", "void"].map((f) => (
                          <button
                            key={f}
                            className={pickFilter === f ? "active" : ""}
                            onClick={() => setPickFilter(f)}
                          >
                            {f === "all"
                              ? "All picks"
                              : f[0].toUpperCase() + f.slice(1)}
                          </button>
                        ))}
                      </div>
                      {picks.filter(
                        (p) => pickFilter === "all" || p.outcome === pickFilter,
                      ).length ? (
                        picks
                          .filter(
                            (p) =>
                              pickFilter === "all" || p.outcome === pickFilter,
                          )
                          .map((p) => {
                            const market =
                              p.match &&
                              marketsFor(p.match).find(
                                (m) => m.id === p.market,
                              );
                            return (
                              <article className="prediction-card" key={p.id}>
                                <div className="prediction-title">
                                  <span className={`outcome ${p.outcome}`}>
                                    {p.outcome === "won" ? (
                                      <CheckCircle2 size={13} />
                                    ) : p.outcome === "pending" ? (
                                      <Clock size={13} />
                                    ) : null}
                                    {p.outcome === "pending"
                                      ? "Pending"
                                      : p.outcome === "won"
                                        ? "+1 point"
                                        : p.outcome === "lost"
                                          ? "Incorrect · 0 pts"
                                          : "Void · 0 pts"}
                                  </span>
                                  <span>
                                    {day(p.match?.kickoff || p.created_at)}
                                  </span>
                                </div>
                                <h3>
                                  {market?.options.find(
                                    (o) => o.value === p.selection,
                                  )?.label || p.selection}
                                </h3>
                                <p>
                                  {p.match?.home.name} vs {p.match?.away.name}
                                </p>
                                <footer>
                                  <span>{market?.name}</span>
                                  {p.simulated_score ? (
                                    <span>
                                      Demo result: {p.simulated_score.home}–
                                      {p.simulated_score.away}
                                    </span>
                                  ) : p.outcome === "pending" &&
                                    isOpen(p.match, now) ? (
                                    <button
                                      className="text-button"
                                      onClick={() => setActiveMatch(p.match)}
                                    >
                                      Edit pick <ChevronRight size={13} />
                                    </button>
                                  ) : (
                                    <span>Locked</span>
                                  )}
                                </footer>
                              </article>
                            );
                          })
                      ) : (
                        <div className="empty-state bordered">
                          <Ticket size={32} />
                          <h3>
                            {picks.length
                              ? "No picks in this category."
                              : "Your first pick is waiting."}
                          </h3>
                          <p>
                            Choose a team, back your instinct, and get on the
                            board.
                          </p>
                          <button
                            className="secondary"
                            onClick={() => nav("matches")}
                          >
                            Browse matches
                          </button>
                        </div>
                      )}
                      {config?.mode === "demo" &&
                        picks.some((p) => p.outcome === "pending") && (
                          <div className="demo-action">
                            <div>
                              <strong>Try the complete experience</strong>
                              <p>
                                Generate fictional results for your practice
                                picks.
                              </p>
                            </div>
                            <button
                              className="secondary"
                              disabled={!!busy}
                              onClick={async () => {
                                setBusy("demo");
                                try {
                                  const d = await api("/demo/settle", {});
                                  setPicks(d.predictions);
                                  notify(
                                    "Practice picks settled using fictional scores.",
                                  );
                                } catch (e) {
                                  notify(e.message, true);
                                } finally {
                                  setBusy("");
                                }
                              }}
                            >
                              Simulate results <Sparkles size={14} />
                            </button>
                          </div>
                        )}
                      {receipts.length > 0 && (
                        <div className="receipt-section">
                          <h3>
                            <ShieldCheck size={17} /> Prediction receipts
                          </h3>
                          <p>
                            A downloadable fingerprint of each submitted slip.
                            {config?.contract
                              ? " You can timestamp it on BOT Chain before kickoff."
                              : " On-chain anchoring is not enabled yet."}
                          </p>
                          {receipts.slice(0, 5).map((r) => (
                            <div className="receipt-row" key={r.id}>
                              <div>
                                <code>
                                  {r.hash.slice(0, 12)}…{r.hash.slice(-6)}
                                </code>
                                <small>
                                  {day(r.createdAt)} · {time(r.createdAt)}
                                </small>
                              </div>
                              <button
                                className="icon-button"
                                aria-label="Download prediction receipt"
                                onClick={() => exportReceipt(r)}
                              >
                                <Download size={16} />
                              </button>
                              {config?.contract &&
                                !user.practice &&
                                JSON.parse(r.payload).mode === "live" &&
                                r.deadline > now / 1000 && (
                                  <button
                                    className="secondary small"
                                    disabled={!!busy}
                                    onClick={() => anchor(r)}
                                  >
                                    Anchor on BOT <ArrowUpRight size={13} />
                                  </button>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}
            </section>
            <aside
              className={`right-column ${mobileSlip ? "show-mobile" : ""}`}
            >
              <div className="prediction-slip">{slipContent()}</div>
              <div className="how-card">
                <div className="eyebrow mint">
                  SMALL RULES. BIG BRAGGING RIGHTS.
                </div>
                <h3>Football, without the stakes.</h3>
                <div>
                  <span>01</span>
                  <p>
                    Pick any match.<small>Europe’s five biggest leagues.</small>
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <p>
                    Make your predictions.
                    <small>Every market. The same 1 point.</small>
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <p>
                    Climb the leaderboard.
                    <small>Unlimited picks. It’s your season.</small>
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setModal("rules")}
                >
                  Read the rules <ArrowUpRight size={14} />
                </button>
              </div>
              {user && (
                <div className="personal-card">
                  <span className="avatar">
                    {user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <strong>{user.name}</strong>
                    <span>
                      {totalPoints} points · {picks.length} picks
                    </span>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="View my predictions"
                    onClick={() => nav("picks")}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              )}
            </aside>
          </div>
          <footer className="page-footer">
            <span>© {new Date().getFullYear()} Matchday</span>
            <span>Made for the love of the game.</span>
            <a href="https://botchain.ai" target="_blank" rel="noreferrer">Built for BOT Chain ↗</a>
            <a href="https://scan.botchain.ai" target="_blank" rel="noreferrer">BOT Chain Explorer ↗</a>
            <button onClick={() => setModal("rules")}>
              Rules & transparency <ArrowUpRight size={12} />
            </button>
          </footer>
        </div>
      </main>
      <button
        className="mobile-slip-bar"
        onClick={() => setMobileSlip(!mobileSlip)}
      >
        <Ticket size={18} />
        <strong>Prediction slip</strong>
        <span>{slip.length}</span>
        <ChevronDown size={16} />
      </button>
      {mobileSlip && (
        <div className="slip-scrim" onClick={() => setMobileSlip(false)} />
      )}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <Info size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {activeMatch && (
        <Modal title="Match markets" wide onClose={() => setActiveMatch(null)}>
          <div className="modal-match">
            <div>
              <TeamBadge team={activeMatch.home} large />
              <strong>{activeMatch.home.name}</strong>
            </div>
            <span>
              <small>{day(activeMatch.kickoff)}</small>
              <b>{time(activeMatch.kickoff)}</b>
              <small>
                {isOpen(activeMatch, now) ? "Picks open" : "Picks locked"}
              </small>
            </span>
            <div>
              <TeamBadge team={activeMatch.away} large />
              <strong>{activeMatch.away.name}</strong>
            </div>
          </div>
          <div className="market-notice">
            <Target size={15} /> Every correct prediction earns 1 point. One
            selection per market.
          </div>
          <div className="markets-grid">
            {marketsFor(activeMatch).map((m) => (
              <section className="market-group" key={m.id}>
                <h3>{m.name}</h3>
                {m.id === "score" ? (
                  <select
                    aria-label="Correct score"
                    value={selectionFor(activeMatch, m.id) || ""}
                    disabled={!isOpen(activeMatch, now)}
                    onChange={(e) => {
                      if (e.target.value)
                        select(activeMatch, m.id, e.target.value);
                    }}
                  >
                    <option value="">Choose a score</option>
                    {m.options.map((o) => (
                      <option value={o.value} key={o.value}>
                        {o.label} · +1 point
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className={`market-options options-${m.options.length}`}>
                    {m.options.map((o) => pickButton(activeMatch, m.id, o))}
                  </div>
                )}
              </section>
            ))}
          </div>
          <div className="modal-bottom">
            <span>{slip.length} picks in your slip</span>
            <button
              className="primary"
              onClick={() => {
                setActiveMatch(null);
                if (window.innerWidth < 1100) setMobileSlip(true);
              }}
            >
              View prediction slip <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "wallet" && (
        <Modal title="Your game starts here" onClose={() => setModal(null)}>
          <div className="connect-intro">
            <span className="big-icon">
              <Wallet size={30} />
            </span>
            <h3>One wallet. Your football identity.</h3>
            <p>
              Sign a free message to create your profile. No deposit, payment,
              or vote is included.
            </p>
          </div>
          <div className="wallet-options">
            {providers.length ? (
              providers.map((p) => (
                <button
                  className="secondary full"
                  disabled={!!busy}
                  key={p.info.uuid}
                  onClick={() => connect(p.provider)}
                >
                  <Wallet size={18} />
                  {p.info.name}
                  <ArrowRight size={16} />
                </button>
              ))
            ) : (
              <button
                className="primary full"
                disabled={!!busy}
                onClick={() => connect()}
              >
                {busy === "wallet" ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Wallet size={18} />
                )}{" "}
                Connect wallet
              </button>
            )}
          </div>
          {config?.mode === "demo" && (
            <>
              <div className="or-divider">
                <span>JUST EXPLORING?</span>
              </div>
              <button
                className="secondary full"
                disabled={!!busy}
                onClick={practice}
              >
                {busy === "practice" ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Sparkles size={16} />
                )}{" "}
                Try a practice profile
              </button>
              <p className="fine-print centered">
                Practice profiles use fictional fixtures and demo points only.
              </p>
            </>
          )}
        </Modal>
      )}
      {modal === "profile" && (
        <Modal title="Your Matchday profile" onClose={() => setModal(null)}>
          <div className="profile-wallet">
            <span className="big-icon">
              <Wallet size={24} />
            </span>
            <code>{shortAddress(user?.address)}</code>
            <span className="small-pill">
              {user?.practice ? "Practice profile" : "Wallet verified"}
            </span>
          </div>
          <label className="field-label">
            Display name
            <input
              maxLength={24}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your football alter ego"
            />
          </label>
          <button
            className="primary full"
            disabled={!!busy}
            onClick={async () => {
              setBusy("profile");
              try {
                const d = await api("/profile", { name: profileName }, "PATCH");
                setUser(d.user);
                setModal(null);
                notify("Profile updated.");
              } catch (e) {
                notify(e.message, true);
              } finally {
                setBusy("");
              }
            }}
          >
            Save profile <Check size={16} />
          </button>
          <button className="secondary full spaced" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </Modal>
      )}
      {modal === "success" && (
        <Modal title="Your predictions are in" onClose={() => setModal(null)}>
          <div className="success-intro">
            <span className="big-icon">
              <CheckCircle2 size={34} />
            </span>
            <h3>You’ve made your call.</h3>
            <p>
              Picks are saved to your profile. You can change them before
              kickoff; results earn points after settlement.
            </p>
          </div>
          <button
            className="primary full"
            onClick={() => {
              setModal(null);
              nav("picks");
            }}
          >
            View my predictions <ArrowRight size={16} />
          </button>
          <button
            className="secondary full spaced"
            onClick={() => setModal("support")}
          >
            Support Matchday on BOT <ArrowUpRight size={16} />
          </button>
          <p className="fine-print centered">
            An ecosystem vote is optional and requires a separate wallet
            transaction and gas.
          </p>
        </Modal>
      )}
      {modal === "support" && (
        <Modal
          title="Back Matchday on BOT Chain"
          onClose={() => setModal(null)}
        >
          <div className="connect-intro">
            <span className="big-icon">
              <Trophy size={32} />
            </span>
            <h3>A little support. A bigger matchday.</h3>
            <p>
              The official BOT Chain ecosystem leaderboard helps people discover
              projects like Matchday.
            </p>
          </div>
          {config?.voteUrl ? (
            <a
              className="primary full"
              href={config.voteUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open our official listing <ArrowUpRight size={16} />
            </a>
          ) : (
            <div className="notice-card">
              <strong>Our listing is not available yet.</strong>
              <p>
                Voting will open here once Matchday is accepted and its official
                listing is configured.
              </p>
            </div>
          )}
          <p className="fine-print">
            Voting is optional, happens on BOT Chain’s official site, and
            requires a separate transaction with gas. Connecting your wallet or
            making predictions does not cast a vote. Voting does not add
            Matchday points.
          </p>
        </Modal>
      )}
      {modal === "data" && (
        <Modal title="Football data status" onClose={() => setModal(null)}>
          <div className="notice-card">
            <strong>
              {feed?.mode === "demo"
                ? "Demo fixtures are active"
                : "football-data.org feed"}
            </strong>
            <p>
              {feed?.mode === "demo"
                ? "These pairings, kickoff times, and simulated results are fictional. Demo points never enter the real competition."
                : "Fixtures and results are cached on our server. The free provider plan has delayed updates; the app does not offer in-play predictions."}
            </p>
            {feed?.error && <p className="warning-text">{feed.error}</p>}
          </div>
          <p className="fine-print">
            {feed?.updatedAt
              ? `Last successful refresh: ${new Date(feed.updatedAt).toLocaleString()}`
              : "No successful data refresh yet."}
          </p>
        </Modal>
      )}
      {modal === "rules" && (
        <Modal
          title="A fair game, in plain English"
          wide
          onClose={() => setModal(null)}
        >
          <div className="rules-grid">
            <section>
              <span>01</span>
              <h3>One correct pick. One point.</h3>
              <p>
                Every market awards +1 for a correct prediction. Incorrect or
                void picks earn 0. There are no odds, deposits, cash stakes, or
                cash prizes.
              </p>
            </section>
            <section>
              <span>02</span>
              <h3>Unlimited predictions.</h3>
              <p>
                Pick as many matches and markets as you like. Each wallet has
                one selection per market per match. Changing a selection
                replaces it; it never creates extra points.
              </p>
            </section>
            <section>
              <span>03</span>
              <h3>Kickoff means pencils down.</h3>
              <p>
                The server locks picks at the scheduled kickoff, or sooner if
                the provider reports the match has started. In-play predictions
                are unavailable. A stale feed pauses new picks.
              </p>
            </section>
            <section>
              <span>04</span>
              <h3>Results decide the table.</h3>
              <p>
                Markets use the confirmed full-time score, including stoppage
                time. Postponed, cancelled, suspended, or awarded matches void
                existing picks when reported. Provider corrections may update
                scores.
              </p>
            </section>
            <section>
              <span>05</span>
              <h3>Transparent rankings.</h3>
              <p>
                Rankings count correct predictions; accuracy breaks ties. Equal
                points and accuracy share a rank. Periods use match kickoff
                dates in UTC. A wallet is an account, not proof of one human.
              </p>
            </section>
            <section>
              <span>06</span>
              <h3>Know what’s on-chain.</h3>
              <p>
                Wallet login verifies ownership. Picks and scoring are hosted by
                Matchday. Downloadable receipts contain pick fingerprints;
                optional BOT timestamps are available only when a contract is
                configured. They prove timing, not result accuracy.
              </p>
            </section>
          </div>
          <div className="notice-card">
            <strong>Built for BOT Chain. Independently operated.</strong>
            <p>
              Matchday is not an official BOT Chain product. Club names identify
              fixtures; their owners do not sponsor or endorse this app. Demo
              fixtures and scores are fictional.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
