import { useGameStore } from "./stores/gameStore";
import { LandingPage } from "./components/screens/LandingPage";
import { LobbyScreen } from "./components/screens/LobbyScreen";
import { GameScreen } from "./components/screens/GameScreen";
import { VictoryScreen } from "./components/screens/VictoryScreen";
import { HowToPlayPanel } from "./components/modals/HowToPlayPanel";

function App() {
  const screen = useGameStore((s) => s.screen);
  const showHowToPlay = useGameStore((s) => s.showHowToPlay);

  return (
    <>
      {screen === "landing" && <LandingPage />}
      {screen === "lobby" && <LobbyScreen />}
      {screen === "waiting" && <LobbyScreen />}
      {screen === "game" && <GameScreen />}
      {screen === "victory" && <VictoryScreen />}
      {showHowToPlay && screen === "landing" && <HowToPlayPanel />}
    </>
  );
}

export default App;
