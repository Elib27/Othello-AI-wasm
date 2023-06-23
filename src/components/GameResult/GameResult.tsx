import type { Component } from 'solid-js';
import type { Gameboard } from '../../othello';
import styles from './GameResult.module.css'
import { getWinner, getScore } from '../../othello';

type GameResultProps = {gameboard: Gameboard};

const GameResult: Component<GameResultProps> = (props) => {

  const winner = getWinner(props.gameboard);
  const score = getScore(props.gameboard);

  function winnerText(winner: string) {
    if (winner === 'draw') return 'Draw: no winner !';
    return `The winner is ${winner.toUpperCase()} !`;
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
    </div>
  )
};


export default GameResult;