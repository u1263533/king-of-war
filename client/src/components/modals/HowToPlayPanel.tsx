import { useGameStore } from "../../stores/gameStore";

export function HowToPlayPanel() {
  const toggleHowToPlay = useGameStore((s) => s.toggleHowToPlay);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-army-dark border-2 border-gold/30 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-stencil text-2xl text-gold tracking-wider">HOW TO PLAY</h2>
          <button onClick={toggleHowToPlay} className="text-khaki/40 hover:text-khaki text-xl transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-6 text-sm">
          <Section title="OBJECTIVE">
            <p>Be the last warlord standing. Eliminate opponents through economic pressure and military conquest. Players who go bankrupt are eliminated.</p>
          </Section>

          <Section title="TURN STRUCTURE">
            <ol className="list-decimal list-inside space-y-1 text-cream/80">
              <li><strong className="text-gold">Movement Phase</strong> — Roll 2 dice, move your commander clockwise. Doubles grant an extra turn.</li>
              <li><strong className="text-gold">Action Phase</strong> — Based on where you land: buy territory, pay rent, enter combat, draw cards, or recruit units.</li>
              <li><strong className="text-gold">Management Phase</strong> — Deploy/transfer units, play cards, sell territories, build structures.</li>
              <li><strong className="text-gold">End Turn</strong> — Pass to the next player (or take extra turn if doubles).</li>
            </ol>
          </Section>

          <Section title="ECONOMY">
            <ul className="space-y-1 text-cream/80">
              <li>&#9733; <strong>Buy land</strong> when landing on unoccupied territory</li>
              <li>&#9733; <strong>Collect rent</strong> when opponents land on your territory</li>
              <li>&#9733; <strong>Build structures</strong>: Outpost (+50% rent) → Fortress (+100%) → Stronghold (+200%)</li>
              <li>&#9733; <strong>Collect income</strong> when passing Supply Station</li>
              <li>&#9733; <strong>Sell territory</strong> at 50% price to raise emergency funds</li>
            </ul>
          </Section>

          <Section title="MILITARY UNITS">
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: "Infantry", cost: 3, power: 1, icon: "🎖" },
                { name: "Tank", cost: 8, power: 3, icon: "🛡" },
                { name: "Aircraft", cost: 12, power: 5, icon: "✈" },
              ].map((u) => (
                <div key={u.name} className="p-2 bg-army/50 rounded border border-army-light/20 text-center">
                  <div className="text-lg">{u.icon}</div>
                  <div className="font-stencil text-cream text-xs">{u.name}</div>
                  <div className="text-[10px] text-khaki/50">Cost: {u.cost} | Power: {u.power}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-cream/70">
              Units go to your <strong>Reserve Pool</strong>. Deploy them as <strong>Mobile Army</strong> (travels with commander, for attacking) or <strong>Garrison</strong> (stays on territory, for defending).
            </p>
          </Section>

          <Section title="COMBAT">
            <p className="text-cream/80 mb-2">When landing on a garrisoned enemy territory, choose:</p>
            <ul className="space-y-1 text-cream/70">
              <li>&#9876; <strong>Military Battle</strong> — Both sides roll dice + add unit combat power. Higher total wins (defender wins ties).</li>
              <li>&#128176; <strong>Costly Battle</strong> — Pay rent + play a card to avoid fighting.</li>
              <li>&#127939; <strong>Retreat</strong> — Go back, lose 1 random unit.</li>
            </ul>
            <p className="mt-2 text-cream/70">
              <strong>Losses:</strong> Difference 1-3 = lose 1 unit, 4-6 = lose 2, 7+ = lose all.
            </p>
          </Section>

          <Section title="FOG OF WAR">
            <p className="text-cream/80">
              Enemy garrisons are <strong>hidden</strong>. You can see that a territory is garrisoned, but not the composition. Use the <strong>Military Investigation</strong> card to reveal one garrison.
            </p>
          </Section>

          <Section title="LAST AMMUNITION CARDS">
            <p className="text-cream/70 mb-2">Draw cards from the Last Ammunition deck. 11 card types across combat, economy, defense, and movement categories. Max hand: 5 cards.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-stencil text-sm text-khaki tracking-wider mb-2">{title}</h3>
      <div className="text-cream/60 leading-relaxed">{children}</div>
    </div>
  );
}
