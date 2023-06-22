import type { Component } from 'solid-js';
import type { Move, Gameboard } from './othello';
import { createSignal, createEffect, onMount, Index, Show } from 'solid-js';
import styles from './OthelloGame.module.css';
import GameResult from './GameResult';
import {
  initializeGameBoard,
  cloneGameboard,
  placeLegalMovesOnGameboard,
  isMoveValid,
  playMove,
  checkIfGameEnd,
  getLegalMoves,
  convertGameboardToArray,
  convertAImoveToMove,
} from './othello'


const OthelloGame: Component = () => {

  const [gameboard, setGameboard] = createSignal<Gameboard>(initializeGameBoard());
  const [player, setPlayer] = createSignal('x');
  const [isGameEnd, setIsGameEnd] = createSignal(false);

  const gameboardWithPossibleMoves = () => placeLegalMovesOnGameboard(gameboard(), player());

  const AIplayer = 'o';

  let getAImoveWrapper: (gameboard: Gameboard, player: string) => Promise<Move>;

  onMount(() => {
    WebAssembly.instantiateStreaming(fetch('/othelloAI.wasm'), {}).then(obj => {

      const { getAImove } = obj.instance.exports;

      getAImoveWrapper = async (gameboard: Gameboard, player: string) => {
        const arrayGameboard = convertGameboardToArray(gameboard);
        const arrayGameboardMemory = new Int8Array(obj.instance.exports.memory.buffer);
        for (let i = 0; i < arrayGameboard.length; i++) {
          arrayGameboardMemory[i] = arrayGameboard[i];
        }
        const result = getAImove(arrayGameboardMemory, player.charCodeAt(0));
        const move = convertAImoveToMove(result);
        console.log(move);
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
    const legalMoves = getLegalMoves(AIplayer, gameboard());
    if (legalMoves.length === 0) return;
    const move = await getAImoveWrapper(gameboard(), AIplayer)
    updateGameboardWithMove(move, player());
  }

  async function setPlayerCase(move: Move) {
    if (player() === AIplayer) return;
    if (isMoveValid(move, player(), gameboard())) {
      updateGameboardWithMove(move, player());
      setPlayer('o')
    }
    await playAIMove();
    setPlayer('x');
  }

  createEffect(() => {
    const gameEndStatus = checkIfGameEnd(gameboard());
    setIsGameEnd(gameEndStatus);
  });


  return (
    <Show when={!isGameEnd()} fallback={<GameResult gameboard={gameboard()}/>}>
      <div class={styles.playerRound}>{player() === AIplayer ? "AI is playing..." : "It's your turn !"}</div>
      <table class={styles.gameboard}>
        <tbody>
          <Index each={gameboardWithPossibleMoves()}>{(row, i) => 
            <tr class={styles.row}>
              <Index each={row()}>{(gameCase, j) =>
                <td
                  class={styles.cell}
                  onClick={() => setPlayerCase({row: i, column: j})}
                >
                  <Show when={ gameCase() !== ' ' }>
                    <div classList={{
                      [styles.piece]: true, 
                      [styles.black]: gameCase() === 'x',
                      [styles.white]: gameCase() === 'o',
                      [styles.border]: gameCase() === '.'
                      }}
                    ></div>
                  </Show>
                </td>
              }</Index>
            </tr>
          }</Index>
        </tbody>
      </table>
    </Show>
  );
}

export default OthelloGame;