import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../../stores/gameStore";
import { CARD_TYPE_COLORS, UNIT_CONFIG, BALANCE } from "../../utils/constants";
import { t, tTile } from "../../utils/i18n";
import { getCardImage } from "../../utils/assetMap";
import { playDiceRoll, playBuy, playRecruit, playCardPlay, playButtonClick, playCoinLoss } from "../../utils/sounds";
import type { Card, Unit, UnitType } from "../../types/game";

function CardInHand({ card, isPlayable, onPlay }: { card: Card; isPlayable: boolean; onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const handleEnter = () => {
    setHovered(true);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      // Center horizontally on card, above it
      let x = rect.left + rect.width / 2 - 96; // 96 = half of popup 192px width
      const y = rect.top - 270; // 256px height + 14px gap
      // Clamp to viewport
      if (x < 8) x = 8;
      if (x + 192 > window.innerWidth - 8) x = window.innerWidth - 200;
      setPopupPos({ x, y: Math.max(8, y) });
    }
  };

  return (
    <>
      {/* Fixed-position enlarged hover card — renders outside parent overflow */}
      {hovered && (
        <div
          className="fixed w-48 h-64 rounded-xl border-2 border-gold overflow-hidden shadow-2xl shadow-gold/20 animate-fade-in pointer-events-none"
          style={{ left: popupPos.x, top: popupPos.y, zIndex: 9999 }}
        >
          <img src={getCardImage(card.type)} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
          <div className="relative z-10 p-3 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="w-3 h-3 rounded-full border border-white/30" style={{ background: CARD_TYPE_COLORS[card.timing] }} />
              <span className="text-xs text-khaki/80 uppercase drop-shadow">{t(card.timing === "combat" ? "Combat" : card.timing === "instant" ? "Cards" : card.timing === "defense" ? "DEFENDER" : "MOVEMENT")}</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="font-stencil text-lg text-cream text-center leading-tight drop-shadow-lg">{t(card.name)}</span>
            </div>
            <p className="text-sm text-khaki/90 leading-snug drop-shadow">{t(card.description)}</p>
            {isPlayable && <div className="text-xs text-gold font-stencil mt-1 text-center">{t("点击使用")}</div>}
          </div>
        </div>
      )}
      {/* Normal card */}
      <div
        ref={cardRef}
        className={`relative shrink-0 w-24 h-32 rounded-lg border-2 overflow-hidden cursor-pointer
                    transition-all duration-200 animate-card-deal ${
          isPlayable
            ? "border-gold/60 hover:border-gold hover:shadow-lg hover:shadow-gold/10"
            : "border-army-light/30 opacity-50"
        }`}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { if (isPlayable) { playCardPlay(); onPlay(); } }}
      >
        <img src={getCardImage(card.type)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative z-10 p-2 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div className="w-2 h-2 rounded-full" style={{ background: CARD_TYPE_COLORS[card.timing] }} />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="font-stencil text-xs text-cream text-center leading-tight drop-shadow-lg">{t(card.name)}</span>
          </div>
          <p className="text-[8px] text-khaki/70 leading-tight drop-shadow">{t(card.description)}</p>
        </div>
      </div>
    </>
  );
}

function RecruitModal({ onClose }: { onClose: () => void }) {
  const doAction = useGameStore((s) => s.doAction);
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const me = gameState?.players.find((p) => p.id === myPlayerId);
  const [error, setError] = useState<string | null>(null);

  if (!me) return null;

  const handleRecruit = (type: UnitType) => {
    const result = doAction("recruit", { unitType: type, count: 1 });
    if (result?.error) setError(result.error);
    else { setError(null); playRecruit(); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-army-dark border border-gold/30 rounded-lg p-4 w-80 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-stencil text-gold text-lg mb-3">{t("RECRUIT UNITS")}</h3>
        <p className="text-xs text-khaki/50 mb-3">{t("Your coins:")} <span className="text-gold">{me.coins}</span></p>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <div className="space-y-2">
          {(["infantry", "tank", "aircraft"] as UnitType[]).map((type) => {
            const cfg = UNIT_CONFIG[type];
            const canAfford = me.coins >= cfg.cost;
            return (
              <button
                key={type}
                onClick={() => handleRecruit(type)}
                disabled={!canAfford}
                className={`w-full flex items-center justify-between p-2 rounded border transition-all ${
                  canAfford
                    ? "border-army-light/40 hover:border-gold/60 bg-army"
                    : "border-army-light/20 bg-army/30 opacity-40"
                }`}
              >
                <span className="text-sm text-cream">{cfg.icon} {t(cfg.label)}</span>
                <span className="text-xs">
                  <span className="text-khaki/50">{t("Power")} {cfg.power}</span>
                  <span className="text-gold ml-2">{cfg.cost} ★</span>
                </span>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2 border border-army-light/30 text-khaki/60 text-xs rounded hover:text-khaki transition-colors">
          {t("CLOSE")}
        </button>
      </div>
    </div>
  );
}

function DeployModal({ onClose }: { onClose: () => void }) {
  const doAction = useGameStore((s) => s.doAction);
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const me = gameState?.players.find((p) => p.id === myPlayerId);

  if (!me) return null;
  const reserve = me.reservePool as Unit[];
  if (reserve.length === 0) return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-army-dark border border-gold/30 rounded-lg p-4 w-72 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-stencil text-gold text-lg mb-2">{t("DEPLOY FORCES")}</h3>
        <p className="text-sm text-khaki/50">{t("No units in reserve pool")}</p>
        <button onClick={onClose} className="mt-3 w-full py-2 border border-army-light/30 text-khaki/60 text-xs rounded hover:text-khaki transition-colors">{t("CLOSE")}</button>
      </div>
    </div>
  );

  const handleDeploy = (unitId: string) => {
    doAction("deploy_mobile", { unitIds: [unitId] });
    playButtonClick();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-army-dark border border-gold/30 rounded-lg p-4 w-80 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-stencil text-gold text-lg mb-2">{t("DEPLOY TO MOBILE ARMY")}</h3>
        <p className="text-xs text-khaki/40 mb-3">{t("Click a unit to deploy")}</p>
        <div className="space-y-1">
          {reserve.map((unit) => (
            <button
              key={unit.id}
              onClick={() => handleDeploy(unit.id)}
              className="w-full flex items-center justify-between p-2 rounded border border-army-light/40 hover:border-gold/60 bg-army transition-all animate-march"
            >
              <span className="text-sm text-cream">{UNIT_CONFIG[unit.type].icon} {t(UNIT_CONFIG[unit.type].label)}</span>
              <span className="text-xs text-khaki/50">{t("Power")} {unit.combatPower}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2 border border-army-light/30 text-khaki/60 text-xs rounded hover:text-khaki transition-colors">{t("CLOSE")}</button>
      </div>
    </div>
  );
}

function SellModal({ onClose }: { onClose: () => void }) {
  const doAction = useGameStore((s) => s.doAction);
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const me = gameState?.players.find((p) => p.id === myPlayerId);

  if (!me || !gameState) return null;
  const ownedTiles = me.ownedTerritories.map((i) => gameState.board[i]);

  if (ownedTiles.length === 0) return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-army-dark border border-gold/30 rounded-lg p-4 w-72 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-stencil text-gold text-lg mb-2">{t("SELL TERRITORY")}</h3>
        <p className="text-sm text-khaki/50">{t("No territories to sell")}</p>
        <button onClick={onClose} className="mt-3 w-full py-2 border border-army-light/30 text-khaki/60 text-xs rounded hover:text-khaki transition-colors">{t("CLOSE")}</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-army-dark border border-gold/30 rounded-lg p-4 w-80 animate-bounce-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-stencil text-gold text-lg mb-2">{t("SELL TERRITORY")}</h3>
        <p className="text-xs text-khaki/40 mb-3">{t("Sell for 50% of purchase cost")}</p>
        <div className="space-y-1">
          {ownedTiles.map((tile) => (
            <button
              key={tile.index}
              onClick={() => { doAction("sell_territory", { tileIndex: tile.index }); playCoinLoss(); }}
              className="w-full flex items-center justify-between p-2 rounded border border-army-light/40 hover:border-danger/60 bg-army transition-all"
            >
              <span className="text-sm text-cream">{tTile(tile.name)}</span>
              <span className="text-xs text-gold">+{Math.floor((tile.purchaseCost ?? 0) * BALANCE.sellMultiplier)} ★</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2 border border-army-light/30 text-khaki/60 text-xs rounded hover:text-khaki transition-colors">{t("CLOSE")}</button>
      </div>
    </div>
  );
}

export function BottomBar() {
  const gameState = useGameStore((s) => s.gameState);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const setShowCombat = useGameStore((s) => s.setShowCombat);
  const doAction = useGameStore((s) => s.doAction);
  const gameLog = useGameStore((s) => s.gameLog);
  const [showRecruit, setShowRecruit] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [diceShaking, setDiceShaking] = useState(false);

  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const myCards = me && Array.isArray(me.hand) ? me.hand : [];
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId;
  const phase = gameState.phase;
  const tile = me ? gameState.board[me.position] : null;

  const handleAction = (action: string, payload?: Record<string, unknown>) => {
    const result = doAction(action, payload);
    if (result?.error) {
      setActionError(result.error);
      setTimeout(() => setActionError(null), 2000);
    } else {
      setActionError(null);
    }
  };

  const [coinDelta, setCoinDelta] = useState<{ amount: number; key: number } | null>(null);
  const prevCoins = useRef(me?.coins ?? 0);

  // Track coin changes for floating animation
  useEffect(() => {
    const currentCoins = me?.coins ?? 0;
    if (prevCoins.current !== currentCoins && prevCoins.current !== 0) {
      const delta = currentCoins - prevCoins.current;
      setCoinDelta({ amount: delta, key: Date.now() });
      setTimeout(() => setCoinDelta(null), 1200);
    }
    prevCoins.current = currentCoins;
  }, [me?.coins]);

  const handleRollDice = () => {
    playDiceRoll();
    setDiceShaking(true);
    setTimeout(() => setDiceShaking(false), 800);
    handleAction("roll_dice");
  };

  const handleBuy = () => {
    playBuy();
    handleAction("buy_territory");
  };

  const canBuy = tile?.type === "territory" && !tile.owner && tile.purchaseCost !== null && (me?.coins ?? 0) >= (tile.purchaseCost ?? 0);
  const isEnemyWithGarrison = tile?.type === "territory" && tile.owner !== null && tile.owner !== myPlayerId && tile.garrison !== null && ((Array.isArray(tile.garrison) && tile.garrison.length > 0) || tile.garrison === "hidden");

  const handlePlayCard = (card: Card) => {
    if (card.type === "war_fund" || card.type === "mobilisation_of_militia") {
      handleAction("play_card", { cardId: card.id });
    } else if (card.type === "land_tax") {
      handleAction("play_card", { cardId: card.id });
    } else if (card.type === "repressive") {
      const target = gameState.players.find(p => p.id !== myPlayerId && !p.isEliminated);
      if (target) handleAction("play_card", { cardId: card.id, target: target.id });
    } else if (card.type === "fuse_mine") {
      const ownTile = me?.ownedTerritories[0];
      if (ownTile !== undefined) handleAction("play_card", { cardId: card.id, target: ownTile });
    } else if (card.type === "transport_aircraft") {
      const targets = gameState.board.filter(t => t.type === "territory" && !t.owner);
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        handleAction("play_card", { cardId: card.id, target: target.index });
      }
    }
  };

  return (
    <div className="shrink-0 border-t border-army-light/30 bg-army relative">
      {/* Floating coin delta */}
      {coinDelta && (
        <div
          key={coinDelta.key}
          className={`absolute top-0 left-1/2 -translate-x-1/2 font-stencil text-2xl pointer-events-none z-50 animate-coin-scatter ${
            coinDelta.amount > 0 ? "text-gold" : "text-danger-light"
          }`}
        >
          {coinDelta.amount > 0 ? `+${coinDelta.amount}` : coinDelta.amount} ★
        </div>
      )}
      {actionError && (
        <div className="px-4 py-1 bg-red-900/50 text-red-300 text-xs text-center animate-shake">
          {actionError}
        </div>
      )}
      <div className="flex h-40">
        {/* Card Hand */}
        <div className="flex-1 p-2 overflow-x-auto">
          <div className="text-[10px] text-khaki/40 tracking-wider mb-1 px-1">
            {t("YOUR HAND")} ({myCards.length}/5)
          </div>
          <div className="flex gap-2">
            {myCards.length > 0 ? (
              myCards.map((card) => (
                <CardInHand
                  key={card.id}
                  card={card}
                  isPlayable={
                    isMyTurn &&
                    ((card.timing === "combat" && phase === "combat") ||
                     (card.timing !== "combat" && phase === "management") ||
                     card.timing === "instant")
                  }
                  onPlay={() => handlePlayCard(card)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-24 text-khaki/20 text-sm">
                {t("No cards in hand")}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`w-52 p-2 flex flex-col gap-1.5 border-x border-army-light/20 ${diceShaking ? "animate-shake" : ""}`}>
          <div className="text-[10px] text-khaki/40 tracking-wider mb-0.5">{t("ACTIONS")}</div>

          {isMyTurn && phase === "movement" && (
            <button
              onClick={handleRollDice}
              className={`py-2.5 bg-gold text-army-dark font-stencil text-sm tracking-wider rounded
                         hover:bg-khaki hover:scale-105 transition-all active:scale-95 hover-pop
                         ${diceShaking ? "animate-dice-tumble" : "animate-glow-pulse"}`}
            >
              {diceShaking ? (
                <span className="flex items-center justify-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="5" cy="5" r="1.2"/><circle cx="11" cy="5" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="5" cy="11" r="1.2"/><circle cx="11" cy="11" r="1.2"/></svg>
                  ...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="5" cy="5" r="1.2"/><circle cx="11" cy="5" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="5" cy="11" r="1.2"/><circle cx="11" cy="11" r="1.2"/></svg>
                  {t("ROLL DICE")}
                </span>
              )}
            </button>
          )}

          {isMyTurn && phase === "action" && (
            <>
              {canBuy && (
                <button
                  onClick={handleBuy}
                  className="py-2 bg-gold text-army-dark font-stencil text-sm tracking-wider rounded
                             hover:bg-khaki hover:scale-105 transition-all active:scale-95 animate-bounce-in hover-pop"
                >
                  <span className="flex items-center justify-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="currentColor">$</text></svg>
                    {t("BUY")} {tTile(tile?.name ?? "").toUpperCase()} ({tile?.purchaseCost}★)
                  </span>
                </button>
              )}
              {isEnemyWithGarrison && (
                <>
                  <button
                    onClick={() => { playButtonClick(); handleAction("combat_choice", { choice: "military" }); }}
                    className="py-1.5 bg-danger text-cream text-xs font-stencil tracking-wider rounded
                               hover:bg-danger-light transition-all active:scale-95 animate-danger-pulse hover-pop"
                  >
                    <span className="flex items-center justify-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 14L8 2L14 14" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="5" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5"/></svg>
                      {t("ATTACK (MILITARY)")}
                    </span>
                  </button>
                  <button
                    onClick={() => { playCoinLoss(); handleAction("combat_choice", { choice: "costly" }); }}
                    className="py-1.5 bg-army-light/40 text-cream text-xs font-stencil tracking-wider rounded
                               hover:bg-army-light/60 transition-all active:scale-95 hover-pop"
                  >
                    {t("COSTLY PASSAGE (2x RENT)")}
                  </button>
                  <button
                    onClick={() => { playCoinLoss(); handleAction("combat_choice", { choice: "retreat" }); }}
                    className="py-1.5 bg-army-light/40 text-cream text-xs font-stencil tracking-wider rounded
                               hover:bg-army-light/60 transition-all active:scale-95 hover-pop"
                  >
                    {t("RETREAT (PAY RENT)")}
                  </button>
                </>
              )}
              {!canBuy && !isEnemyWithGarrison && (
                <button
                  onClick={() => { playButtonClick(); handleAction("pass_buy"); }}
                  className="py-2 bg-army-light/40 text-cream font-stencil text-sm tracking-wider rounded hover:bg-army-light/60 transition-all"
                >
                  {t("PASS")}
                </button>
              )}
              {canBuy && (
                <button
                  onClick={() => { playButtonClick(); handleAction("pass_buy"); }}
                  className="py-1.5 bg-army-light/30 text-khaki/60 text-xs font-stencil tracking-wider rounded hover:bg-army-light/50 transition-all"
                >
                  {t("SKIP (DON'T BUY)")}
                </button>
              )}
            </>
          )}

          {isMyTurn && phase === "management" && (
            <>
              {tile && (tile.type === "recruitment" || tile.type === "supply_station") && (
              <button
                onClick={() => { playButtonClick(); setShowRecruit(true); }}
                className="py-1 bg-army-light/40 text-cream text-xs font-stencil tracking-wider rounded
                           hover:bg-army-light/60 transition-all active:scale-95 hover-pop animate-slide-in-left"
                style={{ animationDelay: "0s" }}
              >
                {t("RECRUIT UNITS")}
              </button>
              )}
              <button
                onClick={() => { playButtonClick(); setShowDeploy(true); }}
                className="py-1 bg-army-light/40 text-cream text-xs font-stencil tracking-wider rounded
                           hover:bg-army-light/60 transition-all active:scale-95 hover-pop animate-slide-in-left"
                style={{ animationDelay: "0.05s" }}
              >
                {t("DEPLOY FORCES")}
              </button>
              <button
                onClick={() => { playButtonClick(); setShowSell(true); }}
                className="py-1 bg-army-light/40 text-cream text-xs font-stencil tracking-wider rounded
                           hover:bg-army-light/60 transition-all active:scale-95 hover-pop animate-slide-in-left"
                style={{ animationDelay: "0.1s" }}
              >
                {t("SELL TERRITORY")}
              </button>
              <button
                onClick={() => { playButtonClick(); handleAction("end_management"); }}
                className="py-1.5 bg-gold/80 text-army-dark font-stencil text-sm tracking-wider rounded
                           hover:bg-gold transition-all active:scale-95 hover-pop animate-slide-in-left"
                style={{ animationDelay: "0.15s" }}
              >
                {t("END TURN")}
              </button>
            </>
          )}

          {isMyTurn && phase === "combat" && (
            <button
              onClick={() => { playButtonClick(); setShowCombat(true); }}
              className="py-2.5 bg-danger text-cream font-stencil text-sm tracking-wider rounded
                         hover:bg-danger-light transition-all active:scale-95 animate-danger-pulse hover-pop"
            >
              <span className="flex items-center justify-center gap-1">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><line x1="2" y1="14" x2="8" y2="2" stroke="currentColor" strokeWidth="1.5"/><line x1="14" y1="14" x2="8" y2="2" stroke="currentColor" strokeWidth="1.5"/><line x1="4" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.5"/></svg>
                {t("VIEW BATTLE")}
              </span>
            </button>
          )}

          {!isMyTurn && gameState.status === "playing" && (
            <div className="flex-1 flex items-center justify-center text-khaki/30 text-xs text-center animate-fade-in">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="animate-wiggle inline-block"><circle cx="8" cy="8" r="6" stroke="#c4a35a" strokeWidth="1.5"/><line x1="8" y1="4" x2="8" y2="8" stroke="#c4a35a" strokeWidth="1.5"/><line x1="8" y1="8" x2="11" y2="10" stroke="#c4a35a" strokeWidth="1.2"/></svg>&nbsp;
              {t("Waiting for")}<br />{gameState.players[gameState.currentPlayerIndex]?.name}...
            </div>
          )}

          {gameState.status === "ended" && (
            <div className="flex-1 flex items-center justify-center text-gold font-stencil text-sm text-center">
              {t("GAME OVER")}
            </div>
          )}
        </div>

        {/* Game Log */}
        <div className="w-56 p-2 flex flex-col">
          <div className="text-[10px] text-khaki/40 tracking-wider mb-1">{t("BATTLE LOG")}</div>
          <div className="flex-1 overflow-y-auto mb-1.5 space-y-0.5">
            {gameLog.slice(-15).map((msg, i, arr) => (
              <div key={`${gameLog.length}-${i}`} className={`text-[11px] text-cream/60 leading-tight ${i === arr.length - 1 ? "animate-slide-down text-cream/90 font-medium" : ""}`}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showRecruit && <RecruitModal onClose={() => setShowRecruit(false)} />}
      {showDeploy && <DeployModal onClose={() => setShowDeploy(false)} />}
      {showSell && <SellModal onClose={() => setShowSell(false)} />}
    </div>
  );
}
