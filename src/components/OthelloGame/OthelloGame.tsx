import type { Component } from 'solid-js';
import type { Move, Gameboard } from '../../othello';
import { createSignal, onMount, Show } from 'solid-js';
import styles from './OthelloGame.module.css';
import GameResult from '../GameResult/GameResult';
import GameboardUI from '../GameboardUI/GameboardUI';
import {
  AIplayer,
  initializeGameBoard,
  cloneGameboard,
  isMoveValid,
  playMove,
  checkIfGameEnd,
  getLegalMoves,
  convertGameboardToArray,
  convertAImoveToMove,
  copyInt8Array
} from '../../othello'


const OthelloGame: Component = () => {

  const [gameboard, setGameboard] = createSignal<Gameboard>(initializeGameBoard());
  const [player, setPlayer] = createSignal('x');
  const [isGameEnd, setIsGameEnd] = createSignal(false);

  const updateGameEnd = () => setIsGameEnd(checkIfGameEnd(gameboard()));

  let getAImoveWrapper: (gameboard: Gameboard, player: string) => Promise<Move>;

  onMount(() => {
    WebAssembly.instantiateStreaming(fetch('/othelloAI.wasm'), {}).then(obj => {

      const getAImove = obj.instance.exports.getAImove as CallableFunction;

      getAImoveWrapper = async (gameboard: Gameboard, player: string) => {
        const arrayGameboard = convertGameboardToArray(gameboard);
        const WASMmemory = obj.instance.exports.memory as WebAssembly.Memory;
        const arrayGameboardMemory = new Int8Array(WASMmemory.buffer);
        copyInt8Array(arrayGameboard, arrayGameboardMemory);
        const result = getAImove(arrayGameboardMemory, player.charCodeAt(0));
        const move = convertAImoveToMove(result);
        return move;
      }
    });
  });

  function updateGameboardWithMove(move: Move, player: string) {
    const newGameboard = cloneGameboard(gameboard());
    playMove(move, player, newGameboard);
    setGameboard(newGameboard);
  }

  async function playAIMove() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const legalMoves = getLegalMoves(AIplayer, gameboard());
    if (legalMoves.length === 0) return;
    const move = await getAImoveWrapper(gameboard(), AIplayer)
    updateGameboardWithMove(move, player());
  }

  async function setPlayerCase(move: Move) {
    if (player() === AIplayer) return;
    if (!isMoveValid(move, player(), gameboard())) return;
    updateGameboardWithMove(move, player());
    updateGameEnd();
    setPlayer('o')
    await playAIMove();
    setPlayer('x');
    updateGameEnd();
  }


  return (
    <Show when={!isGameEnd()} fallback={<GameResult gameboard={gameboard()}/>}>
      <div class={styles.playerRound}>{player() === AIplayer ? "AI is playing..." : "It's your turn !"}</div>
      <GameboardUI
        gameboard={gameboard}
        player={player}
        setPlayerCase={setPlayerCase}
      />
    </Show>
  );
}

export default OthelloGame;