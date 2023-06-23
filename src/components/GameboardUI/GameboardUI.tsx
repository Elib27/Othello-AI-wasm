import type { Component, Accessor } from "solid-js";
import type { Gameboard, Move } from "../../othello";
import { Show, Index } from "solid-js";
import styles from "./GameboardUI.module.css";
import { placeLegalMovesOnGameboard, AIplayer } from "../../othello";

interface Props {
  gameboard: Accessor<Gameboard>;
  player: Accessor<string>;
  setPlayerCase: (move: Move) => void;
}

const GameboardUI: Component<Props> = (props) => {

  const gameboardWithPossibleMoves = () => placeLegalMovesOnGameboard(props.gameboard(), props.player());

  const gameboardToShow = () => props.player() === AIplayer ? props.gameboard() : gameboardWithPossibleMoves();

  return (
    <table class={styles.gameboard}>
    <tbody>
      <Index each={gameboardToShow()}>{(row, i) => 
        <tr class={styles.row}>
          <Index each={row()}>{(gameCase, j) =>
            <td
              class={styles.cell}
              onClick={() => props.setPlayerCase({row: i, column: j})}
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
  );
};

export default GameboardUI;