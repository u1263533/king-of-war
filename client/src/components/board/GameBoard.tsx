import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { computeBoardLayout, getTileCenter, type TileLayout } from "../../utils/boardLayout";
import { PLAYER_COLORS, TILE_TYPE_COLORS, BUILDING_ICONS } from "../../utils/constants";
import { t, tTile } from "../../utils/i18n";
import { getTileImage, getAvatarImage } from "../../utils/assetMap";
import type { Tile, Player } from "../../types/game";

const BOARD_SIZE = 800;

function TileRect({ tile, x, y, width, height }: {
  tile: Tile; x: number; y: number; width: number; height: number;
}) {
  const selectedTile = useGameStore((s) => s.selectedTile);
  const selectTile = useGameStore((s) => s.selectTile);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const players = useGameStore((s) => s.gameState?.players);
  const isSelected = selectedTile === tile.index;
  const owner = players?.find((p) => p.id === tile.owner);
  const ownerColor = owner ? PLAYER_COLORS[owner.color] : undefined;
  const isTerritory = tile.type === "territory";
  const hasHiddenGarrison = tile.garrison === "hidden";
  const isOwn = tile.owner === myPlayerId;

  const tileName = tTile(tile.name);

  return (
    <g
      onClick={() => selectTile(tile.index)}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
    >
      {/* Tile background with image */}
      <defs>
        <clipPath id={`tile-clip-${tile.index}`}>
          <rect x={x} y={y} width={width} height={height} rx={4} />
        </clipPath>
      </defs>
      <rect
        x={x} y={y} width={width} height={height}
        fill={TILE_TYPE_COLORS[tile.type]}
        stroke={ownerColor || "#4a5a35"}
        strokeWidth={ownerColor ? 3 : 1}
        rx={4}
        opacity={isSelected ? 1 : 0.9}
      />
      <image
        href={getTileImage(tile.name, tile.type)}
        x={x} y={y} width={width} height={height}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#tile-clip-${tile.index})`}
        opacity={0.45}
      />

      {/* Glow pulse for newly-owned tiles */}
      {ownerColor && isOwn && (
        <rect
          x={x - 2} y={y - 2} width={width + 4} height={height + 4}
          fill="none" stroke={ownerColor} strokeWidth={1} rx={6} opacity={0.4}
        >
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="1;3;1" dur="2s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Highlight on selection with pulse */}
      {isSelected && (
        <>
          <rect
            x={x - 1} y={y - 1} width={width + 2} height={height + 2}
            fill="none" stroke="#d4a847" strokeWidth={2} rx={5}
          >
            <animate attributeName="stroke-width" values="2;4;2" dur="1s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
          </rect>
          {/* Selection corner markers */}
          <rect x={x - 3} y={y - 3} width={8} height={8} fill="#d4a847" rx={1} opacity={0.8}>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x={x + width - 5} y={y - 3} width={8} height={8} fill="#d4a847" rx={1} opacity={0.8}>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x={x - 3} y={y + height - 5} width={8} height={8} fill="#d4a847" rx={1} opacity={0.8}>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x={x + width - 5} y={y + height - 5} width={8} height={8} fill="#d4a847" rx={1} opacity={0.8}>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
          </rect>
        </>
      )}

      {/* Tile name (Chinese) */}
      <text
        x={x + width / 2} y={y + 14}
        textAnchor="middle" fontSize={width > 120 ? 9 : 8}
        fill="#e8e0d0" fontFamily="Inter, sans-serif"
      >
        {(() => {
          const maxChars = Math.floor(width / (width > 120 ? 6 : 5.5));
          return tileName.length > maxChars ? tileName.slice(0, maxChars - 1) + "…" : tileName;
        })()}
      </text>

      {/* Cost for territories */}
      {isTerritory && tile.purchaseCost && !tile.owner && (
        <text
          x={x + width / 2} y={y + height / 2 + 4}
          textAnchor="middle" fontSize={10}
          fill="#d4a847" fontWeight="bold"
        >
          {tile.purchaseCost} &#9733;
        </text>
      )}

      {/* Rent for owned territories */}
      {isTerritory && tile.owner && tile.rentBase && (
        <text
          x={x + width / 2} y={y + height / 2 + 4}
          textAnchor="middle" fontSize={9}
          fill="#c4a35a"
        >
          Rent: {Math.round(tile.rentBase * (tile.buildingLevel === 0 ? 1 : tile.buildingLevel === 1 ? 1.5 : tile.buildingLevel === 2 ? 2 : 3))}
        </text>
      )}

      {/* Building level */}
      {tile.buildingLevel > 0 && (
        <text
          x={x + width - 14} y={y + 14}
          textAnchor="middle" fontSize={12}
          fill="#d4a847"
        >
          {BUILDING_ICONS[tile.buildingLevel]}
        </text>
      )}

      {/* Garrison indicator (fog of war) */}
      {hasHiddenGarrison && (
        <g>
          <circle cx={x + 12} cy={y + height - 14} r={8} fill="#8b3a3a" opacity={0.7} />
          <text x={x + 12} y={y + height - 10} textAnchor="middle" fontSize={10} fill="#e8e0d0" fontWeight="bold">
            ?
          </text>
        </g>
      )}

      {/* Own garrison count */}
      {isOwn && Array.isArray(tile.garrison) && tile.garrison.length > 0 && (
        <g>
          <circle cx={x + 12} cy={y + height - 14} r={8} fill="#4c7cc9" opacity={0.8} />
          <text x={x + 12} y={y + height - 10} textAnchor="middle" fontSize={9} fill="#e8e0d0" fontWeight="bold">
            {tile.garrison.length}
          </text>
        </g>
      )}

      {/* Owner color dot */}
      {ownerColor && (
        <circle cx={x + width - 8} cy={y + height - 8} r={4} fill={ownerColor} />
      )}
    </g>
  );
}

/** Step-by-step piece movement: walks through each tile on the board path */
function CommanderPiece({ player, targetCx, targetCy, isActive, layout }: {
  player: Player; targetCx: number; targetCy: number; isActive: boolean;
  layout: TileLayout[];
}) {
  const color = PLAYER_COLORS[player.color];
  const prevPos = useRef(player.position);
  const [animPos, setAnimPos] = useState({ x: targetCx, y: targetCy });
  const [stepped, setStepped] = useState(false);
  const animating = useRef(false);

  useEffect(() => {
    const from = prevPos.current;
    const to = player.position;
    prevPos.current = to;

    if (from === to || animating.current) {
      setAnimPos({ x: targetCx, y: targetCy });
      return;
    }

    // Build waypoints stepping through each tile
    const total = layout.length;
    const steps: number[] = [];
    let cur = from;
    // Walk forward (board is circular)
    while (cur !== to) {
      cur = (cur + 1) % total;
      steps.push(cur);
    }

    if (steps.length === 0) {
      setAnimPos({ x: targetCx, y: targetCy });
      return;
    }

    animating.current = true;
    setStepped(true);
    const STEP_MS = Math.min(200, 1200 / steps.length); // faster if many steps

    let i = 0;
    const tick = () => {
      const tl = layout[steps[i]];
      if (tl) {
        const center = getTileCenter(tl);
        // Apply same offset logic for multiple pieces
        setAnimPos({ x: center.cx, y: center.cy + 20 });
      }
      i++;
      if (i < steps.length) {
        setTimeout(tick, STEP_MS);
      } else {
        // Arrive at final position
        setTimeout(() => {
          setAnimPos({ x: targetCx, y: targetCy });
          animating.current = false;
          // Bounce on arrival
          setTimeout(() => setStepped(false), 500);
        }, STEP_MS);
      }
    };
    tick();
  }, [player.position, targetCx, targetCy, layout]);

  const avatarSize = 24;
  const r = avatarSize / 2;
  const clipId = `avatar-clip-${player.id}`;

  return (
    <g
      transform={`translate(${animPos.x},${animPos.y})`}
      style={{ transition: `transform ${animating.current ? "0.15s" : "0.3s"} ease-out` }}
    >
      {/* Active ring pulse */}
      {isActive && (
        <>
          <circle cx={0} cy={0} r={r + 4} fill="none" stroke="#d4a847" strokeWidth={2} opacity={0.6}>
            <animate attributeName="r" values={`${r + 2};${r + 8};${r + 2}`} dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={0} cy={0} fill="none" stroke="#d4a847" strokeWidth={1} opacity={0.3}>
            <animate attributeName="r" values={`${r};${r + 16}`} dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Shadow */}
      <ellipse cx={0} cy={r + 2} rx={r - 2} ry={3} fill="#000" opacity={0.25} />

      {/* Avatar image in circle */}
      <defs>
        <clipPath id={clipId}>
          <circle cx={0} cy={0} r={r} />
        </clipPath>
      </defs>
      <circle cx={0} cy={0} r={r} fill={color} stroke={isActive ? "#d4a847" : "#1a1a1a"} strokeWidth={isActive ? 2.5 : 2}>
        {isActive && !stepped && (
          <animate attributeName="cy" values="0;-4;0" dur="0.8s" repeatCount="indefinite" />
        )}
      </circle>
      <image
        href={getAvatarImage(player.color)}
        x={-r} y={-r} width={avatarSize} height={avatarSize}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      >
        {isActive && !stepped && (
          <animate attributeName="y" values={`${-r};${-r - 4};${-r}`} dur="0.8s" repeatCount="indefinite" />
        )}
      </image>

      {/* Mobile army count badge */}
      {player.mobileArmy.length > 0 && (
        <>
          <circle cx={r} cy={-r + 2} r={6} fill="#2a3320" stroke={color} strokeWidth={1} />
          <text x={r} y={-r + 5} textAnchor="middle" fontSize={7} fill="#e8e0d0">
            {player.mobileArmy.length}
          </text>
        </>
      )}
    </g>
  );
}

function AnimatedDice({ value, x, y }: { value: number; x: number; y: number }) {
  const [animating, setAnimating] = useState(true);
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    setAnimating(true);
    setDisplayVal(0);
    // Flash random numbers during animation
    const interval = setInterval(() => {
      setDisplayVal(Math.floor(Math.random() * 6) + 1);
    }, 80);
    const timer = setTimeout(() => {
      clearInterval(interval);
      setDisplayVal(value);
      setAnimating(false);
    }, 800);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [value]);

  return (
    <g>
      {/* Glow behind dice */}
      <rect x={x - 4} y={y - 4} width={48} height={48} fill="none" rx={10}
        stroke="#d4a847" strokeWidth={animating ? 2 : 0} opacity={animating ? 0.6 : 0}>
        {animating && <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.2s" repeatCount="indefinite" />}
      </rect>
      <rect x={x} y={y} width={40} height={40} fill="#3d4a2a" rx={6} stroke="#d4a847" strokeWidth={1}>
        {animating && (
          <>
            <animateTransform attributeName="transform" type="rotate"
              values={`0 ${x + 20} ${y + 20};15 ${x + 20} ${y + 20};-15 ${x + 20} ${y + 20};0 ${x + 20} ${y + 20}`}
              dur="0.15s" repeatCount="indefinite" />
            <animate attributeName="fill" values="#3d4a2a;#4d5a3a;#3d4a2a" dur="0.1s" repeatCount="indefinite" />
          </>
        )}
      </rect>
      <text x={x + 20} y={y + 28} textAnchor="middle" fontSize={20} fill="#e8e0d0" fontWeight="bold">
        {displayVal || "?"}
        {animating && (
          <animate attributeName="font-size" values="20;24;20" dur="0.1s" repeatCount="indefinite" />
        )}
      </text>
    </g>
  );
}

export function GameBoard() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const layout = computeBoardLayout(gameState.board, BOARD_SIZE);
  const activePlayers = gameState.players.filter((p) => !p.isEliminated);

  return (
    <div className="flex-1 flex items-center justify-center p-2 min-w-0">
      <svg
        viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
        className="max-h-full max-w-full drop-shadow-lg"
        style={{ maxHeight: "calc(100vh - 220px)" }}
      >
        {/* Board background */}
        <rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill="#1e2718" rx={8} />

        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a3320" strokeWidth="0.5" opacity="0.5" />
          </pattern>
        </defs>
        <rect x={100} y={100} width={600} height={600} fill="url(#grid)" opacity={0.3} rx={4} />

        {/* Center area */}
        <rect x={120} y={120} width={560} height={560} fill="#232e1a" rx={4} opacity={0.5} />

        {/* Center text */}
        <text x={400} y={340} textAnchor="middle" fontSize={28} fill="#d4a847" fontFamily="'Black Ops One', cursive" opacity={0.15}>
          {t("KING OF WAR")}
        </text>

        {/* Animated Dice display */}
        {gameState.lastDiceRoll && (
          <g>
            <AnimatedDice value={gameState.lastDiceRoll[0]} x={380} y={370} />
          </g>
        )}

        {/* Turn info in center */}
        <text x={400} y={440} textAnchor="middle" fontSize={11} fill="#c4a35a" fontFamily="Inter, sans-serif">
          {t("Turn")} {gameState.turnNumber} — {t(gameState.phase.toUpperCase())} {t("PHASE")}
        </text>

        {/* Tiles */}
        {layout.map((l) => (
          <TileRect key={l.tile.index} tile={l.tile} x={l.x} y={l.y} width={l.width} height={l.height} />
        ))}

        {/* Commander pieces */}
        {activePlayers.map((player) => {
          const tileLayout = layout[player.position];
          if (!tileLayout) return null;
          const { cx, cy } = getTileCenter(tileLayout);
          const samePos = activePlayers.filter((p) => p.position === player.position);
          const offset = samePos.indexOf(player);
          const isActive = gameState.currentPlayerIndex === gameState.players.indexOf(player);
          const spread = 22;
          return (
            <CommanderPiece
              key={player.id}
              player={player}
              targetCx={cx + offset * spread - (samePos.length - 1) * (spread / 2)}
              targetCy={cy + 20}
              isActive={isActive}
              layout={layout}
            />
          );
        })}
      </svg>
    </div>
  );
}
