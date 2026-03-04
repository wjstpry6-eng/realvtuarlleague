import React, { useState, useEffect } from "react";
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

// ★ 실전용: 기본 참가자 0점 세팅 ★
const SEED_PLAYERS = [
  { name: "우왁굳", points: 0 },
  { name: "천양", points: 0 },
  { name: "릴파", points: 0 },
  { name: "아이네", points: 0 },
  { name: "고세구", points: 0 },
  { name: "징버거", points: 0 },
  { name: "비챤", points: 0 },
  { name: "주르르", points: 0 },
  { name: "뢴트게늄", points: 0 },
  { name: "해루석", points: 0 },
];

// ★ 실전용: 테스트 경기 데이터 제거 ★
const SEED_MATCHES = [];

// ★ 실전용: D 티어 최소 점수를 -9999로 설정하여 마이너스 점수 커버 ★
const TIER_SETTINGS = [
  { id: "S", name: "S 티어", color: "bg-red-500", minPoints: 1300 },
  { id: "A", name: "A 티어", color: "bg-orange-500", minPoints: 1000 },
  { id: "B", name: "B 티어", color: "bg-yellow-500", minPoints: 700 },
  { id: "C", name: "C 티어", color: "bg-green-500", minPoints: 400 },
  { id: "D", name: "D 티어", color: "bg-blue-500", minPoints: -9999 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return ["home", "matches", "tier", "admin"].includes(hash) ? hash : "home";
  });
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
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

  // ★ 실전용: 데이터 초기화 모달 상태 추가 ★
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

  const [individualResults, setIndividualResults] = useState([
    { playerName: "우왁굳", rank: 1, scoreChange: 100 },
    { playerName: "", rank: 2, scoreChange: 50 },
  ]);
  const [teamResults, setTeamResults] = useState([
    { id: 1, rank: 1, scoreChange: 100, players: ["우왁굳", "천양"] },
    { id: 2, rank: 2, scoreChange: -50, players: ["", ""] },
  ]);

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
      if (["home", "matches", "tier", "admin"].includes(hash))
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
          await signInWithCustomToken(auth, __initial_auth_token);
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

    if (user) {
      recordVisit();
    }
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

  // ★ 실전용: 데이터 초기화 및 0점 로스터 강제 세팅 로직 ★
  const handleResetDatabase = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      // 1. 모든 매치 기록 삭제
      for (const m of matches) {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "matches", m.id)
        );
      }
      // 2. 모든 플레이어 기록 삭제
      for (const p of players) {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "players", p.id)
        );
      }
      // 3. 0점 초기 로스터 세팅
      for (const p of SEED_PLAYERS) {
        await addDoc(
          collection(db, "artifacts", appId, "public", "data", "players"),
          { ...p, createdAt: new Date().toISOString() }
        );
      }
      await updateLastModifiedTime();
      showToast(
        "데이터가 초기화되고 실전 모드(0점)가 시작되었습니다!",
        "success"
      );
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
        {
          imageUrl: url || "",
        }
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
          <div className="flex gap-4">
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

  const renderTierListView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center">
        <Trophy className="w-6 h-6 mr-2 text-yellow-400" /> 공식 실력 티어표
      </h2>
      <div className="bg-gray-900 rounded-xl border border-gray-700 flex flex-col gap-1 p-1">
        {TIER_SETTINGS.map((tier, tIdx) => {
          const isLastTier = tIdx === TIER_SETTINGS.length - 1;
          const tierPlayers = players
            .filter((p) => {
              if (isLastTier)
                return p.points < TIER_SETTINGS[tIdx - 1].minPoints;
              return (
                p.points >= tier.minPoints &&
                p.points <
                  (tIdx === 0 ? Infinity : TIER_SETTINGS[tIdx - 1].minPoints)
              );
            })
            .sort((a, b) => b.points - a.points);
          return (
            <div
              key={tier.id}
              className="flex flex-col md:flex-row bg-gray-800 rounded-lg min-h-[100px]"
            >
              <div
                className={`${tier.color} md:w-24 w-full flex-shrink-0 flex flex-col items-center justify-center p-3`}
              >
                <span className="text-2xl font-extrabold text-white">
                  {tier.id}
                </span>
                {/* ★ 실전용: D티어(-9999)는 최소 점수를 MIN으로 표시 ★ */}
                <span className="text-xs font-semibold text-white/90 mt-1 text-center leading-tight">
                  {tier.minPoints === -9999 ? "MIN" : `${tier.minPoints}pt`}
                  <br className="hidden md:block" /> ~{" "}
                  {tIdx === 0
                    ? "MAX"
                    : `${TIER_SETTINGS[tIdx - 1].minPoints - 1}pt`}
                </span>
              </div>
              <div className="flex-1 p-4 flex flex-wrap gap-4 items-center">
                {tierPlayers.map((player) => {
                  const streak = getPlayerStreak(player.name);
                  return (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayer(player.name)}
                      className="relative flex flex-col items-center cursor-pointer group"
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
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

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
          // ★ 실전용: 신규 참가자 추가 시 0점부터 시작 ★
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
          { playerName: "우왁굳", rank: 1, scoreChange: 100 },
          { playerName: "", rank: 2, scoreChange: 50 },
        ]);
        setTeamResults([
          { id: 1, rank: 1, scoreChange: 100, players: ["우왁굳", "천양"] },
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
            기존에 쌓인 테스트용 데이터를 싹 지우고, 왁타버스 멤버들이{" "}
            <strong className="text-white">모두 0점부터 시작하는 상태</strong>로
            리셋합니다. (실전 오픈용)
          </p>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> 모든 데이터 지우고 실전
            모드(0점) 시작하기
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

      {/* ★ 실전용: 데이터 초기화 모달 ★ */}
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
              삭제 후 모든 스트리머가 0점부터 시작하는
              <br />
              '실전 모드'로 즉시 전환됩니다. (복구 불가)
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
              <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 mr-1.5 md:mr-2 text-green-400" />
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
                <RefreshCw className="w-3 h-3 mr-1 opacity-70" />
                최근 갱신: {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <span className="ml-1 md:ml-2 text-[10px] md:text-xs font-medium text-white/90 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm flex items-center whitespace-nowrap">
              <Users className="w-3 h-3 mr-1 opacity-70" />
              오늘 방문자: {todayVisits}
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
              onClick={() => navigateTo("tier")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeTab === "tier"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              티어
            </button>
            <button
              onClick={() => navigateTo("admin")}
              className={`px-3 py-1.5 rounded border border-gray-600 flex items-center text-sm font-medium ${
                activeTab === "admin"
                  ? "bg-gray-800 text-green-400 border-green-500"
                  : "text-gray-400"
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
        {activeTab === "tier" && renderTierListView()}
        {activeTab === "admin" && renderAdminView()}
      </main>
    </div>
  );
}
