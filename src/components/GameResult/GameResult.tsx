import type { Component } from 'solid-js';
import type { Gameboard } from '../../othello';
import styles from './GameResult.module.css'
import { getWinner, getScore } from '../../othello';

interface GameResultProps 
{
  gameboard: Gameboard;
  reset: () => void;
};

const GameResult: Component<GameResultProps> = (props) => {

  const winner = getWinner(props.gameboard);
  const score = getScore(props.gameboard);

  function winnerText(winner: string) {
    if (winner === 'draw') return 'Draw: no winner !';
    if (winner === 'x') return 'You won !';
    return 'You lost !';
  }

  return (
    <div class={styles.wrapper}>
      <div>
        <h1>Results</h1>
        <p>{winnerText(winner)}</p>
        <h2>Score</h2>
        <p>X : {score.x}</p>
        <p>O : {score.o}</p>
      </div>
      <button
        class={styles.resetButton}
        onClick={props.reset}
      >Reset</button>
    </div>
  )
};


export default GameResult;