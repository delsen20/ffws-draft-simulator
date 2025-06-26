import { useState, useEffect } from 'react';
import { db, ref, set, onValue } from './firebase';

const skillList = [
  "A124", 
  "Alok", 
  "Chrono", 
  "Clu", 
  "Dimitri",
  "K", 
  "Kenta", 
  "Skyler", 
  "Steffie", 
  "Wukong",
  "Xayne",
  "Koda",
  "Homer",
  "Iris",
  "Tatsuya",
  "Santino",
  "Ignis",
  "Orion",
  "Kassie",
  "Oscar"
];

export default function FFWSDraftSimulator() {
const query = new URLSearchParams(window.location.search);
const roomId = query.get('room') || 'default-room';
  const [teamNames, setTeamNames] = useState({ A: "Tim A", B: "Tim B" });
  const [bans, setBans] = useState({ A: null, B: null });
  const [picks, setPicks] = useState({ A: [], B: [] });
  const draftOrder = ['A', 'B', 'A', 'A', 'B', 'B', 'A', 'B'];
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(30);
  const [isStarted, setIsStarted] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);

  const allChosen = [...picks.A, ...picks.B, bans.A, bans.B].filter(Boolean);
  const availableSkills = skillList.filter(skill => !allChosen.includes(skill));

  const currentPhase = () => {
    if (bans.A === null) return { type: "ban", team: "A" };
    if (bans.B === null) return { type: "ban", team: "B" };
    if (step < draftOrder.length) return { type: "pick", team: draftOrder[step] };
    return { type: "done" };
  };

    const handleSkillSelect = (skill) => {
    if (allChosen.includes(skill)) return; // ❗ Cegah skill duplikat

    const phase = currentPhase();
    if (phase.type === "ban") {
        setBans(prev => ({ ...prev, [phase.team]: skill }));
    } else if (phase.type === "pick") {
        setPicks(prev => ({
        ...prev,
        [phase.team]: [...prev[phase.team], skill],
        }));
        setStep(prev => prev + 1);
    }
    setTimer(30);
    };


  useEffect(() => {
    if (!isStarted) return;

    const phase = currentPhase();
    if (phase.type === "done") return;

    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      if (phase.type === "ban") {
        setBans(prev => ({ ...prev, [phase.team]: "" }));
      } else if (phase.type === "pick") {
        const validSkills = skillList.filter(
            skill => ![...picks.A, ...picks.B, bans.A, bans.B].includes(skill)
            );

            const randomSkill = validSkills[Math.floor(Math.random() * validSkills.length)];

            if (randomSkill) {
            setPicks(prev => ({
                ...prev,
                [phase.team]: [...prev[phase.team], randomSkill],
            }));
            setStep(prev => prev + 1);
            }

      }
      setTimer(30);
    }
  }, [timer, isStarted, bans, step, availableSkills]);

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data && isSpectator) {
        console.warn("Room belum ada atau kosong.");
        return;
        }
        if (data && isSpectator) {
        setTeamNames(data.teamNames || { A: "Tim A", B: "Tim B" });
        setBans(data.bans || { A: null, B: null });
        setPicks(data.picks || { A: [], B: [] });
        setStep(data.step || 0);
        setTimer(data.timer || 60);
        setIsStarted(data.isStarted || false);
        }

    });
    return () => unsub();
  }, [isSpectator]);

  useEffect(() => {
    if (!isSpectator) {
      const roomRef = ref(db, `rooms/${roomId}`);
      set(roomRef, {
        teamNames,
        bans,
        picks,
        step,
        timer,
        isStarted
      });
    }
  }, [teamNames, bans, picks, step, timer, isStarted, isSpectator]);

  const resetDraft = () => {
    setTeamNames({ A: "Tim A", B: "Tim B" });
    setBans({ A: null, B: null });
    setPicks({ A: [], B: [] });
    setStep(0);
    setTimer(30);
    setIsStarted(false);
  };

  const phase = currentPhase();

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans bg-gradient-to-br from-black via-gray-900 to-gray-800 min-h-screen text-white">
        {!isStarted && (
            <div className="text-center mb-6">
            <label className="text-white mr-4 font-semibold">Mode:</label>
            <select
                value={isSpectator ? "spectator" : "player"}
                onChange={e => setIsSpectator(e.target.value === "spectator")}
                className="px-4 py-2 rounded text-black"
            >
                <option value="player">Player</option>
                <option value="spectator">Spectator</option>
            </select>
            </div>
        )}      
      <h1 className="text-4xl font-extrabold text-center text-yellow-400 mb-6 uppercase tracking-wide drop-shadow-lg">
        RCS SEASON 4 DRAFT PICK
      </h1>
      <p className="text-center text-sm text-gray-400 mb-4">
        Room ID: <span className="font-mono">{roomId}</span> — Mode: <strong>{isSpectator ? 'Spectator' : 'Player'}</strong>
        </p>


      {isStarted && phase.type !== "done" && (
        <div className="text-center mb-8">
          <p className="text-3xl font-bold text-yellow-300">
            ⏱️ {timer}s - <span className="text-blue-300">{teamNames[phase.team]}</span> giliran <span className="text-pink-300">{phase.type.toUpperCase()}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {['A', 'B'].map(team => (
          <div key={team} className={`p-6 rounded-2xl border-4 ${phase.team === team ? 'border-yellow-400' : 'border-gray-700'} bg-gray-900 shadow-xl`}>
            <input
              className="text-2xl font-bold w-full mb-6 bg-transparent border-b border-gray-500 focus:outline-none text-center uppercase"
              value={teamNames[team]}
              onChange={e => setTeamNames(prev => ({ ...prev, [team]: e.target.value }))}
            />
            <div className="text-center mb-4">
              <p className="text-yellow-400 text-xl font-semibold">🚫 Ban</p>
              <div className="text-2xl mt-1 font-mono tracking-wide">{bans[team] || '-'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 p-3 rounded-xl text-center text-white text-sm shadow-inner border border-gray-600"
                >
                  <div className="font-semibold mb-1 text-xs text-gray-400">Player {idx + 1}</div>
                  {picks[team][idx] ? `✅ ${picks[team][idx]}` : `⬜ -`}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!isStarted && (
        <div className="text-center mb-8">
          <button
            onClick={() => !isSpectator && setIsStarted(true)}
            disabled={isSpectator}
            className={`px-10 py-4 rounded-full text-lg font-semibold shadow-lg ${
                isSpectator ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            >
            ▶️ Mulai Draft
            </button>
        </div>
      )}

      {isStarted && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-12">
          {availableSkills.map(skill => (
            <button
                key={skill}
                onClick={() => {
                if (!isSpectator) handleSkillSelect(skill);
                }}
                className="flex flex-col items-center bg-gray-200 hover:scale-105 hover:bg-blue-400 transition transform py-2 px-2 rounded-lg shadow text-center"
            >
                <img
                src={`/characters/${skill}.png`}
                alt={skill}
                className="w-16 h-16 object-contain mb-1"
                />
                <span className="text-xs text-black font-medium">{skill}</span>
            </button>
            ))}

        </div>
      )}

      <div className="text-center pb-10">
        <button
        onClick={() => !isSpectator && resetDraft()}
        disabled={isSpectator}
        className={`px-8 py-3 rounded-full shadow-md text-sm ${
            isSpectator ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"
        }`}
        >
        🔄 Reset Draft
        </button>

      </div>
    </div>
  );
}
