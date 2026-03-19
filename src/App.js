import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Gamepad2,
  Swords,
  BarChart3,
  PlusCircle,
  Trash2,
  User,
  Users,
  Loader2,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  Camera,
  X,
  Activity,
  Crown,
  Clover,
  Gem,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Shield,
  Ticket,
  Plus,
  Minus,
  Search,
  Filter,
  Heart,
  PieChart,
  Tv,
  Edit,
  Coins,
  Star,
  Target
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  setDoc,
  increment,
  getDoc
} from "firebase/firestore";

// --- Firebase 초기화 ---
const fallbackConfig = {
  apiKey: "AIzaSyDQ4quZh90YTXSqut2nrPXnpQ4E_XO-2rk",
  authDomain: "virtual-league-f72fb.firebaseapp.com",
  projectId: "virtual-league-f72fb",
  storageBucket: "virtual-league-f72fb.firebasestorage.app",
  messagingSenderId: "911374464561",
  appId: "1:911374464561:web:b2021383cc764e232e8710",
  measurementId: "G-4STYYKEXFR",
};
const firebaseConfig =
  typeof __firebase_config !== "undefined" && __firebase_config
    ? JSON.parse(__firebase_config)
    : fallbackConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId =
  typeof __app_id !== "undefined" ? __app_id : "virtual-league-dev-final";

// ★ 실전용 상대평가 티어 설정 (비율 기준) ★
const TIER_SETTINGS = [
  { id: "S", name: "S 티어", color: "bg-red-500", percent: 10, label: "상위 10%" },
  { id: "A", name: "A 티어", color: "bg-orange-500", percent: 30, label: "상위 11% ~ 30%" },
  { id: "B", name: "B 티어", color: "bg-yellow-500", percent: 60, label: "상위 31% ~ 60%" },
  { id: "C", name: "C 티어", color: "bg-green-500", percent: 85, label: "상위 61% ~ 85%" },
  { id: "D", name: "D 티어", color: "bg-blue-500", percent: 100, label: "하위 15%" },
];

// ★ WOW 고유 직업 색상 사전 정의 ★
const WOW_CLASS_COLORS = {
  "전사": "#C79C6E", "사제": "#FFFFFF", "도적": "#FFF569", "성기사": "#F58CBA",
  "사냥꾼": "#ABD473", "주술사": "#0070DE", "마법사": "#69CCF0", "흑마": "#9482C9",
  "흑마법사": "#9482C9", "드루": "#FF7D0A", "드루이드": "#FF7D0A", "죽음의기사": "#C41E3A", "수도사": "#00FF96", "악마사냥꾼": "#A330C9", "기원사": "#33937F"
};
const fallbackColors = ['#94a3b8', '#cbd5e1', '#64748b']; 

// ★ 직업 뱃지에 파스텔 톤 반투명 효과를 주는 마법의 함수 ★
const getJobBadgeStyle = (jobClass) => {
  const hex = WOW_CLASS_COLORS[jobClass] || "#94a3b8"; // 색상이 없으면 기본 회색
  let r = 0, g = 0, b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return {
    color: hex,
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`, // 배경은 15% 투명도
    borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`       // 테두리는 30% 투명도
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return ["home", "players", "matches", "stats", "tier", "wow", "admin"].includes(hash) ? hash : "home";
  });
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  
  // ★ WOW 탭 상태 관리 ★
  const [wowRoster, setWowRoster] = useState([]);
  const [wowSortConfig, setWowSortConfig] = useState({ key: 'level', direction: 'desc' });
  const [isWowFaqOpen, setIsWowFaqOpen] = useState(false);

  // ★ WOW 탭 '점프 검색'을 위한 신규 상태 추가 ★
  const [wowSearchInput, setWowSearchInput] = useState("");
  const [showWowSearchDropdown, setShowWowSearchDropdown] = useState(false);
  const [wowSearchResults, setWowSearchResults] = useState([]);
  const [currentWowSearchIndex, setCurrentWowSearchIndex] = useState(-1);
  const [highlightedWowMemberId, setHighlightedWowMemberId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  
  // ★ 관리자 인증 상태 관리 ★
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminNicknameInput, setAdminNicknameInput] = useState(() => localStorage.getItem("wak_admin_nickname") || "");
  const [currentAdminName, setCurrentAdminName] = useState(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false); 
  
  const [rawAdminPresence, setRawAdminPresence] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [matchToDelete, setMatchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [todayVisits, setTodayVisits] = useState(0); 
  
  // ★ 펀딩 결산 아코디언 열림 상태 관리 ★
  const [expandedFundingMatchId, setExpandedFundingMatchId] = useState(null);

  // ★ 응원하기(하트) 스팸 클릭 방지용 로딩 상태 추가 ★
  const [cheeringPlayerId, setCheeringPlayerId] = useState(null);

  const [gameName, setGameName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchMode, setMatchMode] = useState("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageInputs, setImageInputs] = useState({});
  const [wowImageInputs, setWowImageInputs] = useState({});
  
  // ★ 방송국 URL 관리를 위한 상태 추가 ★
  const [broadcastUrlInputs, setBroadcastUrlInputs] = useState({});

  const [wowStreamerName, setWowStreamerName] = useState("");
  const [wowNickname, setWowNickname] = useState("");
  const [wowJobClass, setWowJobClass] = useState("");
  const [wowLevel, setWowLevel] = useState("");
  const [isWowSubmitting, setIsWowSubmitting] = useState(false);
  const [wowAdminSearchTerm, setWowAdminSearchTerm] = useState("");
  const [wowAdminSortOption, setWowAdminSortOption] = useState("levelDesc");

  // ★ 배그 신청 명단 복사 옵션 토글 상태 추가 ★
  const [showPubgCopyOptions, setShowPubgCopyOptions] = useState(false);

  // ★ 경기 기록 등록용 펀딩 상태 ★
  const [hasFunding, setHasFunding] = useState(false);
  const [totalFunding, setTotalFunding] = useState("");

  const [individualResults, setIndividualResults] = useState([
    { playerName: "", rank: 1, scoreChange: 100, fundingRatio: "", fundingAmount: "" },
    { playerName: "", rank: 2, scoreChange: 50, fundingRatio: "", fundingAmount: "" },
  ]);
  const [teamResults, setTeamResults] = useState([
    { id: 1, rank: 1, scoreChange: 100, players: ["", ""], fundingRatio: "", fundingAmount: "" },
    { id: 2, rank: 2, scoreChange: -50, players: ["", ""], fundingRatio: "", fundingAmount: "" },
  ]);

  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' });

  // ★ 경기 기록 수정을 위한 신규 상태 추가 ★
  const [matchToEdit, setMatchToEdit] = useState(null);
  const [editGameName, setEditGameName] = useState("");
  const [editMatchDate, setEditMatchDate] = useState("");
  const [editMatchMode, setEditMatchMode] = useState("individual");
  const [editHasFunding, setEditHasFunding] = useState(false);
  const [editTotalFunding, setEditTotalFunding] = useState("");
  const [editIndividualResults, setEditIndividualResults] = useState([]);
  const [editTeamResults, setEditTeamResults] = useState([]);
  const [isEditingSubmit, setIsEditingSubmit] = useState(false);

  const playerStatsMap = useMemo(() => {
    return players.map((p) => {
      let matchCount = 0;
      let winCount = 0;
      matches.forEach((m) => {
        const res = m.results?.find((r) => r.playerName === p.name);
        if (res) {
          matchCount++;
          if (res.rank === 1) winCount++;
        }
      });
      const avgScore = matchCount > 0 ? (p.points / matchCount) : 0;
      return { ...p, matchCount, winCount, avgScore: Number(avgScore.toFixed(1)) };
    }); 
  }, [players, matches]);

  const sortedPlayerStats = useMemo(() => {
    let sortableItems = [...playerStatsMap];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return sortableItems;
  }, [playerStatsMap, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc'; 
    setSortConfig({ key, direction });
  };

  const sortedWowRoster = useMemo(() => {
    let sortableItems = [...wowRoster];
    sortableItems.sort((a, b) => {
      if (a[wowSortConfig.key] < b[wowSortConfig.key]) return wowSortConfig.direction === 'asc' ? -1 : 1;
      if (a[wowSortConfig.key] > b[wowSortConfig.key]) return wowSortConfig.direction === 'asc' ? 1 : -1;
      return a.streamerName.localeCompare(b.streamerName);
    });
    return sortableItems;
  }, [wowRoster, wowSortConfig]);

  const requestWowSort = (key) => {
    let direction = 'desc'; 
    if (wowSortConfig && wowSortConfig.key === key && wowSortConfig.direction === 'desc') direction = 'asc'; 
    setWowSortConfig({ key, direction });
  };

  useEffect(() => {
    if (!wowSearchInput.trim()) {
      setWowSearchResults([]);
      setCurrentWowSearchIndex(-1);
      return;
    }
    const term = wowSearchInput.toLowerCase();
    const results = sortedWowRoster.filter(m =>
      m.streamerName.toLowerCase().includes(term) ||
      m.wowNickname.toLowerCase().includes(term) ||
      m.jobClass.toLowerCase().includes(term)
    );
    setWowSearchResults(results);
  }, [wowSearchInput, sortedWowRoster]);

  const scrollToWowMember = (memberId) => {
    const element = document.getElementById(`wow-member-${memberId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedWowMemberId(memberId);
      setTimeout(() => setHighlightedWowMemberId(null), 2000);
    }
  };

  const handleWowSearchNext = () => {
    if (wowSearchResults.length === 0) return;
    const nextIndex = (currentWowSearchIndex + 1) % wowSearchResults.length;
    setCurrentWowSearchIndex(nextIndex);
    scrollToWowMember(wowSearchResults[nextIndex].id);
    setShowWowSearchDropdown(false);
  };

  const handleWowSearchPrev = () => {
    if (wowSearchResults.length === 0) return;
    const prevIndex = currentWowSearchIndex <= 0 ? wowSearchResults.length - 1 : currentWowSearchIndex - 1;
    setCurrentWowSearchIndex(prevIndex);
    scrollToWowMember(wowSearchResults[prevIndex].id);
    setShowWowSearchDropdown(false);
  };

  const handleWowSearchSelect = (member) => {
    setShowWowSearchDropdown(false);
    const idx = wowSearchResults.findIndex(m => m.id === member.id);
    if (idx !== -1) setCurrentWowSearchIndex(idx);
    scrollToWowMember(member.id);
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["home", "players", "matches", "stats", "tier", "wow", "admin"].includes(hash)) setActiveTab(hash);
      else setActiveTab("home");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (tabName) => {
    window.location.hash = tabName;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } 
          catch (tokenError) { await signInAnonymously(auth); }
        } else { await signInAnonymously(auth); }
      } catch (error) { console.error(error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const playersRef = collection(db, "artifacts", appId, "public", "data", "players");
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const matchesRef = collection(db, "artifacts", appId, "public", "data", "matches");
    const unsubMatches = onSnapshot(matchesRef, (snapshot) => {
        const matchesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        matchesData.sort((a, b) => {
          const dateA = new Date(a.date).getTime(), dateB = new Date(b.date).getTime();
          if (dateA === dateB) return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setMatches(matchesData);
        setIsLoading(false);
      },
      (error) => { console.error(error); setIsLoading(false); }
    );

    const wowRef = collection(db, "artifacts", appId, "public", "data", "wow_roster");
    const unsubWow = onSnapshot(wowRef, (snapshot) => {
      setWowRoster(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const metaRef = doc(db, "artifacts", appId, "public", "data", "metadata", "app_info");
    const unsubMeta = onSnapshot(metaRef, (docSnap) => {
      if (docSnap.exists()) setLastUpdated(docSnap.data().lastUpdated);
    });

    const today = new Date();
    const todayDocId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const visitRef = doc(db, "artifacts", appId, "public", "data", "daily_visits", todayDocId);
    const unsubVisit = onSnapshot(visitRef, (docSnap) => {
      if (docSnap.exists()) setTodayVisits(docSnap.data().count || 0);
    });

    const presenceRef = collection(db, "artifacts", appId, "public", "data", "admin_presence");
    const unsubPresence = onSnapshot(presenceRef, (snapshot) => {
      setRawAdminPresence(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubPlayers(); unsubMatches(); unsubWow(); unsubMeta(); unsubVisit(); unsubPresence(); };
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeAdmins = useMemo(() => {
    return rawAdminPresence.filter(admin => (currentTime - admin.lastActive) < 300000);
  }, [rawAdminPresence, currentTime]);

  useEffect(() => {
    if (!isAdminAuth || !currentAdminName || !user) return;
    let lastUpdated = Date.now();
    setDoc(doc(db, "artifacts", appId, "public", "data", "admin_presence", currentAdminName), { lastActive: Date.now(), status: "online" });
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdated > 60000) {
        lastUpdated = now;
        setDoc(doc(db, "artifacts", appId, "public", "data", "admin_presence", currentAdminName), { lastActive: now, status: "online" }, { merge: true }).catch(err => console.error(err));
      }
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [isAdminAuth, currentAdminName, user]);

  useEffect(() => {
    const recordVisit = async () => {
      const today = new Date();
      const todayDocId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const storageKey = `wak_visited_${todayDocId}`;
      if (!localStorage.getItem(storageKey)) {
        try {
          const visitRef = doc(db, "artifacts", appId, "public", "data", "daily_visits", todayDocId);
          await setDoc(visitRef, { count: increment(1) }, { merge: true });
          localStorage.setItem(storageKey, "true"); 
        } catch (error) {}
      }
    };
    if (user) recordVisit();
  }, [user]);

  useEffect(() => {
    if (!matchDate) {
      const today = new Date();
      setMatchDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,"0")}-${String(today.getDate()).padStart(2, "0")}`);
    }
  }, [matchDate]);

  const getAvatarSrc = (playerName) => {
    const p = players.find((p) => p.name === playerName);
    return p?.imageUrl?.trim() ? p.imageUrl : `https://api.dicebear.com/7.x/adventurer/svg?seed=${playerName}`;
  };

  const getWowAvatarSrc = (member) => {
    return member?.imageUrl?.trim() ? member.imageUrl : `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
  };

  const updateLastModifiedTime = async () => {
    try {
      const metaRef = doc(db, "artifacts", appId, "public", "data", "metadata", "app_info");
      await setDoc(metaRef, { lastUpdated: new Date().toISOString() }, { merge: true });
    } catch (error) {}
  };

  const formatLastUpdated = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${month}.${day} ${hours}:${minutes}`;
  };

  const getPlayerStreak = (playerName) => {
    const playerMatches = matches.filter((m) => m.results?.some((r) => r.playerName === playerName));
    if (playerMatches.length === 0) return { type: "none", count: 0 };
    let streakType = "none", count = 0;
    for (const match of playerMatches) {
      const result = match.results.find((r) => r.playerName === playerName);
      if (!result) continue;
      const isWin = result.scoreChange > 0, isLoss = result.scoreChange < 0;
      if (count === 0) {
        if (isWin) { streakType = "win"; count = 1; } 
        else if (isLoss) { streakType = "lose"; count = 1; } 
        else break;
      } else {
        if (streakType === "win" && isWin) count++;
        else if (streakType === "lose" && isLoss) count++;
        else break;
      }
    }
    return { type: streakType, count };
  };

  const getPlayerStats = (playerName) => {
    const playerMatches = matches.filter((m) => m.results?.some((r) => r.playerName === playerName));
    const totalMatches = playerMatches.length;
    const wins = playerMatches.filter((m) => {
      const r = m.results.find((res) => res.playerName === playerName);
      return r && r.rank === 1;
    }).length;
    const winRate = totalMatches === 0 ? 0 : Math.round((wins / totalMatches) * 100);
    const gameCounts = {};
    playerMatches.forEach((m) => { gameCounts[m.gameName] = (gameCounts[m.gameName] || 0) + 1; });
    let mostPlayedGame = "전적 없음", maxCount = 0;
    for (const [game, count] of Object.entries(gameCounts)) {
      if (count > maxCount) { maxCount = count; mostPlayedGame = game; }
    }
    const recentMatches = playerMatches.slice(0, 5).map((m) => {
      const r = m.results.find((res) => res.playerName === playerName);
      return { id: m.id, gameName: m.gameName, date: m.date, rank: r.rank, scoreChange: r.scoreChange };
    });
    return { totalMatches, wins, winRate, mostPlayedGame, recentMatches };
  };

  const handleCheerPlayer = async (playerId, playerName) => {
    if (!user) return;
    
    // ★ 보안 업데이트: 이미 처리 중인 선수라면 스팸 클릭(중복 실행) 원천 차단!
    if (cheeringPlayerId === playerId) return; 

    setCheeringPlayerId(playerId); // ★ 클릭 즉시 버튼 잠금(로딩 시작)
    const today = new Date().toISOString().split('T')[0];
    const storageKey = 'wak_vleague_hearts_v1';
    let storedData = JSON.parse(localStorage.getItem(storageKey) || '{"date": "", "votes": []}');
    if (storedData.date !== today) storedData = { date: today, votes: [] };
    const hasVoted = storedData.votes.includes(playerName);

    try {
      if (hasVoted) {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId), { hearts: increment(-1) });
        storedData.votes = storedData.votes.filter(name => name !== playerName);
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        showToast(`${playerName}님에 대한 응원을 취소했습니다. 💔`);
      } else {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId), { hearts: increment(1) });
        storedData.votes.push(playerName);
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        showToast(`${playerName}님을 성공적으로 응원했습니다! 💖`);
      }
    } catch (error) { 
      showToast("응원 처리 중 오류가 발생했습니다.", "error"); 
    } finally {
      setCheeringPlayerId(null); // ★ 처리가 끝나면 버튼 잠금 해제
    }
  };

  const handleAddWowMember = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!wowStreamerName.trim() || !wowNickname.trim() || !wowJobClass.trim() || !wowLevel) return showToast("모든 와우 캐릭터 정보를 입력해주세요.", "error");
    setIsWowSubmitting(true);
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "wow_roster"), {
        streamerName: wowStreamerName.trim(), 
        wowNickname: wowNickname.trim(), 
        jobClass: wowJobClass.trim(), 
        level: Number(wowLevel), 
        isApplied: false, // 버종리 참가 신청 (기본 false)
        isPubgApplied: false, // 배그 참가 신청 (기본 false)
        isWowPartner: false, // 와트너 임명 여부 (기본 false)
        createdAt: new Date().toISOString()
      });
      setWowStreamerName(""); setWowNickname(""); setWowJobClass(""); setWowLevel("");
      showToast("와우 길드원이 성공적으로 등록되었습니다!");
    } catch (error) { showToast("길드원 등록 중 오류 발생", "error"); } finally { setIsWowSubmitting(false); }
  };

  const handleUpdateWowLevel = async (id, newLevel) => {
    if (!user) return;
    if (newLevel < 1) newLevel = 1; if (newLevel > 70) newLevel = 70;
    try { 
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id), { level: newLevel }); 
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleToggleWowApply = async (id, currentStatus) => {
    if (!user) return;
    try { 
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id), { isApplied: !currentStatus }); 
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleTogglePubgApply = async (id, currentStatus) => {
    if (!user) return;
    try { 
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id), { isPubgApplied: !currentStatus }); 
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleToggleWowPartner = async (id, currentStatus) => {
    if (!user) return;
    try { 
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id), { isWowPartner: !currentStatus }); 
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleCopyWowApplicantList = () => {
    const applicants = wowRoster
      .filter(m => m.level >= 40 && m.isApplied)
      .map(m => m.streamerName)
      .join(", ");

    if (!applicants) {
      showToast("버종리 참가 신청 완료한 길드원이 아직 없습니다.", "error");
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = applicants;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(`버종리 참가 신청 명단(${applicants.split(', ').length}명) 복사 완료!`);
    } catch (err) {
      showToast("복사에 실패했습니다.", "error");
    }
    document.body.removeChild(textArea);
  };

  const handleCopyPubgApplicantList = (formatType) => {
    const applicants = wowRoster
      .filter(m => m.isPubgApplied) // 레벨 상관없이 신청한 사람은 모두 포함
      .sort((a, b) => b.level - a.level) // 레벨 높은 순(우선권)으로 보기 좋게 정렬
      .map(m => {
        if (formatType === 'level') return `${m.streamerName}(${m.level}렙)`;
        if (formatType === 'level_job') return `${m.streamerName}(${m.level}렙/${m.jobClass})`;
        return m.streamerName;
      })
      .join(", ");

    if (!applicants) {
      showToast("배그 참가 신청 완료한 길드원이 아직 없습니다.", "error");
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = applicants;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(`배그 참가 신청 명단(${wowRoster.filter(m => m.isPubgApplied).length}명) 복사 완료!`);
      setShowPubgCopyOptions(false); // 복사 후 하위 메뉴 닫기
    } catch (err) {
      showToast("복사에 실패했습니다.", "error");
    }
    document.body.removeChild(textArea);
  };

  const handleDeleteWowMember = async (id) => {
    if (!user || !window.confirm("정말 이 길드원을 삭제하시겠습니까?")) return;
    try { await deleteDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id)); showToast("길드원이 삭제되었습니다."); } catch (error) {}
  };

  const handleResetDatabase = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      for (const m of matches) await deleteDoc(doc(db, "artifacts", appId, "public", "data", "matches", m.id));
      for (const p of players) await deleteDoc(doc(db, "artifacts", appId, "public", "data", "players", p.id));
      await updateLastModifiedTime();
      showToast("데이터가 초기화되고 백지상태로 시작됩니다!", "success");
      setShowResetModal(false);
    } catch (error) { showToast("초기화 중 오류가 발생했습니다.", "error"); } finally { setIsResetting(false); navigateTo("tier"); }
  };

  const hashPassword = async (password) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminNicknameInput.trim()) { showToast("닉네임을 입력해주세요.", "error"); return; }
    if (!passwordInput.trim()) { showToast("비밀번호를 입력해주세요.", "error"); return; }
    if (!user) { showToast("서버와 연결 중입니다. 잠시만 기다려주세요.", "error"); return; }

    setIsAdminLoggingIn(true);
    try {
      const authDocRef = doc(db, "artifacts", appId, "public", "data", "admin_auth", "config");
      const authDocSnap = await getDoc(authDocRef);
      const inputHash = await hashPassword(passwordInput);

      if (!authDocSnap.exists()) {
        if (adminNicknameInput.trim() === "딸기세팅") {
          await setDoc(authDocRef, { hash: inputHash, createdAt: new Date().toISOString() });
          showToast(`🔒 [최초 등록 완료] 이제부터 이 비밀번호로만 접속 가능합니다! 다시 로그인해주세요.`);
          setPasswordInput("");
          setAdminNicknameInput("");
        } else {
          showToast("비밀번호가 일치하지 않습니다.", "error");
        }
      } else {
        const storedHash = authDocSnap.data().hash;
        if (inputHash === storedHash) {
          localStorage.setItem("wak_admin_nickname", adminNicknameInput.trim());
          setCurrentAdminName(adminNicknameInput.trim());
          setIsAdminAuth(true);
          showToast(`${adminNicknameInput.trim()}님, 관리자 모드에 접속하셨습니다.`);
          setPasswordInput("");
        } else {
          showToast("비밀번호가 일치하지 않습니다.", "error");
        }
      }
    } catch (error) {
      console.error(error);
      showToast("로그인 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (currentAdminName) {
      try { await deleteDoc(doc(db, "artifacts", appId, "public", "data", "admin_presence", currentAdminName)); } catch (error) {}
    }
    setIsAdminAuth(false); setCurrentAdminName(null); showToast("성공적으로 로그아웃 되었습니다.");
  };

  const handleUpdateImage = async (playerId, url) => {
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId), { imageUrl: url || "" }); await updateLastModifiedTime(); showToast("종겜 리그 프로필 이미지가 저장되었습니다."); } catch (error) {}
  };

  const handleUpdateBroadcastUrl = async (playerId, url) => {
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId), { broadcastUrl: url || "" }); await updateLastModifiedTime(); showToast("방송국 주소가 저장되었습니다."); } catch (error) {}
  };

  const handleUpdateWowImage = async (memberId, url) => {
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), { imageUrl: url || "" }); await updateLastModifiedTime(); showToast("와우 길드원 프로필 이미지가 저장되었습니다."); } catch (error) {}
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete || !user) return;
    setIsDeleting(true);
    try {
      for (const result of matchToDelete.results) {
        const player = players.find((p) => p.name === result.playerName);
        if (player) { await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", player.id), { points: player.points - result.scoreChange }); }
      }
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "matches", matchToDelete.id));
      await updateLastModifiedTime();
      showToast("경기가 삭제되고 점수가 복원되었습니다.");
      setMatchToDelete(null);
    } catch (error) {} finally { setIsDeleting(false); }
  };

  const handleOpenEditMatch = (match) => {
    setMatchToEdit({ ...match, originalMatch: match });
    setEditGameName(match.gameName);
    setEditMatchDate(match.date);
    setEditMatchMode(match.matchType || "individual");
    
    setEditHasFunding(match.hasFunding || false);
    setEditTotalFunding(match.totalFunding || "");

    if (match.matchType === "team") {
      const teamsByRank = {};
      (match.results || []).forEach((r) => {
        if (!teamsByRank[r.rank]) teamsByRank[r.rank] = { 
           id: Date.now() + Math.random(), 
           rank: r.rank, 
           scoreChange: r.scoreChange, 
           players: [],
           fundingRatio: r.fundingRatio || "",
           fundingAmount: r.fundingAmount || ""
        };
        teamsByRank[r.rank].players.push(r.playerName);
      });
      setEditTeamResults(Object.values(teamsByRank).sort((a,b) => a.rank - b.rank));
      setEditIndividualResults([{ playerName: "", rank: 1, scoreChange: 100, fundingRatio: "", fundingAmount: "" }, { playerName: "", rank: 2, scoreChange: 50, fundingRatio: "", fundingAmount: "" }]);
    } else {
      setEditIndividualResults([...(match.results || [])].map(r => ({...r, fundingRatio: r.fundingRatio || "", fundingAmount: r.fundingAmount || ""})));
      setEditTeamResults([{ id: 1, rank: 1, scoreChange: 100, players: ["", ""], fundingRatio: "", fundingAmount: "" }, { id: 2, rank: 2, scoreChange: -50, players: ["", ""], fundingRatio: "", fundingAmount: "" }]);
    }
  };

  const handleSaveEditedMatch = async (e) => {
    e.preventDefault();
    if (!editGameName.trim()) return showToast("게임 이름을 입력해주세요.", "error");

    let finalResults = [];
    if (editMatchMode === "individual") {
      finalResults = editIndividualResults
        .filter((r) => r.playerName.trim() !== "")
        .map(r => ({
           playerName: r.playerName.trim(),
           rank: r.rank,
           scoreChange: r.scoreChange,
           ...(editHasFunding ? { fundingRatio: Number(r.fundingRatio) || 0, fundingAmount: Number(r.fundingAmount) || 0 } : {})
        }));
    } else {
      editTeamResults.forEach((team) => {
        team.players.forEach((pName) => {
          if (pName.trim() !== "") {
            finalResults.push({ 
               playerName: pName.trim(), 
               rank: team.rank, 
               scoreChange: team.scoreChange,
               ...(editHasFunding ? { fundingRatio: Number(team.fundingRatio) || 0, fundingAmount: Number(team.fundingAmount) || 0 } : {})
            });
          }
        });
      });
    }

    if (finalResults.length === 0) return showToast("최소 1명 이상의 유효한 참가자를 입력해주세요.", "error");

    setIsEditingSubmit(true);
    try {
      for (const origResult of matchToEdit.originalMatch.results) {
        const p = players.find((p) => p.name === origResult.playerName);
        if (p) {
          await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", p.id), { 
            points: increment(-origResult.scoreChange) 
          });
        }
      }

      for (const r of finalResults) {
        const pName = r.playerName.trim();
        const p = players.find((p) => p.name === pName);
        if (p) {
          await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", p.id), { 
            points: increment(r.scoreChange) 
          });
        } else {
          await addDoc(collection(db, "artifacts", appId, "public", "data", "players"), { 
            name: pName, points: r.scoreChange, createdAt: new Date().toISOString() 
          });
        }
      }

      await updateDoc(doc(db, "artifacts", appId, "public", "data", "matches", matchToEdit.id), {
        gameName: editGameName,
        date: editMatchDate,
        matchType: editMatchMode,
        hasFunding: editHasFunding,
        totalFunding: editHasFunding ? Number(editTotalFunding) || 0 : 0,
        results: finalResults,
        updatedAt: new Date().toISOString()
      });

      await updateLastModifiedTime();
      showToast("경기 기록이 성공적으로 수정되었습니다.");
      setMatchToEdit(null);
    } catch (error) {
      showToast("수정 중 오류 발생", "error");
    } finally {
      setIsEditingSubmit(false);
    }
  };

  const renderHomeView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900 to-gray-900 rounded-2xl p-8 shadow-xl border border-green-800/50 relative overflow-hidden flex items-center min-h-[240px]">
        <div className="relative z-10 w-full md:w-3/4 pr-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 md:whitespace-nowrap tracking-tight">우왁굳의 버츄얼 종겜 리그에 오신 것을 환영합니다</h2>
          <p className="text-gray-300 mb-6 text-sm md:text-base break-keep">매주 바뀌는 게임과 실시간으로 갱신되는 티어표를 확인하세요.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigateTo("tier")} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition">
              <Trophy className="w-5 h-5 mr-2" /> 티어표 보기
            </button>
            <button onClick={() => navigateTo("matches")} className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 shadow-lg hover:bg-gray-700 transition">
              <Swords className="w-5 h-5 mr-2" /> 경기 기록
            </button>
            <button onClick={() => navigateTo("wow")} className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-900 to-purple-900 text-white rounded-lg border border-blue-700/50 shadow-lg hover:from-blue-800 hover:to-purple-800 transition">
              <Shield className="w-5 h-5 mr-2" /> 와우 왁타버스 길드
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-5 flex items-center">
            <Gamepad2 className="w-6 h-6 mr-2 text-green-400" /> 최근 경기
          </h3>
          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.slice(0, 3).map((match) => (
                <div key={match.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      {match.matchType === "team" && <Users className="w-4 h-4 text-indigo-400 mr-1.5" />}
                      <p className="font-bold text-white text-lg">{match.gameName}</p>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{match.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base text-yellow-400 font-bold">
                      1위: {match.results?.find((r) => r.rank === 1)?.playerName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-lg">최근 경기가 없습니다.</p>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-5 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-green-400" /> TOP 5
          </h3>
          {players.length > 0 ? (
            <div className="space-y-3">
              {[...players].sort((a, b) => b.points - a.points).slice(0, 5).map((player, idx) => (
                  <div key={player.id} onClick={() => setSelectedPlayer(player.name)} className="flex items-center bg-gray-700/30 p-3 rounded-lg cursor-pointer hover:bg-gray-600/50 transition group">
                    <div className={`w-10 h-10 text-lg rounded-full flex items-center justify-center font-bold mr-4 ${
                      idx === 0 ? "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]" : 
                      idx === 1 ? "bg-slate-300 text-black shadow-[0_0_10px_rgba(203,213,225,0.5)]" :
                      idx === 2 ? "bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]" :
                      "bg-gray-600 text-white"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <img src={getAvatarSrc(player.name)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`; }} alt="avatar" className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 group-hover:border-green-400 transition" />
                      <span className="font-bold text-lg text-white group-hover:text-green-400 transition">{player.name}</span>
                    </div>
                    <div className="text-green-400 font-black text-lg">{player.points} pt</div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-lg">참가자가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPlayersView = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const storageData = JSON.parse(localStorage.getItem('wak_vleague_hearts_v1') || '{"date": "", "votes": []}');
    const votesToday = storageData.date === todayStr ? storageData.votes : [];

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-pink-900/40 via-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Users className="w-48 h-48 text-purple-500" />
          </div>
          <div className="relative z-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 flex items-center justify-center drop-shadow-md">
              <Users className="w-8 h-8 mr-3 text-purple-400" /> 참가 선수 갤러리
            </h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto break-keep">
              버츄얼 종겜 리그에 참여한 이력이 있는 스트리머들의 프로필을 확인하실 수 있습니다.<br/>
              <span className="text-purple-200 font-medium text-sm md:text-base mt-4 inline-block bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-sm backdrop-blur-sm">
                💡 궁금한 스트리머의 프로필을 클릭해보세요!
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {[...players].sort((a,b) => a.name.localeCompare(b.name)).map(player => {
            const hasVotedToday = votesToday.includes(player.name);
            const broadcastLink = player.broadcastUrl?.trim() 
              ? player.broadcastUrl 
              : `https://www.sooplive.co.kr/search/station?keyword=${encodeURIComponent(player.name)}`;

            return (
              <div key={player.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300 group flex flex-col">
                <div className="p-4 flex-1 flex flex-col items-center cursor-pointer" onClick={() => setSelectedPlayer(player.name)}>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-700 border-2 border-gray-600 mb-3 overflow-hidden group-hover:scale-110 group-hover:border-purple-400 transition-all duration-300 shadow-md">
                    <img src={getAvatarSrc(player.name)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`; }} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold text-white text-base md:text-lg group-hover:text-purple-400 transition-colors">{player.name}</h3>
                  <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2.5 py-0.5 rounded mt-1.5 border border-green-800/30">{player.points} pt</span>
                </div>
                <div className="px-3 pb-4 space-y-2 mt-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCheerPlayer(player.id, player.name); }}
                      disabled={cheeringPlayerId === player.id}
                      className={`w-full flex items-center justify-center py-2 rounded-lg font-bold text-xs transition-all duration-300 transform active:scale-95 ${
                        cheeringPlayerId === player.id
                          ? "bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed" 
                          : hasVotedToday
                            ? "bg-pink-500/10 border border-pink-500/50 text-pink-400 hover:bg-pink-500/20 cursor-pointer"
                            : "bg-pink-500 hover:bg-pink-400 text-white shadow-[0_4px_14px_rgba(236,72,153,0.3)]"
                      }`}
                    >
                      {cheeringPlayerId === player.id ? (
                        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-gray-400" /> 처리 중...</>
                      ) : (
                        <>
                          <Heart className={`w-3.5 h-3.5 mr-1.5 ${hasVotedToday ? "fill-pink-400 text-pink-400" : "fill-transparent text-white"}`} />
                          {hasVotedToday ? "응원완료" : "응원하기"} {(player.hearts || 0).toLocaleString()}
                        </>
                      )}
                    </button>
                    <a
                      href={broadcastLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="w-full flex items-center justify-center py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md"
                    >
                      📺 방송국 가기
                    </a>
                </div>
              </div>
            )
          })}
          {players.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>아직 등록된 선수가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMatchesView = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white flex items-center mb-4">
        <Swords className="w-8 h-8 mr-3 text-green-400" /> 경기 기록
      </h2>
      <div className="grid gap-6">
        {matches.map((match) => {
          if (match.matchType === "team") {
            const teamsByRank = {};
            (match.results || []).forEach((r) => {
              if (!teamsByRank[r.rank]) teamsByRank[r.rank] = { rank: r.rank, scoreChange: r.scoreChange, players: [] };
              teamsByRank[r.rank].players.push(r.playerName);
            });
            const sortedTeams = Object.values(teamsByRank).sort((a, b) => a.rank - b.rank);

            return (
              <div key={match.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                  <div className="flex items-center flex-wrap gap-3">
                    <h3 className="text-2xl font-bold text-white">{match.gameName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-3 py-1 rounded text-sm font-bold flex items-center shadow-sm">
                        <Users className="w-4 h-4 mr-1.5" /> 팀전
                      </span>
                      {match.hasFunding && (
                        <button 
                          onClick={() => setExpandedFundingMatchId(expandedFundingMatchId === match.id ? null : match.id)}
                          className="bg-yellow-900/40 text-yellow-400 border border-yellow-700/50 px-3 py-1 rounded text-sm font-bold flex items-center hover:bg-yellow-800/60 transition shadow-sm"
                        >
                          <Coins className="w-4 h-4 mr-1.5" /> 펀딩 결산 {expandedFundingMatchId === match.id ? <ChevronUp className="w-4 h-4 ml-1"/> : <ChevronDown className="w-4 h-4 ml-1"/>}
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-base text-gray-400">{match.date}</span>
                </div>

                <div className="flex flex-col gap-4">
                  {sortedTeams.map((team, idx) => (
                    <div key={idx} className={`p-5 rounded-lg border ${team.rank === 1 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-gray-700/30 border-gray-600"}`}>
                      <div className="flex justify-between items-center mb-4 border-b border-gray-600/50 pb-3">
                        <span className={`text-lg font-bold ${team.rank === 1 ? "text-yellow-400" : "text-gray-300"}`}>{team.rank}위 팀</span>
                        <span className={`text-sm font-bold px-3 py-1 rounded ${team.scoreChange >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {team.scoreChange > 0 ? "+" : ""}{team.scoreChange} pt
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {team.players.map((p) => (
                          <div key={p} onClick={() => setSelectedPlayer(p)} className="flex items-center bg-gray-900 px-4 py-2 rounded-full border border-gray-700 shadow-sm cursor-pointer hover:border-green-400 transition group">
                            <img src={getAvatarSrc(p)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${p}`; }} alt="avatar" className="w-8 h-8 rounded-full mr-2.5 bg-gray-800 object-cover border border-gray-600" />
                            <span className="text-base font-bold text-white group-hover:text-green-400">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {expandedFundingMatchId === match.id && match.hasFunding && (
                  <div className="mt-4 p-5 bg-gradient-to-b from-gray-800 to-gray-900 border border-yellow-700/40 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-2">
                     <div className="text-center mb-5 pb-4 border-b border-gray-700/50">
                        <span className="text-sm text-gray-400 font-bold">총 펀딩 규모</span>
                        <div className="text-3xl font-black text-yellow-400 mt-1 flex items-center justify-center">
                          <Star className="w-6 h-6 mr-2 fill-yellow-400 text-yellow-400" />
                          {(match.totalFunding || 0).toLocaleString()} 개
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedTeams.map((team, idx) => {
                           const firstPlayerResult = match.results.find(r => r.playerName === team.players[0]);
                           const fAmount = firstPlayerResult?.fundingAmount || 0;
                           const fRatio = firstPlayerResult?.fundingRatio || 0;
                           return (
                             <div key={idx} className="flex flex-col bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm">
                                <div className="flex justify-between items-center mb-3 border-b border-gray-700/80 pb-3">
                                   <span className={`text-base font-bold ${team.rank===1?'text-yellow-400':'text-gray-300'}`}>{team.rank}위 팀 전리품</span>
                                   <div className="text-right">
                                      <span className="text-yellow-400 font-black text-xl">{Number(fAmount).toLocaleString()}개</span>
                                      {fRatio > 0 && <span className="text-xs text-gray-400 font-bold ml-1.5">({fRatio}%)</span>}
                                   </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                   {team.players.map(p => (
                                      <span key={p} className="text-sm text-gray-200 font-medium bg-gray-700 px-2.5 py-1 rounded">{p}</span>
                                   ))}
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  </div>
                )}

              </div>
            );
          }

          return (
            <div key={match.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div className="flex items-center flex-wrap gap-3">
                  <h3 className="text-2xl font-bold text-white">{match.gameName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-700 text-gray-300 border border-gray-600 px-3 py-1 rounded text-sm font-bold flex items-center shadow-sm">
                      <User className="w-4 h-4 mr-1.5" /> 개인전
                    </span>
                    {match.hasFunding && (
                      <button 
                        onClick={() => setExpandedFundingMatchId(expandedFundingMatchId === match.id ? null : match.id)}
                        className="bg-yellow-900/40 text-yellow-400 border border-yellow-700/50 px-3 py-1 rounded text-sm font-bold flex items-center hover:bg-yellow-800/60 transition shadow-sm"
                      >
                        <Coins className="w-4 h-4 mr-1.5" /> 펀딩 결산 {expandedFundingMatchId === match.id ? <ChevronUp className="w-4 h-4 ml-1"/> : <ChevronDown className="w-4 h-4 ml-1"/>}
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-base text-gray-400">{match.date}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...(match.results || [])].sort((a, b) => a.rank - b.rank).map((result, idx) => (
                    <div key={idx} onClick={() => setSelectedPlayer(result.playerName)} className={`p-4 rounded-xl border flex flex-col justify-center cursor-pointer transition group hover:-translate-y-1 hover:shadow-lg ${result.rank === 1 ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-400" : "bg-gray-700/30 border-gray-600 hover:border-green-400"}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-gray-300">{result.rank}위</span>
                        <span className={`text-sm font-bold px-3 py-1 rounded ${result.scoreChange >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {result.scoreChange > 0 ? "+" : ""}{result.scoreChange} pt
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src={getAvatarSrc(result.playerName)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${result.playerName}`; }} alt="avatar" className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600" />
                        <span className="font-bold text-white truncate text-xl group-hover:text-green-400 transition">{result.playerName}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {expandedFundingMatchId === match.id && match.hasFunding && (
                <div className="mt-4 p-5 bg-gradient-to-b from-gray-800 to-gray-900 border border-yellow-700/40 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-2">
                   <div className="text-center mb-5 pb-4 border-b border-gray-700/50">
                      <span className="text-sm text-gray-400 font-bold">총 펀딩 규모</span>
                      <div className="text-3xl font-black text-yellow-400 mt-1 flex items-center justify-center">
                        <Star className="w-6 h-6 mr-2 fill-yellow-400 text-yellow-400" />
                        {(match.totalFunding || 0).toLocaleString()} 개
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[...(match.results || [])].sort((a,b) => a.rank - b.rank).map((r, i) => (
                         <div key={i} className="flex justify-between items-center bg-gray-800 p-3.5 rounded-lg border border-gray-700 shadow-sm hover:border-yellow-500/30 transition">
                            <div className="flex items-center gap-2">
                               <span className={`text-base font-black w-8 text-center ${r.rank===1?'text-yellow-400':'text-gray-400'}`}>{r.rank}</span>
                               <span className="text-white font-bold text-lg truncate w-24">{r.playerName}</span>
                            </div>
                            <div className="text-right flex flex-col">
                               <span className="text-yellow-400 font-black text-lg">{Number(r.fundingAmount).toLocaleString()}개</span>
                               {r.fundingRatio > 0 && <span className="text-[10px] text-gray-500 font-bold">({r.fundingRatio}%)</span>}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}

            </div>
          );
        })}
        {matches.length === 0 && <p className="text-gray-400 text-center py-12 text-lg">기록이 없습니다.</p>}
      </div>
    </div>
  );

  const renderStatsView = () => {
    const mostWinsPlayer = [...playerStatsMap].sort((a, b) => b.winCount - a.winCount || b.points - a.points)[0];
    const mostPlayedPlayer = [...playerStatsMap].sort((a, b) => b.matchCount - a.matchCount || b.points - a.points)[0];
    const bestAvgPlayer = [...playerStatsMap].filter(p => p.matchCount > 0).sort((a, b) => b.avgScore - a.avgScore)[0];

    const SortIcon = ({ columnKey }) => {
      if (sortConfig.key !== columnKey) return <ChevronDown className="w-4 h-4 ml-1 opacity-30 group-hover:opacity-100 transition" />;
      return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 text-green-400" /> : <ChevronDown className="w-4 h-4 ml-1 text-green-400" />;
    };

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center mb-3">
            <TrendingUp className="w-8 h-8 mr-3 text-indigo-400" /> 종합 통계 대시보드
          </h2>
          <p className="text-base text-gray-400">매주 새로운 게임, 새로운 참가자들이 만들어내는 치열한 리그의 누적 기록입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-yellow-900/40 to-gray-800 border border-yellow-700/50 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Crown className="w-40 h-40 text-yellow-500" /></div>
            <Crown className="w-10 h-10 text-yellow-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-300 mb-1">👑 종합 우승왕</h3>
            <p className="text-xs md:text-sm text-yellow-500/70 mb-4 text-center break-keep">1위를 가장 많이 달성한 유저</p>
            {mostWinsPlayer && mostWinsPlayer.winCount > 0 ? (
              <>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedPlayer(mostWinsPlayer.name)}>
                  <img src={getAvatarSrc(mostWinsPlayer.name)} alt="avatar" className="w-12 h-12 rounded-full bg-gray-900 object-cover border-2 border-yellow-500/50 group-hover:scale-110 transition" />
                  <span className="text-2xl font-black text-white group-hover:text-yellow-400 transition">{mostWinsPlayer.name}</span>
                </div>
                <p className="text-yellow-400 font-bold mt-4 bg-yellow-900/30 px-4 py-1.5 rounded-full text-base">총 {mostWinsPlayer.winCount}회 우승</p>
              </>
            ) : (<span className="text-gray-500 mt-2 text-base">기록 없음</span>)}
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-gray-800 border border-emerald-700/50 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Clover className="w-40 h-40 text-emerald-500" /></div>
            <Clover className="w-10 h-10 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-300 mb-1">🍀 선택받은 자</h3>
            <p className="text-xs md:text-sm text-emerald-500/70 mb-4 text-center break-keep">경기에 가장 많이 참가한 유저</p>
            {mostPlayedPlayer && mostPlayedPlayer.matchCount > 0 ? (
              <>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedPlayer(mostPlayedPlayer.name)}>
                  <img src={getAvatarSrc(mostPlayedPlayer.name)} alt="avatar" className="w-12 h-12 rounded-full bg-gray-900 object-cover border-2 border-emerald-500/50 group-hover:scale-110 transition" />
                  <span className="text-2xl font-black text-white group-hover:text-emerald-400 transition">{mostPlayedPlayer.name}</span>
                </div>
                <p className="text-emerald-400 font-bold mt-4 bg-emerald-900/30 px-4 py-1.5 rounded-full text-base">총 {mostPlayedPlayer.matchCount}회 참가</p>
              </>
            ) : (<span className="text-gray-500 mt-2 text-base">기록 없음</span>)}
          </div>

          <div className="bg-gradient-to-br from-cyan-900/40 to-gray-800 border border-cyan-700/50 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10"><Gem className="w-40 h-40 text-cyan-500" /></div>
            <Gem className="w-10 h-10 text-cyan-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-300 mb-1">💎 최고 효율 플레이어</h3>
            <p className="text-xs md:text-sm text-cyan-500/70 mb-4 text-center break-keep">경기당 평균 획득 점수가 가장 높은 유저</p>
            {bestAvgPlayer && bestAvgPlayer.matchCount > 0 ? (
              <>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedPlayer(bestAvgPlayer.name)}>
                  <img src={getAvatarSrc(bestAvgPlayer.name)} alt="avatar" className="w-12 h-12 rounded-full bg-gray-900 object-cover border-2 border-cyan-500/50 group-hover:scale-110 transition" />
                  <span className="text-2xl font-black text-white group-hover:text-cyan-400 transition">{bestAvgPlayer.name}</span>
                </div>
                <p className="text-cyan-400 font-bold mt-4 bg-cyan-900/30 px-4 py-1.5 rounded-full text-base">평균 {bestAvgPlayer.avgScore} pt</p>
              </>
            ) : (<span className="text-gray-500 mt-2 text-base">기록 없음</span>)}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-8">
          <div className="p-5 border-b border-gray-700 bg-gray-800/50">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-green-400" /> 참가자 전체 통계 리스트
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left">
              <thead className="text-sm text-gray-400 bg-gray-900 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-5 rounded-tl-lg">순위</th>
                  <th scope="col" className="px-6 py-5">선수명</th>
                  <th scope="col" className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition" onClick={() => requestSort('matchCount')}>
                    <div className="flex items-center justify-center">참가 횟수 <SortIcon columnKey="matchCount" /></div>
                  </th>
                  <th scope="col" className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition" onClick={() => requestSort('winCount')}>
                    <div className="flex items-center justify-center">1위 횟수 <SortIcon columnKey="winCount" /></div>
                  </th>
                  <th scope="col" className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition" onClick={() => requestSort('avgScore')}>
                    <div className="flex items-center justify-center">평균 획득 점수 <SortIcon columnKey="avgScore" /></div>
                  </th>
                  <th scope="col" className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition rounded-tr-lg" onClick={() => requestSort('points')}>
                    <div className="flex items-center justify-end">총 획득 점수 <SortIcon columnKey="points" /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayerStats.length > 0 ? (
                  sortedPlayerStats.map((player, idx) => (
                    <tr key={player.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition cursor-pointer" onClick={() => setSelectedPlayer(player.name)}>
                      <td className="px-6 py-5 font-bold text-gray-400 text-lg">{idx + 1}</td>
                      <td className="px-6 py-5 font-bold text-white flex items-center gap-4 text-lg">
                        <img src={getAvatarSrc(player.name)} alt={player.name} className="w-8 h-8 rounded-full bg-gray-900 object-cover border border-gray-600" />
                        {player.name}
                      </td>
                      <td className="px-6 py-5 text-center text-gray-300 text-lg">{player.matchCount}회</td>
                      <td className="px-6 py-5 text-center text-gray-300 text-lg">
                        {player.winCount > 0 ? <span className="text-yellow-400 font-bold">{player.winCount}회</span> : "0회"}
                      </td>
                      <td className="px-6 py-5 text-center font-medium text-cyan-400 text-lg">{player.avgScore} pt</td>
                      <td className="px-6 py-5 text-right font-black text-green-400 text-xl">{player.points} pt</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-lg">아직 등록된 참가자 통계가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTierListView = () => {
    const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
    const totalPlayers = sortedPlayers.length;
    let currentRank = 1;
    const rankedPlayers = sortedPlayers.map((player, index) => {
      if (index > 0 && player.points < sortedPlayers[index - 1].points) {
        currentRank = index + 1;
      }
      return { ...player, rank: currentRank };
    });

    const cutoffs = {
      S: Math.ceil(totalPlayers * 0.10), A: Math.ceil(totalPlayers * 0.30),
      B: Math.ceil(totalPlayers * 0.60), C: Math.ceil(totalPlayers * 0.85), D: totalPlayers
    };

    const getTierIdByRank = (rank) => {
      if (totalPlayers === 0) return "D";
      if (rank <= cutoffs.S) return "S"; if (rank <= cutoffs.A) return "A";
      if (rank <= cutoffs.B) return "B"; if (rank <= cutoffs.C) return "C"; return "D";
    };

    const categorizedPlayers = TIER_SETTINGS.map((tier, index) => {
      const playersInTier = rankedPlayers.filter(p => getTierIdByRank(p.rank) === tier.id);
      let startRank = 1;
      if (index > 0) {
         const prevTierId = TIER_SETTINGS[index - 1].id;
         startRank = cutoffs[prevTierId] + 1;
      }
      const endRank = cutoffs[tier.id];
      let rankLabel = "";
      if (totalPlayers > 0) {
         if (startRank > endRank) { rankLabel = "(공석)"; } 
         else if (startRank === endRank) { rankLabel = `(${startRank}위)`; } 
         else { rankLabel = `(${startRank}위 ~ ${endRank}위)`; }
      } else { rankLabel = "(0명)"; }
      return { ...tier, players: playersInTier, rankLabel };
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-400" /> 공식 실력 티어표
            </h2>
            <p className="text-sm text-gray-400 mt-1">상대평가(백분율) 기준에 따라 전체 등수로 티어가 실시간 결정됩니다.</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden flex flex-col gap-1 p-1">
          {categorizedPlayers.map((tier) => (
            <div key={tier.id} className="flex flex-col md:flex-row bg-gray-800 rounded-lg overflow-hidden min-h-[100px]">
              <div className={`${tier.color} md:w-28 w-full flex-shrink-0 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r border-gray-900 shadow-inner`}>
                <span className="text-2xl font-extrabold text-white text-shadow">{tier.id}</span>
                <span className="text-xs font-bold text-white/90 mt-1 text-center">{tier.label}</span>
                <span className="text-[10px] text-white/70 mt-0.5 text-center">{tier.rankLabel}</span>
              </div>
              <div className="flex-1 p-4 flex flex-wrap gap-4 items-center bg-gray-800/80">
                {tier.players.length > 0 ? (
                  tier.players.map((player) => {
                    const streak = getPlayerStreak(player.name);
                    return (
                      <div key={player.id} onClick={() => setSelectedPlayer(player.name)} className="group relative flex flex-col items-center cursor-pointer">
                        {streak.count >= 2 && (
                          <div className={`absolute -top-2 -right-3 px-1.5 py-0.5 rounded-full text-[10px] font-black z-10 border shadow-md animate-bounce ${streak.type === "win" ? "bg-red-900/90 text-red-400 border-red-500/50" : "bg-blue-900/90 text-blue-400 border-blue-500/50"}`}>
                            {streak.type === "win" ? "🔥" : "🧊"}{streak.count}{streak.type === "win" ? "연승" : "연패"}
                          </div>
                        )}
                        <div className="w-16 h-16 rounded-lg bg-gray-700 border-2 border-gray-600 flex items-center justify-center overflow-hidden shadow-lg transition-transform transform group-hover:scale-110 group-hover:border-green-400">
                          <img src={getAvatarSrc(player.name)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`; }} alt={player.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="mt-2 text-sm font-medium text-white bg-gray-900/80 px-2 py-0.5 rounded group-hover:text-green-400 transition-colors">{player.name}</span>
                        <span className="text-xs font-bold text-green-400 mt-0.5">{player.points} pt</span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-gray-500 text-sm italic p-2">해당 티어 플레이어 없음</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWowView = () => {
    const totalWowMembers = wowRoster.length;
    const qualifiedCount = wowRoster.filter(m => m.level >= 40).length;
    const qualifyPercent = totalWowMembers === 0 ? 0 : Math.round((qualifiedCount / totalWowMembers) * 100);
    
    const avgLevel = totalWowMembers === 0 ? 0 : (wowRoster.reduce((sum, m) => sum + m.level, 0) / totalWowMembers).toFixed(1);
    const top5Wow = [...wowRoster].sort((a, b) => b.level - a.level).slice(0, 5);
    
    const classCounts = wowRoster.reduce((acc, m) => {
      acc[m.jobClass] = (acc[m.jobClass] || 0) + 1;
      return acc;
    }, {});
    const allClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);

    const WowSortIcon = ({ columnKey }) => {
      if (wowSortConfig.key !== columnKey) return <ChevronDown className="w-4 h-4 ml-1 opacity-30 group-hover:opacity-100 transition" />;
      return wowSortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 text-blue-400" /> : <ChevronDown className="w-4 h-4 ml-1 text-blue-400" />;
    };

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-8 shadow-xl border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <Shield className="w-64 h-64 text-blue-300" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-3 flex items-center drop-shadow-md">
              <Shield className="w-8 h-8 mr-3 text-blue-400" /> 월드 오브 워크래프트 x 버츄얼 종겜 리그
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl font-medium shadow-sm">
              왁타버스 길드에 가입하여 피나는 노력 끝에 <strong className="text-yellow-400 font-black text-xl px-1">레벨 40</strong>을 달성한 자만이 
              <br/>종겜 리그의 공식 참가권을 얻을 수 있습니다! 과연 누가 가장 먼저 합류할까요?
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500"></div>
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
            <Ticket className="w-6 h-6 mr-2" /> '종겜 리그 참가권'에 대한 정확한 안내
          </h3>
          <div className="space-y-3 text-gray-300 text-lg leading-relaxed">
            <p><strong className="text-white">✅ 확정 참가가 아닙니다:</strong> 40레벨 달성 시 부여되는 뱃지는 버츄얼 종겜 리그의 '확정 참가 권리'를 의미하지 않습니다.</p>
            <p><strong className="text-white">✅ 핀볼 추첨 자격 획득:</strong> 왁굳님의 '와우 로드맵 2.0' 내용에 따라, 추후 종겜 리그에서 <strong className="text-blue-300 font-bold">"와튜버 한 자리 보장"</strong> 룰이 적용되어 참가자를 뽑을 때 <strong className="text-white font-bold">해당 핀볼(룰렛) 추첨 명단에 들어갈 수 있는 자격</strong>을 의미합니다.</p>
            <div className="mt-5 pt-4 border-t border-gray-700">
              <p className="text-base text-gray-400">단어 선택으로 인해 마치 '확정 참가'인 것처럼 오해를 불러일으킨 점, 팬 여러분께 깊은 사과의 말씀을 드립니다. 앞으로 더욱 정확하게 안내하는 관리자가 되겠습니다. </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-yellow-400"/> 참가권 획득 진척도
              </h3>
              <p className="text-sm text-gray-400 mb-4">레벨 40 이상 달성자 비율</p>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-yellow-400">{qualifiedCount}<span className="text-lg text-gray-500 font-bold"> / {totalWowMembers}명</span></span>
                <span className="text-lg font-bold text-white">{qualifyPercent}%</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-4 border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-4 rounded-full transition-all duration-1000" style={{ width: `${qualifyPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                <Swords className="w-5 h-5 mr-2 text-red-400"/> 길드 전투력 요약
              </h3>
              <p className="text-sm text-gray-400 mb-4">평균 레벨 및 최상위 선발대</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold mb-1">길드 평균 레벨</span>
                <span className="text-3xl font-black text-white">Lv. {avgLevel}</span>
              </div>
              <div className="flex -space-x-3 overflow-hidden">
                {top5Wow.map((m, i) => (
                  <div key={i} className="relative z-10 inline-block h-12 w-12 rounded-full ring-2 ring-gray-800" title={`${m.streamerName} (Lv.${m.level})`}>
                    <img src={getWowAvatarSrc(m)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.streamerName}`; }} alt={m.streamerName} className="h-full w-full rounded-full object-cover bg-gray-900" />
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[10px] font-black px-1.5 rounded-full border border-gray-800">{m.level}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-blue-400"/> 직업 분포도
              </h3>
              <p className="text-sm text-gray-400 mb-4">길드 내 전체 직업 비율</p>
            </div>
            <div>
              <div className="flex h-4 rounded-full overflow-hidden mb-3 border border-gray-700 bg-gray-900">
                {allClasses.map((cls, i) => {
                  const pct = totalWowMembers === 0 ? 0 : (cls[1] / totalWowMembers) * 100;
                  const bgColor = WOW_CLASS_COLORS[cls[0]] || fallbackColors[i % fallbackColors.length];
                  return <div key={i} style={{ width: `${pct}%`, backgroundColor: bgColor }} className="h-full" title={`${cls[0]}: ${cls[1]}명`}></div>
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                {allClasses.map((cls, i) => {
                  const bgColor = WOW_CLASS_COLORS[cls[0]] || fallbackColors[i % fallbackColors.length];
                  return (
                    <div key={i} className="flex items-center text-gray-300 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full mr-1.5 border border-gray-600/50" style={{ backgroundColor: bgColor }}></span>
                      {cls[0]} <span className="text-gray-500 ml-1">({cls[1]})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ★ FAQ 아코디언 박스 ★ */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden mt-8 transition-all duration-300">
          <button
            onClick={() => setIsWowFaqOpen(!isWowFaqOpen)}
            className="w-full p-5 flex items-center justify-between bg-gray-800 hover:bg-gray-700/80 transition-colors outline-none"
          >
            <div className="flex items-center text-blue-300 font-bold text-lg">
              <Activity className="w-5 h-5 mr-2" />
              🕒 캐릭터 레벨은 언제 업데이트되나요?
            </div>
            {isWowFaqOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {isWowFaqOpen && (
            <div className="p-6 pt-2 border-t border-gray-700/50 bg-gray-800/50 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base">
                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center">
                    💡 갱신 기준 시간
                  </h4>
                  <p className="pl-6 text-gray-400">
                    캐릭터들의 레벨 최신화 시점은 화면 좌측 최상단 바에 표시되는 <strong className="text-blue-300">최근 갱신 시각</strong>을 기준으로 합니다.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center">
                    🛠️ 업데이트 방식 <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded ml-2 font-medium">100% 수동 작업</span>
                  </h4>
                  <p className="pl-6 text-gray-400 mb-2 break-keep">
                    현재 레벨 갱신은 게임 시스템과의 자동 연동이 어려워, 부득이하게 아래와 같은 방법으로 관리자가 직접 수동으로 업데이트하고 있습니다.
                  </p>
                  <ul className="pl-8 list-decimal text-gray-400 space-y-1.5 marker:font-bold marker:text-blue-400/50">
                    <li>관리자가 직접 '월드 오브 워크래프트' 게임 내에 접속하여 길드창 확인</li>
                    <li>왁굳님 및 참가 스트리머분들의 생방송 화면을 실시간으로 모니터링하여 확인</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center">
                    ⏱️ 업데이트 주기
                  </h4>
                  <p className="pl-6 text-gray-400 break-keep">
                    평소에는 관리자가 여유가 생길 때마다 틈틈이 갱신 작업을 진행하고 있습니다. 다만, 중요한 컨텐츠나 이벤트가 시작되기 직전에는 작업의 우선순위를 가장 높여 <strong className="text-white">최대한 실시간에 가깝게 반영</strong>하려 노력 중입니다.
                  </p>
                </div>

                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/50 mt-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                  <h4 className="font-bold text-yellow-400 mb-2 flex items-center text-lg">
                    🙇‍♂️ 팬 여러분께 드리는 말씀
                  </h4>
                  <p className="text-gray-300 text-base break-keep">
                    모든 분들의 레벨을 완벽한 실시간으로 반영하기에는 물리적인 어려움이 따르는 점, 팬 여러분들의 너른 양해를 부탁드립니다. 조금 느리더라도 확실하게, 늘 더 노력하는 관리자가 되겠습니다! 감사합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-8">
          <div className="p-5 border-b border-gray-700 bg-gray-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 mr-2 text-blue-400" /> 왁타버스 길드 소속 여성 버튜버 명단 (점핑권X)
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopyWowApplicantList}
                    className="bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded text-sm font-bold transition flex items-center shadow-sm whitespace-nowrap"
                  >
                    📋 버종리 신청 명단 복사
                  </button>
                  <button
                    onClick={() => setShowPubgCopyOptions(!showPubgCopyOptions)}
                    className={`border px-3 py-1.5 rounded text-sm font-bold transition flex items-center shadow-sm whitespace-nowrap ${showPubgCopyOptions ? 'bg-orange-600 text-white border-orange-500' : 'bg-orange-600/20 text-orange-400 border-orange-500/50 hover:bg-orange-600 hover:text-white'}`}
                  >
                    🎯 배그 신청 명단 복사 {showPubgCopyOptions ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </button>
                </div>
                {showPubgCopyOptions && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 pl-1 mt-1">
                    <button
                      onClick={() => handleCopyPubgApplicantList('level')}
                      className="bg-gray-800 hover:bg-gray-700 text-orange-300 border border-gray-600 px-3 py-1.5 rounded text-xs font-bold transition flex items-center shadow-sm whitespace-nowrap"
                    >
                      ↳ 스트리머명(레벨) 복사
                    </button>
                    <button
                      onClick={() => handleCopyPubgApplicantList('level_job')}
                      className="bg-gray-800 hover:bg-gray-700 text-orange-300 border border-gray-600 px-3 py-1.5 rounded text-xs font-bold transition flex items-center shadow-sm whitespace-nowrap"
                    >
                      ↳ 스트리머명(레벨/직업) 복사
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative flex items-center w-full md:w-auto bg-gray-900 rounded-lg border border-gray-600 p-1 shadow-inner z-20 mt-2 md:mt-0">
              <div className="flex items-center px-2.5">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={wowSearchInput}
                onChange={(e) => { setWowSearchInput(e.target.value); setShowWowSearchDropdown(true); }}
                onFocus={() => { if(wowSearchInput) setShowWowSearchDropdown(true); }}
                onBlur={() => setTimeout(() => setShowWowSearchDropdown(false), 200)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleWowSearchNext(); }}
                placeholder="스트리머, 직업 찾기..."
                className="w-full md:w-48 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 py-1.5"
              />
              {wowSearchResults.length > 0 && wowSearchInput && (
                <span className="text-[10px] text-gray-500 px-2 font-bold whitespace-nowrap select-none">
                  {currentWowSearchIndex + 1}/{wowSearchResults.length}
                </span>
              )}
              <div className="flex border-l border-gray-700 pl-1 ml-1 select-none">
                 <button onClick={handleWowSearchPrev} className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition">
                   <ChevronUp className="w-4 h-4" />
                 </button>
                 <button onClick={handleWowSearchNext} className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition">
                   <ChevronDown className="w-4 h-4" />
                 </button>
              </div>

              {showWowSearchDropdown && wowSearchResults.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-full md:w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl overflow-hidden custom-scrollbar max-h-60 z-50">
                  {wowSearchResults.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleWowSearchSelect(m)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0 transition"
                    >
                      <img src={getWowAvatarSrc(m)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.streamerName}`; }} className="w-8 h-8 rounded-full object-cover bg-gray-900 border border-gray-600" alt="avatar"/>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight">{m.streamerName}</span>
                        {/* ★ 검색 드롭다운 내 직업 색상 적용 ★ */}
                        <div className="flex items-center mt-0.5">
                          <span className="text-xs font-bold" style={{ color: WOW_CLASS_COLORS[m.jobClass] || "#94a3b8" }}>{m.jobClass}</span>
                          <span className="text-gray-500 mx-1 text-[10px]">|</span> 
                          <span className="text-xs text-blue-400">{m.wowNickname}</span>
                        </div>
                      </div>
                      <span className="ml-auto text-xs font-black text-yellow-500">Lv.{m.level}</span>
                    </div>
                  ))}
                </div>
              )}
              {showWowSearchDropdown && wowSearchInput && wowSearchResults.length === 0 && (
                 <div className="absolute top-full right-0 mt-2 w-full md:w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400 z-50">
                   검색 결과가 없습니다.
                 </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-base text-left">
              <thead className="text-sm text-gray-400 bg-gray-900 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-5 rounded-tl-lg text-center">번호</th>
                  <th scope="col" className="px-6 py-5">프로필</th>
                  <th scope="col" className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition" onClick={() => requestWowSort('streamerName')}>
                    <div className="flex items-center">스트리머명 <WowSortIcon columnKey="streamerName" /></div>
                  </th>
                  <th scope="col" className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition" onClick={() => requestWowSort('wowNickname')}>
                    <div className="flex items-center">와우 닉네임 <WowSortIcon columnKey="wowNickname" /></div>
                  </th>
                  <th scope="col" className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition" onClick={() => requestWowSort('jobClass')}>
                    <div className="flex items-center">직업 <WowSortIcon columnKey="jobClass" /></div>
                  </th>
                  <th scope="col" className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition rounded-tr-lg" onClick={() => requestWowSort('level')}>
                    <div className="flex items-center justify-end">현재 레벨 <WowSortIcon columnKey="level" /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedWowRoster.length > 0 ? (
                  sortedWowRoster.map((member, idx) => {
                    const isQualified = member.level >= 40;     
                    const isPubgQualified = member.level >= 20; 

                    return (
                      <tr 
                        id={`wow-member-${member.id}`}
                        key={member.id} 
                        className={`border-b transition-all duration-500 ${
                          highlightedWowMemberId === member.id 
                            ? 'bg-purple-800/40 border-purple-500 shadow-[inset_0_0_15px_rgba(168,85,247,0.3)]' 
                            : isQualified 
                              ? 'bg-yellow-900/10 hover:bg-yellow-900/20 border-gray-700' 
                              : isPubgQualified
                                ? 'bg-orange-900/10 hover:bg-orange-900/20 border-gray-700'
                                : 'hover:bg-gray-700/50 border-gray-700'
                        }`}
                      >
                        <td className="px-6 py-5 text-center font-bold text-gray-400 text-lg">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-5">
                          <div className="group relative flex flex-col items-center justify-center w-fit mx-auto md:mx-0 cursor-help z-10">
                            <div className="relative w-12 h-12 flex-shrink-0">
                              {member.isWowPartner ? (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 p-[2.5px] shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                  <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt={member.streamerName} className="w-full h-full rounded-full object-cover border-[1.5px] border-gray-900 bg-gray-900" />
                                </div>
                              ) : (
                                <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt={member.streamerName} className={`w-full h-full rounded-full object-cover border-2 ${isQualified ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]' : isPubgQualified ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'border-gray-600'}`} />
                              )}
                              {member.isWowPartner && (
                                <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full p-1 shadow-xl border border-yellow-500/50 z-10">
                                  <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.8)]" />
                                </div>
                              )}
                            </div>

                            {member.isWowPartner && (
                              <span className="mt-1.5 text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 tracking-widest drop-shadow-md select-none whitespace-nowrap">
                                와트너
                              </span>
                            )}

                            {member.isWowPartner && (
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-max max-w-[220px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] transform translate-y-2 group-hover:translate-y-0">
                                <div className="bg-gradient-to-b from-gray-900 to-black border border-yellow-500/40 rounded-xl p-3.5 shadow-[0_10px_30px_rgba(250,204,21,0.3)] flex flex-col items-center text-center relative overflow-hidden">
                                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent opacity-50"></div>
                                  <Crown className="w-5 h-5 text-yellow-400 mb-2 relative z-10 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                                  <p className="text-xs text-gray-300 leading-relaxed relative z-10 font-medium break-keep">
                                    와우 컨텐츠를 진행.<br/>길드장 <strong className="text-yellow-400 font-black text-sm">『왁두』</strong>에게<br/>칭호를 하사받다.
                                  </p>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-yellow-500/40"></div>
                              </div>
                            )}

                          </div>
                        </td>
                        <td className={`px-6 py-5 font-bold text-lg ${isQualified ? 'text-yellow-100' : isPubgQualified ? 'text-orange-100' : 'text-white'}`}>
                          <div className="flex flex-col items-start gap-1">
                            <span>{member.streamerName}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {isQualified && member.isApplied && (
                                <span className="bg-green-900/60 text-green-400 border border-green-500/30 text-[10px] px-1.5 py-0.5 rounded flex items-center whitespace-nowrap">
                                  ✅ 버종리 신청 완료
                                </span>
                              )}
                              {member.isPubgApplied && (
                                <span className="bg-orange-900/60 text-orange-400 border border-orange-500/30 text-[10px] px-1.5 py-0.5 rounded flex items-center whitespace-nowrap">
                                  🎯 배그 신청 완료
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-blue-300 font-medium text-lg">
                          {member.wowNickname}
                        </td>
                        <td className="px-6 py-5">
                          {/* ★ 수정된 로직: 직업별 고유 색상 파스텔 반투명 뱃지 적용 ★ */}
                          <span 
                            style={getJobBadgeStyle(member.jobClass)} 
                            className="px-3 py-1.5 rounded-md text-sm font-bold border whitespace-nowrap inline-block"
                          >
                            {member.jobClass}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end">
                            <span className={`font-black text-2xl mr-3 ${isQualified ? 'text-yellow-400' : isPubgQualified ? 'text-orange-400' : 'text-gray-300'}`}>
                              Lv. {member.level}
                            </span>
                            <div className="flex flex-col gap-1.5 items-end">
                              {isQualified && (
                                <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-[11px] font-bold px-2 py-1 rounded shadow-md flex items-center">
                                  <Ticket className="w-3 h-3 mr-1" /> 버종리 참가권!
                                </span>
                              )}
                              {isPubgQualified && (
                                <span className="bg-gradient-to-r from-gray-800 to-gray-700 text-orange-400 border border-orange-500/50 text-[11px] font-bold px-2 py-1 rounded shadow-md flex items-center">
                                  <Target className="w-3 h-3 mr-1" /> 배그 참가 가능
                                </span>
                              )}
                              {!isPubgQualified && !isQualified && (
                                <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded border border-gray-700">
                                  배그까지 {20 - member.level}렙 남음
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-gray-500 flex-col items-center">
                      <Shield className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                      아직 등록된 왁타버스 길드원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminView = () => {
    if (!isAdminAuth)
      return (
        <div className="max-w-md mx-auto mt-10 bg-gray-800 rounded-xl p-8 text-center shadow-xl border border-gray-700">
          <Lock className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-6">관리자 로그인</h2>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="text"
              value={adminNicknameInput}
              onChange={(e) => setAdminNicknameInput(e.target.value)}
              placeholder="관리자 닉네임을 입력하세요 (예: 스태프A)"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-center border border-gray-600 focus:border-green-500 outline-none"
              required
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-center border border-gray-600 focus:border-green-500 outline-none"
              required
            />
            <button type="submit" disabled={isAdminLoggingIn} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition flex items-center justify-center shadow-lg">
              {isAdminLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "안전하게 접속하기"}
            </button>
          </form>
        </div>
      );

    const handleSubmitMatch = async (e) => {
      e.preventDefault();
      if (!gameName.trim()) return showToast("게임 이름을 입력해주세요.", "error");

      let finalResults = [];
      if (matchMode === "individual") {
        finalResults = individualResults
          .filter((r) => r.playerName.trim() !== "")
          .map(r => ({
             playerName: r.playerName.trim(),
             rank: r.rank,
             scoreChange: r.scoreChange,
             ...(hasFunding ? { fundingRatio: Number(r.fundingRatio) || 0, fundingAmount: Number(r.fundingAmount) || 0 } : {})
          }));
      } else {
        teamResults.forEach((team) => {
          team.players.forEach((pName) => {
            if (pName.trim() !== "") {
              finalResults.push({ 
                 playerName: pName.trim(), 
                 rank: team.rank, 
                 scoreChange: team.scoreChange,
                 ...(hasFunding ? { fundingRatio: Number(team.fundingRatio) || 0, fundingAmount: Number(team.fundingAmount) || 0 } : {})
              });
            }
          });
        });
      }

      if (finalResults.length === 0) return showToast("최소 1명 이상의 유효한 참가자를 입력해주세요.", "error");

      setIsSubmitting(true);
      try {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "matches"), {
          date: matchDate, 
          gameName, 
          createdAt: new Date().toISOString(), 
          matchType: matchMode,
          hasFunding, 
          totalFunding: hasFunding ? Number(totalFunding) || 0 : 0,
          results: finalResults,
        });

        for (const r of finalResults) {
          const pName = r.playerName.trim();
          const p = players.find((p) => p.name === pName);
          if (p) await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", p.id), { points: p.points + r.scoreChange });
          else await addDoc(collection(db, "artifacts", appId, "public", "data", "players"), { name: pName, points: 0 + r.scoreChange, createdAt: new Date().toISOString() });
        }

        setGameName("");
        setHasFunding(false);
        setTotalFunding("");
        setIndividualResults([{ playerName: "", rank: 1, scoreChange: 100, fundingRatio: "", fundingAmount: "" }, { playerName: "", rank: 2, scoreChange: 50, fundingRatio: "", fundingAmount: "" }]);
        setTeamResults([{ id: 1, rank: 1, scoreChange: 100, players: ["", ""], fundingRatio: "", fundingAmount: "" }, { id: 2, rank: 2, scoreChange: -50, players: ["", ""], fundingRatio: "", fundingAmount: "" }]);
        await updateLastModifiedTime(); 
        showToast("결과 저장 성공!");
        navigateTo("tier");
      } catch (error) {
        showToast("오류 발생", "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-1.5 text-green-400" /> 현재 활동 중인 관리자 ({activeAdmins.length}명)
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeAdmins.map(admin => (
                <span key={admin.id} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${admin.name === currentAdminName ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-gray-700 text-gray-300'}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 mr-2 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
                  {admin.name} {admin.name === currentAdminName && <span className="ml-1 opacity-60 text-xs">(나)</span>}
                </span>
              ))}
            </div>
          </div>
          <button onClick={handleAdminLogout} className="text-sm font-bold flex items-center text-red-400 hover:text-white bg-red-900/30 hover:bg-red-600 px-4 py-2 rounded-lg transition shrink-0 border border-red-800/50">
            <Unlock className="w-4 h-4 mr-1.5" /> 로그아웃
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <PlusCircle className="w-6 h-6 mr-2 text-green-400" /> 새 경기 결과 등록
            </h2>
          </div>

          <div className="flex bg-gray-900 p-1 rounded-lg mb-6 border border-gray-700">
            <button type="button" onClick={() => setMatchMode("individual")} className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${matchMode === "individual" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
              <User className="w-4 h-4 mr-2" /> 개인전
            </button>
            <button type="button" onClick={() => setMatchMode("team")} className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${matchMode === "team" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
              <Users className="w-4 h-4 mr-2" /> 팀전
            </button>
          </div>

          <form onSubmit={handleSubmitMatch} className="space-y-6">
            
            <div className="bg-gray-900 border border-yellow-700/50 rounded-lg p-4 flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                 <input 
                   type="checkbox" 
                   checked={hasFunding} 
                   onChange={(e) => setHasFunding(e.target.checked)} 
                   className="w-5 h-5 accent-yellow-500 rounded bg-gray-800 border-gray-600 cursor-pointer" 
                 />
                 <span className="text-yellow-400 font-bold flex items-center text-base select-none">
                   <Coins className="w-5 h-5 mr-2" /> 펀딩/상금 결산 추가하기
                 </span>
              </label>
              {hasFunding && (
                 <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm text-gray-300 font-bold whitespace-nowrap">총 모인 별풍선 개수:</span>
                    <div className="flex items-center w-full sm:w-auto">
                      <input 
                        type="number" 
                        placeholder="예: 100000" 
                        value={totalFunding} 
                        onChange={(e) => setTotalFunding(e.target.value)} 
                        className="w-full sm:w-48 bg-gray-900 border border-gray-600 text-yellow-400 font-black rounded-l-lg px-4 py-2 focus:border-yellow-500 outline-none text-right" 
                      />
                      <span className="bg-gray-700 border border-l-0 border-gray-600 text-gray-300 px-4 py-2 rounded-r-lg font-bold">개</span>
                    </div>
                 </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="게임 이름" className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2" required />
              <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2" required />
            </div>

            {matchMode === "individual" && (
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">
                <p className="text-xs font-bold text-gray-500 mb-2">개인별 순위와 점수를 입력합니다.</p>
                {individualResults.map((r, idx) => (
                  <div key={idx} className="flex flex-col gap-2 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50">
                    <div className="flex gap-2">
                      <input type="number" value={r.rank} onChange={(e) => { const n = [...individualResults]; n[idx].rank = Number(e.target.value); setIndividualResults(n); }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600" />
                      <input type="text" value={r.playerName} onChange={(e) => { const n = [...individualResults]; n[idx].playerName = e.target.value; setIndividualResults(n); }} placeholder="참가자 이름" className="flex-1 bg-gray-800 text-white px-3 rounded border border-gray-600" />
                      <input type="number" value={r.scoreChange} onChange={(e) => { const n = [...individualResults]; n[idx].scoreChange = Number(e.target.value); setIndividualResults(n); }} placeholder="점수" className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600" />
                      <button type="button" onClick={() => { if (individualResults.length > 1) setIndividualResults(individualResults.filter((_, i) => i !== idx)); }} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                    </div>
                    {hasFunding && (
                      <div className="flex gap-2 items-center sm:pl-[72px]">
                        <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">💰 상금:</span>
                        <input type="number" placeholder="비율(%)" value={r.fundingRatio || ""} onChange={(e) => {
                          const val = e.target.value;
                          const n = [...individualResults];
                          n[idx].fundingRatio = val;
                          n[idx].fundingAmount = val && totalFunding ? Math.floor((Number(totalFunding) * Number(val)) / 100) : "";
                          setIndividualResults(n);
                        }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none" />
                        <span className="text-gray-500 text-xs font-bold">% ➔</span>
                        <input type="number" placeholder="별풍선(직접수정 가능)" value={r.fundingAmount || ""} onChange={(e) => {
                          const n = [...individualResults];
                          n[idx].fundingAmount = e.target.value;
                          n[idx].fundingRatio = "";
                          setIndividualResults(n);
                        }} className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none" />
                        <span className="text-gray-500 text-xs font-bold mr-8">개</span>
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setIndividualResults([...individualResults, { playerName: "", rank: individualResults.length + 1, scoreChange: 0, fundingRatio: "", fundingAmount: "" }]) } className="w-full py-2 text-gray-400 border border-dashed border-gray-600 rounded hover:text-white hover:border-gray-400 transition">참가자 추가</button>
              </div>
            )}

            {matchMode === "team" && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-indigo-400 mb-2">팀 단위로 순위와 점수를 한 번만 입력하고, 팀원 이름을 추가하세요.</p>
                {teamResults.map((team, tIdx) => (
                  <div key={team.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 relative overflow-hidden flex flex-col">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                    <div className="flex gap-2 mb-3 pb-3 border-b border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 mb-1">순위</span>
                        <input type="number" value={team.rank} onChange={(e) => { const n = [...teamResults]; n[tIdx].rank = Number(e.target.value); setTeamResults(n); }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-gray-500 mb-1">팀 전체 획득/감소 점수</span>
                        <input type="number" value={team.scoreChange} onChange={(e) => { const n = [...teamResults]; n[tIdx].scoreChange = Number(e.target.value); setTeamResults(n); }} placeholder="점수" className="w-full bg-gray-800 text-white px-3 rounded border border-gray-600 py-1" />
                      </div>
                      <div className="flex flex-col justify-end">
                        <button type="button" onClick={() => { if (teamResults.length > 2) setTeamResults(teamResults.filter((_, i) => i !== tIdx)); }} className="p-2 text-gray-500 hover:text-red-400 transition"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                    {hasFunding && (
                      <div className="flex gap-2 items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 mb-2">
                        <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">💰 팀상금:</span>
                        <input type="number" placeholder="비율(%)" value={team.fundingRatio || ""} onChange={(e) => {
                          const val = e.target.value;
                          const n = [...teamResults];
                          n[tIdx].fundingRatio = val;
                          n[tIdx].fundingAmount = val && totalFunding ? Math.floor((Number(totalFunding) * Number(val)) / 100) : "";
                          setTeamResults(n);
                        }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none" />
                        <span className="text-gray-500 text-xs font-bold">% ➔</span>
                        <input type="number" placeholder="팀에 분배될 별풍선(수동수정 가능)" value={team.fundingAmount || ""} onChange={(e) => {
                          const n = [...teamResults];
                          n[tIdx].fundingAmount = e.target.value;
                          n[tIdx].fundingRatio = "";
                          setTeamResults(n);
                        }} className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none" />
                        <span className="text-gray-500 text-xs font-bold">개</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {team.players.map((pName, pIdx) => (
                        <div key={pIdx} className="flex gap-1">
                          <input type="text" value={pName} onChange={(e) => { const n = [...teamResults]; n[tIdx].players[pIdx] = e.target.value; setTeamResults(n); }} placeholder="팀원 이름" className="flex-1 bg-gray-800 text-sm text-white px-2 py-1 rounded border border-gray-600" />
                          <button type="button" onClick={() => { if (team.players.length > 1) { const n = [...teamResults]; n[tIdx].players.splice(pIdx, 1); setTeamResults(n); } }} className="text-gray-500 hover:text-red-400 px-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => { const n = [...teamResults]; n[tIdx].players.push(""); setTeamResults(n); }} className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition w-full mt-2 border border-indigo-800/50">+ 팀원 추가</button>
                  </div>
                ))}
                <button type="button" onClick={() => setTeamResults([...teamResults, { id: Date.now(), rank: teamResults.length + 1, scoreChange: 0, players: ["", ""], fundingRatio: "", fundingAmount: "" }])} className="w-full py-2.5 text-indigo-300 border-2 border-dashed border-indigo-700/50 rounded-lg hover:bg-indigo-900/30 transition font-medium text-sm">새로운 팀 라인 추가</button>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex justify-center items-center transition shadow-lg">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "결과 DB에 저장 및 갱신"}
            </button>
          </form>
        </div>

        <div className="bg-gradient-to-b from-blue-900/20 to-gray-800 rounded-xl p-6 border border-blue-800/40 shadow-lg">
          <h2 className="text-xl font-bold text-blue-300 mb-2 flex items-center">
            <Shield className="w-5 h-5 mr-2" /> WOW 왁타버스 길드 관리
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            와우 서버에서 플레이 중인 버튜버 캐릭터를 등록하고, 방송을 보며 실시간으로 레벨을 갱신해주세요.
          </p>

          <form onSubmit={handleAddWowMember} className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input type="text" value={wowStreamerName} onChange={e=>setWowStreamerName(e.target.value)} placeholder="스트리머명 (예: 단답벌레)" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500" required />
              <input type="text" value={wowNickname} onChange={e=>setWowNickname(e.target.value)} placeholder="와우 닉네임" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500" required />
              <input type="text" value={wowJobClass} onChange={e=>setWowJobClass(e.target.value)} placeholder="직업 (예: 전사)" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500" required />
              <div className="flex gap-2">
                <input type="number" value={wowLevel} onChange={e=>setWowLevel(e.target.value)} placeholder="레벨" min="1" max="70" className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500" required />
                <button type="submit" disabled={isWowSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded font-bold transition whitespace-nowrap">
                  {isWowSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "등록"}
                </button>
              </div>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={wowAdminSearchTerm}
                onChange={(e) => setWowAdminSearchTerm(e.target.value)}
                placeholder="스트리머명, 닉네임, 직업으로 검색..."
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="relative w-full sm:w-48">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={wowAdminSortOption}
                onChange={(e) => setWowAdminSortOption(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm appearance-none focus:border-blue-500 outline-none transition"
              >
                <option value="levelDesc">레벨 높은 순 ▼</option>
                <option value="levelAsc">레벨 낮은 순 ▲</option>
                <option value="nameAsc">이름 가나다순 정렬</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {wowRoster
              .filter(member => 
                member.streamerName.toLowerCase().includes(wowAdminSearchTerm.toLowerCase()) ||
                member.wowNickname.toLowerCase().includes(wowAdminSearchTerm.toLowerCase()) ||
                member.jobClass.toLowerCase().includes(wowAdminSearchTerm.toLowerCase())
              )
              .sort((a,b) => {
                if (wowAdminSortOption === 'levelDesc') return b.level - a.level;
                if (wowAdminSortOption === 'levelAsc') return a.level - b.level;
                if (wowAdminSortOption === 'nameAsc') return a.streamerName.localeCompare(b.streamerName);
                return 0;
              })
              .map(member => (
              <div key={member.id} className="flex justify-between items-center bg-gray-800 border border-gray-700 p-3 rounded-lg hover:border-blue-500/50 transition">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center gap-0.5 w-fit">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {member.isWowPartner ? (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 p-[2px] shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                          <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt="avatar" className="w-full h-full rounded-full object-cover border-[1.5px] border-gray-900 bg-gray-900" />
                        </div>
                      ) : (
                        <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt="avatar" className="w-full h-full rounded-full bg-gray-900 object-cover border border-gray-600" />
                      )}
                      {member.isWowPartner && (
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full p-0.5 shadow-lg border border-yellow-500/50 z-10">
                          <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        </div>
                      )}
                    </div>
                    {member.isWowPartner && (
                      <span className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 tracking-widest select-none whitespace-nowrap">
                        와트너
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{member.streamerName}</span>
                      {/* ★ 관리자 리스트 직업 뱃지에도 색상 적용 ★ */}
                      <span style={getJobBadgeStyle(member.jobClass)} className="text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap">
                        {member.jobClass}
                      </span>
                    </div>
                    <div className="text-xs text-blue-400">{member.wowNickname}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* ★ 수정된 로직: 와트너 임명 버튼 추가 ★ */}
                  <div className="flex flex-col gap-2 mr-2">
                    <button
                      onClick={() => handleToggleWowPartner(member.id, member.isWowPartner)}
                      className={`px-3 py-1 rounded text-xs font-bold transition flex items-center border ${
                        member.isWowPartner 
                          ? 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50 hover:bg-yellow-800' 
                          : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {member.isWowPartner ? '👑 와트너 해제' : '🎬 와트너 임명'}
                    </button>
                    {member.level >= 40 && (
                      <button
                        onClick={() => handleToggleWowApply(member.id, member.isApplied)}
                        className={`px-3 py-1 rounded text-xs font-bold transition flex items-center border ${
                          member.isApplied 
                            ? 'bg-green-900/50 text-green-400 border-green-500/50 hover:bg-green-800' 
                            : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600 hover:text-white'
                        }`}
                      >
                        {member.isApplied ? '✅ 버종리 참가 신청 ON' : '📝 버종리 참가 신청 OFF'}
                      </button>
                    )}
                    <button
                      onClick={() => handleTogglePubgApply(member.id, member.isPubgApplied)}
                      className={`px-3 py-1 rounded text-xs font-bold transition flex items-center border ${
                        member.isPubgApplied 
                          ? 'bg-orange-900/50 text-orange-400 border-orange-500/50 hover:bg-orange-800' 
                          : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {member.isPubgApplied ? '🎯 배그 참가 신청 ON' : '🪂 배그 참가 신청 OFF'}
                    </button>
                  </div>

                  <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
                    <button onClick={() => handleUpdateWowLevel(member.id, member.level - 1)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"><Minus className="w-4 h-4"/></button>
                    <span className="w-12 text-center font-black text-yellow-400">Lv {member.level}</span>
                    <button onClick={() => handleUpdateWowLevel(member.id, member.level + 1)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"><Plus className="w-4 h-4"/></button>
                  </div>
                  <button onClick={() => handleDeleteWowMember(member.id)} className="text-gray-500 hover:text-red-400 transition p-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {wowRoster.length === 0 && <p className="text-center text-gray-500 py-6">검색된 길드원이 없습니다.</p>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-blue-400" /> WOW 길드원 프로필 이미지 관리
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            인터넷에 올라와 있는 이미지 주소(URL)를 복사하여 와우 캐릭터 혹은 버튜버 사진을 변경할 수 있습니다. <br/>(빈칸으로 저장하면 다시 기본 아바타로 돌아갑니다.)
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {[...wowRoster].sort((a,b) => a.streamerName.localeCompare(b.streamerName)).map(member => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={getWowAvatarSrc(member)} 
                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 flex-shrink-0" 
                  />
                  <span className="font-bold text-white w-20 truncate">{member.streamerName}</span>
                </div>
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={wowImageInputs[member.id] !== undefined ? wowImageInputs[member.id] : (member.imageUrl || "")}
                    onChange={(e) => setWowImageInputs({...wowImageInputs, [member.id]: e.target.value})}
                    className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={() => handleUpdateWowImage(member.id, wowImageInputs[member.id])}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                  >
                    저장
                  </button>
                </div>
              </div>
            ))}
            {wowRoster.length === 0 && <p className="text-center text-gray-500 py-4">등록된 길드원이 없습니다.</p>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-green-400" /> 종겜 리그 참가자 이미지 관리
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            인터넷에 올라와 있는 이미지 주소(URL)를 복사하여 종겜 리그 참가자의 사진을 변경할 수 있습니다. <br/>(빈칸으로 저장하면 다시 기본 아바타로 돌아갑니다.)
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {[...players].sort((a,b) => a.name.localeCompare(b.name)).map(player => (
              <div key={player.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={getAvatarSrc(player.name)} 
                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`; }} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 flex-shrink-0" 
                  />
                  <span className="font-bold text-white w-20 truncate">{player.name}</span>
                </div>
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={imageInputs[player.id] !== undefined ? imageInputs[player.id] : (player.imageUrl || "")}
                    onChange={(e) => setImageInputs({...imageInputs, [player.id]: e.target.value})}
                    className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-green-500 outline-none"
                  />
                  <button
                    onClick={() => handleUpdateImage(player.id, imageInputs[player.id])}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                  >
                    저장
                  </button>
                </div>
              </div>
            ))}
            {players.length === 0 && <p className="text-center text-gray-500 py-4">등록된 참가자가 없습니다.</p>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center">
            <Tv className="w-5 h-5 mr-2 text-indigo-400" /> 종겜 리그 참가자 방송국 주소 관리
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            스트리머의 실제 방송국 주소(유튜브, 치지직, SOOP 등)를 입력해주세요. <br/>(빈칸으로 두시면 선수의 이름으로 자동 검색하여 SOOP으로 연결됩니다.)
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {[...players].sort((a,b) => a.name.localeCompare(b.name)).map(player => (
              <div key={player.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-3 w-28 flex-shrink-0">
                  <span className="font-bold text-white truncate">{player.name}</span>
                </div>
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={broadcastUrlInputs[player.id] !== undefined ? broadcastUrlInputs[player.id] : (player.broadcastUrl || "")}
                    onChange={(e) => setBroadcastUrlInputs({...broadcastUrlInputs, [player.id]: e.target.value})}
                    className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                  />
                  <button
                    onClick={() => handleUpdateBroadcastUrl(player.id, broadcastUrlInputs[player.id])}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                  >
                    저장
                  </button>
                </div>
              </div>
            ))}
            {players.length === 0 && <p className="text-center text-gray-500 py-4">등록된 참가자가 없습니다.</p>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Swords className="w-5 h-5 mr-2 text-red-400" /> 등록된 경기 관리 (수정 및 삭제)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            경기를 수정하거나 삭제하면 해당 경기로 증감된 참가자들의 점수가 자동으로 재계산/복구됩니다.
          </p>

          <div className="space-y-3">
            {matches.length === 0 ? (
              <p className="text-gray-500 text-center py-4">등록된 경기가 없습니다.</p>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="flex justify-between items-center bg-gray-900 border border-gray-700 p-3 rounded-lg">
                  <div>
                    <span className="font-bold text-white mr-3">{match.gameName}</span>
                    <span className="text-xs text-gray-400">{match.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEditMatch(match)} className="flex items-center text-sm bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded transition">
                      <Edit className="w-4 h-4 mr-1" /> 수정
                    </button>
                    <button onClick={() => setMatchToDelete(match)} className="flex items-center text-sm bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition">
                      <Trash2 className="w-4 h-4 mr-1" /> 삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-300 mb-2">🚨 데이터베이스 완벽 초기화</h3>
          <p className="text-sm text-gray-400 mb-4">
            기존에 쌓인 테스트용 데이터를 싹 지우고, 참가자가 <strong className="text-white">0명인 완전 초기 상태</strong>로 리셋합니다. (실전 오픈용)
          </p>
          <button onClick={() => setShowResetModal(true)} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition">
            <RefreshCw className="w-4 h-4 mr-2" /> 모든 데이터 지우고 백지상태로 시작하기
          </button>
        </div>
      </div>
    );
  };

  if (isLoading && !activeTab)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> 데이터 로딩 중...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans pb-20">
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[300] px-6 py-3 rounded-lg shadow-2xl text-white ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
          {toast.message}
        </div>
      )}

      {matchToEdit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 py-10 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full border border-blue-500/50 shadow-2xl relative my-auto">
            <button onClick={() => setMatchToEdit(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition"><X className="w-6 h-6" /></button>
            <div className="flex items-center mb-6">
              <Edit className="w-6 h-6 mr-2 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">경기 기록 수정</h3>
            </div>
            
            <form onSubmit={handleSaveEditedMatch} className="space-y-6">
              <div className="flex bg-gray-900 p-1 rounded-lg mb-6 border border-gray-700">
                <button type="button" onClick={() => setEditMatchMode("individual")} className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${editMatchMode === "individual" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
                  <User className="w-4 h-4 mr-2" /> 개인전
                </button>
                <button type="button" onClick={() => setEditMatchMode("team")} className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${editMatchMode === "team" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
                  <Users className="w-4 h-4 mr-2" /> 팀전
                </button>
              </div>

              <div className="bg-gray-900 border border-yellow-700/50 rounded-lg p-4 flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer w-fit">
                   <input 
                     type="checkbox" 
                     checked={editHasFunding} 
                     onChange={(e) => setEditHasFunding(e.target.checked)} 
                     className="w-5 h-5 accent-yellow-500 rounded bg-gray-800 border-gray-600 cursor-pointer" 
                   />
                   <span className="text-yellow-400 font-bold flex items-center text-base select-none">
                     <Coins className="w-5 h-5 mr-2" /> 펀딩/상금 결산 추가하기
                   </span>
                </label>
                {editHasFunding && (
                   <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <span className="text-sm text-gray-300 font-bold whitespace-nowrap">총 모인 별풍선 개수:</span>
                      <div className="flex items-center w-full sm:w-auto">
                        <input 
                          type="number" 
                          placeholder="예: 100000" 
                          value={editTotalFunding} 
                          onChange={(e) => setEditTotalFunding(e.target.value)} 
                          className="w-full sm:w-48 bg-gray-900 border border-gray-600 text-yellow-400 font-black rounded-l-lg px-4 py-2 focus:border-yellow-500 outline-none text-right" 
                        />
                        <span className="bg-gray-700 border border-l-0 border-gray-600 text-gray-300 px-4 py-2 rounded-r-lg font-bold">개</span>
                      </div>
                   </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={editGameName} onChange={(e) => setEditGameName(e.target.value)} placeholder="게임 이름" className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2" required />
                <input type="date" value={editMatchDate} onChange={(e) => setEditMatchDate(e.target.value)} className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2" required />
              </div>

              {editMatchMode === "individual" && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 mt-4">
                  <p className="text-xs font-bold text-gray-500 mb-2">개인별 순위와 점수를 수정합니다.</p>
                  {editIndividualResults.map((r, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50">
                      <div className="flex gap-2">
                        <input type="number" value={r.rank} onChange={(e) => { const n = [...editIndividualResults]; n[idx].rank = Number(e.target.value); setEditIndividualResults(n); }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600" />
                        <input type="text" value={r.playerName} onChange={(e) => { const n = [...editIndividualResults]; n[idx].playerName = e.target.value; setEditIndividualResults(n); }} placeholder="참가자 이름" className="flex-1 bg-gray-800 text-white px-3 rounded border border-gray-600" />
                        <input type="number" value={r.scoreChange} onChange={(e) => { const n = [...editIndividualResults]; n[idx].scoreChange = Number(e.target.value); setEditIndividualResults(n); }} placeholder="점수" className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600" />
                        <button type="button" onClick={() => { if (editIndividualResults.length > 1) setEditIndividualResults(editIndividualResults.filter((_, i) => i !== idx)); }} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      {editHasFunding && (
                        <div className="flex gap-2 items-center sm:pl-[72px]">
                          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">💰 상금:</span>
                          <input type="number" placeholder="비율(%)" value={r.fundingRatio || ""} onChange={(e) => {
                            const val = e.target.value;
                            const n = [...editIndividualResults];
                            n[idx].fundingRatio = val;
                            n[idx].fundingAmount = val && editTotalFunding ? Math.floor((Number(editTotalFunding) * Number(val)) / 100) : "";
                            setEditIndividualResults(n);
                          }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none" />
                          <span className="text-gray-500 text-xs font-bold">% ➔</span>
                          <input type="number" placeholder="별풍선(직접수정 가능)" value={r.fundingAmount || ""} onChange={(e) => {
                            const n = [...editIndividualResults];
                            n[idx].fundingAmount = e.target.value;
                            n[idx].fundingRatio = "";
                            setEditIndividualResults(n);
                          }} className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none" />
                          <span className="text-gray-500 text-xs font-bold mr-8">개</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditIndividualResults([...editIndividualResults, { playerName: "", rank: editIndividualResults.length + 1, scoreChange: 0, fundingRatio: "", fundingAmount: "" }]) } className="w-full py-2 text-gray-400 border border-dashed border-gray-600 rounded hover:text-white hover:border-gray-400 transition">참가자 추가</button>
                </div>
              )}

              {editMatchMode === "team" && (
                <div className="space-y-4 mt-4">
                  <p className="text-xs font-bold text-indigo-400 mb-2">팀 기록을 수정합니다.</p>
                  {editTeamResults.map((team, tIdx) => (
                    <div key={team.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 relative overflow-hidden flex flex-col">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                      <div className="flex gap-2 mb-3 pb-3 border-b border-gray-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 mb-1">순위</span>
                          <input type="number" value={team.rank} onChange={(e) => { const n = [...editTeamResults]; n[tIdx].rank = Number(e.target.value); setEditTeamResults(n); }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-[10px] text-gray-500 mb-1">팀 전체 획득/감소 점수</span>
                          <input type="number" value={team.scoreChange} onChange={(e) => { const n = [...editTeamResults]; n[tIdx].scoreChange = Number(e.target.value); setEditTeamResults(n); }} placeholder="점수" className="w-full bg-gray-800 text-white px-3 rounded border border-gray-600 py-1" />
                        </div>
                        <div className="flex flex-col justify-end">
                          <button type="button" onClick={() => { if (editTeamResults.length > 1) setEditTeamResults(editTeamResults.filter((_, i) => i !== tIdx)); }} className="p-2 text-gray-500 hover:text-red-400 transition"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      {editHasFunding && (
                        <div className="flex gap-2 items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 mb-2">
                          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">💰 팀상금:</span>
                          <input type="number" placeholder="비율(%)" value={team.fundingRatio || ""} onChange={(e) => {
                            const val = e.target.value;
                            const n = [...editTeamResults];
                            n[tIdx].fundingRatio = val;
                            n[tIdx].fundingAmount = val && editTotalFunding ? Math.floor((Number(editTotalFunding) * Number(val)) / 100) : "";
                            setEditTeamResults(n);
                          }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none" />
                          <span className="text-gray-500 text-xs font-bold">% ➔</span>
                          <input type="number" placeholder="팀에 분배될 별풍선(수동수정 가능)" value={team.fundingAmount || ""} onChange={(e) => {
                            const n = [...editTeamResults];
                            n[tIdx].fundingAmount = e.target.value;
                            n[tIdx].fundingRatio = "";
                            setEditTeamResults(n);
                          }} className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none" />
                          <span className="text-gray-500 text-xs font-bold">개</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {team.players.map((pName, pIdx) => (
                          <div key={pIdx} className="flex gap-1">
                            <input type="text" value={pName} onChange={(e) => { const n = [...editTeamResults]; n[tIdx].players[pIdx] = e.target.value; setEditTeamResults(n); }} placeholder="팀원 이름" className="flex-1 bg-gray-800 text-sm text-white px-2 py-1 rounded border border-gray-600" />
                            <button type="button" onClick={() => { if (team.players.length > 1) { const n = [...editTeamResults]; n[tIdx].players.splice(pIdx, 1); setEditTeamResults(n); } }} className="text-gray-500 hover:text-red-400 px-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => { const n = [...editTeamResults]; n[tIdx].players.push(""); setEditTeamResults(n); }} className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition w-full mt-2 border border-indigo-800/50">+ 팀원 추가</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditTeamResults([...editTeamResults, { id: Date.now() + Math.random(), rank: editTeamResults.length + 1, scoreChange: 0, players: ["", ""], fundingRatio: "", fundingAmount: "" }])} className="w-full py-2.5 text-indigo-300 border-2 border-dashed border-indigo-700/50 rounded-lg hover:bg-indigo-900/30 transition font-medium text-sm">새로운 팀 라인 추가</button>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setMatchToEdit(null)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium">
                  취소
                </button>
                <button type="submit" disabled={isEditingSubmit} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex justify-center items-center transition shadow-lg">
                  {isEditingSubmit ? <Loader2 className="w-5 h-5 animate-spin" /> : "수정 내용 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {matchToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-white">정말 삭제하시겠습니까?</h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              <span className="font-bold text-yellow-400">[{matchToDelete.gameName}]</span> 경기를 삭제합니다.<br />
              이 경기로 얻거나 잃은 참가자들의 점수가 <br />모두 이전으로 되돌아갑니다. (복구 불가)
            </p>
            <div className="flex gap-3">
              <button onClick={() => setMatchToDelete(null)} disabled={isDeleting} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium">취소</button>
              <button onClick={confirmDeleteMatch} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition flex justify-center items-center">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "삭제 및 복구"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-white">정말 초기화하시겠습니까?</h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              지금까지의 <span className="font-bold text-red-400">모든 경기 기록과 참가자가 삭제</span>됩니다.<br /><br />
              삭제 후 참가자가 아무도 없는 완전한<br />'백지 상태'로 즉시 전환됩니다. (복구 불가)
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)} disabled={isResetting} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium">취소</button>
              <button onClick={handleResetDatabase} disabled={isResetting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition flex justify-center items-center">
                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : "초기화 및 실전 시작"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPlayer && (() => {
        const stats = getPlayerStats(selectedPlayer);
        const playerInfo = players.find(p => p.name === selectedPlayer);
        if (!playerInfo) return null;

        const todayStr = new Date().toISOString().split('T')[0];
        const storageData = JSON.parse(localStorage.getItem('wak_vleague_hearts_v1') || '{"date": "", "votes": []}');
        const hasVotedToday = storageData.date === todayStr && storageData.votes.includes(selectedPlayer);
        
        const broadcastLink = playerInfo.broadcastUrl?.trim() 
          ? playerInfo.broadcastUrl 
          : `https://www.sooplive.co.kr/search/station?keyword=${encodeURIComponent(selectedPlayer)}`;

        return (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
            <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-gray-900 p-6 flex flex-col items-center relative border-b border-gray-700">
                <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition"><X className="w-6 h-6" /></button>
                <div className="w-24 h-24 rounded-2xl bg-gray-700 border-4 border-green-500/50 overflow-hidden shadow-lg mb-4">
                  <img src={getAvatarSrc(selectedPlayer)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedPlayer}`; }} alt={selectedPlayer} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-black text-white">{selectedPlayer}</h3>
                <span className="text-green-400 font-bold mt-1 text-lg">{playerInfo.points} pt</span>

                <div className="flex flex-col items-center mt-5 w-full gap-2">
                  <button
                    onClick={() => handleCheerPlayer(playerInfo.id, selectedPlayer)}
                    disabled={cheeringPlayerId === playerInfo.id}
                    className={`flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-base transition-all duration-300 transform hover:scale-105 active:scale-95 w-full ${
                      cheeringPlayerId === playerInfo.id
                        ? "bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed hover:scale-100 active:scale-100" // ★ 처리 중일 때의 디자인
                        : hasVotedToday
                          ? "bg-pink-500/10 border border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.1)] hover:bg-pink-500/20"
                          : "bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                    }`}
                  >
                    {cheeringPlayerId === playerInfo.id ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin text-gray-400" /> 처리 중...</>
                    ) : (
                      <>
                        <Heart className={`w-5 h-5 mr-2 ${hasVotedToday ? "fill-pink-400 text-pink-400" : "fill-transparent text-white"}`} />
                        {hasVotedToday ? "응원 완료!" : "응원하기"} {(playerInfo.hearts || 0).toLocaleString()}
                      </>
                    )}
                  </button>
                  
                  <a
                    href={broadcastLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all duration-300 transform hover:scale-105 w-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  >
                    <Tv className="w-5 h-5 mr-2" /> 방송국 가기
                  </a>

                  <p className="text-xs text-gray-500 mt-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 text-center break-keep w-full">
                    💡 스트리머 1명당 <strong className="text-gray-300">하루에 1번만</strong> 응원할 수 있습니다.<br/>(다시 누르면 취소됩니다)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-700 bg-gray-800/50 border-b border-gray-700">
                <div className="flex flex-col items-center py-4">
                  <span className="text-xs text-gray-400 font-medium mb-1">총 참가</span>
                  <span className="text-xl font-bold text-white">{stats.totalMatches}전</span>
                </div>
                <div className="flex flex-col items-center py-4">
                  <span className="text-xs text-gray-400 font-medium mb-1">우승 확률(1위)</span>
                  <span className="text-xl font-bold text-yellow-400">{stats.winRate}%</span>
                </div>
                <div className="flex flex-col items-center py-4 px-2 text-center">
                  <span className="text-xs text-gray-400 font-medium mb-1">주력 종목</span>
                  <span className="text-sm font-bold text-indigo-300 leading-tight break-keep">{stats.mostPlayedGame}</span>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center"><Activity className="w-4 h-4 mr-1.5" /> 최근 전적 (최대 5경기)</h4>
                {stats.recentMatches.length === 0 ? (
                  <p className="text-center text-gray-500 py-6 text-sm">경기 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentMatches.map((m) => (
                      <div key={m.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                        <div className="flex-1 truncate pr-2">
                          <p className="text-sm font-bold text-white truncate">{m.gameName}</p>
                          <p className="text-[10px] text-gray-500">{m.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${m.rank === 1 ? 'text-yellow-400' : 'text-gray-400'}`}>{m.rank}위</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded w-14 text-center ${m.scoreChange >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {m.scoreChange > 0 ? "+" : ""}{m.scoreChange}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <nav className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <h1 className="text-lg md:text-xl font-bold text-white cursor-pointer flex items-center whitespace-nowrap" onClick={() => navigateTo("home")}>
              <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 mr-1.5 md:mr-2 text-green-400" /> 버츄얼 종겜 리그
            </h1>
            <a href="https://www.sooplive.co.kr/station/ecvhao" target="_blank" rel="noopener noreferrer" title="우왁굳 방송국" className="flex items-center justify-center px-2 py-0.5 bg-black text-green-400 border border-green-500/50 rounded text-xs font-black tracking-widest hover:bg-green-400 hover:text-black transition-all duration-300 shadow-[0_0_10px_rgba(74,222,128,0.3)] hover:shadow-[0_0_15px_rgba(74,222,128,0.6)]">
              WAK
            </a>
            {lastUpdated && (
              <span className="ml-2 md:ml-3 text-[10px] md:text-xs font-medium text-white/90 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm flex items-center whitespace-nowrap">
                <RefreshCw className="w-3 h-3 mr-1 opacity-70" /> 최근 갱신: {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <span className="ml-1 md:ml-2 text-[10px] md:text-xs font-medium text-white/90 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm flex items-center whitespace-nowrap">
              <Users className="w-3 h-3 mr-1 opacity-70" /> 오늘 방문자: {todayVisits}
            </span>
          </div>
          <div className="flex space-x-1 md:space-x-2 ml-4 flex-shrink-0">
            <button onClick={() => navigateTo("home")} className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${activeTab === "home" ? "bg-gray-800 text-green-400" : "text-gray-300 hover:text-white"}`}>홈</button>
            <button onClick={() => navigateTo("players")} className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${activeTab === "players" ? "bg-gray-800 text-green-400" : "text-gray-300 hover:text-white"}`}>선수</button>
            <button onClick={() => navigateTo("matches")} className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${activeTab === "matches" ? "bg-gray-800 text-green-400" : "text-gray-300 hover:text-white"}`}>경기</button>
            <button onClick={() => navigateTo("stats")} className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${activeTab === "stats" ? "bg-gray-800 text-green-400" : "text-gray-300 hover:text-white"}`}>통계</button>
            <button onClick={() => navigateTo("tier")} className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${activeTab === "tier" ? "bg-gray-800 text-green-400" : "text-gray-300 hover:text-white"}`}>티어</button>
            <button onClick={() => navigateTo("wow")} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center whitespace-nowrap ${activeTab === "wow" ? "bg-blue-900/50 text-blue-400 border border-blue-500/50" : "text-blue-300 hover:text-white hover:bg-gray-800"}`}>
              <Shield className="w-4 h-4 mr-1" /> WOW
            </button>
            <button onClick={() => navigateTo("admin")} className={`px-3 py-1.5 rounded border border-gray-600 flex items-center text-sm font-medium whitespace-nowrap ${activeTab === "admin" ? "bg-gray-800 text-green-400 border-green-500" : "text-gray-400 hover:text-white hover:border-gray-400"}`}>
              {isAdminAuth ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />} 관리
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 relative">
        {activeTab === "home" && renderHomeView()}
        {activeTab === "players" && renderPlayersView()}
        {activeTab === "matches" && renderMatchesView()}
        {activeTab === "stats" && renderStatsView()}
        {activeTab === "tier" && renderTierListView()}
        {activeTab === "wow" && renderWowView()}
        {activeTab === "admin" && renderAdminView()}
      </main>
    </div>
  );
}