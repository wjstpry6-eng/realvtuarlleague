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

// ★ 보안 업그레이드: 비밀번호 난독화 (해싱) 적용 ★
const ADMIN_HASH = "zITMrF2d";

// ★ 실전용: 참가자 명단 완전 백지화 (0명부터 시작) ★
const SEED_PLAYERS = [];

// ★ 실전용: 테스트 경기 데이터 제거 ★
const SEED_MATCHES = [];

// ★ 실전용 상대평가 티어 설정 (비율 기준) ★
const TIER_SETTINGS = [
  {
    id: "S",
    name: "S 티어",
    color: "bg-red-500",
    percent: 10,
    label: "상위 10%",
  },
  {
    id: "A",
    name: "A 티어",
    color: "bg-orange-500",
    percent: 30,
    label: "상위 11% ~ 30%",
  },
  {
    id: "B",
    name: "B 티어",
    color: "bg-yellow-500",
    percent: 60,
    label: "상위 31% ~ 60%",
  },
  {
    id: "C",
    name: "C 티어",
    color: "bg-green-500",
    percent: 85,
    label: "상위 61% ~ 85%",
  },
  {
    id: "D",
    name: "D 티어",
    color: "bg-blue-500",
    percent: 100,
    label: "하위 15%",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return ["home", "matches", "stats", "tier", "wow", "admin"].includes(hash)
      ? hash
      : "home";
  });
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  // ★ WOW 탭 상태 관리 ★
  const [wowRoster, setWowRoster] = useState([]);
  const [wowSortConfig, setWowSortConfig] = useState({
    key: "level",
    direction: "desc",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [matchToDelete, setMatchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [todayVisits, setTodayVisits] = useState(0);

  const [gameName, setGameName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchMode, setMatchMode] = useState("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageInputs, setImageInputs] = useState({});

  // ★ 관리자 WOW 길드원 추가 폼 상태 ★
  const [wowStreamerName, setWowStreamerName] = useState("");
  const [wowNickname, setWowNickname] = useState("");
  const [wowJobClass, setWowJobClass] = useState("");
  const [wowLevel, setWowLevel] = useState("");
  const [isWowSubmitting, setIsWowSubmitting] = useState(false);

  const [individualResults, setIndividualResults] = useState([
    { playerName: "", rank: 1, scoreChange: 100 },
    { playerName: "", rank: 2, scoreChange: 50 },
  ]);
  const [teamResults, setTeamResults] = useState([
    { id: 1, rank: 1, scoreChange: 100, players: ["", ""] },
    { id: 2, rank: 2, scoreChange: -50, players: ["", ""] },
  ]);

  const [sortConfig, setSortConfig] = useState({
    key: "points",
    direction: "desc",
  });

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

      const avgScore = matchCount > 0 ? p.points / matchCount : 0;

      return {
        ...p,
        matchCount,
        winCount,
        avgScore: Number(avgScore.toFixed(1)),
      };
    });
  }, [players, matches]);

  const sortedPlayerStats = useMemo(() => {
    let sortableItems = [...playerStatsMap];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });
    return sortableItems;
  }, [playerStatsMap, sortConfig]);

  const requestSort = (key) => {
    let direction = "desc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "desc"
    ) {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  // ★ WOW 탭 정렬 로직 ★
  const sortedWowRoster = useMemo(() => {
    let sortableItems = [...wowRoster];
    sortableItems.sort((a, b) => {
      if (a[wowSortConfig.key] < b[wowSortConfig.key]) {
        return wowSortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[wowSortConfig.key] > b[wowSortConfig.key]) {
        return wowSortConfig.direction === "asc" ? 1 : -1;
      }
      return a.streamerName.localeCompare(b.streamerName);
    });
    return sortableItems;
  }, [wowRoster, wowSortConfig]);

  const requestWowSort = (key) => {
    let direction = "desc";
    if (
      wowSortConfig &&
      wowSortConfig.key === key &&
      wowSortConfig.direction === "desc"
    ) {
      direction = "asc";
    }
    setWowSortConfig({ key, direction });
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["home", "matches", "stats", "tier", "wow", "admin"].includes(hash))
        setActiveTab(hash);
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
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            console.warn("Token mismatch fallback:", tokenError);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error(error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const playersRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players"
    );
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const matchesRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "matches"
    );
    const unsubMatches = onSnapshot(
      matchesRef,
      (snapshot) => {
        const matchesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        matchesData.sort((a, b) => {
          const dateA = new Date(a.date).getTime(),
            dateB = new Date(b.date).getTime();
          if (dateA === dateB)
            return (
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
            );
          return dateB - dateA;
        });
        setMatches(matchesData);
        setIsLoading(false);
      },
      (error) => {
        console.error(error);
        setIsLoading(false);
      }
    );

    // ★ WOW 왁타버스 길드원 데이터 리스너 ★
    const wowRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "wow_roster"
    );
    const unsubWow = onSnapshot(wowRef, (snapshot) => {
      setWowRoster(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const metaRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "metadata",
      "app_info"
    );
    const unsubMeta = onSnapshot(metaRef, (docSnap) => {
      if (docSnap.exists()) {
        setLastUpdated(docSnap.data().lastUpdated);
      }
    });

    const today = new Date();
    const todayDocId = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const visitRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "daily_visits",
      todayDocId
    );

    const unsubVisit = onSnapshot(visitRef, (docSnap) => {
      if (docSnap.exists()) {
        setTodayVisits(docSnap.data().count || 0);
      }
    });

    return () => {
      unsubPlayers();
      unsubMatches();
      unsubWow();
      unsubMeta();
      unsubVisit();
    };
  }, [user]);

  useEffect(() => {
    const recordVisit = async () => {
      const today = new Date();
      const todayDocId = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const storageKey = `wak_visited_${todayDocId}`;

      if (!localStorage.getItem(storageKey)) {
        try {
          const visitRef = doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "daily_visits",
            todayDocId
          );
          await setDoc(visitRef, { count: increment(1) }, { merge: true });
          localStorage.setItem(storageKey, "true");
        } catch (error) {
          console.error("Visit record error:", error);
        }
      }
    };
    if (user) recordVisit();
  }, [user]);

  useEffect(() => {
    if (!matchDate) {
      const today = new Date();
      setMatchDate(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(today.getDate()).padStart(2, "0")}`
      );
    }
  }, [matchDate]);

  const getAvatarSrc = (playerName) => {
    const p = players.find((p) => p.name === playerName);
    return p?.imageUrl?.trim()
      ? p.imageUrl
      : `https://api.dicebear.com/7.x/adventurer/svg?seed=${playerName}`;
  };

  const updateLastModifiedTime = async () => {
    try {
      const metaRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "metadata",
        "app_info"
      );
      await setDoc(
        metaRef,
        { lastUpdated: new Date().toISOString() },
        { merge: true }
      );
    } catch (error) {
      console.error("Meta update error:", error);
    }
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
    const playerMatches = matches.filter((m) =>
      m.results?.some((r) => r.playerName === playerName)
    );
    if (playerMatches.length === 0) return { type: "none", count: 0 };
    let streakType = "none";
    let count = 0;
    for (const match of playerMatches) {
      const result = match.results.find((r) => r.playerName === playerName);
      if (!result) continue;
      const isWin = result.scoreChange > 0;
      const isLoss = result.scoreChange < 0;
      if (count === 0) {
        if (isWin) {
          streakType = "win";
          count = 1;
        } else if (isLoss) {
          streakType = "lose";
          count = 1;
        } else break;
      } else {
        if (streakType === "win" && isWin) count++;
        else if (streakType === "lose" && isLoss) count++;
        else break;
      }
    }
    return { type: streakType, count };
  };

  const getPlayerStats = (playerName) => {
    const playerMatches = matches.filter((m) =>
      m.results?.some((r) => r.playerName === playerName)
    );
    const totalMatches = playerMatches.length;
    const wins = playerMatches.filter((m) => {
      const r = m.results.find((res) => res.playerName === playerName);
      return r && r.rank === 1;
    }).length;
    const winRate =
      totalMatches === 0 ? 0 : Math.round((wins / totalMatches) * 100);
    const gameCounts = {};
    playerMatches.forEach((m) => {
      gameCounts[m.gameName] = (gameCounts[m.gameName] || 0) + 1;
    });
    let mostPlayedGame = "전적 없음";
    let maxCount = 0;
    for (const [game, count] of Object.entries(gameCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostPlayedGame = game;
      }
    }
    const recentMatches = playerMatches.slice(0, 5).map((m) => {
      const r = m.results.find((res) => res.playerName === playerName);
      return {
        id: m.id,
        gameName: m.gameName,
        date: m.date,
        rank: r.rank,
        scoreChange: r.scoreChange,
      };
    });
    return { totalMatches, wins, winRate, mostPlayedGame, recentMatches };
  };

  // ★ WOW 관리자 액션 함수 ★
  const handleAddWowMember = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (
      !wowStreamerName.trim() ||
      !wowNickname.trim() ||
      !wowJobClass.trim() ||
      !wowLevel
    ) {
      return showToast("모든 와우 캐릭터 정보를 입력해주세요.", "error");
    }
    setIsWowSubmitting(true);
    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "wow_roster"),
        {
          streamerName: wowStreamerName.trim(),
          wowNickname: wowNickname.trim(),
          jobClass: wowJobClass.trim(),
          level: Number(wowLevel),
          createdAt: new Date().toISOString(),
        }
      );
      setWowStreamerName("");
      setWowNickname("");
      setWowJobClass("");
      setWowLevel("");
      showToast("와우 길드원이 성공적으로 등록되었습니다!");
    } catch (error) {
      console.error(error);
      showToast("길드원 등록 중 오류 발생", "error");
    } finally {
      setIsWowSubmitting(false);
    }
  };

  const handleUpdateWowLevel = async (id, newLevel) => {
    if (!user) return;
    if (newLevel < 1) newLevel = 1;
    if (newLevel > 60) newLevel = 60; // 와우 만렙 임의 지정, 필요시 해제 가능
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", id),
        {
          level: newLevel,
        }
      );
    } catch (error) {
      console.error(error);
      showToast("레벨 갱신 실패", "error");
    }
  };

  const handleDeleteWowMember = async (id) => {
    if (!user || !window.confirm("정말 이 길드원을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", id)
      );
      showToast("길드원이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      showToast("삭제 실패", "error");
    }
  };

  const handleResetDatabase = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      for (const m of matches) {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "matches", m.id)
        );
      }
      for (const p of players) {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "players", p.id)
        );
      }
      await updateLastModifiedTime();
      showToast("데이터가 초기화되고 백지상태로 시작됩니다!", "success");
      setShowResetModal(false);
    } catch (error) {
      console.error("Reset Error:", error);
      showToast("초기화 중 오류가 발생했습니다.", "error");
    } finally {
      setIsResetting(false);
      navigateTo("tier");
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const hashedInput = btoa(encodeURIComponent(passwordInput))
      .split("")
      .reverse()
      .join("");
    if (hashedInput === ADMIN_HASH) {
      setIsAdminAuth(true);
      showToast("관리자 인증 성공!");
      setPasswordInput("");
    } else {
      showToast("비밀번호 오류", "error");
    }
  };

  const handleUpdateImage = async (playerId, url) => {
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "players", playerId),
        { imageUrl: url || "" }
      );
      await updateLastModifiedTime();
      showToast("프로필 이미지가 저장되었습니다.");
    } catch (error) {
      showToast("이미지 저장 중 오류 발생", "error");
    }
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete || !user) return;
    setIsDeleting(true);
    try {
      for (const result of matchToDelete.results) {
        const player = players.find((p) => p.name === result.playerName);
        if (player) {
          const playerRef = doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "players",
            player.id
          );
          await updateDoc(playerRef, {
            points: player.points - result.scoreChange,
          });
        }
      }
      await deleteDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "matches",
          matchToDelete.id
        )
      );
      await updateLastModifiedTime();
      showToast("경기가 삭제되고 점수가 복원되었습니다.");
      setMatchToDelete(null);
    } catch (error) {
      console.error("Delete Error:", error);
      showToast("삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderHomeView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900 to-gray-900 rounded-2xl p-8 shadow-xl border border-green-800/50 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            버츄얼 종겜 리그에 오신 것을 환영합니다
          </h2>
          <p className="text-gray-300 mb-6">
            매주 바뀌는 게임과 실시간으로 갱신되는 티어표를 확인하세요.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigateTo("tier")}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition"
            >
              <Trophy className="w-5 h-5 mr-2" /> 티어표 보기
            </button>
            <button
              onClick={() => navigateTo("matches")}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 shadow-lg hover:bg-gray-700 transition"
            >
              <Swords className="w-5 h-5 mr-2" /> 경기 기록
            </button>
            <button
              onClick={() => navigateTo("wow")}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-900 to-purple-900 text-white rounded-lg border border-blue-700/50 shadow-lg hover:from-blue-800 hover:to-purple-800 transition"
            >
              <Shield className="w-5 h-5 mr-2" /> 와우 왁타버스 길드
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Gamepad2 className="w-5 h-5 mr-2 text-green-400" /> 최근 경기
          </h3>
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.slice(0, 3).map((match) => (
                <div
                  key={match.id}
                  className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center">
                      {match.matchType === "team" && (
                        <Users className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
                      )}
                      <p className="font-bold text-white">{match.gameName}</p>
                    </div>
                    <p className="text-xs text-gray-400">{match.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-yellow-400 font-medium">
                      1위:{" "}
                      {match.results?.find((r) => r.rank === 1)?.playerName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">최근 경기가 없습니다.</p>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-400" /> TOP 5
          </h3>
          {players.length > 0 ? (
            <div className="space-y-3">
              {[...players]
                .sort((a, b) => b.points - a.points)
                .slice(0, 5)
                .map((player, idx) => (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.name)}
                    className="flex items-center bg-gray-700/30 p-2 rounded-lg cursor-pointer hover:bg-gray-600/50 transition group"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                        idx === 0
                          ? "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                          : "bg-gray-600 text-white"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <img
                        src={getAvatarSrc(player.name)}
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`;
                        }}
                        alt="avatar"
                        className="w-8 h-8 rounded-full bg-gray-800 object-cover border border-gray-600 group-hover:border-green-400 transition"
                      />
                      <span className="font-medium text-white group-hover:text-green-400 transition">
                        {player.name}
                      </span>
                    </div>
                    <div className="text-green-400 font-bold">
                      {player.points} pt
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400">참가자가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderMatchesView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center">
        <Swords className="w-6 h-6 mr-2 text-green-400" /> 경기 기록
      </h2>
      <div className="grid gap-4">
        {matches.map((match) => {
          if (match.matchType === "team") {
            const teamsByRank = {};
            (match.results || []).forEach((r) => {
              if (!teamsByRank[r.rank])
                teamsByRank[r.rank] = {
                  rank: r.rank,
                  scoreChange: r.scoreChange,
                  players: [],
                };
              teamsByRank[r.rank].players.push(r.playerName);
            });
            const sortedTeams = Object.values(teamsByRank).sort(
              (a, b) => a.rank - b.rank
            );

            return (
              <div
                key={match.id}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700"
              >
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {match.gameName}
                  </h3>
                  <span className="ml-3 bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded text-xs font-bold flex items-center">
                    <Users className="w-3 h-3 mr-1" /> 팀전
                  </span>
                  <span className="text-sm text-gray-400 ml-auto">
                    {match.date}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {sortedTeams.map((team, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        team.rank === 1
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-gray-700/30 border-gray-600"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3 border-b border-gray-600/50 pb-2">
                        <span
                          className={`text-sm font-bold ${
                            team.rank === 1
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          {team.rank}위 팀
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            team.scoreChange >= 0
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {team.scoreChange > 0 ? "+" : ""}
                          {team.scoreChange} pt
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {team.players.map((p) => (
                          <div
                            key={p}
                            onClick={() => setSelectedPlayer(p)}
                            className="flex items-center bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700 shadow-sm cursor-pointer hover:border-green-400 transition group"
                          >
                            <img
                              src={getAvatarSrc(p)}
                              onError={(e) => {
                                e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${p}`;
                              }}
                              alt="avatar"
                              className="w-5 h-5 rounded-full mr-2 bg-gray-800 object-cover"
                            />
                            <span className="text-sm font-medium text-white group-hover:text-green-400">
                              {p}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div
              key={match.id}
              className="bg-gray-800 rounded-xl p-5 border border-gray-700"
            >
              <div className="flex items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  {match.gameName}
                </h3>
                <span className="ml-3 bg-gray-700 text-gray-300 border border-gray-600 px-2 py-0.5 rounded text-xs font-bold flex items-center">
                  <User className="w-3 h-3 mr-1" /> 개인전
                </span>
                <span className="text-sm text-gray-400 ml-auto">
                  {match.date}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...(match.results || [])]
                  .sort((a, b) => a.rank - b.rank)
                  .map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPlayer(result.playerName)}
                      className={`p-3 rounded-lg border flex flex-col justify-center cursor-pointer transition group hover:-translate-y-1 hover:shadow-lg ${
                        result.rank === 1
                          ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-400"
                          : "bg-gray-700/30 border-gray-600 hover:border-green-400"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-300">
                          {result.rank}위
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            result.scoreChange >= 0
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {result.scoreChange > 0 ? "+" : ""}
                          {result.scoreChange} pt
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={getAvatarSrc(result.playerName)}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${result.playerName}`;
                          }}
                          alt="avatar"
                          className="w-7 h-7 rounded-full bg-gray-800 object-cover"
                        />
                        <span className="font-medium text-white truncate text-lg group-hover:text-green-400 transition">
                          {result.playerName}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
        {matches.length === 0 && (
          <p className="text-gray-400 text-center py-10">기록이 없습니다.</p>
        )}
      </div>
    </div>
  );

  const renderStatsView = () => {
    const mostWinsPlayer = [...playerStatsMap].sort(
      (a, b) => b.winCount - a.winCount || b.points - a.points
    )[0];
    const mostPlayedPlayer = [...playerStatsMap].sort(
      (a, b) => b.matchCount - a.matchCount || b.points - a.points
    )[0];
    const bestAvgPlayer = [...playerStatsMap]
      .filter((p) => p.matchCount > 0)
      .sort((a, b) => b.avgScore - a.avgScore)[0];

    const SortIcon = ({ columnKey }) => {
      if (sortConfig.key !== columnKey)
        return (
          <ChevronDown className="w-3 h-3 ml-1 opacity-30 group-hover:opacity-100 transition" />
        );
      return sortConfig.direction === "asc" ? (
        <ChevronUp className="w-3 h-3 ml-1 text-green-400" />
      ) : (
        <ChevronDown className="w-3 h-3 ml-1 text-green-400" />
      );
    };

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center mb-2">
            <TrendingUp className="w-6 h-6 mr-2 text-indigo-400" /> 종합 통계
            대시보드
          </h2>
          <p className="text-sm text-gray-400">
            매주 새로운 게임, 새로운 참가자들이 만들어내는 치열한 리그의 누적
            기록입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-900/40 to-gray-800 border border-yellow-700/50 rounded-xl p-5 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Crown className="w-32 h-32 text-yellow-500" />
            </div>
            <Crown className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="text-sm font-bold text-gray-300 mb-1">
              👑 종합 우승왕
            </h3>
            <p className="text-[10px] text-yellow-500/70 mb-3 text-center break-keep">
              1위를 가장 많이 달성한 유저
            </p>
            {mostWinsPlayer && mostWinsPlayer.winCount > 0 ? (
              <>
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setSelectedPlayer(mostWinsPlayer.name)}
                >
                  <img
                    src={getAvatarSrc(mostWinsPlayer.name)}
                    alt="avatar"
                    className="w-8 h-8 rounded-full bg-gray-900 object-cover border border-yellow-500/50 group-hover:scale-110 transition"
                  />
                  <span className="text-xl font-black text-white group-hover:text-yellow-400 transition">
                    {mostWinsPlayer.name}
                  </span>
                </div>
                <p className="text-yellow-400 font-bold mt-2 bg-yellow-900/30 px-3 py-1 rounded-full text-sm">
                  총 {mostWinsPlayer.winCount}회 우승
                </p>
              </>
            ) : (
              <span className="text-gray-500 mt-2">기록 없음</span>
            )}
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-gray-800 border border-emerald-700/50 rounded-xl p-5 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Clover className="w-32 h-32 text-emerald-500" />
            </div>
            <Clover className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-gray-300 mb-1">
              🍀 선택받은 자
            </h3>
            <p className="text-[10px] text-emerald-500/70 mb-3 text-center break-keep">
              경기에 가장 많이 참가한 유저
            </p>
            {mostPlayedPlayer && mostPlayedPlayer.matchCount > 0 ? (
              <>
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setSelectedPlayer(mostPlayedPlayer.name)}
                >
                  <img
                    src={getAvatarSrc(mostPlayedPlayer.name)}
                    alt="avatar"
                    className="w-8 h-8 rounded-full bg-gray-900 object-cover border border-emerald-500/50 group-hover:scale-110 transition"
                  />
                  <span className="text-xl font-black text-white group-hover:text-emerald-400 transition">
                    {mostPlayedPlayer.name}
                  </span>
                </div>
                <p className="text-emerald-400 font-bold mt-2 bg-emerald-900/30 px-3 py-1 rounded-full text-sm">
                  총 {mostPlayedPlayer.matchCount}회 참가
                </p>
              </>
            ) : (
              <span className="text-gray-500 mt-2">기록 없음</span>
            )}
          </div>

          <div className="bg-gradient-to-br from-cyan-900/40 to-gray-800 border border-cyan-700/50 rounded-xl p-5 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Gem className="w-32 h-32 text-cyan-500" />
            </div>
            <Gem className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-sm font-bold text-gray-300 mb-1">
              💎 최고 효율 플레이어
            </h3>
            <p className="text-[10px] text-cyan-500/70 mb-3 text-center break-keep">
              경기당 평균 획득 점수가 가장 높은 유저
            </p>
            {bestAvgPlayer && bestAvgPlayer.matchCount > 0 ? (
              <>
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setSelectedPlayer(bestAvgPlayer.name)}
                >
                  <img
                    src={getAvatarSrc(bestAvgPlayer.name)}
                    alt="avatar"
                    className="w-8 h-8 rounded-full bg-gray-900 object-cover border border-cyan-500/50 group-hover:scale-110 transition"
                  />
                  <span className="text-xl font-black text-white group-hover:text-cyan-400 transition">
                    {bestAvgPlayer.name}
                  </span>
                </div>
                <p className="text-cyan-400 font-bold mt-2 bg-cyan-900/30 px-3 py-1 rounded-full text-sm">
                  평균 {bestAvgPlayer.avgScore} pt
                </p>
              </>
            ) : (
              <span className="text-gray-500 mt-2">기록 없음</span>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50">
            <h3 className="text-lg font-bold text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-400" /> 참가자 전체
              통계 리스트
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 bg-gray-900 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">
                    순위
                  </th>
                  <th scope="col" className="px-6 py-4">
                    선수명
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestSort("matchCount")}
                  >
                    <div className="flex items-center justify-center">
                      참가 횟수 <SortIcon columnKey="matchCount" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestSort("winCount")}
                  >
                    <div className="flex items-center justify-center">
                      1위 횟수 <SortIcon columnKey="winCount" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestSort("avgScore")}
                  >
                    <div className="flex items-center justify-center">
                      평균 획득 점수 <SortIcon columnKey="avgScore" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 cursor-pointer group select-none hover:bg-gray-800 transition rounded-tr-lg"
                    onClick={() => requestSort("points")}
                  >
                    <div className="flex items-center justify-end">
                      총 획득 점수 <SortIcon columnKey="points" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayerStats.length > 0 ? (
                  sortedPlayerStats.map((player, idx) => (
                    <tr
                      key={player.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition cursor-pointer"
                      onClick={() => setSelectedPlayer(player.name)}
                    >
                      <td className="px-6 py-4 font-bold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                        <img
                          src={getAvatarSrc(player.name)}
                          alt={player.name}
                          className="w-6 h-6 rounded-full bg-gray-900 object-cover"
                        />
                        {player.name}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-300">
                        {player.matchCount}회
                      </td>
                      <td className="px-6 py-4 text-center text-gray-300">
                        {player.winCount > 0 ? (
                          <span className="text-yellow-400 font-bold">
                            {player.winCount}회
                          </span>
                        ) : (
                          "0회"
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-cyan-400">
                        {player.avgScore} pt
                      </td>
                      <td className="px-6 py-4 text-right font-black text-green-400">
                        {player.points} pt
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      아직 등록된 참가자 통계가 없습니다.
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
      S: Math.ceil(totalPlayers * 0.1),
      A: Math.ceil(totalPlayers * 0.3),
      B: Math.ceil(totalPlayers * 0.6),
      C: Math.ceil(totalPlayers * 0.85),
      D: totalPlayers,
    };

    const getTierIdByRank = (rank) => {
      if (totalPlayers === 0) return "D";
      if (rank <= cutoffs.S) return "S";
      if (rank <= cutoffs.A) return "A";
      if (rank <= cutoffs.B) return "B";
      if (rank <= cutoffs.C) return "C";
      return "D";
    };

    const categorizedPlayers = TIER_SETTINGS.map((tier, index) => {
      const playersInTier = rankedPlayers.filter(
        (p) => getTierIdByRank(p.rank) === tier.id
      );
      let startRank = 1;
      if (index > 0) {
        const prevTierId = TIER_SETTINGS[index - 1].id;
        startRank = cutoffs[prevTierId] + 1;
      }
      const endRank = cutoffs[tier.id];
      let rankLabel = "";
      if (totalPlayers > 0) {
        if (startRank > endRank) {
          rankLabel = "(공석)";
        } else if (startRank === endRank) {
          rankLabel = `(${startRank}위)`;
        } else {
          rankLabel = `(${startRank}위 ~ ${endRank}위)`;
        }
      } else {
        rankLabel = "(0명)";
      }
      return { ...tier, players: playersInTier, rankLabel };
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-400" /> 공식 실력
              티어표
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              상대평가(백분율) 기준에 따라 전체 등수로 티어가 실시간 결정됩니다.
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden flex flex-col gap-1 p-1">
          {categorizedPlayers.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col md:flex-row bg-gray-800 rounded-lg overflow-hidden min-h-[100px]"
            >
              <div
                className={`${tier.color} md:w-28 w-full flex-shrink-0 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r border-gray-900 shadow-inner`}
              >
                <span className="text-2xl font-extrabold text-white text-shadow">
                  {tier.id}
                </span>
                <span className="text-xs font-bold text-white/90 mt-1 text-center">
                  {tier.label}
                </span>
                <span className="text-[10px] text-white/70 mt-0.5 text-center">
                  {tier.rankLabel}
                </span>
              </div>
              <div className="flex-1 p-4 flex flex-wrap gap-4 items-center bg-gray-800/80">
                {tier.players.length > 0 ? (
                  tier.players.map((player) => {
                    const streak = getPlayerStreak(player.name);
                    return (
                      <div
                        key={player.id}
                        onClick={() => setSelectedPlayer(player.name)}
                        className="group relative flex flex-col items-center cursor-pointer"
                      >
                        {streak.count >= 2 && (
                          <div
                            className={`absolute -top-2 -right-3 px-1.5 py-0.5 rounded-full text-[10px] font-black z-10 border shadow-md animate-bounce ${
                              streak.type === "win"
                                ? "bg-red-900/90 text-red-400 border-red-500/50"
                                : "bg-blue-900/90 text-blue-400 border-blue-500/50"
                            }`}
                          >
                            {streak.type === "win" ? "🔥" : "🧊"}
                            {streak.count}
                            {streak.type === "win" ? "연승" : "연패"}
                          </div>
                        )}
                        <div className="w-16 h-16 rounded-lg bg-gray-700 border-2 border-gray-600 flex items-center justify-center overflow-hidden shadow-lg transition-transform transform group-hover:scale-110 group-hover:border-green-400">
                          <img
                            src={getAvatarSrc(player.name)}
                            onError={(e) => {
                              e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`;
                            }}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="mt-2 text-sm font-medium text-white bg-gray-900/80 px-2 py-0.5 rounded group-hover:text-green-400 transition-colors">
                          {player.name}
                        </span>
                        <span className="text-xs font-bold text-green-400 mt-0.5">
                          {player.points} pt
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-gray-500 text-sm italic p-2">
                    해당 티어 플레이어 없음
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ★ 추가된 WOW 탭 컴포넌트 ★
  const renderWowView = () => {
    const WowSortIcon = ({ columnKey }) => {
      if (wowSortConfig.key !== columnKey)
        return (
          <ChevronDown className="w-3 h-3 ml-1 opacity-30 group-hover:opacity-100 transition" />
        );
      return wowSortConfig.direction === "asc" ? (
        <ChevronUp className="w-3 h-3 ml-1 text-blue-400" />
      ) : (
        <ChevronDown className="w-3 h-3 ml-1 text-blue-400" />
      );
    };

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-8 shadow-xl border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <Shield className="w-64 h-64 text-blue-300" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-3 flex items-center drop-shadow-md">
              <Shield className="w-8 h-8 mr-3 text-blue-400" /> 월드 오브
              워크래프트 x 버츄얼 종겜 리그
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl font-medium shadow-sm">
              왁타버스 길드에 가입하여 피나는 노력 끝에{" "}
              <strong className="text-yellow-400 font-black text-xl px-1">
                레벨 40
              </strong>
              을 달성한 자만이
              <br />
              종겜 리그의 공식 참가권을 얻을 수 있습니다! 과연 누가 합류하게
              될까요?
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" /> 왁타버스 길드
              소속 버튜버 명단
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 bg-gray-900 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">
                    프로필
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestWowSort("streamerName")}
                  >
                    <div className="flex items-center">
                      스트리머명 <WowSortIcon columnKey="streamerName" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestWowSort("wowNickname")}
                  >
                    <div className="flex items-center">
                      와우 닉네임 <WowSortIcon columnKey="wowNickname" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestWowSort("jobClass")}
                  >
                    <div className="flex items-center">
                      직업 <WowSortIcon columnKey="jobClass" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 cursor-pointer group select-none hover:bg-gray-800 transition rounded-tr-lg"
                    onClick={() => requestWowSort("level")}
                  >
                    <div className="flex items-center justify-end">
                      현재 레벨 <WowSortIcon columnKey="level" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedWowRoster.length > 0 ? (
                  sortedWowRoster.map((member) => {
                    const isQualified = member.level >= 40;
                    return (
                      <tr
                        key={member.id}
                        className={`border-b border-gray-700 transition ${
                          isQualified
                            ? "bg-yellow-900/10 hover:bg-yellow-900/20"
                            : "hover:bg-gray-700/50"
                        }`}
                      >
                        <td className="px-6 py-3">
                          <img
                            src={getAvatarSrc(member.streamerName)}
                            alt={member.streamerName}
                            className={`w-10 h-10 rounded-full object-cover border-2 ${
                              isQualified
                                ? "border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]"
                                : "border-gray-600"
                            }`}
                          />
                        </td>
                        <td
                          className={`px-6 py-4 font-bold ${
                            isQualified ? "text-yellow-100" : "text-white"
                          }`}
                        >
                          {member.streamerName}
                        </td>
                        <td className="px-6 py-4 text-blue-300 font-medium">
                          {member.wowNickname}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                            {member.jobClass}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isQualified ? (
                            <div className="flex items-center justify-end">
                              <span className="text-yellow-400 font-black text-lg mr-2">
                                Lv. {member.level}
                              </span>
                              <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center animate-pulse">
                                <Ticket className="w-3 h-3 mr-1" /> 참가권 획득!
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end">
                              <span className="text-gray-300 font-bold text-base mr-2">
                                Lv. {member.level}
                              </span>
                              <span className="text-[11px] text-gray-500 bg-gray-800 px-2 py-1 rounded border border-gray-700">
                                40까지 {40 - member.level}렙 남음
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-16 text-center text-gray-500 flex-col items-center"
                    >
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
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="비밀번호"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-center border border-gray-600 focus:border-green-500 outline-none"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition"
            >
              접속하기
            </button>
          </form>
        </div>
      );

    const handleSubmitMatch = async (e) => {
      e.preventDefault();
      if (!gameName.trim())
        return showToast("게임 이름을 입력해주세요.", "error");

      let finalResults = [];
      if (matchMode === "individual") {
        finalResults = individualResults.filter(
          (r) => r.playerName.trim() !== ""
        );
      } else {
        teamResults.forEach((team) => {
          team.players.forEach((pName) => {
            if (pName.trim() !== "") {
              finalResults.push({
                playerName: pName.trim(),
                rank: team.rank,
                scoreChange: team.scoreChange,
              });
            }
          });
        });
      }

      if (finalResults.length === 0)
        return showToast(
          "최소 1명 이상의 유효한 참가자를 입력해주세요.",
          "error"
        );

      setIsSubmitting(true);
      try {
        await addDoc(
          collection(db, "artifacts", appId, "public", "data", "matches"),
          {
            date: matchDate,
            gameName,
            createdAt: new Date().toISOString(),
            matchType: matchMode,
            results: finalResults,
          }
        );

        for (const r of finalResults) {
          const pName = r.playerName.trim();
          const p = players.find((p) => p.name === pName);
          if (p)
            await updateDoc(
              doc(db, "artifacts", appId, "public", "data", "players", p.id),
              { points: p.points + r.scoreChange }
            );
          else
            await addDoc(
              collection(db, "artifacts", appId, "public", "data", "players"),
              {
                name: pName,
                points: 0 + r.scoreChange,
                createdAt: new Date().toISOString(),
              }
            );
        }

        setGameName("");
        setIndividualResults([
          { playerName: "", rank: 1, scoreChange: 100 },
          { playerName: "", rank: 2, scoreChange: 50 },
        ]);
        setTeamResults([
          { id: 1, rank: 1, scoreChange: 100, players: ["", ""] },
          { id: 2, rank: 2, scoreChange: -50, players: ["", ""] },
        ]);
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
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <PlusCircle className="w-6 h-6 mr-2 text-green-400" /> 새 경기
              결과 등록
            </h2>
            <button
              onClick={() => setIsAdminAuth(false)}
              className="text-xs text-gray-400 hover:text-white bg-gray-700 px-3 py-1.5 rounded-lg"
            >
              로그아웃
            </button>
          </div>

          <div className="flex bg-gray-900 p-1 rounded-lg mb-6 border border-gray-700">
            <button
              type="button"
              onClick={() => setMatchMode("individual")}
              className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${
                matchMode === "individual"
                  ? "bg-gray-700 text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <User className="w-4 h-4 mr-2" /> 개인전
            </button>
            <button
              type="button"
              onClick={() => setMatchMode("team")}
              className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${
                matchMode === "team"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Users className="w-4 h-4 mr-2" /> 팀전
            </button>
          </div>

          <form onSubmit={handleSubmitMatch} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="게임 이름"
                className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2"
                required
              />
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2"
                required
              />
            </div>

            {matchMode === "individual" && (
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">
                <p className="text-xs font-bold text-gray-500 mb-2">
                  개인별 순위와 점수를 입력합니다.
                </p>
                {individualResults.map((r, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="number"
                      value={r.rank}
                      onChange={(e) => {
                        const n = [...individualResults];
                        n[idx].rank = Number(e.target.value);
                        setIndividualResults(n);
                      }}
                      className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600"
                    />
                    <input
                      type="text"
                      value={r.playerName}
                      onChange={(e) => {
                        const n = [...individualResults];
                        n[idx].playerName = e.target.value;
                        setIndividualResults(n);
                      }}
                      placeholder="참가자 이름"
                      className="flex-1 bg-gray-800 text-white px-3 rounded border border-gray-600"
                    />
                    <input
                      type="number"
                      value={r.scoreChange}
                      onChange={(e) => {
                        const n = [...individualResults];
                        n[idx].scoreChange = Number(e.target.value);
                        setIndividualResults(n);
                      }}
                      placeholder="점수"
                      className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (individualResults.length > 1)
                          setIndividualResults(
                            individualResults.filter((_, i) => i !== idx)
                          );
                      }}
                      className="p-2 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setIndividualResults([
                      ...individualResults,
                      {
                        playerName: "",
                        rank: individualResults.length + 1,
                        scoreChange: 0,
                      },
                    ])
                  }
                  className="w-full py-2 text-gray-400 border border-dashed border-gray-600 rounded hover:text-white hover:border-gray-400 transition"
                >
                  참가자 추가
                </button>
              </div>
            )}

            {matchMode === "team" && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-indigo-400 mb-2">
                  팀 단위로 순위와 점수를 한 번만 입력하고, 팀원 이름을
                  추가하세요.
                </p>
                {teamResults.map((team, tIdx) => (
                  <div
                    key={team.id}
                    className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                    <div className="flex gap-2 mb-3 pb-3 border-b border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 mb-1">
                          순위
                        </span>
                        <input
                          type="number"
                          value={team.rank}
                          onChange={(e) => {
                            const n = [...teamResults];
                            n[tIdx].rank = Number(e.target.value);
                            setTeamResults(n);
                          }}
                          className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1"
                        />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-gray-500 mb-1">
                          팀 전체 획득/감소 점수
                        </span>
                        <input
                          type="number"
                          value={team.scoreChange}
                          onChange={(e) => {
                            const n = [...teamResults];
                            n[tIdx].scoreChange = Number(e.target.value);
                            setTeamResults(n);
                          }}
                          placeholder="점수"
                          className="w-full bg-gray-800 text-white px-3 rounded border border-gray-600 py-1"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (teamResults.length > 2)
                              setTeamResults(
                                teamResults.filter((_, i) => i !== tIdx)
                              );
                          }}
                          className="p-2 text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {team.players.map((pName, pIdx) => (
                        <div key={pIdx} className="flex gap-1">
                          <input
                            type="text"
                            value={pName}
                            onChange={(e) => {
                              const n = [...teamResults];
                              n[tIdx].players[pIdx] = e.target.value;
                              setTeamResults(n);
                            }}
                            placeholder="팀원 이름"
                            className="flex-1 bg-gray-800 text-sm text-white px-2 py-1 rounded border border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (team.players.length > 1) {
                                const n = [...teamResults];
                                n[tIdx].players.splice(pIdx, 1);
                                setTeamResults(n);
                              }
                            }}
                            className="text-gray-500 hover:text-red-400 px-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const n = [...teamResults];
                        n[tIdx].players.push("");
                        setTeamResults(n);
                      }}
                      className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition w-full mt-2 border border-indigo-800/50"
                    >
                      + 팀원 추가
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setTeamResults([
                      ...teamResults,
                      {
                        id: Date.now(),
                        rank: teamResults.length + 1,
                        scoreChange: 0,
                        players: ["", ""],
                      },
                    ])
                  }
                  className="w-full py-2.5 text-indigo-300 border-2 border-dashed border-indigo-700/50 rounded-lg hover:bg-indigo-900/30 transition font-medium text-sm"
                >
                  새로운 팀 라인 추가
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex justify-center items-center transition shadow-lg"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "결과 DB에 저장 및 갱신"
              )}
            </button>
          </form>
        </div>

        {/* ★ 새롭게 추가된 WOW 왁타버스 길드원 관리 섹션 ★ */}
        <div className="bg-gradient-to-b from-blue-900/20 to-gray-800 rounded-xl p-6 border border-blue-800/40 shadow-lg">
          <h2 className="text-xl font-bold text-blue-300 mb-2 flex items-center">
            <Shield className="w-5 h-5 mr-2" /> WOW 왁타버스 길드 관리
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            와우 서버에서 플레이 중인 버튜버 캐릭터를 등록하고, 방송을 보며
            실시간으로 레벨을 갱신해주세요.
          </p>

          {/* 길드원 등록 폼 */}
          <form
            onSubmit={handleAddWowMember}
            className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={wowStreamerName}
                onChange={(e) => setWowStreamerName(e.target.value)}
                placeholder="스트리머명 (예: 단답벌레)"
                className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500"
                required
              />
              <input
                type="text"
                value={wowNickname}
                onChange={(e) => setWowNickname(e.target.value)}
                placeholder="와우 닉네임"
                className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500"
                required
              />
              <input
                type="text"
                value={wowJobClass}
                onChange={(e) => setWowJobClass(e.target.value)}
                placeholder="직업 (예: 전사)"
                className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={wowLevel}
                  onChange={(e) => setWowLevel(e.target.value)}
                  placeholder="레벨"
                  min="1"
                  max="60"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isWowSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded font-bold transition whitespace-nowrap"
                >
                  {isWowSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "등록"
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* 길드원 리스트 및 레벨 수정 패널 */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {wowRoster
              .sort((a, b) => b.level - a.level)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex justify-between items-center bg-gray-800 border border-gray-700 p-3 rounded-lg hover:border-blue-500/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarSrc(member.streamerName)}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                      }}
                      alt="avatar"
                      className="w-10 h-10 rounded-full bg-gray-900 object-cover border border-gray-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {member.streamerName}
                        </span>
                        <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                          {member.jobClass}
                        </span>
                      </div>
                      <div className="text-xs text-blue-400">
                        {member.wowNickname}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* 실시간 레벨 조절기 */}
                    <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
                      <button
                        onClick={() =>
                          handleUpdateWowLevel(member.id, member.level - 1)
                        }
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-black text-yellow-400">
                        Lv {member.level}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateWowLevel(member.id, member.level + 1)
                        }
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteWowMember(member.id)}
                      className="text-gray-500 hover:text-red-400 transition p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            {wowRoster.length === 0 && (
              <p className="text-center text-gray-500 py-6">
                등록된 길드원이 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-blue-400" /> 참가자 프로필
            이미지 관리
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            인터넷에 올라와 있는 이미지 주소(URL)를 복사하여 참가자의 사진을
            변경할 수 있습니다. <br />
            (빈칸으로 저장하면 다시 기본 아바타로 돌아갑니다.)
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {[...players]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarSrc(player.name)}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`;
                      }}
                      alt="avatar"
                      className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 flex-shrink-0"
                    />
                    <span className="font-bold text-white w-20 truncate">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={
                        imageInputs[player.id] !== undefined
                          ? imageInputs[player.id]
                          : player.imageUrl || ""
                      }
                      onChange={(e) =>
                        setImageInputs({
                          ...imageInputs,
                          [player.id]: e.target.value,
                        })
                      }
                      className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={() =>
                        handleUpdateImage(player.id, imageInputs[player.id])
                      }
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ))}
            {players.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                등록된 참가자가 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Swords className="w-5 h-5 mr-2 text-red-400" /> 등록된 경기 관리
            (삭제)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            경기를 삭제하면 해당 경기로 증감된 참가자들의 점수가 자동으로
            복구됩니다.
          </p>

          <div className="space-y-3">
            {matches.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                등록된 경기가 없습니다.
              </p>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  className="flex justify-between items-center bg-gray-900 border border-gray-700 p-3 rounded-lg"
                >
                  <div>
                    <span className="font-bold text-white mr-3">
                      {match.gameName}
                    </span>
                    <span className="text-xs text-gray-400">{match.date}</span>
                  </div>
                  <button
                    onClick={() => setMatchToDelete(match)}
                    className="flex items-center text-sm bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> 삭제
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ★ 실전용: 초기화 버튼 영역 ★ */}
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-300 mb-2">
            🚨 데이터베이스 완벽 초기화
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            기존에 쌓인 테스트용 데이터를 싹 지우고, 참가자가{" "}
            <strong className="text-white">0명인 완전 초기 상태</strong>로
            리셋합니다. (실전 오픈용)
          </p>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> 모든 데이터 지우고 백지상태로
            시작하기
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
        <div
          className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-lg shadow-2xl text-white ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {matchToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-white">
                정말 삭제하시겠습니까?
              </h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              <span className="font-bold text-yellow-400">
                [{matchToDelete.gameName}]
              </span>{" "}
              경기를 삭제합니다.
              <br />
              이 경기로 얻거나 잃은 참가자들의 점수가 <br />
              모두 이전으로 되돌아갑니다. (복구 불가)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMatchToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteMatch}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition flex justify-center items-center"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "삭제 및 복구"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 데이터 초기화 모달 */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-white">
                정말 초기화하시겠습니까?
              </h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              지금까지의{" "}
              <span className="font-bold text-red-400">
                모든 경기 기록과 참가자가 삭제
              </span>
              됩니다.
              <br />
              <br />
              삭제 후 참가자가 아무도 없는 완전한
              <br />
              '백지 상태'로 즉시 전환됩니다. (복구 불가)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
              >
                취소
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition flex justify-center items-center"
              >
                {isResetting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "초기화 및 실전 시작"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인 프로필 모달 */}
      {selectedPlayer &&
        (() => {
          const stats = getPlayerStats(selectedPlayer);
          const playerInfo = players.find((p) => p.name === selectedPlayer);
          if (!playerInfo) return null;

          return (
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
              onClick={() => setSelectedPlayer(null)}
            >
              <div
                className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gray-900 p-6 flex flex-col items-center relative border-b border-gray-700">
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="w-24 h-24 rounded-2xl bg-gray-700 border-4 border-green-500/50 overflow-hidden shadow-lg mb-4">
                    <img
                      src={getAvatarSrc(selectedPlayer)}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedPlayer}`;
                      }}
                      alt={selectedPlayer}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    {selectedPlayer}
                  </h3>
                  <span className="text-green-400 font-bold mt-1 text-lg">
                    {playerInfo.points} pt
                  </span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-700 bg-gray-800/50 border-b border-gray-700">
                  <div className="flex flex-col items-center py-4">
                    <span className="text-xs text-gray-400 font-medium mb-1">
                      총 참가
                    </span>
                    <span className="text-xl font-bold text-white">
                      {stats.totalMatches}전
                    </span>
                  </div>
                  <div className="flex flex-col items-center py-4">
                    <span className="text-xs text-gray-400 font-medium mb-1">
                      우승 확률(1위)
                    </span>
                    <span className="text-xl font-bold text-yellow-400">
                      {stats.winRate}%
                    </span>
                  </div>
                  <div className="flex flex-col items-center py-4 px-2 text-center">
                    <span className="text-xs text-gray-400 font-medium mb-1">
                      주력 종목
                    </span>
                    <span className="text-sm font-bold text-indigo-300 leading-tight break-keep">
                      {stats.mostPlayedGame}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-1.5" /> 최근 전적 (최대
                    5경기)
                  </h4>
                  {stats.recentMatches.length === 0 ? (
                    <p className="text-center text-gray-500 py-6 text-sm">
                      경기 기록이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentMatches.map((m) => (
                        <div
                          key={m.id}
                          className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700/50"
                        >
                          <div className="flex-1 truncate pr-2">
                            <p className="text-sm font-bold text-white truncate">
                              {m.gameName}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {m.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-bold ${
                                m.rank === 1
                                  ? "text-yellow-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {m.rank}위
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded w-14 text-center ${
                                m.scoreChange >= 0
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {m.scoreChange > 0 ? "+" : ""}
                              {m.scoreChange}
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
        <div className="max-w-4xl mx-auto w-full flex justify-between items-center overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <h1
              className="text-lg md:text-xl font-bold text-white cursor-pointer flex items-center whitespace-nowrap"
              onClick={() => navigateTo("home")}
            >
              <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 mr-1.5 md:mr-2 text-green-400" />{" "}
              버츄얼 종겜 리그
            </h1>
            <a
              href="https://www.sooplive.co.kr/station/ecvhao"
              target="_blank"
              rel="noopener noreferrer"
              title="우왁굳 방송국"
              className="flex items-center justify-center px-2 py-0.5 bg-black text-green-400 border border-green-500/50 rounded text-xs font-black tracking-widest hover:bg-green-400 hover:text-black transition-all duration-300 shadow-[0_0_10px_rgba(74,222,128,0.3)] hover:shadow-[0_0_15px_rgba(74,222,128,0.6)]"
            >
              WAK
            </a>
            {lastUpdated && (
              <span className="ml-2 md:ml-3 text-[10px] md:text-xs font-medium text-white/90 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm flex items-center whitespace-nowrap">
                <RefreshCw className="w-3 h-3 mr-1 opacity-70" /> 최근 갱신:{" "}
                {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <span className="ml-1 md:ml-2 text-[10px] md:text-xs font-medium text-white/90 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm flex items-center whitespace-nowrap">
              <Users className="w-3 h-3 mr-1 opacity-70" /> 오늘 방문자:{" "}
              {todayVisits}
            </span>
          </div>
          <div className="flex space-x-1 md:space-x-2 ml-4 flex-shrink-0">
            <button
              onClick={() => navigateTo("home")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeTab === "home"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              홈
            </button>
            <button
              onClick={() => navigateTo("matches")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeTab === "matches"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              경기
            </button>
            <button
              onClick={() => navigateTo("stats")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeTab === "stats"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              통계
            </button>
            <button
              onClick={() => navigateTo("tier")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeTab === "tier"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              티어
            </button>
            {/* ★ 추가된 WOW 탭 네비게이션 버튼 ★ */}
            <button
              onClick={() => navigateTo("wow")}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center ${
                activeTab === "wow"
                  ? "bg-blue-900/50 text-blue-400 border border-blue-500/50"
                  : "text-blue-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Shield className="w-4 h-4 mr-1" /> WOW
            </button>
            <button
              onClick={() => navigateTo("admin")}
              className={`px-3 py-1.5 rounded border border-gray-600 flex items-center text-sm font-medium ${
                activeTab === "admin"
                  ? "bg-gray-800 text-green-400 border-green-500"
                  : "text-gray-400 hover:text-white hover:border-gray-400"
              }`}
            >
              {isAdminAuth ? (
                <Unlock className="w-3 h-3 mr-1" />
              ) : (
                <Lock className="w-3 h-3 mr-1" />
              )}{" "}
              관리
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 relative">
        {activeTab === "home" && renderHomeView()}
        {activeTab === "matches" && renderMatchesView()}
        {activeTab === "stats" && renderStatsView()}
        {activeTab === "tier" && renderTierListView()}
        {/* ★ 추가된 WOW 탭 렌더링 ★ */}
        {activeTab === "wow" && renderWowView()}
        {activeTab === "admin" && renderAdminView()}
      </main>
    </div>
  );
}
